var DBL = window.DBL || {};

DBL.keyupCount = 0;
DBL.firstFocus = 1;
DBL.position;
DBL.suggestionsAllowed = 1;
DBL.suggestionIndex = -1;
DBL.currentRequest;
DBL.reloadTimeout;
DBL.currentStop;
DBL.stopInfoFetched;
DBL.stops;

function setup() {
	fetchStopInfo();
    $("form").submit(function(event) {
        event.preventDefault()
    });
    if (navigator.geolocation) {
        $('<span/>', {
            'class': 'locationAttach button',
            'data-icon': '⬇',
            'html': "Use Location"
        }).appendTo('#stopDirection');
    }
    changeLinkAction();
    $("body").ajaxError(function(e, xhr, ajax, error) {
        if (ajax.url == "/suggestion/") {
            console.log("It seems there were no suggestions.");
            DBL.suggestionsAllowed = 1;
            $('#suggestionSpinner').fadeOut();

        } else {
            console.log("Something went terribly wrong with AJAX…" + ajax.url);
            $('#suggestionSpinner').fadeOut();
            $('#fetchSpinner').fadeOut();
        }
    });
    $('#stopSearch').focus(function() {
        if (DBL.firstFocus) {
            $('#stopSearch').val("");
            DBL.firstFocus = 0;
        }
    });
    $('#stopSearch').keyup(DBL.Suggestions.fetchSuggestion);
    DBL.Router = new (Backbone.Router.extend({
    	routes:{
    		":stopID": "stop"
    	},
    	stop: function(stopID) {
    		console.log("URL contains stop ID: " + stopID);
    		DBL.Results.fetchResultsForStop(stopID,"");
    	}
    }))();
    
    Backbone.history.start({pushState: true});
}

function fetchStopInfo() {
	if(JSON.parse(localStorage.getItem("stopInfoFetched"))) {
		DBL.stops = new Array(localStorage.length);
		for (var i = 0; i < localStorage.length; i++) {
			DBL.stops[i] = localStorage.key(i);
		}
		DBL.stopInfoFetched = true;
	} else {
	DBL.currentRequest = $.post("/suggestion/", {"prefix": ' '}, 
		function(data, textStatus, xhr) {
			
			$.each(data, function(stop, stopInformation) {
				localStorage.setItem(stop, JSON.stringify(stopInformation));
				
			});
			DBL.stops = new Array(localStorage.length);
			for (var i = 0; i < localStorage.length; i++) {
				DBL.stops[i] = localStorage.key(i);
			}
			localStorage.setItem("stopInfoFetched","true");
			DBL.stopInfoFetched = true;
		}
	);
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
}


$(document).ready(function() {
    setup();
});
