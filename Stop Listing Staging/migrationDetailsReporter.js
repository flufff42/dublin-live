// Migration Details Reporter
var un_ = require('underscore');
var fs = require('fs');
var nodemailer = require('nodemailer');

var newStopListing = JSON.parse(fs.readFileSync('/home/flufff/dublin-live/Stop Listing Staging/DublinBusStopListing.json'));
var oldStopListing = JSON.parse(fs.readFileSync('/home/flufff/dublin-live/DublinBusStopListing.json'));
console.log(newStopListing);
var stopsAdded = un_.difference(un_.keys(newStopListing),un_.keys(oldStopListing));
var stopsRemoved = un_.difference(un_.keys(oldStopListing),un_.keys(newStopListing));

var stopsRenamed = un_.intersection(un_.map(stopsAdded, function(s) { return s.match(/^(\d+)\|/)[1]; } ),un_.map(stopsRemoved, function(s) { return s.match(/^(\d+)\|/)[1]; } ));
var stopIdsRemoved = un_.difference(un_.map(stopsRemoved, function(s) { return s.match(/^(\d+)\|/)[1]; } ),un_.map(stopsAdded, function(s) { return s.match(/^(\d+)\|/)[1]; } ));
var stopIdsAdded = un_.difference(un_.map(stopsAdded, function(s) { return s.match(/^(\d+)\|/)[1]; } ),un_.map(stopsRemoved, function(s) { return s.match(/^(\d+)\|/)[1]; } ));
console.log(stopsAdded);
console.log(stopsRemoved);
console.log(stopsRenamed);
console.log(stopIdsRemoved);
console.log(stopIdsAdded);
function stopNameForId(stopArray,id) { var r = new RegExp('^'+id+'\\|'); return un_.find(stopArray, function(s) { return s.match(r); }); }

var reportString = "";

un_.forEach(stopsRenamed, function (id) { reportString += "\nStop " + stopNameForId(stopsRemoved,id) + " renamed to " + stopNameForId(stopsAdded,id); } );
un_.forEach(stopIdsRemoved, function (id) { reportString += "\nStop " + stopNameForId(stopsRemoved,id) + " removed"; } );
un_.forEach(stopIdsAdded, function (id) { reportString += "\nStop " + stopNameForId(stopsAdded,id) + " added"; } );
console.log(reportString);
if (stopsRenamed.length > 0
	|| stopIdsRemoved.length > 0
	|| stopIdsAdded.length > 0) {
	
	var smtpTransport = nodemailer.createTransport("sendmail");
	var mailOptions = {from: "Migration Reporter", to: "dublinlive@lsr.li", subject: "Dublin Bus Stops Migration Report", text: "Here's the latest changes from the Dublin Bus Stop Listing Migration: " + reportString}

	smtpTransport.sendMail(mailOptions,function(error,response) {/*console.log(error,response.message);*/});
	
	fs.renameSync('/home/flufff/dublin-live/DublinBusStopListing.json','/home/flufff/dublin-live/Stop Listing Staging/Old Listings/DublinBusStopListing'+(new Date().toJSON())+'.json');
	fs.renameSync('/home/flufff/dublin-live/Stop Listing Staging/DublinBusStopListing.json','/home/flufff/dublin-live/DublinBusStopListing.json');
	var hypnotoadPID = (fs.readFileSync('/home/flufff/dublin-live/hypnotoad.pid') * 1.0);
	process.kill(hypnotoadPID,'SIGUSR2')
}
