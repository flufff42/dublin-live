define(function() {
	return {
		getEFATrips: function(tripDetails) {
			var requestParams = {};
			if (tripDetails.origin.latitude !== undefined && tripDetails.origin.longitude !== undefined) {
				requestParams.originLat = tripDetails.origin.latitude;
				requestParams.originLong = tripDetails.origin.longitude;
			} else if (tripDetails.origin !== undefined) {
				requestParams.origin = tripDetails.origin;
			}
			if (tripDetails.destination.latitude !== undefined && tripDetails.destination.longitude !== undefined) {
				requestParams.destinationLat = tripDetails.destination.latitude;
				requestParams.destinationLong = tripDetails.destination.longitude;
			} else if (tripDetails.destination !== undefined) {
				requestParams.destination = tripDetails.destination;
			}
			$.getJSON('http://dublin.lsr.li/efaTrip/', requestParams, function(data) {
				console.log(data);
				if (data.trips.length > 0) {
					$('#tripsFrame').detach();
					$('<div/>', {
						id: "tripsFrame"
					}).appendTo($("body"));
					$('<div/>', {
						id: "tripTimeline"
					}).appendTo($("#tripsFrame"));
					var firstTripTimeComponents = data.trips[0].legs[0].points[0].dateTime.time.split(/:/);
					var firstTripDateComponents = data.trips[0].legs[0].points[0].dateTime.date.split(/\./);
					var firstTripHour = firstTripTimeComponents[0] * 1.0;
					var firstTripMinute = firstTripTimeComponents[1];
					var firstTripDate = new Date();
					firstTripDate.setHours(firstTripHour);
					firstTripDate.setMinutes(firstTripMinute);
					firstTripDate.setFullYear(firstTripDateComponents[2] * 1.0);
					firstTripDate.setMonth(firstTripDateComponents[1] * 1.0 - 1.0);
					firstTripDate.setDate(firstTripDateComponents[0] * 1.0);
					DBL.Results.initializeTimeline("#tripTimeline", firstTripDate.getTime());

					data.trips.forEach(function(trip) {
						console.log(trip.duration);
						var legs = [];
						var previousLegEndTime = 0;
						var tripWidth = 0;
						var tripOffset = 0;
						trip.legs.forEach(function(leg) {
							switch (leg.mode.code) {
							case '5':
								console.log("Bus");
								break;
							case '-1':
								console.log("Walk");
								break;
							case '4':
								console.log("Tram");
								break;
							case '6':
								console.log("Regional Bus");
								break;
							case '9':
								console.log("Ferry");
								break;
							case '0':
								console.log("Train");
								break;
							default:
								console.log("Other Mode: " + leg.mode.code);
								break;
							}
							if (leg.mode.code != '-1') console.log(leg.mode.number + " " + leg.mode.destination);
							if (leg.mode.code != '5') {
								console.log(leg.points[0].name + " " + leg.points[0].place + " " + leg.points[0].dateTime.date + " " + leg.points[0].dateTime.time);
							} else {
								console.log(leg.stopSeq[0].platformName + " " + leg.stopSeq[0].name + " " + leg.stopSeq[0].ref.depDateTime);
							}
							if (leg.mode.code != '5') {
								console.log(leg.points[1].name + " " + leg.points[1].place + " " + leg.points[1].dateTime.date + " " + leg.points[1].dateTime.time);
							} else {
								console.log(leg.stopSeq[leg.stopSeq.length - 1].platformName + " " + leg.stopSeq[leg.stopSeq.length - 1].name + " " + leg.stopSeq[leg.stopSeq.length - 1].ref.depDateTime);
							}
							var deptTimeComponents = leg.points[0].dateTime.time.split(/:/);
							var deptDateComponents = leg.points[0].dateTime.date.split(/\./);
							var deptHour = deptTimeComponents[0] * 1.0;
							var deptMinute = deptTimeComponents[1];
							var scheduledDept = new Date();
							var now = new Date();
							scheduledDept.setHours(deptHour);
							scheduledDept.setMinutes(deptMinute);
							scheduledDept.setFullYear(deptDateComponents[2] * 1.0);
							scheduledDept.setMonth(deptDateComponents[1] * 1.0 - 1.0);
							scheduledDept.setDate(deptDateComponents[0] * 1.0);
							var minsToDept = (scheduledDept.getTime() - firstTripDate.getTime()) / 60000;
							var arrTimeComponents = leg.points[1].dateTime.time.split(/:/);
							var arrDateComponents = leg.points[1].dateTime.date.split(/\./);
							var arrHour = arrTimeComponents[0] * 1.0;
							var arrMinute = arrTimeComponents[1];
							var scheduledArr = new Date();
							scheduledArr.setHours(arrHour);
							scheduledArr.setMinutes(arrMinute);
							scheduledArr.setFullYear(arrDateComponents[2] * 1.0);
							scheduledArr.setMonth(arrDateComponents[1] * 1.0 - 1.0);
							scheduledArr.setDate(arrDateComponents[0] * 1.0);
							var minsToArr = (scheduledArr.getTime() - firstTripDate.getTime()) / 60000;
							legs.push(Mustache.render(DBL.Templates.tripLeg, {
								"mode": leg.mode.code,
								"route": leg.mode.number,
								"diff10": 20 * (minsToDept - previousLegEndTime),
								"legDeptTime": leg.points[0].dateTime.time,
								"legFrom": leg.points[0].name + ((leg.stopSeq !== undefined) ? " " + leg.stopSeq[0].platformName : ""),
								"legTo": leg.points[1].name + ((leg.stopSeq !== undefined) ? " " + leg.stopSeq[leg.stopSeq.length - 1].platformName : ""),
								"legArrTime": leg.points[1].dateTime.time,
								"width": 20 * (minsToArr - minsToDept)
							}));
							previousLegEndTime = minsToArr;
							tripWidth += 20 * (minsToDept - previousLegEndTime); // + 20*(minsToArr-minsToDept);
							if (tripOffset === 0) tripOffset = 20 * minsToDept;
						});
						var tripDiv = $('<div/>', {
							'class': 'trip',
							html: legs.join('')
						});
						tripDiv.css("width", 2 * Math.abs(tripWidth) + Math.abs(tripOffset));
						tripDiv.appendTo($('#tripTimeline'));
					});
				}
			});
		}
	};
});