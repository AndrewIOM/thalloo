/*jshint esversion: 6 */

import './Components/_koBindings';
import * as $ from 'jquery';
import * as d3 from 'd3';
import * as _ from 'underscore';
import * as ThallooMap from './thalloo-mapping';
import * as ko from "knockout";
import * as T from "./types";

enum DisplayMode {
    LOADING = 0,
    STANDARD = 1,
    FULLSCREEN = 2
  };

type RangeSlice = {
    ColumnMin: string
    ColumnMax: string
}

type Slicer = {
    Name: string
    Column: string | RangeSlice
    Unit: string
    Min: number
    Max: number
}

interface Filter {
    Column: string
    Name: string
    Unit: string
    Description: string
    DataType: T.DataType
    Options: string[]
    SelectedOptions: string[]
}

type ActiveSlicer = {
    Name: string
    Min: number
    Max: number
    Unit: string
}

type MetaData = number | string
type ThallooData = Map<string,MetaData>[]

///////////////////////////////
/// View Model for Map
///////////////////////////////

export class ThallooViewModel {

    config : T.Option<T.MapConfiguration> = undefined;
    rawData: any[] = [];
    thallooMap : T.Option<ThallooMap.ThallooMap> = undefined;

    filters = ko.observableArray<Filter>();
    slices = ko.observableArray<Slicer>();

    displayMode = ko.observable(DisplayMode.LOADING);

    id = ko.observable<string>();
    title = ko.observable<string>();
    description = ko.observable<string>("");
    descriptionExpanded = ko.observable(false);
    publication = ko.observable<string>("");
    publicationUrl = ko.observable<string>("");
    displayUnit = ko.observable();
    baselayers = ko.observableArray<T.BaseLayer>([]);
    logos = ko.observableArray<T.Logo>([]);

    selectedFilter = ko.observable<Filter>();
    selectedFilterValues = ko.observableArray<string>();

    currentSlice = ko.observable<Slicer>();
    currentSliceMin = ko.observable<number>();
    currentSliceMax = ko.observable<number>();

    stashedFilters = ko.observableArray<Filter>();
    stashedSlices = ko.observableArray<ActiveSlicer>();
    displayedPointsCount = ko.observable(0);
    selectedPoints = ko.observableArray();

    // Display options for full screen
    hiddenLegend = ko.observable(true);
    hiddenDetail = ko.observable(true);
    hiddenFilter = ko.observable(true);

