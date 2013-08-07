define(['mapbox'], function() {
	var uriPrefix = window.location.protocol + "//" + window.location.hostname + "/";
	return {
		initmap: function initmap(targetId) {
			var url = 'http://api.tiles.mapbox.com/v3/flufff42.map-vagxln5f.jsonp';
			var map = new L.mapbox.map(targetId, 'flufff42.map-vagxln5f').setView((DBL.position !== undefined ? new L.LatLng(DBL.position.coords.latitude, DBL.position.coords.longitude) : new L.LatLng(53.3498, -6.2526)), 13);
			var stopIcon = new L.Icon({
				iconRetinaUrl: uriPrefix + 'leaflet/images/markerStop@2x.png',
				iconUrl: uriPrefix + 'leaflet/images/markerStop.png',
				shadowUrl: null,
				iconSize: new L.Point(5, 5),
				shadowSize: null,
				iconAnchor: new L.Point(2.5, 2.5),
				popupAnchor: new L.Point(0, -5)
			});
			var gl = new L.GeoJSON(undefined, {
				pointToLayer: function(data,latlng) {
					return new L.Marker(latlng, {
						icon: stopIcon
					});
				},
				onEachFeature: function(data, layer) {
					layer.bindPopup(data.properties.name + "\n" + data.properties.routes)
				}
			});
			$.getJSON(uriPrefix + 'stopFeatures/' + DBL.route, function(d) {
				console.log("Features:");
				console.log(d);
				if (d !== null) gl.addData(d);
			});
			map.addLayer(gl);
			var vehicleIconI = new L.Icon({
				iconRetinaUrl: uriPrefix + 'leaflet/images/markerOutbound@2x.png',
				iconUrl: uriPrefix + 'leaflet/images/markerOutbound.png',
				shadowUrl: null,
				iconSize: new L.Point(10, 10),
				shadowSize: null,
				iconAnchor: new L.Point(5, 5),
				popupAnchor: new L.Point(0, -10)
			});
			var glpI = new L.GeoJSON(undefined, {
				pointToLayer: function(data,latlng) {
					return new L.Marker(latlng, {
						icon: vehicleIconI,
						zIndexOffset: 1000
					});
				}
			});
			glpI.on("featureparse", function(e) {
				if (e.properties && e.properties.name && e.properties.direction.match("Inbound") !== null) {
					console.log(e.properties.name);
					e.layer.bindPopup(e.properties.name + "\n" + e.properties.direction);
				}
			});
			map.addLayer(glpI);
			var vehicleIconO = new L.Icon({
				iconRetinaUrl: uriPrefix + 'leaflet/images/markerOutbound@2x.png',
				iconUrl: uriPrefix + 'leaflet/images/markerOutbound.png',
				shadowUrl: null,
				iconSize: [10, 10],
				shadowSize: null,
				iconAnchor: [5, 5],
				popupAnchor: [0, -10]
			});
			var glpO = new L.GeoJSON(undefined, {
				pointToLayer: function(data,latlng) {
					return new L.Marker(latlng, {
						icon: vehicleIconO,
						zIndexOffset: 1000
					});
				}
			});
			glpO.on("featureparse", function(e) {
				if (e.properties && e.properties.name && e.properties.direction.match("Outbound") !== null) {
					console.log(e.properties.name);
					e.layer.bindPopup(e.properties.name + "\n" + e.properties.direction);
				}
			});
			map.addLayer(glpO);
			$.getJSON(uriPrefix + 'vehiclePositions/inbound/' + DBL.route, function(d) {
				console.log("Inbound:");
				console.log(d);
				if (d !== null) glpI.addData(d);
			});
			$.getJSON(uriPrefix + 'vehiclePositions/outbound/' + DBL.route, function(d) {
				console.log("Outbound:");
				console.log(d);
				if (d !== null) glpO.addData(d);
			});
			var userIcon = new L.Icon({
				iconRetinaUrl: uriPrefix + 'leaflet/images/markerUser@2x.png',
				iconUrl: uriPrefix + 'leaflet/images/markerUser.png',
				shadowUrl: null,
				iconSize: new L.Point(5, 5),
				shadowSize: null,
				iconAnchor: new L.Point(2.5, 2.5),
				popupAnchor: new L.Point(0, -5)
			});
			var userPositionIcon = userIcon;
			if (DBL.position !== undefined) {
				map.addLayer(new L.Marker(new L.LatLng(DBL.position.coords.latitude, DBL.position.coords.longitude), {
					icon: userPositionIcon
				}));
			}
			var overlays = {
				"Route": gl,
				"Inbound": glpI,
				"Outbound": glpO
			};
			var layerControl = new L.Control.Layers(undefined, overlays, {
				"collapsed": false
			});
			map.addControl(layerControl);
			DBL.map = map;
		}
	}
});