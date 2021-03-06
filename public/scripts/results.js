define(['mustache', 'util', 'map','backbone'], function(Mustache, Util, Map, Backbone) {
	DBL.Util = Util;
	function processServices(route, services) {
		var times = [];
		if (typeof services !== "object" || route === "") {} else {
			$.each(services, function(destination, time) {
				var chompedD = destination.substring(0, destination.length - 2);
				var minutePattern = /min/;
				var timeP;
				var scheduled = new Date();
				var now = new Date();
				if (Date.parse(time)) {
					scheduled = new Date(Date.parse(time));
				} else {
					var timeComponents = time.split(":");
					scheduled.setHours(timeComponents[0]);
					scheduled.setMinutes(timeComponents[1].match(/(\d+)/)[0]);
					if (timeComponents[0] < now.getHours()) {
						scheduled.setDate(now.getDate() + 1);
					}
				}
				var diff = Math.floor((scheduled.getTime() - now.getTime()) / 60000);
				timeP = Mustache.render(DBL.Templates.service, {
					"route": route,
					"diff": diff,
					"diff10": diff * 20,
					"chompedD": chompedD
				});
				//}
				times.push(timeP);
			});
			return times;
		}
	}

	function initializeTimeline(targetId, startDate) {
		var resultFrameWidth = $(targetId).css("width").substring(0, ($(targetId).css("width").length - 2));
		$(targetId).find('.timeline-time').detach();
		var timeCount = 0;
		while (timeCount * 100 < resultFrameWidth) {
			var time = new Date(startDate === undefined ? new Date().getTime() + 5 * timeCount * 60000 : startDate + 5 * timeCount * 60000);
			$('<span/>').addClass('timeline-time').css("margin-left", (100 * timeCount + "px")).html("<span>" + (time.getHours() < 10 ? "0" + time.getHours() : time.getHours()) + ":" + (time.getMinutes() < 10 ? "0" + time.getMinutes() : time.getMinutes()) + "</span>").appendTo($(targetId));
			timeCount++;
		}
	}

	function fetchResultsForStop(stop, routeId) {
		if (stop.match(/^\d+$/)) { // It seems we only have a stop ID
			if (localStorage.length > 1000) { // Ensure we've loaded a few stops already
				for (var i = 0; i < localStorage.length; i++) {
					var match = localStorage.key(i).match(/^(\d+)/);
					if (match !== null && match[0] == stop) {
						stop = localStorage.key(i);
						break;
					}
				}
			}
		}
		$('#fetchSpinner').fadeIn();
		$('#stopSearch').val(stop);
		DBL.suggestionsAllowed = 0;
		if (DBL.currentRequest) DBL.currentRequest.abort();
		DBL.currentRequest = $.post(window.location.protocol + "//" + window.location.hostname + "/", {
			"stop": stop,
			"route": routeId
		}, function(results, textStatus, xhr) {
			if (xhr.status == 204) {
				$('#fetchSpinner').fadeOut();
				$('#suggestions').fadeOut();
				$('#results-frame').find('#results').detach();
				$('<div/>', {
					'id': 'results',
					'class': 'no-results',
					html: "<span id='sign' data-icon='!'>It seems there are no departures at this time.</span>"
				}).appendTo($('#results-frame'));
			} else {
				var times = [];
				if (routeId === "" || routeId === undefined) {
					$.each(results, function(route, services) {
						if (services !== null && services !== "1") {
							times = times.concat(processServices(route, services));
						}
					});
				} else {
					times = processServices(routeId, results);
				}
				$.each(times, function(timeIndex) {
					for (var compareTime = timeIndex + 1; compareTime < times.length; compareTime++) {
						var stringT = times[timeIndex];
						var matchT = stringT.match(/(\d+)px/)[0];
						matchT = Number(matchT.substring(0, matchT.length - 2));
						var stringC = times[compareTime];
						var matchC = stringC.match(/(\d+)px/)[0];
						matchC = Number(matchC.substring(0, matchC.length - 2));
						if (matchC <= matchT) {
							var temp = times[timeIndex];
							times[timeIndex] = times[compareTime];
							times[compareTime] = temp;
						}
					}
				});
				$('#fetchSpinner').fadeOut();
				$('#suggestions').fadeOut();
				$('#results-frame').find('#results').detach();
				initializeTimeline("#results-frame");
				$('<div/>', {
					'id': 'results',
					html: times.join('')
				}).appendTo($('#results-frame'));
				$('#stopDirection a').detach();
				var stopInfo;
				if (stop.indexOf('|') != -1) {
					stopInfo = JSON.parse(localStorage.getItem(stop));
				} else {
					for (var i = 0; i < localStorage.length; i++) {
						if (localStorage.key(i).match(new RegExp("^" + stop + "\\|", "i"))) {
							stopInfo = JSON.parse(localStorage.getItem(localStorage.key(i)));
						}
					}
				}
				$('<a/>', {
					'href': 'http://maps.google.com/maps?q=' + stop + '%40' + stopInfo["lat"] + ',' + stopInfo["long"] + '&sll=' + stopInfo["lat"] + ',' + stopInfo["long"] + '&sspn=0.037249,0.10849&t=m&z=15">',
					'data-icon': 'g',
					'class': 'mapLink button',
					'html': !(DBL.position === undefined) ? "Show stop in Google Maps (" + DBL.Util.roundToNDecimals(DBL.Util.haversineDistance(DBL.position.coords.latitude, DBL.position.coords.longitude, stopInfo["lat"], stopInfo["long"]), 2) + " km away)" : "Show stop in Google Maps"
				}).appendTo('#stopDirection');
				_.forEach($('.service .route'), function(service) {
					$(service).on("click", function(e) {
						console.log($(e.target).data('route'));
						if (DBL.Router !== undefined) DBL.Router.navigate("line/" + $(e.target).data('route'), {
							trigger: true
						});
					});
				});
				DBL.suggestionIndex = -1;
				DBL.suggestionsAllowed = 1;
				DBL.currentStop = stop;
				if (DBL.Router !== undefined) DBL.Router.navigate(stop.match(/\d+/)[0]);
				$('title').text(stop + " — Dublin Live Times");
			}
			DBL.reloadTimeout = setTimeout(function() {
				fetchResultsForStop(stop, '');
			}, 10000);
		}, "json");
	}
	return {
		initializeTimeline: initializeTimeline,
		fetchResultsForStop: fetchResultsForStop,
		showRouteMap: function() {
			if ($('#suggestion-list dt:nth-child(' + (DBL.suggestionIndex * 2 + 1) + ') a').length > 0) {
				DBL.route = $('#suggestion-list dt:nth-child(' + (DBL.suggestionIndex * 2 + 1) + ') a').text();
			}
			$('#stopSearch').val(DBL.route);
			$('#suggestion-list').detach();
			$('#mapbox').detach();
			$('<div/>', {
				id: "mapbox"
			}).appendTo($("body"));
			if (DBL.Router !== undefined) DBL.Router.navigate("map/" + DBL.route, {
				trigger: false
			});
			$('title').text(DBL.route + "— Map — Dublin Live Times");
			Map.initmap('mapbox');
			$('#suggestions').fadeOut();
		}
	};
});