    constructor(mapName:string) {
        let self = this;

        // Subscribe to events
        self.selectedFilter.subscribe((filter) => {
            self.selectedFilterValues([]);
            self.redrawMap();
        });

        self.selectedFilterValues.subscribe((filters) => {
            self.redrawMap();
        });

        self.currentSliceMin.subscribe((min) => {
            self.redrawMap();
        });
        self.currentSliceMax.subscribe((max) => {
            self.redrawMap();
        });
        self.stashedFilters.subscribe((max) => {
            self.redrawMap();
        });
        self.stashedSlices.subscribe((max) => {
            self.redrawMap();
        });
        self.currentSlice.subscribe((slice) => {
            if (slice != null) {
                self.currentSliceMin(slice.Min);
                self.currentSliceMax(slice.Max);
                self.redrawMap();
            } else {
                self.redrawMap();
            }
        });

        // Loader types
        let loadConfig = d3.json<T.MapConfiguration>("../map-data/" + mapName + ".json");
        let loadData = d3.tsv("../map-data/" + mapName + ".txt");

        loadConfig.then(config => {
            this.displayMode(DisplayMode.STANDARD);
            self.config = config;
            self.thallooMap = new ThallooMap.ThallooMap("map", ".symbology-container", config);

            // Cache in observables (is this needed?)
            self.baselayers(config.BaseLayers);
            self.title(config.Name);
            self.description(config.Description);
            self.publication(config.PublicationReference);
            self.publicationUrl(config.PublicationUrl);
            self.displayUnit(config.DisplayUnit);
            self.logos(config.Logos);

            // Register event handler for selection of points on map
            $(self.thallooMap).on(ThallooMap.ThallooMapEvent.SELECTED_POINTS, () => {
                if (self.thallooMap != undefined) {
                    let selectedPoints = self.thallooMap.selectedPoints();
                    let allFields = _.map(selectedPoints, Helper.objectToKeyValue);
                    self.selectedPoints(allFields);
                    let offset = $("#slicer").offset();
                    if (offset != undefined) {
                        $('html, body').animate({
                            scrollTop: offset.top
                        }, 750, "swing");
                    }
                }
            });

            const getColumnNumbers = (rawData: any[], column: string) => 
                _.chain(rawData)
                .pluck(column).filter(n => { return Number.isFinite(Number.parseFloat(n)); })
                .map(n => Number.parseFloat(n));

            // Load data
            loadData.then(data => {
                self.rawData = _.flatten(_.map(data, Helper.tryParseDataPoint));
                // Setup slicers and filters
                _(config.Fields)
                .map(function (field) {
                    // Split into slices and filters
                    if (field.DataType == T.DataType.Continuous) {
                        if (Array.isArray(field.Column)) {
                            if (field.Column.length == 2) {
                                // Configure a range slicer based on two columns
                                let min = _.min([
                                    Number(getColumnNumbers(self.rawData, field.Column[0]).min().value()),
                                    Number(getColumnNumbers(self.rawData, field.Column[1]).min().value()) ]);
                                let max = _.min([
                                    Number(getColumnNumbers(self.rawData, field.Column[0]).max().value()),
                                    Number(getColumnNumbers(self.rawData, field.Column[1]).max().value()) ]);
                                    let slicer : Slicer = 
                                {   Min: min, 
                                    Max: max,
                                    Unit: field.Unit,
                                    Name: field.Name,
                                    Column: { ColumnMin: field.Column[0], ColumnMax: field.Column[1] } }
                                self.slices.push(slicer);    
                            } else {
                                console.log("The slicer " + field.Name + " had invalid column name(s).");
                            }
                        } else {
                            // Configure a simple single number slicer
                            let slicer : Slicer = 
                            {   Min: Number(getColumnNumbers(self.rawData, field.Column).min().value()),
                                Max: Number(getColumnNumbers(self.rawData, field.Column).max().value()),
                                    Unit: field.Unit,
                                    Name: field.Name,
                                    Column: field.Column }
                            self.slices.push(slicer);
                        }
                    } else if (field.DataType == T.DataType.Categorical && !Array.isArray(field.Column)) {
                        let filter : Filter =
                            { Options: _.chain(self.rawData)
                                        .pluck(field.Column)
                                        .map((s:T.Option<string>) => {
                                            if (s != undefined) {
                                                return _.map(s.split(';'), st => {
                                                    return st.trim();
                                                })    
                                            }
                                        })
                                        .flatten()
                                        .filter(d => { return d != ''; })
                                        .uniq()
                                        .sortBy(i => {
                                            return i.toLowerCase();
                                        })
                                        .value(),
                                Name: field.Name,
                                Unit: field.Unit,
                                Description: field.Description,
                                DataType: field.DataType,
                                Column: field.Column,
                                SelectedOptions: [] }
                        self.filters.push(filter);
                    }
                });
                self.redrawMap();
            })
        });
    }

    scrollToTop = () => {
        let offset = $("#map").offset();
        let offsetTop = offset == undefined ? 0 : offset.top;
        $('html, body').animate({
            scrollTop: offsetTop
        }, 750, "swing");
    }

    toggleFullScreen = () => {
        if (this.displayMode() == DisplayMode.FULLSCREEN) this.displayMode(DisplayMode.STANDARD);
        else if (this.displayMode() == DisplayMode.STANDARD) this.displayMode(DisplayMode.FULLSCREEN);
    };

    toggleDescriptionLength = () => {
        this.descriptionExpanded(!this.descriptionExpanded());
    };

