var DBL = window.DBL || {};

DBL.keyupCount = 0;
DBL.firstFocus = 1;
DBL.position;
DBL.suggestionsAllowed = 1;
DBL.suggestionIndex = -1;
DBL.currentRequest;
DBL.reloadTimeout;
DBL.currentStop;

function setup() {
    $("form").submit(function(event) {
        event.preventDefault()
    });
    if (navigator.geolocation) {
        $('<span/>', {
            class: 'locationAttach button',
            'data-icon': '⬇',
            html: "Use Location"
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
    if(window.location.hash) {
    	console.log("Hash: "+ window.location.hash);
    	var stop = window.location.hash.substr(2);
    	DBL.Results.fetchResultsForStop(stop,"");
    }
}


function changeLinkAction() {
    $("a:not(.mapLink):not(.locationAttach):not(.nearbyLink)").click(function(event) {
        event.preventDefault();
        console.log(event.target);
        
        var linkComponents = event.target.href.split("/");
        console.log(linkComponents);
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
