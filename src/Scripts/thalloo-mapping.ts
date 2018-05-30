
///////////////////////////////
/// Thalloo MapView Component
///////////////////////////////

import * as $ from 'jquery';
import * as turf from 'turf';
import * as topojson from 'topojson';
import * as D3 from 'd3';
import * as _ from 'underscore';
import { isNullOrUndefined } from 'util';

export enum ThallooMapEvent {
    SELECTED_POINTS = 'selectedPoints'
}

export interface DataPoint {
    LatDD: number,
    LonDD: number,
}

type RenderingLayers = {
    BackgroundLayers: D3.Selection<D3.BaseType, {}, HTMLElement, any>
    Data: D3.Selection<D3.BaseType, {}, HTMLElement, any>
}

type PieData = {
    Centroid: GeoJSON.Feature<GeoJSON.Point, { [name: string]: any; } | null>,
    Categories: any,
    Total: number,
    DataPoints: any[]
}

type Category = {
    Category: string
    Value: number
    Radius: number
}

type Cluster = {
    Centroid: GeoJSON.Feature<GeoJSON.Point, { [name: string]: any; } | null>
    Points: DataPoint[]
}

interface RadiusArcObject extends D3.DefaultArcObject {
    Data: { Radius: number; }
 }

///////////////////////////////
/// Thalloo MapView Component
///////////////////////////////

export class ThallooMap {

    _data: any;

    _svg: D3.Selection<D3.BaseType, {}, HTMLElement, any>;
    _config: MapConfiguration;
    _symbology: Symbology;
    _layers: RenderingLayers;
    _projection: D3.GeoProjection;
    _zoomLevel: number;
    _zoom: D3.ZoomBehavior<Element, {}>;
    _selectedPoints: Array<any>;

    constructor(containerId: string, config: MapConfiguration) {
        // Validate map config
        // Clean svg element

        // Activate basic map functions
        this._config = config;
        this._svg = D3.select("#" + containerId);
        if (isNullOrUndefined(this._svg)) {
            throw Error("The specified map container does not exist");
        };

        // Set default symbology
        this._symbology = config.DisplayMode;

        let width = $('#' + containerId).width();
        let height = $('#' + containerId).height();
        if (isNullOrUndefined(width) || isNullOrUndefined(height)) {
            throw Error("The height and width of the map element could not be computed");
        };

        // Mutate SVG element
        this._svg.attr("width", '100%')
        .attr("height", '100%')
        .attr('viewBox','0 0 '+Math.min(width,height)+' '+Math.min(width,height))
        .attr('preserveAspectRatio','xMinYMin')
        .append("g")
        .attr("transform", "translate(" + Math.min(width,height) / 2 + "," + Math.min(width,height) / 2 + ")");

        // Setup data layers in SVG
        let vector = this._svg.append("g");
        this._layers = {
            BackgroundLayers: vector.append("g"),
            Data: vector.append("g")
        }

        this._projection = Projections.create(config.Projection, config.MapCentre, config.MapZoomLevel);
        this._zoom = D3.zoom()
            .scaleExtent([1, 4])
            .on("zoom", this.zoomed);
        this._zoomLevel = 1;
        this._selectedPoints = [];
        let path = D3.geoPath()
            .projection(this._projection);

        this.loadBaseLayers(path);
    }

    zoomIn = () => {
        this._zoom.scaleBy(<any>this._svg.transition().duration(750), 1.3);    
    };

    zoomOut = () => {
        this._zoom.scaleBy(<any>this._svg.transition().duration(750), 1 / 1.3);  
    };

    /// Draws all base layers defined in json configuration
    loadBaseLayers = (path:D3.GeoPath<any, D3.GeoPermissibleObjects>) => {
        _.map(this._config.BaseLayers, (l) => {
            return this.loadBaseLayer(l, this._layers.BackgroundLayers, path);
        })
    }

    /// Draws an individual base layer, as defined in json configuration
    loadBaseLayer = (layer:BaseLayer, g1:D3.Selection<D3.BaseType, {}, HTMLElement, any>, path:D3.GeoPath<any, D3.GeoPermissibleObjects>) => {
        
        // Loader types
        let loadTopojson = D3.json<TopoJSON.Topology>("../layers/" + layer.File + ".json");
        let loadPalette = D3.json<Palette>("../layers/" + layer.File + ".palette.json");

        loadTopojson.then((tj) => {
            
            let geojson = topojson.feature(tj, tj.objects.collection);
            if (geojson.type != "FeatureCollection" ) {
                throw "The layer was not in a TopoJSON featurecollection format: " + layer.Name;
            }

            // Render GeoJSON features
            let c = g1.append("g")
                .selectAll('.' + layer.File)
                .data(geojson.features)
                .enter()
                .append('path')
                .attr('d', path);

            // Load in an optional palette
            loadPalette.then ( 
                // Successful
                (palettes) => {
                    c.attr('fill', d => {
                        if (isNullOrUndefined(d.properties)) {
                            return "black";
                        } else {
                            return '#' + Palette.getColour(palettes, d.properties["name"]);
                        }
                    });
                },
                // Was unsuccessful: generate a random greyscale palette
                (error) => {
                    let randomColour = D3.scaleLinear().domain([1, length])
                        .interpolate(<any>D3.interpolateHcl)
                        .range(<any>[D3.rgb("#a6a6a6"), D3.rgb('#f2f2f2')]);
                    c.attr('fill', function (d) {
                        return randomColour(Math.random());
                    });
                });
        });
    }

