#!/usr/bin/env perl
use Modern::Perl;
use Mojo::JSON;
use Mojo::DOM;
use Mojo::UserAgent;
use Data::Dumper;
use SOAP::Lite;
use utf8;

my $stopListingXMLPath = "/home/flufff/dublin-live/Stop Listing Staging/DublinBusStopListing.xml";
my $stopListingJSONPath = "/home/flufff/dublin-live/Stop Listing Staging/DublinBusStopListing.json";
my $dublinBusRTPIWebServiceURL =
  'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx';

my $stopsSOAP;

if ( $ARGV[0] eq "migrate" ) {
    #say "Migrating..."; # Migrating: Fetch a copy of all stops and then process these
    open X, ">", $stopListingXMLPath;
    my $ua = Mojo::UserAgent->new;
    my $tx = $ua->post(
        $dublinBusRTPIWebServiceURL => {
            "Content-Type" => "text/xml; charset=utf-8",
            "SOAPAction"   => '"http://dublinbus.ie/GetDestinations"'
          } => '<?xml version="1.0" encoding="utf-8"?>
			<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
			    <soap:Body>
			    	<GetDestinations xmlns="http://dublinbus.ie/">
			    	<filter></filter>
			    	</GetDestinations>
			    </soap:Body>
			</soap:Envelope>'
    );
    my $stopVehicles = ();
    say X $tx->res->body;
    close X;

    open S, "<", $stopListingXMLPath;
    $|++;
    $stopsSOAP = <S>;
    while (<S>) { chomp; $stopsSOAP .= $_; }

}
else {
    open S, "<", $stopListingXMLPath;
    $|++;
    $stopsSOAP = <S>;
    while (<S>) { chomp; $stopsSOAP .= $_; }
}
open J, ">", $stopListingJSONPath;

my $dom = Mojo::DOM->new($stopsSOAP);
createStopsJSON();
close J;
system('node /home/flufff/dublin-live/Stop\ Listing\ Staging/migrationDetailsReporter.js');

sub createStopsJSON {
    my $soapStopListing = ();
    my $stopCount       = 0;
    my $stopsHash       = ();

#say Dumper $dom->at('soap:Envelope soap:Body GetAllDestinationsResponse GetAllDestinationsResult Destinations');
    $dom->find('Destinations Destination')->each(
        sub {
            my $stop = shift;

            my $routes = getRoutesServicedByStopNumber(
                $stop->find('StopNumber')->[0]->text );
            my $routeSequenceNumbers = getRouteSequenceNumbersForStopAndRoutes(
                $stop->find('StopNumber')->[0]->text,
                $routes eq "null" ? "0" : $routes
            );

            say $stop->find('StopNumber')->[0]->text . " "
              . $stop->find('Longitude')->[0]->text . " "
              . $stop->find('Latitude')->[0]->text . " "
              . $stop->find('Description')->[0]->text . " "
              . $routes;
            my $stopId =
                $stop->find('StopNumber')->[0]->text . "|"
              . $stop->find('Description')->[0]->text;
            $stopsHash->{$stopId}         = ();
            $stopsHash->{$stopId}->{lat}  = $stop->find('Latitude')->[0]->text;
            $stopsHash->{$stopId}->{long} = $stop->find('Longitude')->[0]->text;
            $stopsHash->{$stopId}->{routes}          = $routes;
            $stopsHash->{$stopId}->{sequenceNumbers} = $routeSequenceNumbers;
            say $stopCount++;
        }
    );
    #say Dumper $stopsHash;
    my $json       = Mojo::JSON->new;
    my $jsonString = $json->encode($stopsHash);
    #say $jsonString;
    print J $jsonString;
}

sub getRoutesServicedByStopNumber {
    my $soap = SOAP::Lite->new( proxy =>
          $dublinBusRTPIWebServiceURL );

    $soap->on_action(
        sub { "http://dublinbus.ie/GetRoutesServicedByStopNumber" } );
    $soap->autotype(0);
    $soap->default_ns('http://dublinbus.ie/');

    my $som = $soap->call(
        "GetRoutesServicedByStopNumber",
        SOAP::Data->name('stopId')->value(shift),
    );

    die $som->fault->{faultstring} if ( $som->fault );
    my $routes = $som->result->{Route} unless ( $som->result eq "" );

    #say Dumper $routes;
    my $routeNumbers = "";
    if ( ref $routes eq "ARRAY" ) {
        for my $route (@$routes) {
            #say $route->{Number} . " to " . $route->{Towards};
            $routeNumbers .= $route->{Number} . "|";
        }
    }
    else {
        return $routes->{Number} . "|";
    }
    return $routeNumbers;

}

sub getRouteSequenceNumbersForStopAndRoutes {
    my ( $stop, $routes ) = @_;
    my @routes = split /\|/, $routes;
    my $routeSequenceNumbers = ();
    foreach my $route (@routes) {
        my $soap =
          SOAP::Lite->new( proxy => $dublinBusRTPIWebServiceURL);

        $soap->on_action( sub { "http://dublinbus.ie/GetStopDataByRoute" } );
        $soap->autotype(0);
        $soap->default_ns('http://dublinbus.ie/');

        my $som =
          $soap->call( "GetStopDataByRoute",
            SOAP::Data->name('route')->value($route),
          );

        if ( $som->fault ) {
            say $som->fault->{faultstring};
        }
	#say Dumper $som->result;
        #if (!($som->result->{diffgram} eq "") {
		my $inboundStops =
          	  $som->result->{diffgram}->{StopDataByRoute}->{InboundStop}
          	  unless ( $som->result eq "" || $som->result->{diffgram} eq "");
        	my $outboundStops =
          	  $som->result->{diffgram}->{StopDataByRoute}->{OutboundStop}
        	  unless ( $som->result eq "" || $som->result->{diffgram} eq "");
	

        #die Dumper $inboundStops;
        foreach my $iStop (@$inboundStops) {

            #die Dumper $iStop->{"StopNumber"};
            #say $stop;
            if ( $iStop->{"StopNumber"} =~ /^$stop$/ ) {
                #say Dumper $iStop->{"SeqNumber"};
                $routeSequenceNumbers->{$route}->{"Inbound"} =
                  $iStop->{"SeqNumber"};
            }
        }
        foreach my $oStop (@$outboundStops) {

            #say Dumper $oStop;
            if ( $oStop->{"StopNumber"} =~ /^$stop$/ ) {
                #say Dumper $oStop->{"SeqNumber"};
                $routeSequenceNumbers->{$route}->{"Outbound"} =
                  $oStop->{"SeqNumber"};
            }
        }
    }
    return $routeSequenceNumbers;
}
