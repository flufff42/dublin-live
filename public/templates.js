(function templates() {
	function Templates() {}
	Templates.prototype.routeLink = "<a class=\"r{{route}}\"href=\"/{{stop}}\">{{route}}</a>";
	Templates.prototype.stopLink = "<dt><a href=\"/{{stop}}\">{{stop}}</a><span class=\"distance\">{{distance}}</span></dt><dd>{{{routeLinks}}}</dd>";
	Templates.prototype.service = "<p class=\"service r{{route}}\" style=\"margin-left: {{diff}}px\"><span class=\"route\"> {{route}}</span><span class=\"destination\"> {{chompedD}}</span><span class=\"time\"> {{diff}}min</span></p>";
	
	DBL.Templates = new Templates();
	
}());