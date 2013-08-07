define(['util', 'results', 'templates', 'mustache', 'dispatcher','line','efaTrip'], function(Util, Results, Templates, Mustache, dispatcher, LineDiag, EFA) {
	var DBL = window.DBL || {};
	DBL.suggestionIndex = -1;
	DBL.keyupCount = 0;
	DBL.Util = Util;
	DBL.Results = Results;
	DBL.Templates = Templates;
	DBL.LineDiag = LineDiag;
	DBL.EFA = EFA;
	previousSearchTerm = undefined;
	previousResults = undefined;

	function showSuggestions(suggestions) {
		$('#suggestion-list').detach();
		$('<dl/>', {
			'id': 'suggestion-list',
			html: suggestions.join('')
		}).appendTo('#suggestions');
		dispatcher.trigger('changeLinkAction'); //changeLinkAction();
		DBL.suggestionIndex = -1;
		$('#suggestions').fadeIn();
	}

	function showStopSuggestions(targetInput) {
		var data = {};
		if (DBL.stopInfoFetched) {
			//var stop = '2895|Dundrum Road, Opposite Dundrum Business Park';
			var i = 0;
			var filterRegEx = new RegExp(targetInput.value, "i");
			if (targetInput.value.indexOf(previousSearchTerm) === 0) {
				previousResults = _.filter(previousResults, function(stopname) {
					return stopname.match(filterRegEx);
				});
			} else {
				previousResults = _.filter(_.keys(localStorage), function(stopname) {
					if (stopname.indexOf('|') == -1) {
						return false;
					} else {
						return stopname.match(filterRegEx);
					}
				});
			}
			previousSearchTerm = targetInput.value;
			_.each(previousResults, function(stop) {
				data[stop] = JSON.parse(localStorage.getItem(stop));
			});
			//data[stop] = JSON.parse(localStorage.getItem(stop));
		} else {
			if (DBL.currentRequest) DBL.currentRequest.abort();
			DBL.currentRequest = $.post(window.location.protocol + "//" + window.location.hostname + +"/suggestion/", {
				"prefix": targetInput.value
			}, function(d, textStatus, xhr) {
				if (xhr.status == 204 || DBL.suggestionsAllowed != 1) {
					$('#suggestionSpinner').fadeOut();
				} else {
					data = d;
				}
			});
		}
		var stops = [];
		var lastStop = "";
		//console.log(data);
		if (_.keys(data).length < 100) {
			$.each(data, function(stop, stopInformation) {
				var directionText = "";
				var directionClass = "";
				if (DBL.position) {
					var distance = DBL.Util.haversineDistance(
					stopInformation.lat, stopInformation.long, DBL.position.coords.latitude, DBL.position.coords.longitude);
					directionText = (Math.round(distance * 10) / 10) + "km "; // + directionClass;
					$('#stopDirection a').detach();
					$('#stopDirection span').detach();
					$("#stopDirection").removeClass().addClass(directionClass);
				}
				if (stopInformation.routes !== null && stopInformation.routes.indexOf(" ") != -1) {
					stopInformation.routes = stopInformation.routes.replace(" ", "|", "g");
				}
				var routesArray = (stopInformation.routes !== null) ? stopInformation.routes.split("|") : undefined;
				var routeLinks = "";
				for (var route in routesArray) {
					if (route != routesArray.length - 1) routeLinks += Mustache.render(DBL.Templates.routeLink, {
						route: routesArray[route],
						"stop": stop
					});
				}
				if (directionText) {
					stops.push(Mustache.render(DBL.Templates.stopLink, {
						"routeLinks": routeLinks,
						distance: directionText,
						"stop": stop
					}));
				} else {
					stops.push(Mustache.render(DBL.Templates.stopLink, {
						"routeLinks": routeLinks,
						"stop": stop
					}));
				}
				lastStop = stop;
			});
			showSuggestions(stops);
			$('#time-line').find('.timeline-time').detach();
			if (stops.length == 1) {
				clearTimeout(DBL.reloadTimeout);
				DBL.Results.fetchResultsForStop(lastStop);
			}
		}
		DBL.keyupCount = 0;
	}

	function showRouteSuggestions(targetInput) {
		var data = {};
		if (DBL.routeInfoFetched) {
			//var stop = '2895|Dundrum Road, Opposite Dundrum Business Park';
			var i = 0;
			var filterRegEx = new RegExp(targetInput.value, "i");
			previousResults = _.filter(_.keys(localStorage), function(route) {
				if (route.indexOf('|') == -1 && (route.match(/\d+/) !== null)) {
					return route.match(filterRegEx);
				} else {
					return false;
				}
			});
		}
		previousSearchTerm = targetInput.value;
		_.each(previousResults, function(route) {
			data[route] = JSON.parse(localStorage.getItem(route));
		});
		var routes = [];
		$.each(data, function(route, routeInformation) {
			console.log(route + routeInformation);
			var stopInfoString = (routeInformation.InboundFrom !== null ? routeInformation.InboundFrom + " ➔ " + routeInformation.InboundTo : " ") + "<br/>" + (routeInformation.OutboundFrom !== null ? routeInformation.OutboundFrom + " ➔ " + routeInformation.OutboundTo : " ");
			routes.push(Mustache.render(DBL.Templates.routeInfoLink, {
				"routeLinks": Mustache.render(DBL.Mode === DBL.Modes.Maps ? DBL.Templates.routeMapLink : DBL.Templates.routeLink, {
					"route": route,
					"stop": ""
				}),
				"stop": stopInfoString
			}));
		});
		showSuggestions(routes);
/*$('#suggestion-list').detach();
		$('<dl/>', {
			'id': 'suggestion-list',
			html: routes.join('')
		}).appendTo('#suggestions');*/
		$('dt').on("click", function(e) {
			console.log(e.target);
			var count = 0;
			_.forEach($(e.target).parent().children(), function(c) {
				if ($(c).text() != $(e.target).text()) {
					count++;
				} else {
					DBL.suggestionIndex = Math.floor(count / 2);
				}
			});
			console.log("Suggestion chosen: " + DBL.suggestionIndex);
			if (DBL.Mode == DBL.Modes.Maps) {
				DBL.Results.showMap();
			} else if (DBL.Mode == DBL.Modes.Routes) {
				setupAndRenderLineDiags();
			}
		});
		$('dd').on("click", function(e) {
			console.log(e.target);
			var count = 0;
			_.forEach($(e.target).parent().children(), function(c) {
				if ($(c).text() != $(e.target).text()) {
					count++;
				} else {
					DBL.suggestionIndex = Math.floor(count / 2);
				}
			});
			console.log("Suggestion chosen: " + DBL.suggestionIndex);
			if (DBL.Mode == DBL.Modes.Maps) {
				DBL.Results.showMap();
			} else if (DBL.Mode == DBL.Modes.Routes) {
				setupAndRenderLineDiags();
			}
		});
		//$('#suggestionSpinner').fadeOut();
		$('#time-line').find('.timeline-time').detach();
/*changeLinkAction();
		DBL.suggestionIndex = -1;*/
		//$('#suggestions').fadeIn();
		if (routes.length == 1) {
			console.log("Only one route left" + routes);
			DBL.suggestionIndex = 0;
			if (DBL.Mode == DBL.Modes.Maps) {
				DBL.Results.showMap();
			} else if (DBL.Mode == DBL.Modes.Routes) {
				setupAndRenderLineDiags();
			}
		}
		DBL.keyupCount = 0;
	}
	
	function showEFAStopSuggestions(targetInput) {
			if (DBL.currentRequest) DBL.currentRequest.abort();
			DBL.currentRequest = $.post(window.location.protocol + "//" + window.location.hostname + "/suggestionEFA/", {
				"prefix": targetInput.value
			}, function(d, textStatus, xhr) {
				if (xhr.status == 204 || DBL.suggestionsAllowed != 1) {
					$('#suggestionSpinner').fadeOut();
				} else {
					data = d;
					var stops = [];
					$.each(data, function(stopId, stopName) {
						stops.push(stops.push(Mustache.render(DBL.Templates.efaStopLink, {
							"stopId": stopId,
							"stop": stopName
						})));
						showSuggestions(stops);
					});
					if (data !== "" && _.keys(data).length == 1) {
						console.log(targetInput.id + ": " + _.keys(data)[0]);
						DBL.efaEndpointId[targetInput.id] = _.keys(data)[0];
						DBL.efaEndpointName[targetInput.id] = data[_.keys(data)[0]];
						if (_.keys(DBL.efaEndpointId).length === 2) {
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').val(DBL.efaEndpointName.tripTo);
							DBL.EFA.getEFATrips({
								origin: DBL.efaEndpointId.tripFrom,
								destination: DBL.efaEndpointId.tripTo
							});
							$('#suggestions').fadeOut();
						} else if (_.keys(DBL.efaEndpointId).length === 1) {
							$('#suggestions').fadeOut();
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').focus();
						}
					}
					$('dt').on("click", function(e) {
						console.log(e.target);
						var count = 0;
						_.forEach($(e.target).parent().parent().children(), function(c) {
							if ($(c).text() != $(e.target).text()) {
								count++;
							} else {
								DBL.suggestionIndex = Math.floor(count / 2);
							}
						});
						console.log("Suggestion chosen: " + DBL.suggestionIndex);
						DBL.efaEndpointId[targetInput.id] = $('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ') span').data('stopid');
						DBL.efaEndpointName[targetInput.id] = $('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ') span').text();
						if (_.keys(DBL.efaEndpointId).length === 2) {
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').val(DBL.efaEndpointName.tripTo);
							DBL.EFA.getEFATrips({
								origin: DBL.efaEndpointId.tripFrom,
								destination: DBL.efaEndpointId.tripTo
							});
							$('#suggestions').fadeOut();
						} else if (_.keys(DBL.efaEndpointId).length === 1) {
							$('#suggestions').fadeOut();
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').focus();
						}
					});
					$('dd').on("click", function(e) {
						console.log(e.target);
						var count = 0;
						_.forEach($(e.target).parent().parent().children(), function(c) {
							if ($(c).text() != $(e.target).text()) {
								count++;
							} else {
								DBL.suggestionIndex = Math.floor(count / 2);
							}
						});
						console.log("Suggestion chosen: " + DBL.suggestionIndex);
						DBL.efaEndpointId[targetInput.id] = $('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ') span').data('stopid');
						DBL.efaEndpointName[targetInput.id] = $('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ') span').text();
						if (_.keys(DBL.efaEndpointId).length === 2) {
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').val(DBL.efaEndpointName.tripTo);
							DBL.EFA.getEFATrips({
								origin: DBL.efaEndpointId.tripFrom,
								destination: DBL.efaEndpointId.tripTo
							});
							$('#suggestions').fadeOut();
						} else if (_.keys(DBL.efaEndpointId).length === 1) {
							$('#suggestions').fadeOut();
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').focus();
						}
					});
				}
			});
		}
	
	function setupAndRenderLineDiags() {
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
			DBL.LineDiag.renderLineDiags();
		}
	
	return {
		setupAndRenderLineDiags: setupAndRenderLineDiags,
		fetchSuggestion: function(event) {
			var ENTER = 13;
			var UP = 38;
			var LEFT = 37;
			var RIGHT = 39;
			var DOWN = 40;
			DBL.keyupCount++;
			var selectedSuggestion = $('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ')');
			var selectedSuggestionLink = $('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ') a');
			if (event.keyCode == ENTER || event.keyCode == DOWN || (event.keyCode == UP && DBL.suggestionIndex != -1)) {
				if (event.keyCode == UP && DBL.suggestionIndex > 0) {
					selectedSuggestion.toggleClass('selected');
					$('#suggestion-list dt:nth-of-type(' + [--DBL.suggestionIndex + 1] + ')').toggleClass('selected');
				} else if (event.keyCode == DOWN && DBL.suggestionIndex < $('#suggestion-list dt').length - 1) {
					selectedSuggestion.toggleClass('selected');
					$('#suggestion-list dt:nth-of-type(' + [++DBL.suggestionIndex + 1] + ')').toggleClass('selected');
				} else if (event.keyCode == ENTER && DBL.suggestionIndex != -1) {
					switch (DBL.Mode) {
					case DBL.Modes.Maps:
						DBL.Results.showMap();
						break;
					case DBL.Modes.Departures:
						DBL.Results.fetchResultsForStop(selectedSuggestionLink[0].text, "");
						break;
					case DBL.Modes.Routes:
						setupAndRenderLineDiags();
						break;
					case DBL.Modes.Trips:
						console.log("Selected EFA ID " + selectedSuggestionLink[0].dataset.stopid + "in field " + event.target.id);
						DBL.efaEndpointId[event.target.id] = selectedSuggestionLink[0].dataset.stopid;
						DBL.efaEndpointName[event.target.id] = selectedSuggestionLink[0].text;
						$(event.target).val(DBL.efaEndpointName[event.target.id]);
						if (_.keys(DBL.efaEndpointId).length === 2) {
							$('#tripFrom').val(DBL.efaEndpointName.tripFrom);
							$('#tripTo').val(DBL.efaEndpointName.tripTo);
							DBL.EFA.getEFATrips({
								origin: DBL.efaEndpointId.tripFrom,
								destination: DBL.efaEndpointId.tripTo
							});
							$('#suggestions').fadeOut();
						}
						break;
					}
				}
				if ($('#suggestion-list dt').length > 0) {}
			} else if (DBL.keyupCount > 0 && (event.target.value.length > 0) && !(event.keyCode == LEFT || event.keyCode == RIGHT)) {
				clearTimeout(DBL.reloadTimeout);
				$('#suggestionSpinner').fadeIn();
				var data = {};
				switch (DBL.Mode) {
				case DBL.Modes.Departures:
					showStopSuggestions(event.target);
					break;
				case DBL.Modes.Maps:
					showRouteSuggestions(event.target);
					break;
				case DBL.Modes.Routes:
					showRouteSuggestions(event.target);
					break;
				case DBL.Modes.Trips:
					showEFAStopSuggestions(event.target);
					break;
				default:
					console.log("Invalid mode: " + targetMode);
					break;
				}
			}
		},
		showEFAStopSuggestions: showEFAStopSuggestions,
		showRouteSuggestions: showRouteSuggestions
	}
});