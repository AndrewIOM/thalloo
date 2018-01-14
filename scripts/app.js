/*jshint esversion: 6 */

///////////////////////////////
/// KnockoutJS Custom Bindings
///////////////////////////////

ko.bindingHandlers.slider = {
    init: function (element, valueAccessor, allBindingsAccesor, viewModel, bindingContext) {
        var model = viewModel;
        if (model.currentSlice() == null) return;
        noUiSlider.create(element, {
            start: [-9999, 9999],
            range: {
                'min': model.currentSlice().min,
                'max': model.currentSlice().max
            },
            connect: true,
            behaviour: 'tap-drag',
            step: 1,
        });
        element.noUiSlider.on('slide', function (values, handle) {
            var value = values[handle];
            if (handle) {
                model.currentSliceMax(value);

            } else {
                model.currentSliceMin(value);
            }
        });
    },
    update: function (element, valueAccessor, allBindingsAccesor, viewModel, bindingContext) {
        if (viewModel.currentSlice() == null) {
            document.getElementById('slicer').setAttribute('disabled', true);
        } else {
            if (element.innerHTML.length > 0) {
                updateSliderRange(Number(viewModel.currentSlice().min), Number(viewModel.currentSlice().max));
                document.getElementById('slicer').removeAttribute('disabled');
            } else {
                createSlider(element, viewModel);
                document.getElementById('slicer').removeAttribute('disabled');
            }
        }
    }
};

function createSlider(element, viewModel) {
    var model = viewModel;
    if (model.currentSlice() == null) return;
    noUiSlider.create(element, {
        start: [-9999, 9999],
        range: {
            'min': Number(model.currentSlice().min),
            'max': Number(model.currentSlice().max)
        },
        connect: true,
        behaviour: 'tap-drag',
        step: 1,
    });
    element.noUiSlider.on('slide', function (values, handle) {
        var value = values[handle];
        if (handle) {
            model.currentSliceMax(value);

        } else {
            model.currentSliceMin(value);
        }
    });
}

function updateSliderRange(min, max) {
    document.getElementById('slicer').noUiSlider.updateOptions({
        range: {
            'min': min,
            'max': max
        }
    });
}

///////////////////////////////
/// View Model for Map
///////////////////////////////

