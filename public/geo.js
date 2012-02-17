(function geo() {
	function Geo() {}
	
	Geo.prototype.fetchLocation = function() {
    	if (navigator.geolocation && !DBL.position) {
    	    navigator.geolocation.getCurrentPosition(function(p) {
    	        console.log(p)
    	        DBL.position = p;
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
	
	Geo.prototype.getNearbyStops = function (lat,long) {
		if (lat && long) {} else {var lat = DBL.position["coords"]["latitude"], long = DBL.position["coords"]["longitude"]}
		$('#suggestions').fadeOut();
    	    $('#suggestionSpinner').fadeIn();
		if (DBL.currentRequest) DBL.currentRequest.abort();
    	DBL.currentRequest = $.post("/near/",{"lat":lat,"long":long},function(data,textStatus,xhr) {
			if (xhr.status == 204) {$('#suggestionSpinner').fadeOut();$('#results-frame').find('#results').detach();$('#time-line').find('.timeline-time').detach();
    	        $('<div/>', {
    	            'id': 'results',
    	            'class': 'no-results',
    	            html: "<span id='sign' data-icon='!'>No nearby stops found.</span>"
    	        }).appendTo($('#results-frame'));}
    	         else {
			console.log(data);
			console.log($.parseJSON(data));
			
			var stops = [];
			$.each(data, function(stop,location) {
				console.log(stop+" "+location["lat"]+":"+location["long"]+" Distance: "+DBL.Util.haversineDistance(lat,long,location["lat"],location["long"]));
				stops.push('<dt>' + '<a href="/' + stop + '">' + stop + '</a>' + '</dt>' + '<dd class="distance">' + DBL.Util.roundToNDecimals(DBL.Util.haversineDistance(lat,long,location["lat"],location["long"]),2) + ' km</dd>');
				$('#suggestion-list').detach();
    	            $('<dl/>', {
    	                'id': 'suggestion-list',
    	                html: stops.join('')
    	            }).appendTo('#suggestions');
    	            $('#suggestionSpinner').fadeOut();
    	            redirectLinksToPOST();
    	            $('#suggestions').fadeIn();
    	            
			});
			
			}
		},"json").error(function() {$('#suggestionSpinner').fadeOut();});
	}
	
	DBL.Geo = new Geo();
}());