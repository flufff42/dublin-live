/* jshint globals define, -Util */
define(function() {
	function toRad(deg) {
		return (deg * Math.PI) / (180.0);
	}
	return {
		toRad: toRad,
		roundToNDecimals: function(float, n) {
			return (Math.round(float * Math.pow(10, n)) / Math.pow(10, n));
		},
		haversineDistance: function(lat1, long1, lat2, long2) {
			var latitudeDiff = lat1 - lat2;
			var longitudeDiff = long1 - long2;
			var a = Math.pow(Math.sin(toRad(latitudeDiff) / 2), 2) + Math.pow(Math.sin(toRad(longitudeDiff) / 2), 2) * Math.cos(toRad(lat1)) * Math.cos(toRad(lat2));
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
			return c * 6367;
		}
	};
});