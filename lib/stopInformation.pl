use Modern::Perl;
use Data::Dumper;
our $stops;
our $ua;

my $useStaticData = 0;

sub getRealTimeInformationForStop {
    my $stopId = shift;
    say $stopId;
    my $soap = SOAP::Lite->new( proxy =>
          'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx' );

    $soap->on_action(\&soapOnActionURL);
    $soap->autotype(0);
    $soap->default_ns('http://dublinbus.ie/');
    my $som = $soap->call(
        "GetRealTimeStopData",
        SOAP::Data->name('stopId')->value($stopId),
        SOAP::Data->name('forceRefresh')->value("false")
    );

    die $som->fault->{faultstring} if ( $som->fault );
    #say Dumper $som->result;
    #say Dumper $som->result->{diffgram};
    #say Dumper $som->result->{diffgram}->{DocumentElement};
    #say Dumper $som->result->{diffgram}->{DocumentElement}->{StopData};
    my $services = $som->result->{diffgram}->{DocumentElement}->{StopData} unless ($som->result eq "" || $som->result->{diffgram} eq "");
    say Dumper $services;
    if ($services) {
    my $results = ();
    my $serviceCount = 0;
    if (ref $services eq "ARRAY") {
      for my $service (@$services) {
        
        say "Line " . $service->{MonitoredVehicleJourney_PublishedLineName} .
            " to " . $service->{MonitoredVehicleJourney_DestinationName} . 
            " leaving at ". $service->{MonitoredCall_ExpectedDepartureTime} . 
            "(at stop: " . $service->{MonitoredCall_VehicleAtStop} . ")" . "(in congestion: " . $service->{MonitoredVehicleJourney_InCongestion} . ")";
            $results->{$service->{MonitoredVehicleJourney_PublishedLineName}}->{$service->{MonitoredVehicleJourney_DestinationName} . " ". $serviceCount++} =
                  $service->{MonitoredCall_ExpectedDepartureTime};
      }
    } else {
      say "Line " . $services->{MonitoredVehicleJourney_PublishedLineName} .
          " to " . $services->{MonitoredVehicleJourney_DestinationName} . 
          " leaving at ". $services->{MonitoredCall_ExpectedDepartureTime} . 
          "(at stop: " . $services->{MonitoredCall_VehicleAtStop} . ")";
          $results->{$services->{MonitoredVehicleJourney_PublishedLineName}}->{$services->{MonitoredVehicleJourney_DestinationName} . " ". $serviceCount++} =
                  $services->{MonitoredCall_ExpectedDepartureTime};
    }
    return $results;
    }
    
}

sub soapOnActionURL {
	"http://dublinbus.ie/GetRealTimeStopData";
}

sub staticSampleData {
	my $results = ();
	my $t = localtime;
	$results->{70}->{"Dunboyne via Littlepace" . " ". 0} = $t->datetime."+00:00";
	$results->{70}->{"Dunboyne via Littlepace" . " ". 1} = $t->datetime."+00:10";
	$results->{70}->{"Dunboyne via Littlepace" . " ". 2} = $t->datetime."+00:40";
	$results->{70}->{"Dunboyne via Littlepace" . " ". 3} = $t->datetime."+00:50";
	$results->{70}->{"Dunboyne via Littlepace" . " ". 4} = $t->datetime."+00:56";
	$results->{747}->{"Far Far Away" . " ". 0} = $t->datetime."+00:46";
	$results->{"42N"}->{"Spaß" . " ". 0} = $t->datetime."+00:26";
	$results->{"84X"}->{"Blubb" . " ". 0} = $t->datetime."+00:49";
    return $results;

}

sub queryStopForAllRoutes {
    my ( $stopId, $jsonOut ) = @_;
    my @routes = split /\s/, $stops->{$stopId}->{'routes'};
    if ($jsonOut) {
        my $results      = ();
        	$stopId = (split /\|/,$stopId)[0];
        	$results = ($useStaticData == 1) ? staticSampleData() : getRealTimeInformationForStop($stopId);
        return $results;
    }
}

1
