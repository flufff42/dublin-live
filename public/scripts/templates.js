/* global define:true */
define({
	routeLink: "<a class=\"route r{{route}}\"href=\"/line/{{route}}\">{{route}}</a>",
	routeMapLink: "<a class=\"route r{{route}}\"href=\"/map/{{route}}\">{{route}}</a>",
	stopLink: "<dt><a href=\"/{{stop}}\">{{stop}}</a><span class=\"distance\">{{distance}}</span></dt><dd>{{{routeLinks}}}</dd>",
	efaStopLink: "<dt><span data-stopId=\"{{stopId}}\">{{stop}}</span></dt><dd>{{stopId}}</dd>",
	routeInfoLink: "<dt>{{{routeLinks}}}<span class=\"distance\">{{distance}}</span></dt><dd>{{{stop}}}</dd>",
	service: "<p class=\"service r{{route}}\" style=\"margin-left: {{diff10}}px\"><span class=\"time\"> {{diff}}min</span><span class=\"route\" data-route=\"{{route}}\"> {{route}}</span><span class=\"destination\"> {{chompedD}}</span></p>",
	lineStopName: "<span class='stopName'>{{stop}}</span>",
	routeSpan: "<span class='r{{rt}}'>{{rt}}</span>",
	stopRouteSpans: "<span class='stopRoutes'>{{{stopRouteSpans}}}</span>",
	normalStop: "<span class='normalStop'>&#x25cf;</span>",
	interchangeStop: "<span class='interchangeStop'>&#x25c9;</span>",
	tripLeg: "<p class=\"tripLeg m{{mode}}\" style=\"margin-left: {{diff10}}px; width: {{width}}px;\">{{route}}<br/><span class=\"time\"> {{legDeptTime}}</span><br/><span class=\"legFrom\"> {{legFrom}}</span><br/><span class=\"legTo\"> {{legTo}}</span><br/><span class=\"time\"> {{legArrTime}}</span></p>"
});