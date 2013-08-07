define(function() {
	var DBL = window.DBL || {};
	return {
		renderLineDiags: function() {
			if ($('#suggestions').css('display') !== 'none') {
				DBL.route = $('#suggestion-list dt:nth-child(' + (DBL.suggestionIndex * 2 + 1) + ') a').text();
			}
			if (DBL.Router !== undefined && window.location.pathname !== "/line/" + DBL.route) {
				DBL.Router.navigate("line/" + DBL.route);
			}
			$('title').text(DBL.route + "— Route Schematic — Dublin Live Times");
			$("#diagWrapper").detach();
			$('<div/>', {
				id: "diagWrapper"
			}).appendTo($("body"));
			$('<div/>', {
				id: "linediagInbound"
			}).appendTo($("#diagWrapper"));
			$('<div/>', {
				id: "linediagOutbound"
			}).appendTo($("#diagWrapper"));
			$('#suggestion-list').detach();
			var inboundStops = {},
				outboundStops = {};
			console.log(DBL.route); // Get Stops
			$.get(window.location.protocol + "//" + window.location.hostname + "/" + "stopFeatures/" + DBL.route, function(d, textStatus, xhr) {
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
				if (_.keys(inboundStops).length > 0) {
					console.log(inboundStops);
					var startStop = inboundStops[_.sortBy(_.keys(inboundStops), function(s) {
						return s - 0.0;
					})[0]].name;
					var endStop = inboundStops[_.sortBy(_.keys(inboundStops), function(s) {
						return s - 0.0;
					})[_.keys(inboundStops).length - 1]].name;
					$('<h2/>', {
						"html": "<span class=\"route r" + DBL.route + "\" >" + DBL.route + "</span> ⇥ <span class=\"lineDiagStopNumberSpan\" >" + startStop.split('|')[0] + "</span>" + startStop.split('|')[1] + " ➔ <span class=\"lineDiagStopNumberSpan\" >" + endStop.split('|')[0] + "</span>" + endStop.split('|')[1]
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
						//console.log(i);
						var stopRoutes = {},
							stopRouteSpans = "",
							stopName = inboundStops[i].name;
						_.forEach(inboundStops[i].routes.split(/\|/), function(rt) {
							if ((rt.length !== 0) && rt != DBL.route) {
								stopRoutes[rt] !== undefined ? stopRoutes[rt]++ : stopRoutes[rt] = 1;
							}
						});
						_.forEach(_.keys(stopRoutes), function(rt) {
							stopRouteSpans += Mustache.render(DBL.Templates.routeSpan, {
								"rt": rt
							});
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
							html: (stopCount % 2 == 1 ? Mustache.render(DBL.Templates.lineStopName, {
								"stop": stopName
							}) : Mustache.render(DBL.Templates.stopRouteSpans, {
								"stopRouteSpans": stopRouteSpans
							})) + ((_.keys(stopRoutes).length < 2) ? Mustache.render(DBL.Templates.normalStop) : Mustache.render(DBL.Templates.interchangeStop))
						}).css("width", _.keys(stopRoutes).length > 5 ? "100px" : "").appendTo('#inboundTop');
						$('<div/>', {
							"data-stopId": inboundStops[i].name.split(/\|/)[0],
							html: (stopCount++ % 2 === 0 ? Mustache.render(DBL.Templates.lineStopName, {
								"stop": stopName
							}) : Mustache.render(DBL.Templates.stopRouteSpans, {
								"stopRouteSpans": stopRouteSpans
							}))
						}).css("width", _.keys(stopRoutes).length > 5 ? "100px" : "").appendTo('#inboundBottom');
					});
					$('#linediagInbound').css("width", (_.keys(inboundStops).length * (window.innerWidth < 500 ? 40 : 80) + 30) + "px");
				}
				if (_.keys(outboundStops).length > 0) {
					var startStop = outboundStops[_.sortBy(_.keys(outboundStops), function(s) {
						return s - 0.0;
					})[0]].name;
					var endStop = outboundStops[_.sortBy(_.keys(outboundStops), function(s) {
						return s - 0.0;
					})[_.keys(outboundStops).length - 1]].name;
					$('<h2/>', {
						"html": "<span class=\"route r" + DBL.route + "\" >" + DBL.route + "</span> ↤ <span class=\"lineDiagStopNumberSpan\" >" + startStop.split('|')[0] + "</span>" + startStop.split('|')[1] + " ➔ <span class=\"lineDiagStopNumberSpan\" >" + endStop.split('|')[0] + "</span>" + endStop.split('|')[1]
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
					console.log(_.keys(outboundStops).length);
					stopCount = 0;
					_.forEach(_.sortBy(_.keys(outboundStops), function(k) {
						return (k - 0.0);
					}), function(o) {
						var stopRoutes = {};
						_.forEach(outboundStops[o].routes.split(/\|/), function(rt) { //console.log(rt.length);
							if (rt != DBL.route) {
								(rt.length !== 0) && stopRoutes[rt] !== undefined ? stopRoutes[rt]++ : stopRoutes[rt] = 1;
							}
						});
						var stopRouteSpans = "";
						_.forEach(_.keys(stopRoutes), function(rt) {
							stopRouteSpans += Mustache.render(DBL.Templates.routeSpan, {
								"rt": rt
							});
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
							html: (stopCount % 2 == 1 ? Mustache.render(DBL.Templates.lineStopName, {
								"stop": stopName
							}) : Mustache.render(DBL.Templates.stopRouteSpans, {
								"stopRouteSpans": stopRouteSpans
							})) + ((_.keys(stopRoutes).length < 2) ? Mustache.render(DBL.Templates.normalStop) : Mustache.render(DBL.Templates.interchangeStop))
						}).css("width", _.keys(stopRoutes).length > 5 ? "100px" : "").appendTo('#outboundTop');
						$('<div/>', {
							"data-stopId": outboundStops[o].name.split(/\|/)[0],
							html: (stopCount++ % 2 === 0 ? Mustache.render(DBL.Templates.lineStopName, {
								"stop": stopName
							}) : Mustache.render(DBL.Templates.stopRouteSpans, {
								"stopRouteSpans": stopRouteSpans
							}))
						}).css("width", _.keys(stopRoutes).length > 5 ? "100px" : "").appendTo('#outboundBottom');
					});
					$('#linediagOutbound').css("width", (_.keys(outboundStops).length * (window.innerWidth < 500 ? 40 : 80) + 30) + "px");
					_.forEach($('.stopName'), function(stop) {
						$(stop).on("click", function(e) {
							console.log($(e.target).parent().data('stopid'));
							DBL.Router.navigate("" + $(e.target).parent().data('stopid'), {
								trigger: true
							});
						});
					});
				}
				$.getJSON(window.location.protocol + "//" + window.location.hostname + "/" + 'vehiclePositions/inbound/' + DBL.route, function(d) {
					if (d !== null) {
						_.forEach(d.features, function(f) {
							console.log($("#linediagInbound div[data-stopId=\"" + f.properties.name.split(/\|/)[0] + "\"] span:nth-child(2)"));
							$("#linediagInbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).interchangeStop").removeClass("interchangeStop").addClass("normalStop").html("&#x276f;").css("font-family", "Zapf Dingbats");
							$("#linediagInbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).normalStop").html("&#x276f;").css("font-family", "Zapf Dingbats");
						});
					}
				});
				$.getJSON(window.location.protocol + "//" + window.location.hostname + "/" + 'vehiclePositions/outbound/' + DBL.route, function(d) {
					if (d !== null) {
						_.forEach(d.features, function(f) {
							console.log($("#linediagOutbound div[data-stopId=\"" + f.properties.name.split(/\|/)[0] + "\"] span:nth-child(2)"));
							$("#linediagOutbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).interchangeStop").removeClass("interchangeStop").addClass("normalStop").html("&#x276f;").css("font-family", "Zapf Dingbats");
							$("#linediagOutbound div[data-stopId='" + f.properties.name.split(/\|/)[0] + "'] span:nth-child(2).normalStop").html("&#x276f;").css("font-family", "Zapf Dingbats");
						});
					}
				});
			});
			$('#suggestions').fadeOut();
		}
	}
});