    stashFilter = () => {
        let selected = this.selectedFilter();
        this.stashedFilters.push({
            Name: selected.Name,
            Unit: selected.Unit,
            Description: selected.Description,
            Options: selected.Options,
            Column: selected.Column,
            DataType: selected.DataType,
            SelectedOptions: this.selectedFilterValues()
        });
        this.filters.remove(this.selectedFilter());
    };

    removeFilter = (filter:Filter) => {
        this.stashedFilters.remove(filter);
        this.filters.push(filter);
    };

    stashSlice = () => {
        this.stashedSlices.push({
            Name: this.currentSlice().Name,
            Min: this.currentSliceMin(),
            Max: this.currentSliceMax(),
            Unit: this.currentSlice().Unit
        });
        this.currentSlice();
    };

    removeSlice = (slice:Slicer) => {
        this.stashedSlices.remove(slice);
    }

    zoomIn = () => {
        if (this.thallooMap != null) this.thallooMap.zoomIn();
    };

    zoomOut = () => {
        if (this.thallooMap != null) this.thallooMap.zoomOut();
    };

    toggleLegendDisplay = () => { this.hiddenLegend(!this.hiddenLegend()) }
    toggleDetailDisplay = () => { this.hiddenDetail(!this.hiddenDetail()) }
    toggleFilterDisplay = () => { this.hiddenFilter(!this.hiddenFilter()) }
        
    redrawMap = () => {
        let self = this;

        let filteredAndSlicedData : ThallooMap.DataPoint[] = [];
        if (this.selectedFilterValues().length == 0) {
            filteredAndSlicedData = this.rawData;
        } else {
            filteredAndSlicedData =
                _.filter(this.rawData, d => {
                    return _.find(this.selectedFilterValues(), b => {
                        return Helper.stringPresentInSemicolonList(d[self.selectedFilter().Column], b);
                    }) != undefined;
                })
        }

        if (this.currentSlice() != null) {
            filteredAndSlicedData =
                _(filteredAndSlicedData)
                .chain()
                .filter((dp) => {
                    let column = self.currentSlice().Column;
                    if (_.isString(column)) {
                        let match = 
                            Number(dp[column]) <= Number(self.currentSliceMax()) 
                            && Number(dp[column]) >= Number(self.currentSliceMin());
                        return match;
                    } else {
                        // Test for overlapping ranges
                        let match = 
                            Number(dp[column.ColumnMin]) <= Number(self.currentSliceMax()) 
                            && Number(self.currentSliceMin()) <= Number(dp[column.ColumnMax]);
                        return match;
                    }
                })
                .value();
        }

        this.stashedFilters().forEach( f => {
            filteredAndSlicedData =
                _.filter(filteredAndSlicedData, dp => {
                    return _.contains(f.SelectedOptions, dp[f.Column]);
                });
        });
        
        if (this.thallooMap != null) {
            this.displayedPointsCount(filteredAndSlicedData.length);
            this.thallooMap.redraw(filteredAndSlicedData);
        }
    };

}

module Helper {

    /// Where a data row contains a field 'LatDD,LonDD' of one or many coordinates,
    /// this function returns an array of data rows, containing duplicated data,
    /// one row per coordinate.
    export function splitDataBySite(dataRow:any) {
        return _(dataRow['LatDD,LonDD'].split(';'))
                .chain()
                .map(function(d) { return d.split(','); })
                .filter(function(d) { return d.length == 2; })
                .map(function(d) {
                    let originalRow = dataRow;
                    let newProps = { LatDD: d[0].trim(), LonDD: d[1].trim() };
                    return $.extend(originalRow, newProps);
                })
                .value();
    }

    export function stringPresentInSemicolonList(list:string, str:string) : boolean {
        let x = _.map(list.split(';'), function (st) {
            return st.trim();
        });
        return _.contains(x, str);
    }
    
    export function objectToKeyValue(o) {
        let keys = Object.keys(o);
        return _.map(keys, function (k) {
            return {
                key: k,
                value: o[k]
            };
        });
    }

    export function tryParseDataPoint(d:any) {
        if (d['LatDD,LonDD'] != undefined) { return Helper.splitDataBySite(d); }
        return d;
    }
}