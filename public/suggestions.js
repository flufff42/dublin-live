(function suggestions() {
	function Suggestions() {}
	Suggestions.previousResults;
	Suggestions.previousSearchTerm;
	Suggestions.prototype.fetchSuggestion = function(event) {
		var ENTER = 13;
		var UP = 38;
		var LEFT = 37;
		var RIGHT = 39;
		var DOWN = 40;
		DBL.keyupCount++;
		if (event.keyCode == ENTER || event.keyCode == DOWN || (event.keyCode == UP && DBL.suggestionIndex != -1)) {
			if (event.keyCode == UP && DBL.suggestionIndex > 0) {
				$('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ')').toggleClass('selected');
				$('#suggestion-list dt:nth-of-type(' + [--DBL.suggestionIndex + 1] + ')').toggleClass('selected');
			} else if (event.keyCode == DOWN && DBL.suggestionIndex < $('#suggestion-list dt').length - 1) {
				$('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ')').toggleClass('selected');
				$('#suggestion-list dt:nth-of-type(' + [++DBL.suggestionIndex + 1] + ')').toggleClass('selected');
			} else if (event.keyCode == ENTER && DBL.suggestionIndex != -1) {
				DBL.Results.fetchResultsForStop($('#suggestion-list dt:nth-of-type(' + [DBL.suggestionIndex + 1] + ') a')[0].text, "");
			}
			if ($('#suggestion-list dt').length > 0) {}
		} else if (DBL.keyupCount > 0 && ($('#stopSearch').attr("value").length > 0) && !(event.keyCode == LEFT || event.keyCode == RIGHT)) {
			clearTimeout(DBL.reloadTimeout);
			$('#suggestionSpinner').fadeIn();
			var data = {};
			if (DBL.stopInfoFetched) {
				//var stop = '2895|Dundrum Road, Opposite Dundrum Business Park';
				var i = 0;
				var filterRegEx = new RegExp($('#stopSearch').attr("value"),"i");
				if ($('#stopSearch').attr("value").indexOf(Suggestions.previousSearchTerm) == 0) {
					Suggestions.previousResults = _.filter(Suggestions.previousResults,function(stopname) {return stopname.match(filterRegEx)});
					
				} else {
					Suggestions.previousResults = _.filter(_.keys(localStorage),function(stopname) {return stopname.match(filterRegEx)});
					
				}
				Suggestions.previousSearchTerm = $('#stopSearch').attr("value");
				_.each(Suggestions.previousResults, function(stop) {data[stop] = JSON.parse(localStorage.getItem(stop))})
				//data[stop] = JSON.parse(localStorage.getItem(stop));
			} else {
				if (DBL.currentRequest) DBL.currentRequest.abort();
				DBL.currentRequest = $.post("/suggestion/", {
					"prefix": $('#stopSearch').attr("value")
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
					if (DBL.position) {
			    	var distance = DBL.Util.haversineDistance(
			    	stopInformation["lat"], stopInformation["long"], DBL.position["coords"]["latitude"], DBL.position["coords"]["longitude"]);
			    	var directionText = "";
			    	var directionClass = "";
			    	directionText = (Math.round(distance * 10) / 10) + "km "; // + directionClass;
			    	$('#stopDirection a').detach();
			    	$('#stopDirection span').detach();
			    	$("#stopDirection").removeClass().addClass(directionClass);
			    }
			    var routesArray = (stopInformation["routes"] != null) ? stopInformation["routes"].split("|") : undefined;
			    var routeLinks = "";
			    for (route in routesArray) {
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
			$('#suggestion-list').detach();
			$('<dl/>', {
			    'id': 'suggestion-list',
			    html: stops.join('')
			}).appendTo('#suggestions');
			$('#suggestionSpinner').fadeOut();
			$('#time-line').find('.timeline-time').detach();
			changeLinkAction();
			DBL.suggestionIndex = -1;
			$('#suggestions').fadeIn();
			if (stops.length == 1) {;
			    clearTimeout(DBL.reloadTimeout);
			    DBL.Results.fetchResultsForStop(lastStop);
			}
			}
			DBL.keyupCount = 0;
		}

	}
	DBL.Suggestions = new Suggestions();

}());