    zoomed = () => {
        var transform = D3.event.transform;
        this._layers.Data.style("stroke-width", 1.5 / D3.event.transform.k + "px");
        this._layers.Data.attr("transform", D3.event.transform);
        if (this._zoomLevel != D3.event.transform.k) {
            this._zoomLevel = D3.event.transform.k;
            this.redraw(this._data);
        }
    };

    redraw = (data) => {

        // Update width and height of SVG
        let node = this._svg.node();
        if (node instanceof SVGElement) {
            this._svg.attr("width", node.clientWidth)
                    .attr("height",node.clientHeight);
        }

        // Clear existing data layer contents
        this._layers.Data.selectAll("g").remove();

        // Set new dataset as current map dataset
        this._data = data;

        // Generate new data layer contents
        switch (this._symbology) {
            case Symbology.PointClustered: {
                let pies : PieData[] = Clustering.generatePieData(
                    this._data,
                    this._zoomLevel,
                    1,
                    this._config.MaxPieSize,
                    this._config.ClusterDistance,
                    this._config.DisplayUnit );
                if (pies.length == 0) break;

                let currentDataPalette = this._config.DataPalettes.get(this._config.DisplayUnit);
                if (isNullOrUndefined(currentDataPalette)) {
                    throw "Configuration error: the data palette is not defined: " + this._config.DisplayUnit;
                }

                Legend.drawCategoricalLegend(currentDataPalette, this._svg);

                this.displayPies(
                    pies,
                    this._layers.Data,
                    this._projection,
                    this._config.DataPalettes["Cool Palette"],
                    this._config.DisplayUnit
                );
                this._svg.call(<any>this._zoom);
                break;
            }
            case Symbology.PointIndividual: {
                throw "Not implemented";
            }
        }
    }

    selectedPoints = () => {
        return this._selectedPoints;
    }

    displayPies = (clusteredDataPies:PieData[], g2:D3.Selection<D3.BaseType, {}, HTMLElement, any>, projection:D3.GeoProjection, dataPalette:Palette, pieDisplayUnit:string) => {

        let self = this;

        let pie = D3.pie<PieData>()
            .value((cat) => {
                return cat.Total;
            })
            .sort(null);
    
        let arc = D3.arc<RadiusArcObject>()
            .outerRadius(d => {
                return d.Data.Radius / this._zoomLevel;
            })
            .innerRadius(0);
    
        // Pie chart outline
        let arcOuter = D3.arc<RadiusArcObject>()
            .innerRadius(function (d) {
                return d.Data.Radius / this._zoomLevel;
            })
            .outerRadius(function (d) {
                return (d.Data.Radius + 1) / this._zoomLevel;
            });

        let points = g2.selectAll('g')
            .data(clusteredDataPies)
            .enter()
            .append('g')
            .attr("transform", function (d) {
                return "translate(" + projection([d.Centroid.geometry.coordinates[0], d.Centroid.geometry.coordinates[1]]) + ")";
            })
            .attr("class", "pies marker")
            .on("click", function(d) { 
                $(self).trigger(ThallooMapEvent.SELECTED_POINTS);
                self._selectedPoints = d.DataPoints;
            });

        points.selectAll('path')
            .data(function (d) {
                return pie(d.Categories);
            })
            .enter()
            .append('path')
            .attr('d', <any>arc)
            .attr('fill', function (d, i) {
                if (dataPalette != undefined) { return '#' + Palette.getColour(d.data.Categories, dataPalette[pieDisplayUnit]); }
                else { return 'black'; }
            });

        points.selectAll('path.outline')
            .data(function (d) {
                return pie(d.Categories);
            })
            .enter()
            .append('path')
            .attr('d', <any>arcOuter)
            .attr('fill', 'black');
    };

}


module Projections {

    export function create(projection, centre, zoomLevel:number) {
        if (zoomLevel == undefined) zoomLevel = 1;
        if (centre == undefined) centre = [45,45];
        switch (name) {
            case Projection.Arctic:
                return D3.geoOrthographic()
                    .scale(600 * zoomLevel)
                    .translate([500, 350])
                    .clipAngle(90)
                    .rotate([0, -90])
                    .precision(0);
            case Projection.Standard:
                return D3.geoMercator()
                    .center(centre)
                    .scale(zoomLevel * 150);
        }
        return D3.geoMercator()
            .center(centre)
            .scale(zoomLevel * 150);
    }

}


module Palette {

    export function getColour (palette:Palette, name:string) {
        let match = palette.get(name);
        return (isNullOrUndefined(match)) ? "black" : match;
    };

}

module Legend {

