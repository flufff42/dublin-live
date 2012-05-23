$('document').ready(function() {
	var inboundStops = {},
		outboundStops = {};
	console.log(DBL.route); // Get Stops
	$.get("/stopFeatures/" + DBL.route, function(d, textStatus, xhr) {
		var stopData = d,
			previousStop = "",
			stopCount = 0;
		stopData.features.forEach(function(f) {
			if (f.geometry.type == "Point") {
				if (f.properties.inboundSequenceForKeyRoute !== null) {
					inboundStops[f.properties.inboundSequenceForKeyRoute] = {
						"routes": f.properties.routes,
						"name": f.properties.name
					};
				}
				if (f.properties.outboundSequenceForKeyRoute !== null) {
					outboundStops[f.properties.outboundSequenceForKeyRoute] = {
						"routes": f.properties.routes,
						"name": f.properties.name
					};
				}
			}
		});
		console.log(inboundStops);
		
		$('<h1/>',{
			"html": "Route <span class=\"r" + DBL.route + "\" >" + DBL.route + "</span> inbound from " + inboundStops[_.sortBy(_.keys(inboundStops),function (s) {return s-0.0;})[0]].name + " to " + inboundStops[_.sortBy(_.keys(inboundStops),function (s) {return s-0.0;})[_.keys(inboundStops).length-1]].name 
		}).appendTo('#linediagInbound');
		$('<div/>', {
			"id": "inboundTop"
		}).appendTo('#linediagInbound');
		$('<div/>', {
			"id": "linevisual",
			"class": "r" + DBL.route
		}).appendTo('#linediagInbound'); // Add line with route colour
		$('<div/>', {
			"id": "inboundBottom"
		}).appendTo('#linediagInbound');
		_.forEach(_.sortBy(_.keys(inboundStops), function(k) {
			return (k - 0.0);
		}), function(i) {
			console.log(i);
			var stopRoutes = {},
				stopRouteSpans = "",
				stopName = inboundStops[i].name;
			_.forEach(inboundStops[i].routes.split(/\|/), function(rt) {
				(rt.length !== 0) && stopRoutes[rt] !== undefined ? stopRoutes[rt]++ : stopRoutes[rt] = 1;
			});
			
			_.forEach(_.keys(stopRoutes), function(rt) {
				stopRouteSpans += Mustache.render(DBL.Templates.routeSpan, {"rt": rt});
			});
			console.log(stopRoutes);
			
			if (previousStop === "") {
				previousStop = stopName;
			} else {
				if (stopName.split(/\|/)[1].split(/,/)[0].indexOf(previousStop.split(/\|/)[1].split(/,/)[0]) === 0) {
					previousStop = stopName;
					stopName = stopName.split(/\|/)[1].split(/,/)[1];
				} else {
					previousStop = stopName;
					stopName = stopName.split(/\|/)[1];
				}
			}
			if (inboundStops[i].name.split(/\|/)[1]) $('<div/>', {
				"data-stopId": inboundStops[i].name.split(/\|/)[0],
				html: (stopCount % 2 == 1 ? Mustache.render(DBL.Templates.lineStopName, {"stop": stopName}) : Mustache.render(DBL.Templates.stopRouteSpans, {"stopRouteSpans": stopRouteSpans})) + ((_.keys(stopRoutes).length < 2) ? Mustache.render(DBL.Templates.normalStop) : Mustache.render(DBL.Templates.interchangeStop))
			}).appendTo('#inboundTop');
			$('<div/>', {
				"data-stopId": inboundStops[i].name.split(/\|/)[0],
				html: (stopCount++ % 2 === 0 ? Mustache.render(DBL.Templates.lineStopName, {"stop": stopName}) : Mustache.render(DBL.Templates.stopRouteSpans, {"stopRouteSpans": stopRouteSpans}))
			}).appendTo('#inboundBottom');
		});
		$('<h1/>',{
			"html": "Route <span class=\"r" + DBL.route + "\" >" + DBL.route + "</span> outbound from " + outboundStops[_.sortBy(_.keys(outboundStops),function (s) {return s-0.0;})[0]].name + " to " + outboundStops[_.sortBy(_.keys(outboundStops),function (s) {return s-0.0;})[_.keys(outboundStops).length-1]].name 
		}).appendTo('#linediagOutbound');
		$('<div/>', {
			"id": "outboundTop"
		}).appendTo('#linediagOutbound');
		$('<div/>', {
			"id": "linevisual",
			"class": "r" + DBL.route
		}).appendTo('#linediagOutbound');
		$('<div/>', {
			"id": "outboundBottom"
		}).appendTo('#linediagOutbound');
		$('#linediagInbound').css("width", (_.keys(inboundStops).length * 80) + "px");
		console.log(_.keys(outboundStops).length);
		stopCount = 0;
		_.forEach(_.sortBy(_.keys(outboundStops), function(k) {
			return (k - 0.0);
		}), function(o) {
			var stopRoutes = {};
			_.forEach(outboundStops[o].routes.split(/\|/), function(rt) { //console.log(rt.length);
					(rt.length !== 0) && stopRoutes[rt] !== undefined ? stopRoutes[rt]++ : stopRoutes[rt] = 1;
			});
			var stopRouteSpans = "";
			_.forEach(_.keys(stopRoutes), function(rt) {
				stopRouteSpans += Mustache.render(DBL.Templates.routeSpan, {"rt": rt});
			});
			var stopName = outboundStops[o].name;
			if (previousStop === "") {
				previousStop = stopName;
			} else {
				if (stopName.split(/\|/)[1].split(/,/)[0].indexOf(previousStop.split(/\|/)[1].split(/,/)[0]) === 0) {
					previousStop = stopName;
					stopName = stopName.split(/\|/)[1].split(/,/)[1];
				} else {
					previousStop = stopName;
					stopName = stopName.split(/\|/)[1];
				}
			}
			if (outboundStops[o].name.split(/\|/)[1]) $('<div/>', {
				"data-stopId": outboundStops[o].name.split(/\|/)[0],
				html: (stopCount % 2 == 1 ? 
						Mustache.render(DBL.Templates.lineStopName, {"stop": stopName}) : 
						Mustache.render(DBL.Templates.stopRouteSpans, {"stopRouteSpans": stopRouteSpans})
					) 
					+ ((_.keys(stopRoutes).length < 2) ? 
						Mustache.render(DBL.Templates.normalStop) : 
						Mustache.render(DBL.Templates.interchangeStop))
			}).appendTo('#outboundTop');
			$('<div/>', {
				"data-stopId": outboundStops[o].name.split(/\|/)[0],
				html: (stopCount++ % 2 === 0 ? Mustache.render(DBL.Templates.lineStopName, {"stop": stopName}) : Mustache.render(DBL.Templates.stopRouteSpans, {"stopRouteSpans": stopRouteSpans}))
			}).appendTo('#outboundBottom');
		});
		$('#linediagOutbound').css("width", (_.keys(outboundStops).length * 80) + "px");
		$.getJSON('../vehiclePositions/inbound/' + DBL.route, function(d) {
			_.forEach(d.features, function(f) {
				console.log($("#linediagInbound div[data-stopId=\"" + f.properties.name.split(/\|/)[0] + "\"] span:nth-child(2)"));
				
				$("#linediagInbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).interchangeStop")
				.removeClass("interchangeStop")
				.addClass("normalStop")
				.html("&#x276f;")
				.css("font-family", "Zapf Dingbats");
				
				$("#linediagInbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).normalStop")
				.html("&#x276f;")
				.css("font-family", "Zapf Dingbats");
			});
		});
		$.getJSON('../vehiclePositions/outbound/' + DBL.route, function(d) {
			_.forEach(d.features, function(f) {
				console.log($("#linediagOutbound div[data-stopId=\"" + f.properties.name.split(/\|/)[0] + "\"] span:nth-child(2)"));
				
				$("#linediagOutbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).interchangeStop")
				.removeClass("interchangeStop")
				.addClass("normalStop").html("&#x276f;")
				.css("font-family", "Zapf Dingbats");
				
				$("#linediagOutbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).normalStop")
				.html("&#x276f;")
				.css("font-family", "Zapf Dingbats");
			});
		});
	});
});