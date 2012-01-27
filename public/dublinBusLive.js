var keyupCount = 0;
var firstFocus = 1;
var position;
var suggestionsAllowed = 1;
var suggestionIndex = -1;
var currentRequest;
function initializeTimeline() {
	var resultFrameWidth = $("#results-frame").css("width").substring(0,($("#results-frame").css("width").length-2));
	console.log(resultFrameWidth);
	console.log($("#time-line"));
	$('#time-line').find('.timeline-time').detach();
            var timeCount = 0;
            while (timeCount * 50 < resultFrameWidth) {
            console.log("Appending "+timeCount+"-th timeline element");
            $('<span/>')
            	.addClass('timeline-time')
            	.css("margin-left",(50*timeCount+"px"))
                .html("<span>"+(5*timeCount)+"</span>")
            	.appendTo($('#time-line'));
            timeCount++;
            }
}
function redirectLinksToPOST() {
    $("a:not(.mapLink):not(.locationAttach):not(.nearbyLink)").click(function(event) {
        event.preventDefault();
        console.log(event.target);
        var linkComponents = event.target.href.split("/");
        console.log(linkComponents);
        if (linkComponents.length == 4) {
            linkComponents[3] = decodeURI(linkComponents[3]);
            fetchResultsForStop(linkComponents[3], "");
        } else if (linkComponents.length == 5) {
            linkComponents[3] = decodeURI(linkComponents[3]);
            linkComponents[4] = decodeURI(linkComponents[4]);
            if (linkComponents[4].match(/[CNJSB]?\d+/)) {
                fetchResultsForStop(linkComponents[3], linkComponents[4]);
            } else {
                fetchResultsForStop(linkComponents[3] + "/" + linkComponents[4], "");
            }
        }
    });
    $("span.locationAttach").click(function(event) {
        event.preventDefault();
        fetchLocation();
    });
    $("span.nearbyLink").click(function(event) {
        event.preventDefault();
        getNearbyStops();
    });
}

function processServices(route, services) {
    var times = [];
    if (typeof services != "object" || route == "") {} else {
        $.each(services,
        function(destination, time) {

            var chompedD = destination.substring(0, destination.length - 2);
            console.log("Route " + route + " Service to " + chompedD + " in/at " + time);
            var minutePattern = /min/;
            //console.log(time.match(minutePattern));
            var timeP;
            if (time.match(minutePattern) != null) {
                timeP = "<p class=\"service r" + route + "\" style=\"margin-left: " + time.match(/^\d+/)[0]*10 + "px\"><span class=\"route\">" + route + "</span>				   <span class=\"destination\">" + chompedD + "</span><span class=\"time\">" + time + "</span></p>";
            } else {
                var scheduled = new Date();
                var now = new Date();
                if (Date.parse(time)) {
                    console.log(Date.parse(time));
                    scheduled = new Date(Date.parse(time));
                } else {
                    var timeComponents = time.split(":");
                    scheduled.setHours(timeComponents[0]);
                    console.log(timeComponents[1].match(/(\d+)/)[0]);
                    scheduled.setMinutes(timeComponents[1].match(/(\d+)/)[0]);
                    console.log(scheduled);
                    if (timeComponents[0] < now.getHours()) {
                        scheduled.setDate(now.getDate() + 1)
                    }
                }
                var diff = Math.floor((scheduled.getTime() - now.getTime()) / 60000);
                //console.log(Math.floor(diff));
                timeP = "<p class=\"service r" + route + "\" style=\"margin-left: " + diff*10 + "px\"><span class=\"route\">" + route + "</span>				   <span class=\"destination\">" + chompedD + "</span><span class=\"time\">" + time + "</span></p>";
            }
            //console.log(timeP);
            times.push(timeP);
        });
        console.log(times);
        return times;
    }
}

