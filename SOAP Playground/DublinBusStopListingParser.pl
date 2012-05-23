#!/usr/bin/env perl
use Modern::Perl;
use Mojo::JSON;
use Mojo::DOM;
use Data::Dumper;
use SOAP::Lite;
use utf8;
open S, "<", "DublinBusStopListing.xml";
$|++;
my $stopsSOAP = <S>;
while (<S>) { chomp; $stopsSOAP .= $_; }
open J, ">", "DublinBusStopListing.json";
#say $stopsSOAP;
my $dom             = Mojo::DOM->new($stopsSOAP);
#getRealTimeInformationForStop(12);
createStopsJSON();
sub createStopsJSON {
my $soapStopListing = ();
my $stopCount = 0;
my $stopsHash = ();
#say Dumper $dom->at('soap:Envelope soap:Body GetAllDestinationsResponse GetAllDestinationsResult Destinations');
$dom->find('Destinations Destination')->each(
    sub {
        my $stop = shift;
        
          my $routes =  getRoutesServicedByStopNumber(
            $stop->find('StopNumber')->[0]->text );
            my $routeSequenceNumbers = getRouteSequenceNumbersForStopAndRoutes($stop->find('StopNumber')->[0]->text,$routes eq "null" ? "0" : $routes);
            
        say $stop->find('StopNumber')->[0]->text . " "
          . $stop->find('Longitude')->[0]->text . " "
          . $stop->find('Latitude')->[0]->text . " "
          . $stop->find('Description')->[0]->text . " "
          . $routes;
          my $stopId = $stop->find('StopNumber')->[0]->text . "|" . $stop->find('Description')->[0]->text;
            $stopsHash->{$stopId} = ();
            $stopsHash->{$stopId}->{lat} = $stop->find('Latitude')->[0]->text;
            $stopsHash->{$stopId}->{long} = $stop->find('Longitude')->[0]->text;
            $stopsHash->{$stopId}->{routes} = $routes;
            $stopsHash->{$stopId}->{sequenceNumbers} = $routeSequenceNumbers;
        say $stopCount++;
    }
);
say Dumper $stopsHash;
my $json = Mojo::JSON->new;
my $jsonString = $json->encode($stopsHash);
say $jsonString;
print J $jsonString;
}
sub getRoutesServicedByStopNumber {
    my $soap = SOAP::Lite->new( proxy =>
          'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx' );

    $soap->on_action(
        sub { "http://dublinbus.ie/GetRoutesServicedByStopNumber" } );
    $soap->autotype(0);
    $soap->default_ns('http://dublinbus.ie/');

    my $som = $soap->call(
        "GetRoutesServicedByStopNumber",
        SOAP::Data->name('stopId')->value(shift),
    );

    die $som->fault->{faultstring} if ( $som->fault );
    my $routes = $som->result->{Route} unless ($som->result eq "");

    #say Dumper $routes;
    my $routeNumbers = "";
    if ( ref $routes eq "ARRAY") {
      for my $route (@$routes) {
          say $route->{Number} . " to " . $route->{Towards};
          $routeNumbers .= $route->{Number} . "|";
      }
    }
    else {
        return $routes->{Number} . "|";
    }
    return $routeNumbers;

}

sub getRouteSequenceNumbersForStopAndRoutes {
	my ($stop,$routes) = @_;
	my @routes = split /\|/, $routes;
	my $routeSequenceNumbers = ();
	foreach my $route (@routes) {
		my $soap = SOAP::Lite->new( proxy =>
          'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx' );

    $soap->on_action(
        sub { "http://dublinbus.ie/GetStopDataByRoute" } );
    $soap->autotype(0);
    $soap->default_ns('http://dublinbus.ie/');

    my $som = $soap->call(
        "GetStopDataByRoute",
        SOAP::Data->name('route')->value($route),
    );

    if ( $som->fault ) {
    	say $som->fault->{faultstring};
    }
    my $inboundStops = $som->result->{diffgram}->{StopDataByRoute}->{InboundStop} unless ($som->result eq "");
	my $outboundStops = $som->result->{diffgram}->{StopDataByRoute}->{OutboundStop} unless ($som->result eq "");
	#die Dumper $inboundStops;
	foreach my $iStop (@$inboundStops) {
		#die Dumper $iStop->{"StopNumber"};
		#say $stop;
		if ($iStop->{"StopNumber"} =~ /^$stop$/) {
			say Dumper $iStop->{"SeqNumber"};
			$routeSequenceNumbers->{$route}->{"Inbound"} = $iStop->{"SeqNumber"};
		}
	}
	foreach my $oStop (@$outboundStops) {
		#say Dumper $oStop;
		if ($oStop->{"StopNumber"} =~ /^$stop$/) {
			say Dumper $oStop->{"SeqNumber"};
			$routeSequenceNumbers->{$route}->{"Outbound"} = $oStop->{"SeqNumber"};
		}
	}
	}
	return $routeSequenceNumbers;
}

sub getRealTimeInformationForStop {
    my $soap = SOAP::Lite->new( proxy =>
          'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx' );

    $soap->on_action(
        sub { "http://dublinbus.ie/GetRealTimeStopData" } );
    $soap->autotype(0);
    $soap->default_ns('http://dublinbus.ie/');

    my $som = $soap->call(
        "GetRealTimeStopData",
        SOAP::Data->name('stopId')->value(shift),
        SOAP::Data->name('forceRefresh')->value("false")
    );

    die $som->fault->{faultstring} if ( $som->fault );
    my $services = $som->result->{diffgram}->{DocumentElement}->{StopData};
    if (ref $services eq "ARRAY") {
      for my $service (@$services) {
        say "Line " . $service->{MonitoredVehicleJourney_LineRef} .
            " to " . $service->{MonitoredVehicleJourney_DestinationName} . 
            " leaving at ". $service->{MonitoredCall_ExpectedDepartureTime} . 
            "(at stop: " . $service->{MonitoredCall_VehicleAtStop} . ")";
      }
    } else {
      say "Line " . $services->{MonitoredVehicleJourney_LineRef} .
          " to " . $services->{MonitoredVehicleJourney_DestinationName} . 
          " leaving at ". $services->{MonitoredCall_ExpectedDepartureTime} . 
          "(at stop: " . $services->{MonitoredCall_VehicleAtStop} . ")";
    }
}


#$dom->find('Destination')->each(sub {say Dumper shift});
