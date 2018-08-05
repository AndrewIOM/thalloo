/*jshint esversion: 6 */

import './Components/_koBindings';
import * as $ from 'jquery';
import * as d3 from 'd3';
import * as _ from 'underscore';
import { isString } from 'util';
import * as ThallooMap from './thalloo-mapping';
import * as ko from "knockout";
import * as T from "./types";

enum DisplayMode {
    LOADING = 0,
    STANDARD = 1,
    FULLSCREEN = 2
  };

type Slicer = {
    Name: string
    Column: string
    Unit: string
    Min: number
    Max: number
}

interface Filter extends T.DataField {
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
    publication = ko.observable<string>();
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
                console.log(slice);
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
            self.publication(config.Publication);
            self.displayUnit(config.DisplayUnit);
            self.logos(config.Logos);

            // Register event handler for selection of points on map
            $(self.thallooMap).on(ThallooMap.ThallooMapEvent.SELECTED_POINTS, () => {
                if (self.thallooMap != undefined) {
                    let selectedPoints = self.thallooMap.selectedPoints();
                    let allFields = _.map(selectedPoints, Helper.objectToKeyValue);
                    self.selectedPoints(allFields);
                    let offset = ($("#selected").offset());
                    if (offset != undefined) {
                        $('html, body').animate({
                            scrollTop: offset.top
                        }, 200);
                    }
                }
            });

            // Load data
            loadData.then(data => {
                self.rawData = _.map(data, Helper.tryParseDataPoint);
                // Setup slicers and filters
                _(config.Fields)
                .map(function (field) {
                    // Split into slices and filters
                    if (field.DataType == T.DataType.Continuous) {
                        let slicer : Slicer = 
                            {   Min: Number(
                                        _.chain(self.rawData)
                                        .pluck(field.Column).filter(n => { return !isNaN(parseFloat(n)) && isFinite(n); })
                                        .min()
                                        .value()),
                                Max: Number(_.chain(self.rawData)
                                        .pluck(field.Column).filter(n => { return !isNaN(parseFloat(n)) && isFinite(n); })
                                        .max()
                                        .value()),
                                Unit: field.Unit,
                                Name: field.Name,
                                Column: field.Column }
                        self.slices.push(slicer);
                    } else if (field.DataType == T.DataType.Categorical) {
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
            console.log(self.currentSliceMax());
            console.log(self.currentSliceMin());

            filteredAndSlicedData =
                _(filteredAndSlicedData)
                .chain()
                .filter(function (dp) {
                    let match = 
                        Number(dp[self.currentSlice().Column]) <= Number(self.currentSliceMax()) 
                        && Number(dp[self.currentSlice().Column]) >= Number(self.currentSliceMin());
                    return match;
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
    export function splitDataBySite(dataRow:string) {
        return _(dataRow['LatDD,LonDD'].split(';'))
                .chain()
                .map(function(d) { return d.split(','); })
                .filter(function(d) { return d.length == 2; })
                .map(function(d) {
                    let originalRow = dataRow;
                    let newProps = { LatDD: d[0].trim(), LonDD: d[1].trim() };
                    return jQuery.extend(originalRow, newProps);
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

    export function tryParseDataPoint(d:any) : T.Option<ThallooMap.DataPoint> {
        return d;
        //         // Load App State
//         let loadData = d3.tsv("../map-data/" + mapName + ".txt");
//         loadData.then( (data) => {
//             self.rawData = data;
//             if (data.entries.length > 0) {
//                 if (data.entries[0]['LatDD,LonDD'] != undefined) {
//                     self.rawData = 
//                         _(self.rawData)
//                         .chain()
//                         .map((d) => isString(d) ? Helper.splitDataBySite(d) : undefined)
//                         .flatten()
//                         .value();
//                 }
//             }

//         })
    }
}


//         //((error, rawData) => { 
            
//             self.rawData = rawData;

//             if (self.rawData)

//             return null; 
//         } ));
//             //this.rawData = rawData;
    
//             // // Split out 'LatDD,LonDD' column into 'LatDD' and 'LonDD' programatically
//             // if (self.rawData[0]['LatDD,LonDD'] != undefined) {
//             //     self.rawData = _(self.rawData)
//             //         .chain()
//             //         .map(unstackLatLon)
//             //         .flatten()
//             //         .value();
//             // });
    
    
//     }
// }