// Define the map to use from MapBox
var url = 'http://api.tiles.mapbox.com/v3/mapbox.mapbox-streets.jsonp';

// Get metadata about the map from MapBox
wax.tilejson(url,function(tilejson) {
      
    // Make a new Leaflet map in your container div
    var map = new L.Map('mapbox')  // container's id="mapbox"
      
    // Center the map on Washington, DC, at zoom 15
    .setView(new L.LatLng(53.3498, -6.2526), 13)

    // Add MapBox Streets as a base layer
    .addLayer(new L.StamenTileLayer("toner",{detectRetina:true}));
    var stopIcon = L.Icon.extend({
    iconUrl: window.devicePixelRatio > 1 ? '../leaflet/images/markerStop@2x.png' : '../leaflet/images/markerStop.png',
    shadowUrl: null,
    iconSize: new L.Point(5, 5),
    shadowSize: null,
    iconAnchor: new L.Point(2.5, 2.5),
    popupAnchor: new L.Point(0,-5)
	});
    var gl = new L.GeoJSON(undefined,{pointToLayer: function (latlng) { 
	    	return new L.Marker(latlng, {icon: new stopIcon()});
	    }});
    
    gl.on("featureparse", function (e) {
        if (e.properties && e.properties.name){
            e.layer.bindPopup(e.properties.name + "\n" + e.properties.routes);
        }
    });
    $.getJSON('../stopFeatures/'+DBL.route,function (d) {gl.addGeoJSON(d);});
    map.addLayer(gl);
    
    var vehicleIconI = L.Icon.extend({
    iconUrl: window.devicePixelRatio > 1 ? '../leaflet/images/markerInbound@2x.png' : '../leaflet/images/markerInbound.png',
    shadowUrl: null,
    iconSize:new L.Point(10, 10),
    shadowSize: null,
    iconAnchor: new L.Point(5, 5),
    popupAnchor: new L.Point(0,-10)
	});
	    var glpI = new L.GeoJSON(undefined,{pointToLayer: function (latlng) { 
	    	return new L.Marker(latlng, {icon: new vehicleIconI()});
	    }});
    glpI.on("featureparse", function (e) {
    	
        if (e.properties && e.properties.name && e.properties.direction.match("Inbound") !== null){
            console.log(e.properties.name);
            e.layer.bindPopup(e.properties.name + "\n" + e.properties.direction);
        }
    });
     map.addLayer(glpI);
    var vehicleIconO = L.Icon.extend({
    iconUrl: window.devicePixelRatio > 1 ? '../leaflet/images/markerOutbound@2x.png' : '../leaflet/images/markerOutbound.png',
    shadowUrl: null,
    iconSize: new L.Point(10, 10),
    shadowSize: null,
    iconAnchor: new L.Point(5, 5),
    popupAnchor: new L.Point(0,-10)
	});
    
    var glpO = new L.GeoJSON(undefined,{pointToLayer: function (latlng) { 
    	return new L.Marker(latlng, {icon: new vehicleIconO()});
    }});
    glpO.on("featureparse", function (e) {
    	
        if (e.properties && e.properties.name &&  e.properties.direction.match("Outbound") !== null){
            console.log(e.properties.name);
            e.layer.bindPopup(e.properties.name + "\n" + e.properties.direction);
        }
    });
    map.addLayer(glpO);
    $.getJSON('../vehiclePositions/inbound/'+DBL.route,function (d) {glpI.addGeoJSON(d)});
    $.getJSON('../vehiclePositions/outbound/'+DBL.route,function (d) {glpO.addGeoJSON(d)});
   var overlays = {"Route":gl, "Inbound":glpI,"Outbound":glpO};
   var layerControl = new L.Control.Layers(undefined,overlays,{"collapsed":false});
   map.addControl(layerControl);
    
});