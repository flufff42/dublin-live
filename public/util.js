(function util() {
	function Util() {}
	
	Util.prototype.toRad = function(deg) {
		return (deg * Math.PI) / (180.0)
	}
	Util.prototype.roundToNDecimals = function(float, n) {
		return (Math.round(float * Math.pow(10,n)) / Math.pow(10,n));
	}
	Util.prototype.haversineDistance = function(lat1,long1,lat2,long2) {
		 var latitudeDiff = lat1 - lat2;
		 var longitudeDiff = long1 - long2;
		 var a = Math.pow(Math.sin(Util.prototype.toRad(latitudeDiff) / 2), 2) + Math.pow(Math.sin(Util.prototype.toRad(longitudeDiff) / 2), 2) * Math.cos(Util.prototype.toRad(lat1)) * Math.cos(Util.prototype.toRad(lat2));
		 var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		 return c * 6367;
	}
	DBL.Util = new Util();
}());