function fetchResultsForStop(stop, routeId) {
    $('#fetchSpinner').fadeIn();
    $('#stopSearch').val(stop);
    suggestionsAllowed = 0;
    if (currentRequest) currentRequest.abort();
    currentRequest = $.post("/", {
        "stop": stop,
        "route": routeId
    },
    function(results, textStatus, xhr) {
        if (xhr.status == 204) {
            $('#fetchSpinner').fadeOut();
            $('#suggestions').fadeOut();
            $('#results-frame').find('#results').detach();
            $('<div/>', {
                'id': 'results',
                'class': 'no-results',
                html: "<span id='sign'>It seems there are no departures at this time.</span>"
            }).appendTo($('#results-frame'));
        } else {
            console.log(results);
            var times = [];
            if (routeId == "" || routeId == undefined) {
                $.each(results,
                function(route, services) {
                    if (services != null && services != "1") {
                        console.log(route);
                        times = times.concat(processServices(route, services));
                    }
                });
            } else {

                times = processServices(routeId, results);
            }
            $.each(times,
            function(timeIndex) {
                for (var compareTime = timeIndex + 1; compareTime < times.length; compareTime++) {
                    var stringT = times[timeIndex];
                    var matchT = stringT.match(/(\d+)px/)[0];
                    matchT = Number(matchT.substring(0, matchT.length - 2));
                    var stringC = times[compareTime];
                    //console.log(stringC);
                    var matchC = stringC.match(/(\d+)px/)[0];
                    matchC = Number(matchC.substring(0, matchC.length - 2));
                    //console.log(matchT + " " + matchC);
                    if (matchC <= matchT) {
                        var temp = times[timeIndex];
                        times[timeIndex] = times[compareTime];
                        times[compareTime] = temp;
                    }

                }

            })
            //$('#results').detach();
            $('#fetchSpinner').fadeOut();
            $('#suggestions').fadeOut();
            $('#results-frame').find('#results').detach();
            //$('<div/>', {'id': 'results', html: times.join('')}).appendTo('#times');
            
            $('<div/>', {
                'id': 'results',
                html: times.join('')
            }).appendTo($('#results-frame'));
            initializeTimeline();
            suggestionIndex = -1;
            suggestionsAllowed = 1;
            

        }
    },
    "json");
}
function roundToNDecimals(float, n) {
	return (Math.round(float * Math.pow(10,n)) / Math.pow(10,n));
}
function fetchLocation() {
    if (navigator.geolocation && !position) {
        navigator.geolocation.getCurrentPosition(function(p) {
            console.log(p)
            position = p;
            $('#stopDirection span').detach();
            $('#stopDirection a').detach();
            $('<span/>', {
            class: 'nearbyLink button',
            html: "Find nearby stops"
        }).appendTo('#stopDirection');
        redirectLinksToPOST();
        });
    }
}
function toRad(deg) {
    return (deg * Math.PI) / (180.0)
}
function haversineDistance(lat1,long1,lat2,long2) {
 var latitudeDiff = lat1 - lat2;
 var longitudeDiff = long1 - long2;
 var a = Math.pow(Math.sin(toRad(latitudeDiff) / 2), 2) + Math.pow(Math.sin(toRad(longitudeDiff) / 2), 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
 var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
 return c * 6367;
}

function getNearbyStops(lat,long) {
	if (lat && long) {} else {var lat = position["coords"]["latitude"], long = position["coords"]["longitude"]}
	$('#suggestions').fadeOut();
        $('#suggestionSpinner').fadeIn();
	if (currentRequest) currentRequest.abort();
    currentRequest = $.post("/near/",{"lat":lat,"long":long},function(data,textStatus,xhr) {
		if (xhr.status == 204) {$('#suggestionSpinner').fadeOut();$('#results-frame').find('#results').detach();$('#time-line').find('.timeline-time').detach();
            $('<div/>', {
                'id': 'results',
                'class': 'no-results',
                html: "<span id='sign'>No nearby stops found.</span>"
            }).appendTo($('#results-frame'));}
             else {
		console.log(data);
		console.log($.parseJSON(data));
		
		var stops = [];
		$.each(data, function(stop,location) {
			console.log(stop+" "+location["lat"]+":"+location["long"]+" Distance: "+haversineDistance(lat,long,location["lat"],location["long"]));
			stops.push('<dt>' + '<a href="/' + stop + '">' + stop + '</a>' + '</dt>' + '<dd class="distance">' + roundToNDecimals(haversineDistance(lat,long,location["lat"],location["long"]),2) + ' km</dd>');
			$('#suggestion-list').detach();
                $('<dl/>', {
                    'id': 'suggestion-list',
                    html: stops.join('')
                }).appendTo('#suggestions');
                $('#suggestionSpinner').fadeOut();
                redirectLinksToPOST();
                $('#suggestions').fadeIn();
                $('#stopDirection a').detach();
                $('<a/>', {
                            'href': 'http://maps.google.com/maps?q=' + stop + '%40' + location["lat"] + ',' + location["long"] + '&sll=' + location["lat"] + ',' + location["long"] + '&sspn=0.037249,0.10849&t=m&z=15">',
                            class: 'mapLink button',
                            html: "Show stop in Google Maps ("+ roundToNDecimals(haversineDistance(lat,long,location["lat"],location["long"]),2)+" km away)"
                        }).appendTo('#stopDirection');

		});
		
		}
	},"json").error(function() {$('#suggestionSpinner').fadeOut();});
}

function fetchSuggestion(event) {
    var ENTER = 13;
    var UP = 38;
    var DOWN = 40;
    keyupCount++;
    console.log(event.keyCode);
    if (event.keyCode == "38" || event.keyCode == "40" || (event.keyCode == "13" && suggestionIndex != -1)) {
    	console.log("Up/Down Array pressed");
    	if (event.keyCode == UP && suggestionIndex > 0) {
    		$('#suggestion-list dt:nth-of-type('+[suggestionIndex+1]+')').toggleClass('selected');
    		console.log(--suggestionIndex);
    		$('#suggestion-list dt:nth-of-type('+[suggestionIndex+1]+')').toggleClass('selected');
    	} else if (event.keyCode == DOWN && suggestionIndex < $('#suggestion-list dt').length-1) {
    		if (suggestionIndex >= 0) $('#suggestion-list dt:nth-of-type('+[suggestionIndex+1]+')').toggleClass('selected');
    		console.log(++suggestionIndex);
    		$('#suggestion-list dt:nth-of-type('+[suggestionIndex+1]+')').toggleClass('selected');
    	} else if (event.keyCode == ENTER && suggestionIndex != -1) {
    		console.log($('#suggestion-list dt:nth-of-type('+[suggestionIndex+1]+') a')[0].text);
    		fetchResultsForStop($('#suggestion-list dt:nth-of-type('+[suggestionIndex+1]+') a')[0].text,"");
    	}
    	if ($('#suggestion-list dt').length > 0) {
    		console.log($('#suggestion-list dt').length + " Suggestions showing");
    	}
    } else if (keyupCount > 1 && ($('#stopSearch').attr("value").length > 0)) {
        $('#suggestions').fadeOut();
        $('#suggestionSpinner').fadeIn();
        console.log("Request suggestions for: " + $('#stopSearch').attr("value"));
        if (currentRequest) currentRequest.abort();
    	currentRequest = $.post("/suggestion/", {
            "prefix": $('#stopSearch').attr("value")
        },
        function(data, textStatus, xhr) {
            console.log(xhr.status);
            if (xhr.status == 204 || suggestionsAllowed != 1) {
                $('#suggestionSpinner').fadeOut();
            } else {
                //console.log(data);
                //console.log(data.each);
                var stops = [];
                var lastStop = "";
                $.each(data,
                function(stop, stopInformation) {
                    console.log("latitude:" + stopInformation["lat"] + "longitude:" + stopInformation["long"]);
                    if (position) {
                        var distance = haversineDistance(stopInformation["lat"],stopInformation["long"],position["coords"]["latitude"],position["coords"]["longitude"]);
                        console.log(haversineDistance(position["coords"]["latitude"]+0.001,position["coords"]["longitude"]-0.001,position["coords"]["latitude"]-0.001,position["coords"]["longitude"]+0.001))
                        // Radius in km
                        console.log("Distance: " + distance);
                        var directionText = "";
                        var directionClass = "";
                        directionText = (Math.round(distance * 10) / 10) + "km ";// + directionClass;
                        $('#stopDirection a').detach();
                        $('#stopDirection span').detach();
                        $("#stopDirection").removeClass().addClass(directionClass);
                        $('<a/>', {
                            'href': 'http://maps.google.com/maps?q=' + stop + '%40' + stopInformation["lat"] + ',' + stopInformation["long"] + '&sll=' + stopInformation["lat"] + ',' + stopInformation["long"] + '&sspn=0.037249,0.10849&t=m&z=15">',
                            class: 'mapLink button',
                            html: "Show stop in Google Maps ("+ directionText+" km away)"
                        }).appendTo('#stopDirection');

                    }
                    var routesArray = (stopInformation["routes"] != null) ? stopInformation["routes"].split(" ") : undefined;
                    var routeLinks = "";
                    for (route in routesArray) {
                        if (route != routesArray.length - 1)
                        //console.log('<a class="r'+routesArray[route]+'" href="/'+stop+'/'+routesArray[route]+'">'+routesArray[route]+'</a>');
                        routeLinks += '<a class="r' + routesArray[route] + '"href="/' + stop + '/' + routesArray[route] + '">' + routesArray[route] + '</a> ';
                    }
                    if (directionText) {
                        stops.push('<dt>' + '<a href="/' + stop + '">' + stop + '</a>' + "<span class='distance'> " + directionText + "</span>" + '</dt>' + '<dd>' + routeLinks + '</dd>')
                    } else {
                        stops.push('<dt>' + '<a href="/' + stop + '">' + stop + '</a>' + '</dt>' + '<dd>' + routeLinks + '</dd>')
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
                redirectLinksToPOST();
                $('#suggestions').fadeIn();
                //console.log(stops.length);
                if (stops.length == 1) {
                    //console.log("Only one stop candidate left");
                    //console.log(stops[0]);
                    fetchResultsForStop(lastStop);
                }
            }
        });

        keyupCount = 0;
    }

}
function setup() {
    $("form").submit(function(event) {
        event.preventDefault()
    });
    if (navigator.geolocation) {
        $('<span/>', {
            class: 'locationAttach button',
            html: "Show distance to stop"
        }).appendTo('#stopDirection');
    }
    redirectLinksToPOST();
    $("body").ajaxError(function(e, xhr, ajax, error) {
        if (ajax.url == "/suggestion/") {
            console.log("It seems there were no suggestions.");
            suggestionsAllowed = 1;
            $('#suggestionSpinner').fadeOut();

        } else {
            console.log("Something went terribly wrong with AJAX…" + ajax.url);
            $('#suggestionSpinner').fadeOut();
            $('#fetchSpinner').fadeOut();
        }
    });
    $('#stopSearch').focus(function() {
        if (firstFocus) {
            $('#stopSearch').val("");
            firstFocus = 0;
        }
    });
    $('#stopSearch').keyup(fetchSuggestion);
}

$(document).ready(function() {
    setup();
});
