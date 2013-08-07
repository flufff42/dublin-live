define(function () {
	var DBL = {};
	DBL.firstFocus = {};
	DBL.suggestionsAllowed = 1;
	DBL.Modes = {
		Departures: 0,
		Maps: 1,
		Routes: 2,
		Trips: 3
	};
	DBL.efaEndpointId = {};
	DBL.efaEndpointName = {};
	window.DBL = DBL;
	return {}
});