define(["jquery", "geo", "suggestions", "backbone", "dispatcher", "results", "line"], function($, Geo, Suggestions, Backbone, dispatcher, Results, LineDiag) {
	var DBL = window.DBL || {};
	DBL.Geo = Geo;
	DBL.Suggestions = Suggestions;
	DBL.Results = Results;
	DBL.LineDiag = LineDiag;

	function setup() {
		DBL.Mode = DBL.Modes.Departures;
		DBL.firstFocus.stopSearch = 1;
		$("#results-frame").css("width", "100%");
		fetchStopInfo();
		fetchRouteInfo();
		$("form").submit(function(event) {
			event.preventDefault();
		});
		if (navigator.geolocation && DBL.Geo.fetchLocation()) {}
		dispatcher.on('changeLinkAction', function(arg) {changeLinkAction();});
		changeLinkAction();
		$("body").ajaxError(function(e, xhr, ajax, error) {
			if (ajax.url == "/suggestion/") {
				console.log("It seems there were no suggestions.");
				DBL.suggestionsAllowed = 1;
				$('#suggestionSpinner').fadeOut();
			} else {
				console.log("Something went terribly wrong with AJAX..." + ajax.url);
				$('#suggestionSpinner').fadeOut();
				$('#fetchSpinner').fadeOut();
			}
		});
		$('#stopSearch').focus(firstFocusHandler);
		$('#stopSearch').keyup(DBL.Suggestions.fetchSuggestion);
		DBL.Router = new(Backbone.Router.extend({
			routes: {
				":stopID": "stop",
				"map/:route": "map",
				"line/:route": "line"
			},
			stop: function(stopID) {
				$("#lozengebar span.selected").toggleClass("selected");
				$("#lozengebar span#Departures").toggleClass("selected");
				modeChange(DBL.Modes.Departures);
				console.log("URL contains stop ID: " + stopID);
				DBL.Results.initializeTimeline("#results-frame");
				DBL.Results.fetchResultsForStop(stopID, "");
			},
			map: function(route) {
				$("#lozengebar span.selected").toggleClass("selected");
				$("#lozengebar span#RouteInformation").toggleClass("selected");
				modeChange(DBL.Modes.RouteInformation);
				console.log("URL contains route: " + route);
				DBL.route = route;
				DBL.Results.showRouteMap();
			},
			line: function(route) {
				$("#lozengebar span.selected").toggleClass("selected");
				$("#lozengebar span#RouteInformation").toggleClass("selected");
				modeChange(DBL.Modes.RouteInformation);
				console.log("URL contains route: " + route);
				DBL.route = route;
				//if(DBL.Router !== undefined) DBL.Router.navigate("line/"+DBL.route,{trigger: false});
				DBL.LineDiag.renderLineDiags();
			}
		}))();
		Backbone.history.start({
			pushState: true
		});
	}

	function firstFocusHandler(event) {
		//console.log(event);
		if (DBL.firstFocus[event.target.id]) {
			$(event.target).val("");
			DBL.firstFocus[event.target.id] = 0;
		}
	}

	function fetchStopInfo() {
		if (JSON.parse(localStorage.getItem("stopInfoFetched"))) {
			DBL.stops = new Array(localStorage.length);
			for (var i = 0; i < localStorage.length; i++) {
				DBL.stops[i] = localStorage.key(i);
			}
			DBL.stopInfoFetched = true;
			checkUpdatedStopInfo();
		} else {
			DBL.currentRequest = $.get(window.location.protocol + "//" + window.location.hostname + "/stopInfo", function(data, textStatus, xhr) {
				$.each(data, function(stop, stopInformation) {
					localStorage.setItem(stop, JSON.stringify(stopInformation));
				});
				DBL.stops = new Array(localStorage.length);
				for (var i = 0; i < localStorage.length; i++) {
					DBL.stops[i] = localStorage.key(i);
				}
				localStorage.setItem("stopInfoFetched", "true");
				localStorage.setItem("stopInfoMTime", new Date().valueOf() / 1000);
				DBL.stopInfoFetched = true;
			});
		}
	}

	function checkUpdatedStopInfo() {
		DBL.currentRequest = $.get(window.location.protocol + "//" + window.location.hostname + "/stopInfoUpdated", function(data, textStatus, xhr) {
			if (data.modified > localStorage.getItem("stopInfoMTime")) {
				DBL.stopInfoFetched = false;
				DBL.routeInfoFetched = false;
				localStorage.removeItem("stopInfoFetched");
				localStorage.removeItem("routeInfoFetched");
				fetchStopInfo();
				fetchRouteInfo();
			}
		});
	}

	function fetchRouteInfo() {
		if (JSON.parse(localStorage.getItem("routeInfoFetched"))) {
			DBL.routes = {};
			for (var i = 0; i < localStorage.length; i++) {
				if (localStorage.key(i).indexOf('|') == -1 && localStorage.key(i).match(/\d+/)) {
					DBL.routes[localStorage.key(i)] = JSON.parse(localStorage.getItem(localStorage.key(i)));
				}
			}
			DBL.routeInfoFetched = true;
		} else {
			DBL.currentRequest = $.get(window.location.protocol + "//" + window.location.hostname + "/" + "routeInfo", function(data, textStatus, xhr) {
				$.each(data, function(route, routeInformation) {
					localStorage.setItem(route, JSON.stringify(routeInformation));
				});
				DBL.routes = {};
				for (var i = 0; i < localStorage.length; i++) {
					if (localStorage.key(i).indexOf('|') == -1 && localStorage.key(i).match(/\d+/)) {
						DBL.routes[localStorage.key(i)] = JSON.parse(localStorage.getItem(localStorage.key(i)));
					}
				}
				localStorage.setItem("routeInfoFetched", "true");
				DBL.routeInfoFetched = true;
			});
		}
	}

	function changeLinkAction() {
		$("a:not(.mapLink):not(.locationAttach):not(.nearbyLink)").click(function(event) {
			event.preventDefault();
			//console.log(event.target);
			var linkComponents = event.target.href.split("/");
			//console.log(linkComponents);
			if (linkComponents.length == 4) {
				linkComponents[3] = decodeURI(linkComponents[3]);
				clearTimeout(DBL.reloadTimeout);
				DBL.Results.fetchResultsForStop(linkComponents[3], "");
			}
		});
		$("span.locationAttach").click(function(event) {
			event.preventDefault();
			DBL.Geo.fetchLocation();
		});
		$("span.nearbyLink").click(function(event) {
			event.preventDefault();
			DBL.Geo.getNearbyStops();
		});
		$("#lozengebar span").off("click");
		$("#lozengebar span").click(function(event) {
			console.log(event.target.id);
			$("#lozengebar span.selected").toggleClass("selected");
			$(event.target).toggleClass("selected");
			modeChange(DBL.Modes[event.target.id]);
		});
	}

	function modeChange(targetMode) {
		if (targetMode !== undefined) {
			DBL.Mode = targetMode;
			switch (DBL.Mode) {
			case DBL.Modes.Departures:
				console.log("Switched to Departures");
				if ($("#diagWrapper").length > 0) {
					$("#diagWrapper").detach();
					$('<div/>', {
						id: "results-frame"
					}).appendTo($("body"));
					$('<div/>', {
						id: "time-line"
					}).appendTo($("#results-frame"));
				} else if ($("#mapbox").length > 0) {
					$("#mapbox").detach();
					$('<div/>', {
						id: "results-frame"
					}).appendTo($("body"));
					$('<div/>', {
						id: "time-line"
					}).appendTo($("#results-frame"));
				} else if ($("#tripsFrame").length > 0) {
					$("#tripsFrame").detach();
					$('<div/>', {
						id: "results-frame"
					}).appendTo($("body"));
					$('<div/>', {
						id: "time-line"
					}).appendTo($("#results-frame"));
				}
				$('input').detach();
				$('<input/>', {
					id: "stopSearch",
					"value": "Search for a stop here"
				}).appendTo($("form"));
				$('#stopSearch').focus(firstFocusHandler);
				$('#stopSearch').keyup(DBL.Suggestions.fetchSuggestion);
				DBL.firstFocus.stopSearch = 1;
				break;
			case DBL.Modes.Maps:
				$('.mapLink').detach();
				$('.stopPermaLink').detach();
				//if(DBL.Router !== undefined) DBL.Router.navigate();
				clearTimeout(DBL.reloadTimeout);
				console.log("Switched to Maps");
				if ($("#results-frame").length > 0) {
					$("#results-frame").detach();
					$('<div/>', {
						id: "mapbox"
					}).appendTo($("body"));
				} else if ($("#diagWrapper").length > 0) {
					$("#diagWrapper").detach();
					$('<div/>', {
						id: "mapbox"
					}).appendTo($("body"));
				} else if ($("#tripsFrame").length > 0) {
					$("#tripsFrame").detach();
					$('<div/>', {
						id: "mapbox"
					}).appendTo($("body"));
				}
				$('input').detach();
				$('<input/>', {
					id: "stopSearch",
					"value": "Search for a route here"
				}).appendTo($("form"));
				$('#stopSearch').focus(firstFocusHandler);
				$('#stopSearch').keyup(DBL.Suggestions.fetchSuggestion);
				DBL.firstFocus.stopSearch = 1;
				break;
			case DBL.Modes.Routes:
				$('.mapLink').detach();
				$('.stopPermaLink').detach();
				//if(DBL.Router !== undefined) DBL.Router.navigate();
				clearTimeout(DBL.reloadTimeout);
				console.log("Switched to Routes");
				if ($("#results-frame").length > 0) {
					$("#results-frame").detach();
					$('<div/>', {
						id: "diagWrapper"
					}).appendTo($("body"));
					$('<div/>', {
						id: "linediagInbound"
					}).appendTo($("#diagWrapper"));
					$('<div/>', {
						id: "linediagOutbound"
					}).appendTo($("#diagWrapper"));
				} else if ($("#mapbox").length > 0) {
					$("#mapbox").detach();
					$('<div/>', {
						id: "diagWrapper"
					}).appendTo($("body"));
					$('<div/>', {
						id: "linediagInbound"
					}).appendTo($("#diagWrapper"));
					$('<div/>', {
						id: "linediagOutbound"
					}).appendTo($("#diagWrapper"));
				} else if ($("#tripsFrame").length > 0) {
					$("#tripsFrame").detach();
					$('<div/>', {
						id: "diagWrapper"
					}).appendTo($("body"));
					$('<div/>', {
						id: "linediagInbound"
					}).appendTo($("#diagWrapper"));
					$('<div/>', {
						id: "linediagOutbound"
					}).appendTo($("#diagWrapper"));
				}
				$('input').detach();
				$('<input/>', {
					id: "stopSearch",
					"value": "Search for a route here"
				}).appendTo($("form"));
				$('#stopSearch').focus(firstFocusHandler);
				$('#stopSearch').keyup(DBL.Suggestions.fetchSuggestion);
				DBL.firstFocus.stopSearch = 1;
				break;
			case DBL.Modes.RouteInformation:
				$('.mapLink').detach();
				$('.stopPermaLink').detach();
				//if(DBL.Router !== undefined) DBL.Router.navigate();
				clearTimeout(DBL.reloadTimeout);
				console.log("Switched to RouteInformation");
				if ($("#results-frame").length > 0) {
					$("#results-frame").detach();
					$('<div/>', {
						id: "diagWrapper"
					}).appendTo($("body"));
					$('<div/>', {
						id: "linediagInbound"
					}).appendTo($("#diagWrapper"));
					$('<div/>', {
						id: "linediagOutbound"
					}).appendTo($("#diagWrapper"));
				} else if ($("#tripsFrame").length > 0) {
					$("#tripsFrame").detach();
					$('<div/>', {
						id: "diagWrapper"
					}).appendTo($("body"));
					$('<div/>', {
						id: "linediagInbound"
					}).appendTo($("#diagWrapper"));
					$('<div/>', {
						id: "linediagOutbound"
					}).appendTo($("#diagWrapper"));
				}
				$('input').detach();
				$('<input/>', {
					id: "stopSearch",
					"value": "Search for a route here"
				}).appendTo($("form"));
				$('<span/>',{"class":"button"}).text("Schematic").appendTo($("#top"));
				$('<span/>',{"class":"button"}).text("Map").appendTo($("#top"));
				$('#stopSearch').focus(firstFocusHandler);
				$('#stopSearch').keyup(DBL.Suggestions.fetchSuggestion);
				DBL.firstFocus.stopSearch = 1;
				break;
			case DBL.Modes.Trips:
				if ($("#results-frame").length > 0) {
					$("#results-frame").detach();
				} else if ($("#diagWrapper").length > 0) {
					$("#diagWrapper").detach();
				} else if ($("#mapbox").length > 0) {
					$("#mapbox").detach();
				}
				$('<div/>', {
					id: "tripsFrame"
				}).appendTo($("body"));
				$('<div/>', {
					id: "tripTimeline"
				}).appendTo($("#tripsFrame"));
				//$("#stopSearch").val("Where do you want to go?");
				$('#stopSearch').detach();
				$('input').detach();
				$('<input/>', {
					id: "tripFrom",
					"value": "Where are you leaving from?"
				}).appendTo($("form"));
				$('<input/>', {
					id: "tripTo",
					"value": "Where are you going to?"
				}).appendTo($("form"));
				$('#tripFrom').focus(firstFocusHandler);
				$('#tripTo').focus(firstFocusHandler);
				$('#tripFrom').keyup(DBL.Suggestions.fetchSuggestion);
				$('#tripTo').keyup(DBL.Suggestions.fetchSuggestion);
				DBL.firstFocus.tripTo = 1;
				DBL.firstFocus.tripFrom = 1;
				break;
			default:
				console.log("Invalid mode: " + targetMode);
				break;
			}
		}
	}
	$(document).ready(function() {
		setup();
	});
})