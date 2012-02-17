(function suggestions() {
	function Suggestions() {}
	Suggestions.prototype.fetchSuggestion = function(event) {
    var ENTER = 13;
    var UP = 38;
    var LEFT = 37;
    var RIGHT = 39;
    var DOWN = 40;
    DBL.keyupCount++;
    //if (event.keyCode == UP) event.preventDefault();
    console.log(event.keyCode);
    if (event.keyCode == ENTER || event.keyCode == DOWN || (event.keyCode == UP && DBL.suggestionIndex != -1)) {
    	console.log("Up/Down Array pressed");
    	if (event.keyCode == UP && DBL.suggestionIndex > 0) {
    		$('#suggestion-list dt:nth-of-type('+[DBL.suggestionIndex+1]+')').toggleClass('selected');
    		console.log(--DBL.suggestionIndex);
    		$('#suggestion-list dt:nth-of-type('+[DBL.suggestionIndex+1]+')').toggleClass('selected');
    	} else if (event.keyCode == DOWN && DBL.suggestionIndex < $('#suggestion-list dt').length-1) {
    		if (DBL.suggestionIndex >= 0) $('#suggestion-list dt:nth-of-type('+[DBL.suggestionIndex+1]+')').toggleClass('selected');
    		console.log(++DBL.suggestionIndex);
    		$('#suggestion-list dt:nth-of-type('+[DBL.suggestionIndex+1]+')').toggleClass('selected');
    	} else if (event.keyCode == ENTER && DBL.suggestionIndex != -1) {
    		console.log($('#suggestion-list dt:nth-of-type('+[DBL.suggestionIndex+1]+') a')[0].text);
    		fetchResultsForStop($('#suggestion-list dt:nth-of-type('+[DBL.suggestionIndex+1]+') a')[0].text,"");
    	}
    	if ($('#suggestion-list dt').length > 0) {
    		console.log($('#suggestion-list dt').length + " Suggestions showing");
    	}
    } else if (DBL.keyupCount > 0 && ($('#stopSearch').attr("value").length > 0) && !(event.keyCode == LEFT || event.keyCode == RIGHT)) {
        clearTimeout(DBL.reloadTimeout);
        //$('#suggestions').fadeOut();
        $('#suggestionSpinner').fadeIn();
        console.log("Request suggestions for: " + $('#stopSearch').attr("value"));
        if (DBL.currentRequest) DBL.currentRequest.abort();
    	DBL.currentRequest = $.post("/suggestion/", {
            "prefix": $('#stopSearch').attr("value")
        },
        function(data, textStatus, xhr) {
            console.log(xhr.status);
            if (xhr.status == 204 || DBL.suggestionsAllowed != 1) {
                $('#suggestionSpinner').fadeOut();
            } else {
                //console.log(data);
                //console.log(data.each);
                var stops = [];
                var lastStop = "";
                $.each(data,
                function(stop, stopInformation) {
                    console.log("latitude:" + stopInformation["lat"] + "longitude:" + stopInformation["long"]);
                    localStorage.setItem(stop,JSON.stringify(stopInformation));
                    if (DBL.position) {
                        var distance = 
                        	DBL.Util.haversineDistance(
                        		stopInformation["lat"],
                        		stopInformation["long"],
                        		DBL.position["coords"]["latitude"],
                        		DBL.position["coords"]["longitude"]);
                        //console.log(DBL.Util.haversineDistance(DBL.position["coords"]["latitude"]+0.001,DBL.position["coords"]["longitude"]-0.001,DBL.position["coords"]["latitude"]-0.001,DBL.position["coords"]["longitude"]+0.001))
                        // Radius in km
                        //console.log("Distance: " + distance);
                        var directionText = "";
                        var directionClass = "";
                        directionText = (Math.round(distance * 10) / 10) + "km ";// + directionClass;
                        $('#stopDirection a').detach();
                        $('#stopDirection span').detach();
                        $("#stopDirection").removeClass().addClass(directionClass);
                        

                    }
                    var routesArray = (stopInformation["routes"] != null) ? stopInformation["routes"].split(" ") : undefined;
                    var routeLinks = "";
                    for (route in routesArray) {
                        if (route != routesArray.length - 1)
                        //console.log('<a class="r'+routesArray[route]+'" href="/'+stop+'/'+routesArray[route]+'">'+routesArray[route]+'</a>');
                        routeLinks += Mustache.render(DBL.Templates.routeLink,{route: routesArray[route], "stop": stop}); 
                    }
                    if (directionText) {
                        stops.push(Mustache.render(DBL.Templates.stopLink,{"routeLinks": routeLinks, distance: directionText, "stop": stop}));
                    } else {
                        stops.push(Mustache.render(DBL.Templates.stopLink,{"routeLinks": routeLinks, "stop": stop})); 
                    }
                    lastStop = stop;
                });
                $('#suggestion-list').detach();
                $('<dl/>', {'id': 'suggestion-list',html: stops.join('')}).appendTo('#suggestions');
                $('#suggestionSpinner').fadeOut();
                $('#time-line').find('.timeline-time').detach();
                changeLinkAction();
                DBL.suggestionIndex = -1;
                $('#suggestions').fadeIn();
                //console.log(stops.length);
                if (stops.length == 1) {
                    //console.log("Only one stop candidate left");
                    //console.log(stops[0]);
                    clearTimeout(DBL.reloadTimeout);
                    fetchResultsForStop(lastStop);
                }
            }
        });

        DBL.keyupCount = 0;
    }

}
	DBL.Suggestions = new Suggestions();
	
}());