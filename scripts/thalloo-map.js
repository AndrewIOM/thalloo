/*jshint esversion: 6 */

/* Requires:
   - TurfJS
   - D3.JS */

///////////////////////////////
/// Thalloo MapView Component
///////////////////////////////

let ThallooMap = (function () {

    // Static Configuration
    let displayPointsAs = 'cluster'; // TODO Are all of these required
    let width = 800;
    let height = 800;
    let aggregationDistance = 150;
    let numberOfPoints = 3;
    let maxControlCount = 110;

    // D3 Variables
    let svg, raster, vector, g1, g2;
    let projection, zoom, zoomLevel, path;

    // Data
    let config;
    let mapname;
    let dataPalette;

    let init = function (svgId, c, mn) {
        config = c;
        mapname = mn;
        svg = d3.select("#" + svgId);
        raster = svg.append("g");
        vector = svg.append("g");
        g1 = vector.append("g"); // background
        g2 = vector.append("g"); // pie charts    
        projection = getProjection(config.projection);
        zoom = d3.zoom()
            .scaleExtent([1, 4])
            .on("zoom", zoomed);
        zoomLevel = 1;
        path = d3.geoPath()
            .projection(projection);

        loadBaseLayers(config.baselayers, g1, path);
    };

    let redraw = function (rawData) {
        g2.selectAll('g').remove();
        let pies = generatePieData(rawData, zoomLevel, numberOfPoints, maxControlCount, config.displayUnit);
        if (pies == 0) return;
        if (dataPalette == undefined) {
            d3.json("../map-data/" + mapname + ".palette.json", function (error, palData) {
                dataPalette = palData;
                displayPies(pies, g2, projection, dataPalette, config.displayUnit);
                svg.call(zoom);
            });        
        } else {
            displayPies(pies, g2, projection, dataPalette, config.displayUnit);
            svg.call(zoom);
        }
    };

    let zoomed = function() {
        var transform = d3.event.transform;
        vector.style("stroke-width", 1.5 / d3.event.transform.k + "px");
        vector.attr("transform", d3.event.transform);
        if (zoomLevel != d3.event.transform.k) {
            zoomLevel = d3.event.transform.k;
        }
    };

    return {
        callInit: function (svgId, config, mapname) {
            init(svgId, config, mapname);
        },
        callRedraw: function (rawData) {
            redraw(rawData);
        }
    };

})();

///////////////////////////////
/// Static Helper Functions
///////////////////////////////

let getDataColour = function (controlName, dataPalette) {
    let match = _.find(dataPalette, function (item) {
        return item.name == controlName;
    });
    if (match == null) {
        return "black";
    }
    return match.hex;
};

function getProjection(name) {
    switch (name) {
        case "arctic":
            return d3.geoOrthographic()
                .scale(600)
                .translate([500, 350])
                .clipAngle(90)
                .rotate([0, -90])
                .precision(0);
        case "standard":
            return d3.geoMercator()
                .scale(200);
    }
}

// Draws all base layers defined in json configuration
function loadBaseLayers(layers, g1, path) {
    _.map(layers, function (l) {
        return loadBaseLayer(l, g1, path);
    });
}

// Draws an individual base layer, as defined in json configuration
function loadBaseLayer(layer, g1, path) {
    d3.json("../layers/" + layer.file + ".json", function (error, subzones) {
        let geojson = topojson.feature(subzones, subzones.objects.collection).features;

        let c = g1.append("g")
            .selectAll('path', '.' + layer.file)
            .data(geojson)
            .enter()
            .append('path')
            .attr('d', path);

        d3.json("../layers/" + layer.file + ".palette.json", function (error, palette) {
            if (error != undefined) {
                let randomColour = d3.scaleLinear().domain([1, length])
                    .interpolate(d3.interpolateHcl)
                    .range([d3.rgb("#a8baad"), d3.rgb('#f0ad70')]);
                c.attr('fill', function (d) {
                    return randomColour(Math.random());
                });
            } else {
                let getColour = function (legendName) {
                    let match = _.find(palette, function (item) {
                        return item.name == legendName;
                    });
                    if (match == null) {
                        return "black";
                    }
                    return match.hex;
                };
                c.attr('fill', function (d) {
                    return '#' + getColour(d.properties.name);
                });
            }
        });
    });
}