    export function drawCategoricalLegend(palette:Palette, svg:D3.Selection<D3.BaseType, {}, HTMLElement, any>) {

        // Clear current legend
        svg.empty();

        // Domain and Range
        let domain : string[] = [];
        let range : string[] = [];
        let p : {Key:string,Value:string}[] = [];
        palette.forEach((v,k) => { domain.push(v); range.push(v); p.push({Key:k,Value:v}) } );

        let height = range.length * 17.5;
        let buffer = 6;
        svg.attr('height', height);

        let y = D3.scaleBand()
            .domain(domain)
            .range([buffer,height+buffer]);

        svg.append("g")
                .selectAll('circle')
                .data(p).enter()
                .append('circle')
                .attr('cx', 6)
                .attr('cy', (d) => { 
                    let v = y(d.Key);
                    if (v != undefined) { return 6 + v; } else { return 6 }; })
                .attr('r', 5)
                .attr('stroke', 'black')
                .attr('fill', d => { return '#' + d.Value; });

        svg.append("g")
                .selectAll('text')
                .data(p).enter()
                .append('text')
                .attr('x', 15)
                .attr('y', (d) => { 
                    let v = y(d.Key);
                    if (v != undefined) { return 10 + v; } else { return 10 }; })
                .text( d => { return d.Key; });
    }


}


module Clustering {

    export function generatePieData(rawData:DataPoint[], zoomLevel:number, numberOfPoints:number, maxControlCount:number, maxClusterDistance:number, displayField:string) : PieData[] {
        if (rawData.length == 0) return [];
    
        let sortedData = _.sortBy(rawData, displayField);

        // Zoom level is between one (= 150km aggregation) and four (=1km)
        let currentAggregationDistance = maxClusterDistance - (((zoomLevel - 1) / (4 - 1)) * (maxClusterDistance - 1));
        let clusteredData = cluster(sortedData, currentAggregationDistance);
    
        let pieScale =
            D3.scalePow()
            .domain([0, maxControlCount])
            .range([3.5, 25.5])
            .exponent(1);

        let maxTemp = 0;
    
        let clusteredDataPies : PieData[] =
            _.map(clusteredData, cluster => {
    
                let catsWithValues : Category[] =
                    _.reduce(cluster.Points, function (controls:Category[], point) {
                        let cat : string = point[displayField];
                        let existingCat = _.where(controls, {
                            category: cat
                        });
                        if (existingCat.length == 0) {
                            controls.push( { Category: cat, Value: 1, Radius: 0 } );
                            return controls;
                        } else {
                            let updatedCat = {
                                Category: cat,
                                Value: existingCat[0].Value++,
                                Radius: 0
                            };
                            for (var i = 0, l = controls.length; i < l; i++) {
                                var el = controls[i];
                                if (el.Category == updatedCat.Category) {
                                    controls[i] = updatedCat;
                                    break;
                                }
                            }
                            return controls;
                        }
                    }, []);
    
                let total = 0;
                catsWithValues.forEach(function (cat) {
                    total = total + cat.Value;
                });
    
                if (total > maxTemp) maxTemp = total;
    
                //Stash pie sizes here, for access when drawing pie segments later
                let pieSize = pieScale(total);
                catsWithValues.forEach( a => {
                    a.Radius = pieSize;
                });
    
                return {
                    Centroid: cluster.Centroid,
                    Categories: catsWithValues,
                    Total: total,
                    DataPoints: cluster.Points
                };
            });
    
        return clusteredDataPies;
    }

    export function cluster(points: DataPoint[], searchDistance:number) : Cluster[] {
        let diagnosticCount = 0;
        let clusterRecursive = (remainingPoints:DataPoint[], clusters:Cluster[] ) => {
            let currentPoint : GeoJSON.Feature<GeoJSON.Point> = {
                "type": "Feature",
                "properties": remainingPoints[0],
                "geometry": {
                    "type": "Point",
                    "coordinates": [remainingPoints[0].LonDD, remainingPoints[0].LatDD]
                }
            };
            let nearby =
                _.filter(remainingPoints, function (dataPoint:DataPoint) {
                    let turfTo : GeoJSON.Feature<GeoJSON.Point> = {
                        "type": "Feature",
                        "properties": dataPoint,
                        "geometry": {
                            "type": "Point",
                            "coordinates": [dataPoint.LonDD, dataPoint.LatDD]
                        }
                    };
                    let distance = turf.distance(currentPoint, turfTo, "kilometers");
                    return distance < searchDistance;
                });

            let clusterFeatures = turf.featureCollection(
                _.map(nearby, (dataPoint => {
                    let x : GeoJSON.Feature<GeoJSON.Point> = {
                        "type": "Feature",
                        "properties": dataPoint,
                        "geometry": {
                            "type": "Point",
                            "coordinates": [dataPoint.LonDD, dataPoint.LatDD]
                        }
                    }
                    return x;
                })));

            let centroid = turf.centroid(clusterFeatures);
            let newCluster : Cluster = {
                Centroid: centroid,
                Points: nearby
            };
            clusters.push(newCluster);

            let pointsMinusCluster = _.difference(remainingPoints, nearby);
            diagnosticCount++;
            if (diagnosticCount > 10000) {
                console.log(clusters);
                console.log(pointsMinusCluster);
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

}
