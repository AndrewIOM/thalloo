(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{87:function(e,t,n){"use strict";n.r(t);var r=n(1),i=n(18);r.bindingHandlers.slider={init:function(e,t,n,r,a){null!=r.currentSlice()&&(i.create(e,{start:[-9999,9999],range:{min:r.currentSlice().Min,max:r.currentSlice().Max},connect:!0,behaviour:"tap-drag",step:1}),e.noUiSlider.on("slide",function(e,t){var n=e[t];console.log(n),console.log(t),t?r.currentSliceMax(n):r.currentSliceMin(n)}))},update:function(e,t,n,r,a){var o;null==r.currentSlice()?null!=(o=document.getElementById("slicer"))&&o.setAttribute("disabled","true"):(console.log(r.currentSlice().Min+" - "+r.currentSlice().Max),e.innerHTML.length>0?(!function(e,t){var n=document.getElementById("slicer");null!=n&&n.noUiSlider.updateOptions({range:{min:e,max:t}})}(r.currentSlice().Min,r.currentSlice().Max),null!=(o=document.getElementById("slicer"))&&o.removeAttribute("disabled")):(!function(e,t){if(null==t.currentSlice())return;i.create(e,{start:[-9999,9999],range:{min:Number(t.currentSlice().Min),max:Number(t.currentSlice().Max)},connect:!0,behaviour:"tap-drag",step:1}),e.noUiSlider.on("slide",function(e,n){var r=Number(e[Number(n)]);console.log(r),n?t.currentSliceMax(r):t.currentSliceMin(r)})}(e,r),null!=(o=document.getElementById("slicer"))&&o.removeAttribute("disabled")))}},r.bindingHandlers.truncatedText={update:function(e,t,n){var i=r.utils.unwrapObservable(t()),a=r.utils.unwrapObservable(n().maxTextLength)||20;i.length>a&&i.substring(0,a);r.bindingHandlers.text.update=e}};var a,o,l,s,c=n(6),u=n(3),d=n(2),p=n(9),f=n(28),h=n(5);!function(e){e.PointIndividual="individual",e.PointClustered="cluster"}(a||(a={})),function(e){e.Arctic="arctic",e.Standard="standard"}(o||(o={})),function(e){e.Continuous="float",e.Categorical="string"}(l||(l={})),function(e){e.SELECTED_POINTS="selectedPoints"}(s||(s={}));var m,g,v,b,y,D,S=function(){return function(e,t,n){var r=this;if(this.zoomIn=function(){r._zoom.scaleBy(r._svg.transition().duration(750),1.3)},this.zoomOut=function(){r._zoom.scaleBy(r._svg.transition().duration(750),1/1.3)},this.loadBaseLayers=function(e){d.map(r._config.BaseLayers,function(t){return r.loadBaseLayer(t,r._layers.BackgroundLayers,e)})},this.loadBaseLayer=function(e,t,n){var r=u.g("../layers/"+e.File+".json"),i=u.g("../layers/"+e.File+".palette.json");r.then(function(r){var a=f.a(r,r.objects.collection);if("FeatureCollection"!=a.type)throw"The layer was not in a TopoJSON featurecollection format: "+e.Name;var o=t.append("g").selectAll("."+e.File).data(a.features).enter().append("path").attr("d",n);i.then(function(e){o.attr("fill",function(t){return Object(h.isNullOrUndefined)(t.properties)?"black":"#"+g.getColour(e,t.properties.name)})},function(e){var t=u.k().domain([1,length]).interpolate(u.f).range([u.i("#a6a6a6"),u.i("#f2f2f2")]);o.attr("fill",function(e){return t(Math.random())})})})},this.zoomed=function(){u.b.transform,r._vectorLayer.attr("transform",u.b.transform),r._layers.Data.style("stroke-width",1.5/u.b.transform.k+"px"),r._zoomLevel!=u.b.transform.k&&(r._zoomLevel=u.b.transform.k,r.redraw(r._data))},this.redraw=function(e){r._data=e;var t=r._svg.node();t instanceof SVGElement&&r._svg.attr("width",t.clientWidth).attr("height",t.clientHeight),r._layers.Data.selectAll("g").remove();var n=[];switch(d(e).chain().map(b.spatialPoint).value().forEach(function(e){void 0!=e&&n.push(e)}),r._symbology){case a.PointClustered:var i=y.generatePieData(n,r._zoomLevel,1,r._config.MaxPieSize,r._config.ClusterDistance,r._config.DisplayUnit);if(0==i.length)break;r.displayPies(i,r._layers.Data,r._projection,r._currentPalette,r._config.DisplayUnit),r._svg.call(r._zoom);break;case a.PointIndividual:throw"Not implemented"}},this.selectedPoints=function(){return r._selectedPoints},this.displayPies=function(e,t,n,i,a){var o=r,l=u.h().value(function(e){return e.Value}).sort(null),d=u.a().outerRadius(function(e){return e.data.Radius/r._zoomLevel}).innerRadius(0),p=u.a().innerRadius(function(e){return e.data.Radius/r._zoomLevel}).outerRadius(function(e){return(e.data.Radius+1)/r._zoomLevel}),f=t.selectAll("g").data(e).enter().append("g").attr("transform",function(e){return"translate("+n([e.Centroid.geometry.coordinates[0],e.Centroid.geometry.coordinates[1]])+")"}).attr("class","pies marker").on("click",function(e){c(o).trigger(s.SELECTED_POINTS),o._selectedPoints=e.DataPoints});f.selectAll("path").data(function(e){return l(e.Categories)}).enter().append("path").attr("d",d).attr("fill",function(e,t){return void 0!=i?"#"+g.getColour(i.Palette,e.data.Category):"black"}),f.selectAll("path.outline").data(function(e){return l(e.Categories)}).enter().append("path").attr("class","outline").attr("d",p).attr("fill","black")},this._config=n,this._svg=u.m("#"+e),Object(h.isNullOrUndefined)(this._svg))throw Error("The specified map container does not exist");if(this._legendSvg=u.n(t),Object(h.isNullOrUndefined)(this._legendSvg))throw Error("There are no legend elements available with the class name "+t);this._symbology=n.DisplayMode;var i=c("#"+e).width(),o=c("#"+e).height();if(Object(h.isNullOrUndefined)(i)||Object(h.isNullOrUndefined)(o))throw Error("The height and width of the map element could not be computed");this._svg.attr("width","100%").attr("height","100%").attr("viewBox","0 0 "+Math.min(i,o)+" "+Math.min(i,o)).attr("preserveAspectRatio","xMinYMin");var l=this._svg.append("g");this._vectorLayer=l.append("g"),this._layers={BackgroundLayers:this._vectorLayer.append("g").attr("class","background-layers"),Data:this._vectorLayer.append("g").attr("class","data")},this._projection=m.create(n.Projection,n.MapCentre,n.MapZoomLevel),this._zoom=u.p().scaleExtent([1,4]).on("zoom",this.zoomed),this._zoomLevel=1,this._selectedPoints=[];var p=u.e().projection(this._projection);if(this._currentPalette=this._config.DataPalettes.find(function(e){return e.Column==r._config.DisplayUnit}),Object(h.isNullOrUndefined)(this._currentPalette))throw"Configuration error: the data palette is not defined: "+this._config.DisplayUnit;v.drawCategoricalLegend(this._currentPalette,this._legendSvg),this.loadBaseLayers(p)}}();!function(e){(m||(m={})).create=function(e,t,n){switch(void 0==n&&(n=1),void 0==t&&(t=[45,45]),e){case o.Arctic:return u.d().scale(600*n).translate([500,350]).clipAngle(90).rotate([0,-90]).precision(0);case o.Standard:return u.c().center(t).scale(150*n)}return u.c().center(t).scale(150*n)}}(),function(e){var t="000";(g||(g={})).getColour=function(e,n){if(Object(h.isNullOrUndefined)(e))return t;var r=e.find(function(e){return e.Name==n});return Object(h.isNullOrUndefined)(r)?t:r.Hex}}(),function(e){(v||(v={})).drawCategoricalLegend=function(e,t){t.empty();var n=[],r=[],i=[];e.Palette.forEach(function(e){n.push(e.Name),r.push(e.Name),i.push({Key:e.Name,Value:e.Hex})});var a=17.5*r.length;t.attr("height",a);var o=u.j().domain(n).range([6,a+6]);t.append("g").selectAll("circle").data(i).enter().append("circle").attr("cx",6).attr("cy",function(e){var t=o(e.Key);return void 0!=t?6+t:6}).attr("r",5).attr("stroke","black").attr("fill",function(e){return"#"+e.Value}),t.append("g").selectAll("text").data(i).enter().append("text").attr("x",15).attr("y",function(e){var t=o(e.Key);return void 0!=t?10+t:10}).text(function(e){return e.Key})}}(),function(e){function t(e){return!isNaN(Number(e.toString()))}(b||(b={})).spatialPoint=function(e){if("LatDD"in e&&"LonDD"in e){if((Object(h.isString)(e.LatDD)||Object(h.isString)(e.LonDD))&&(0==e.LatDD.length||0==e.LonDD.length))return void console.log("Warning: a point had empty spatial coordinates");if(t(e.LatDD)&&t(e.LonDD))return e.LatDD=parseFloat(e.LatDD),e.LonDD=parseFloat(e.LonDD),e}console.log("Warning: a point did not have valid spatial coordinates")}}(),function(e){function t(e,t){var n=0,r=function(e,i){var a={type:"Feature",properties:e[0],geometry:{type:"Point",coordinates:[e[0].LonDD,e[0].LatDD]}},o=d.filter(e,function(e){var n={type:"Feature",properties:e,geometry:{type:"Point",coordinates:[e.LonDD,e.LatDD]}};return p.distance(a,n,"kilometers")<t}),l=p.featureCollection(d.map(o,function(e){return p.point([e.LonDD,e.LatDD],e)})),s={Centroid:p.centroid(l),Points:o};i.push(s);var c=d.difference(e,o);return++n>1e4?(console.log(i),console.log(c),i):c.length>0?r(c,i):i};return r(e,[])}e.generatePieData=function(e,n,r,i,a,o){if(0==e.length)return[];var l=t(d.sortBy(e,o),a-(n-1)/3*(a-1)),s=u.l().domain([0,i]).range([3.5,25.5]).exponent(1),c=0;return d.map(l,function(e){var t=d.reduce(e.Points,function(e,t){var n=t[o],r=d.where(e,{category:n});if(0==r.length)return e.push({Category:n,Value:1,Radius:0}),e;for(var i={Category:n,Value:r[0].Value++,Radius:0},a=0,l=e.length;a<l;a++)if(e[a].Category==i.Category){e[a]=i;break}return e},[]),n=0;t.forEach(function(e){n+=e.Value}),n>c&&(c=n);var r=s(n);return t.forEach(function(e){e.Radius=r}),{Centroid:e.Centroid,Categories:t,Total:n,DataPoints:e.Points}})},e.cluster=t}(y||(y={})),n.d(t,"ThallooViewModel",function(){return L}),function(e){e[e.LOADING=0]="LOADING",e[e.STANDARD=1]="STANDARD",e[e.FULLSCREEN=2]="FULLSCREEN"}(D||(D={}));var M,L=function(){return function(e){var t=this;this.config=void 0,this.rawData=[],this.thallooMap=void 0,this.filters=r.observableArray(),this.slices=r.observableArray(),this.displayMode=r.observable(D.LOADING),this.id=r.observable(),this.title=r.observable(),this.description=r.observable(""),this.descriptionExpanded=r.observable(!1),this.publication=r.observable(),this.displayUnit=r.observable(),this.baselayers=r.observableArray([]),this.logos=r.observableArray([]),this.selectedFilter=r.observable(),this.selectedFilterValues=r.observableArray(),this.currentSlice=r.observable(),this.currentSliceMin=r.observable(),this.currentSliceMax=r.observable(),this.stashedFilters=r.observableArray(),this.stashedSlices=r.observableArray(),this.displayedPointsCount=r.observable(0),this.selectedPoints=r.observableArray(),this.toggleFullScreen=function(){t.displayMode()==D.FULLSCREEN?t.displayMode(D.STANDARD):t.displayMode()==D.STANDARD&&t.displayMode(D.FULLSCREEN)},this.toggleDescriptionLength=function(){t.descriptionExpanded(!t.descriptionExpanded())},this.stashFilter=function(){var e=t.selectedFilter();t.stashedFilters.push({Name:e.Name,Unit:e.Unit,Description:e.Description,Options:e.Options,Column:e.Column,DataType:e.DataType,SelectedOptions:t.selectedFilterValues()})},this.removeFilter=function(e){t.stashedFilters.remove(e)},this.stashSlice=function(e,n,r){t.stashedSlices.push({Name:e,Min:n,Max:r})},this.removeSlice=function(e){t.stashedSlices.remove(e)},this.zoomIn=function(){null!=t.thallooMap&&t.thallooMap.zoomIn()},this.zoomOut=function(){null!=t.thallooMap&&t.thallooMap.zoomOut()},this.redrawMap=function(){var e=t,n=[];n=0==t.selectedFilterValues().length?t.rawData:d.filter(t.rawData,function(n){return void 0!=d.find(t.selectedFilterValues(),function(t){return M.stringPresentInSemicolonList(n[e.selectedFilter().Column],t)})}),null!=t.currentSlice()&&(console.log(e.currentSliceMax()),console.log(e.currentSliceMin()),n=d(n).chain().filter(function(t){return Number(t[e.currentSlice().Column])<=Number(e.currentSliceMax())&&Number(t[e.currentSlice().Column])>=Number(e.currentSliceMin())}).value()),t.stashedFilters().forEach(function(e){n=d.filter(n,function(t){return d.contains(e.SelectedOptions,t[e.Column])})}),null!=t.thallooMap&&(t.displayedPointsCount(n.length),t.thallooMap.redraw(n))};var n=this;n.selectedFilter.subscribe(function(e){n.selectedFilterValues([]),n.redrawMap()}),n.selectedFilterValues.subscribe(function(e){n.redrawMap()}),n.currentSliceMin.subscribe(function(e){n.redrawMap()}),n.currentSliceMax.subscribe(function(e){n.redrawMap()}),n.stashedFilters.subscribe(function(e){n.redrawMap()}),n.stashedSlices.subscribe(function(e){n.redrawMap()}),n.currentSlice.subscribe(function(e){null!=e?(n.currentSliceMin(e.Min),n.currentSliceMax(e.Max),console.log(e),n.redrawMap()):n.redrawMap()});var i=u.g("../map-data/"+e+".json"),a=u.o("../map-data/"+e+".txt");i.then(function(e){t.displayMode(D.STANDARD),n.config=e,n.thallooMap=new S("map",".symbology-container",e),n.baselayers(e.BaseLayers),n.title(e.Name),n.description(e.Description),n.publication(e.Publication),n.displayUnit(e.DisplayUnit),n.logos(e.Logos),c(n.thallooMap).on(s.SELECTED_POINTS,function(){if(void 0!=n.thallooMap){var e=n.thallooMap.selectedPoints(),t=d.map(e,M.objectToKeyValue);n.selectedPoints(t);var r=c("#selected").offset();void 0!=r&&c("html, body").animate({scrollTop:r.top},200)}}),a.then(function(t){n.rawData=d.map(t,M.tryParseDataPoint),d(e.Fields).map(function(e){if(e.DataType==l.Continuous){var t={Min:Number(d.chain(n.rawData).pluck(e.Column).filter(function(e){return!isNaN(parseFloat(e))&&isFinite(e)}).min().value()),Max:Number(d.chain(n.rawData).pluck(e.Column).filter(function(e){return!isNaN(parseFloat(e))&&isFinite(e)}).max().value()),Unit:e.Unit,Name:e.Name,Column:e.Column};n.slices.push(t)}else if(e.DataType==l.Categorical){var r={Options:d.chain(n.rawData).pluck(e.Column).map(function(e){if(void 0!=e)return d.map(e.split(";"),function(e){return e.trim()})}).flatten().filter(function(e){return""!=e}).uniq().sortBy(function(e){return e.toLowerCase()}).value(),Name:e.Name,Unit:e.Unit,Description:e.Description,DataType:e.DataType,Column:e.Column,SelectedOptions:[]};n.filters.push(r)}}),n.redrawMap()})})}}();!function(e){e.splitDataBySite=function(e){return d(e["LatDD,LonDD"].split(";")).chain().map(function(e){return e.split(",")}).filter(function(e){return 2==e.length}).map(function(t){var n=e,r={LatDD:t[0].trim(),LonDD:t[1].trim()};return jQuery.extend(n,r)}).value()},e.stringPresentInSemicolonList=function(e,t){var n=d.map(e.split(";"),function(e){return e.trim()});return d.contains(n,t)},e.objectToKeyValue=function(e){var t=Object.keys(e);return d.map(t,function(t){return{key:t,value:e[t]}})},e.tryParseDataPoint=function(e){return e}}(M||(M={}))}}]);