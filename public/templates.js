(function templates() {
	function Templates() {}
	Templates.prototype.routeLink = "<a class=\"r{{route}}\"href=\"/{{stop}}\">{{route}}</a>";
	Templates.prototype.stopLink = "<dt><a href=\"/{{stop}}\">{{stop}}</a><span class=\"distance\">{{distance}}</span></dt><dd>{{{routeLinks}}}</dd>";
	Templates.prototype.service = "<p class=\"service r{{route}}\" style=\"margin-left: {{diff10}}px\"><span class=\"time\"> {{diff}}min</span><span class=\"route\"> <a href=\"/map/{{route}}\">{{route}}</a></span><span class=\"destination\"> {{chompedD}}</span></p>";
	Templates.prototype.lineStopName = "<span class='stopName'>{{stop}}</span>";
	Templates.prototype.routeSpan = "<span class='r{{rt}}'>{{rt}}</span>";
	Templates.prototype.stopRouteSpans = "<span class='stopRoutes'>{{{stopRouteSpans}}}</span>"
	Templates.prototype.normalStop = "<span class='normalStop'>&#x25cf;</span>";
	Templates.prototype.interchangeStop ="<span class='interchangeStop'>&#x25c9;</span>"
	DBL.Templates = new Templates();
	
}());