function generatePieData(rawData, zoomLevel, numberOfPoints, maxControlCount, displayField) {
    if (rawData.length == 0) return;

    // Sort data by category, then by display unit
    let sortedData =
        _(rawData)
        .chain()
        //.sortBy('Category')
        .sortBy(displayField);

    sortedData =
        _(sortedData)
        .filter(function (dp) {
            return !(dp.Extent === "Pan-Arctic" || dp.Extent === "Continent");
        })
        ._wrapped;

    // Zoom level is between one (= 150km aggregation) and four (=1km)
    let currentAggregationDistance = 250 - (((zoomLevel - 1) / (4 - 1)) * (250 - 1));
    let clusteredData = cluster(sortedData, currentAggregationDistance, numberOfPoints);

    let pieScale =
        d3.scalePow()
        .domain([0, maxControlCount])
        .range([3.5, 25.5])
        .exponent(1);

    let maxTemp = 0;

    let clusteredDataPies =
        _.map(clusteredData, function (cluster) {

            let catsWithValues =
                _.reduce(cluster.points, function (controls, point) {
                    let cat = point[displayField];
                    let existingCat = _.where(controls, {
                        category: cat
                    });
                    if (existingCat.length == 0) {
                        controls.push({
                            category: cat,
                            value: 1
                        });
                        return controls;
                    } else {
                        let updatedCat = {
                            category: cat,
                            value: existingCat[0].value++
                        };
                        for (var i = 0, l = controls.length; i < l; i++) {
                            var el = controls[i];
                            if (el.category == updatedCat) {
                                controls[i] = updatedCat;
                                break;
                            }
                        }
                        return controls;
                    }
                }, []);

            let total = 0;
            catsWithValues.forEach(function (cat) {
                total = total + cat.value;
            });

            if (total > maxTemp) maxTemp = total;

            //Stash pie sizes here, for access when drawing pie segments later
            let pieSize = pieScale(total);
            catsWithValues.forEach(function (a) {
                a.radius = pieSize;
            });

            return {
                centroid: cluster.centroid,
                categories: catsWithValues,
                total: total
            };
        });

    return clusteredDataPies;
}

function displayPies(clusteredDataPies, g2, projection, dataPalette, pieDisplayUnit) {

    var pie = d3.pie()
        .value(function (cat) {
            return cat.value;
        })
        .sort(null);

    var arc = d3.arc()
        .outerRadius(function (d) {
            return d.data.radius;
        })
        .innerRadius(0);

    var arcOuter = d3.arc() //(This is the outline for the pie chart)
        .innerRadius(function (d) {
            return d.data.radius;
        })
        .outerRadius(function (d) {
            return d.data.radius + 1;
        });

    var points = g2.selectAll('g')
        .data(clusteredDataPies)
        .enter()
        .append('g')
        .attr("transform", function (d) {
            return "translate(" + projection([d.centroid.geometry.coordinates[0], d.centroid.geometry.coordinates[1]]) + ")";
        })
        .attr("class", "pies");
    
    points.selectAll('path')
        .data(function (d) {
            return pie(d.categories);
        })
        .enter()
        .append('path')
        .attr('d', arc)
        .attr('fill', function (d, i) {
            if (dataPalette != undefined) { return '#' + getDataColour(d.data.category, dataPalette[pieDisplayUnit]); }
            else { return 'black'; }
        });

    points.selectAll('path.outline')
        .data(function (d) {
            return pie(d.categories);
        })
        .enter()
        .append('path')
        .attr('d', arcOuter)
        .attr('fill', 'black');
}

///////////////////////////////
/// Point Clustering
///////////////////////////////

function cluster(points, searchDistance) {
    let cool = 0;
    let clusterRecursive = function (remainingPoints, clusters) {
        let currentPoint = {
            "type": "Feature",
            "properties": remainingPoints[0],
            "geometry": {
                "type": "Point",
                "coordinates": [parseInt(remainingPoints[0].LonDD), parseInt(remainingPoints[0].LatDD)]
            }
        };
        let nearby =
            _.filter(remainingPoints, function (dataPoint) {
                let turfTo = {
                    "type": "Feature",
                    "properties": dataPoint,
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseInt(dataPoint.LonDD), parseInt(dataPoint.LatDD)]
                    }
                };

                let distance = turf.distance(currentPoint, turfTo, "kilometers");
                return distance < searchDistance;
            });

        let clusterFeatures = turf.featureCollection(
            _
            .map(nearby, function (dataPoint) {
                return {
                    "type": "Feature",
                    "properties": dataPoint,
                    "geometry": {
                        "type": "Point",
                        "coordinates": [parseFloat(dataPoint.LonDD), parseFloat(dataPoint.LatDD)]
                    }
                };
            }));

        let centroid = turf.centroid(clusterFeatures);
        let newCluster = {
            "centroid": centroid,
            "points": nearby
        };
        clusters.push(newCluster);

        let pointsMinusCluster = _.difference(remainingPoints, nearby);
        cool++;
        if (cool > 10000) {
            return clusters;
        }
        if (pointsMinusCluster.length > 0) {
            return clusterRecursive(pointsMinusCluster, clusters);
        } else {
            return clusters;
        }
    };
    return clusterRecursive(points, []);
}