function ThallooViewModel(mapname) {

    var self = this;
    self.rawdata = null;
    self.config = null;

    self.id = ko.observable();
    self.title = ko.observable();
    self.description = ko.observable();
    self.publication = ko.observable();
    self.displayUnit = ko.observable();
    self.baselayers = ko.observableArray();

    self.filters = ko.observableArray();
    self.slices = ko.observableArray();
    self.selectedFilter = ko.observable();
    self.selectedFilters = ko.observableArray();

    self.currentSlice = ko.observable();
    self.currentSliceMin = ko.observable();
    self.currentSliceMax = ko.observable();

    self.stashedFilters = ko.observableArray();
    self.stashedSlices = ko.observableArray();

    self.selectedPoints = ko.observableArray();

    self.palette = ko.observable();
    self.thallooMap = undefined;

    self.stashFilter = function () {
        self.stashedFilters.push({
            name: self.selectedFilter().column,
            value: self.selectedFilters()
        });
    };

    self.stashSlice = function (name, lower, upper) {
        self.stashedSlices.push({
            name: name,
            lower: lower,
            upper: upper
        });
    };

    self.redrawMap = function () {

        let filteredAndSlicedData;
        if (self.selectedFilters().length == 0) {
            filteredAndSlicedData = self.rawData;
        } else {
            filteredAndSlicedData =
                _(self.rawData)
                .chain()
                .filter(function (dp) {
                    return _.find(self.selectedFilters(), function (b) {
                        return stringPresentInSemicolonList(dp[self.selectedFilter().column], b)
                    });
                })
                ._wrapped;
        }

        if (self.currentSlice() != null) {
            filteredAndSlicedData =
                _(filteredAndSlicedData)
                .chain()
                .filter(function (dp) {
                    let match = Number(dp[self.currentSlice().column]) < Number(self.currentSliceMax()) && Number(dp[self.currentSlice().column]) > Number(self.currentSliceMin());
                    return match;
                })
                ._wrapped;
        }

        self.stashedFilters().forEach(function (f) {
            filteredAndSlicedData =
                _.filter(filteredAndSlicedData, function (dp) {
                    return _.contains(f.value, dp[f.name]);
                });
        });

        self.thallooMap.redraw(filteredAndSlicedData);
    };

    self.removeFilter = function (filter) {
        self.stashedFilters.remove(filter);
    };

    self.selectedFilter.subscribe(function (filter) {
        self.selectedFilters([]);
        self.redrawMap();
    });
    self.selectedFilters.subscribe(function (filters) {
        self.redrawMap();
    });
    self.currentSliceMin.subscribe(function (min) {
        self.redrawMap();
    });
    self.currentSliceMax.subscribe(function (max) {
        self.redrawMap();
    });
    self.stashedFilters.subscribe(function (max) {
        self.redrawMap();
    });
    self.stashedSlices.subscribe(function (max) {
        self.redrawMap();
    });
    self.currentSlice.subscribe(function (slice) {
        if (slice != null) {
            self.currentSliceMin(slice.min);
            self.currentSliceMax(slice.max);
            self.redrawMap();
        } else {
            self.redrawMap();
        }
    });

    // Load app state
    d3.tsv("../map-data/" + mapname + ".txt", function (error, rawData) {
        self.rawData = rawData;

        // Split out 'LatDD,LonDD' column into 'LatDD' and 'LonDD' programatically
        if (self.rawData[0]['LatDD,LonDD'] != undefined) {
            self.rawData = _(self.rawData)
                .chain()
                .map(unstackLatLon)
                .flatten()
                .value();
        }
        console.log(self.rawData);

        $.getJSON("../map-data/" + mapname + ".json", function (config) {
            self.config = config;
            self.thallooMap = new ThallooMap("map", config, mapname);
            $(self.thallooMap).on(ThallooMap.EVENT_SELECTED_POINTS, function () {
                let selectedPoints = self.thallooMap.getSelectedPoints();
                let allFields = _.map(selectedPoints, objectToKeyValue);
                self.selectedPoints(allFields);
                $('html, body').animate({
                    scrollTop: $("#selected").offset().top
                }, 200);
            });
            self.baselayers(config.baselayers);
            self.title(config.name);
            self.description(config.description);
            self.publication(config.publication);
            self.displayUnit(config.displayUnit);
            $('#study-publication').val(config.publication);
            _(config.fields)
                .map(function (field) {
                    // Split into slices and filters
                    if (field.datatype == "float") {
                        field.min = _.chain(self.rawData)
                            .pluck(field.column)
                            .filter(function (n) {
                                return !isNaN(parseFloat(n)) && isFinite(n);
                            })
                            .min().value();
                        field.max = _.chain(self.rawData)
                            .pluck(field.column)
                            .filter(function (n) {
                                return !isNaN(parseFloat(n)) && isFinite(n);
                            })
                            .max().value();
                        self.slices.push(field);
                    } else if (field.datatype == "string") {
                        field.options = _.chain(self.rawData)
                            .pluck(field.column)
                            .map(function (s) {
                                return _.map(s.split(';'), function (st) {
                                    return st.trim();
                                });
                            })
                            .flatten()
                            .uniq()
                            .sortBy(function (i) {
                                return i.toLowerCase();
                            })
                            .value();
                        self.filters.push(field);
                    }
                });
            self.redrawMap();
        });
    });
}

function stringPresentInSemicolonList(list, str) {
    let x = _.map(list.split(';'), function (st) {
        return st.trim();
    });
    return _.contains(x, str);
}

function objectToKeyValue(o) {
    let keys = Object.keys(o);
    return _.map(keys, function (k) {
        return {
            key: k,
            value: o[k]
        };
    });
}

/// Where a data row contains a field 'LatDD,LonDD' of one or many coordinates,
/// this function returns an array of data rows, containing duplicated data,
/// one row per coordinate.
function unstackLatLon(dataRow) {
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