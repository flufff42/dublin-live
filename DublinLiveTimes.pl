#!/usr/bin/env perl
use Modern::Perl;
use Mojolicious::Lite;
use Mojo::UserAgent;
use Mojo::JSON;
use Data::Dumper;
use Carp;
use SOAP::Lite;
use Time::Piece;
use charnames ':full';
use utf8;
use threads;
app->secret("Dubh Linn");

binmode STDOUT, ':utf8';
say "Dublin Bus Live Departure Times - Development. Loading…";
open J, "<", "DublinBusStopListing.json";

my $stopsJSON = <J>;
while (<J>) { chomp; $stopsJSON .= $_; }
my $json  = Mojo::JSON->new;
my %stops = ();
my $stops = $json->decode("$stopsJSON");

#say Dumper $stops;
say $json->error if ($json->error);
my $ua = Mojo::UserAgent->new;

#queryStopForRoute(9,"Martyrs");
#queryStopForAllRoutes("Konrad Adenauer");
#stopListing();
get '/'             => 'index';
post '/suggestion/' => sub {
    my $self            = shift;
    my $suggestions     = "";
    my $suggestionsHash = ();
    my $prefix = $self->param('prefix');
        $prefix =~ s=[^A-Za-z0-9/\,\-\(\)\. ]==;
        $prefix =~ s=\(=\(=;
        $prefix =~ s=\*==;
        $prefix =~ s=\)=\(=;
        $prefix =~ s=\.==;
        say "Sanitized prefix: " . $prefix;
    for my $stopId ( sort ( keys %$stops ) ) {        
        my @stopIdComponents = split /\|/,$stopId;
        if ( $stopIdComponents[0] =~ /$prefix/i || $stopIdComponents[1] =~ /$prefix/i) {
            $suggestions .= "$stopId\t$stops->{$stopId}->{'routes'}\n";
            $suggestionsHash->{$stopId} = $stops->{$stopId};
        }
    }
    say Dumper $suggestionsHash;
    $self->stash( suggestions => $suggestions );
    if ( $suggestions eq "" ) {
        $self->render_json({ "Error:" => "No suggestions found." },status => 204);
    }
    else {
        $self->render_json($suggestionsHash);
    }

};
post '/near/' => sub {
	my $self = shift;
	say $self->param('lat');
	say $self->param('long');
	say "http://www.dublinbus.ie/Templates/Public/RoutePlannerService/RTPIMapHandler.ashx?ne=".($self->param('lat')+0.005).",".($self->param('long')+0.005)."&sw=".($self->param('lat')-0.005).",".($self->param('long')-0.001)."&zoom=13&czoom=16&rjson=false";
	my $tx = $ua->get("http://www.dublinbus.ie/Templates/Public/RoutePlannerService/RTPIMapHandler.ashx?ne=".($self->param('lat')+0.005).",".($self->param('long')+0.005)."&sw=".($self->param('lat')-0.005).",".($self->param('long')-0.001)."&zoom=13&czoom=16&rjson=false");
	
	if ($tx->success) {
		say $tx->res->body;
		my $points = ();
		$tx->res->dom->find('point')->each(
			sub {
				my $point = shift;
				say $point->{lat} . ":" . $point->{lng} . " " . $point->{stopnumber} . "|" . $point->{address};
				$points->{$point->{stopnumber} . "|" . $point->{address}} = ();
				$points->{$point->{stopnumber} . "|" . $point->{address}}->{lat} = $point->{lat}; $points->{$point->{stopnumber} . "|" . $point->{address}}->{long} = $point->{lng};
		});
		say Dumper $points;
		if (!($points)) {
			$self->render(text => '',
                    status => 204
                );
            
		} else {
			$self->render_json($points);
			undef $points;
		}
	}
};
post '/' => => sub {
    my $self = shift;

    #say Dumper $self->req->content->headers->accept;
    #say Dumper $self->param;
    my $stop = $self->param('stop');
    say $stop;
    say $self->param('route');
    if ( $self->req->content->headers->accept =~ m|^application/json| ) {
        my $results =
          ( $self->param('route') eq "" )
          ? queryStopForAllRoutes( $stop, 1 )
          : queryStopForRoute( $self->param('route'), $stop, 1 );

        #say Dumper $results;
        if ( !$results ) {
            $self->render_json( { "Error:" => "No results found." },
                status => 204 );
        }
        $self->render_json($results);

    }
    else {
        my $results =
          $self->param('route')
          ? queryStopForAllRoutes( $stop, 0 )
          : queryStopForRoute( $self->param('route'), $stop, 0 );
        $self->stash( stop  => $stop );
        $self->stash( times => $results );

        $self->render('times');
    }

    #$self->respond_to(
    #	json => sub {
    #
    #			},
    #	html => sub {
    #			$self->render('times')
    #		}
    #	);

};
app->start;

sub queryStopForRoute {
    my ( $routeId, $stopId, $jsonOut ) = @_;

    #say Dumper @_;
    #say Dumper $stops->{$stopId};
    my @routes = split /\s/, $stops->{$stopId}->{'routes'};
    $stopId =~ s/ - / \/ /;
    unless ( $routeId ~~ @routes ) {
        carp
"Invalid routeId ($routeId) for stopId ($stopId). The following are valid Ids: "
          . $stops->{$stopId}->{'routes'};
        return;
    }
    my $tx = $ua->get(
"http://service.vdl.lu/hotcity/mobility/bus_app.php?routeId=$routeId&stopId=$stopId"
    );
    if ( $tx->success ) {

        #say Dumper $tx->req;
        #say $tx->res->dom;
        my @services =
          $tx->res->dom->find("table:nth-of-type(2) tr:not(:first-child)")
          ->each;

        #say $routeId.":".(scalar @services);
        my $results = "";
        $results = () if ($jsonOut);
        for ( my $i = 0 ; $i < @services ; $i++ ) {
            if ($jsonOut) {
                $results->{ $services[$i]->at('td')->text . $i } =
                  $services[$i]->at('td font')->text;
            }
            else {
                $results .=
                    "$routeId  "
                  . $services[$i]->at('td')->text . " "
                  . $services[$i]->at('td font')->text . " \n";
            }
        }
        return $results;
    }
    else {
        say $tx->error;
    }
}

sub getRealTimeInformationForStop {
    my $stopId = shift;
    say $stopId;
    my $soap = SOAP::Lite->new( proxy =>
          'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx' );

    $soap->on_action(
        sub { "http://dublinbus.ie/GetRealTimeStopData" } );
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
            "(at stop: " . $service->{MonitoredCall_VehicleAtStop} . ")";
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
	# my $t = localtime;
# 	$results->{70}->{"Dunboyne via Littlepace" . " ". 0} = $t->datetime."+00:00";
# 	$results->{70}->{"Dunboyne via Littlepace" . " ". 1} = $t->datetime."+00:10";
# 	$results->{70}->{"Dunboyne via Littlepace" . " ". 2} = $t->datetime."+00:40";
# 	$results->{70}->{"Dunboyne via Littlepace" . " ". 3} = $t->datetime."+00:50";
# 	$results->{70}->{"Dunboyne via Littlepace" . " ". 4} = $t->datetime."+00:56";
# 	$results->{747}->{"Far Far Away" . " ". 0} = $t->datetime."+00:46";
# 	$results->{"42N"}->{"Spaß" . " ". 0} = $t->datetime."+00:26";
# 	$results->{"84X"}->{"Blubb" . " ". 0} = $t->datetime."+00:49";
    return $results;
    }
    
}

sub queryStopForAllRoutes {
    my ( $stopId, $jsonOut ) = @_;
    my @routes = split /\s/, $stops->{$stopId}->{'routes'};
    if ($jsonOut) {
        my $results      = ();
        	$stopId = (split /\|/,$stopId)[0];
        	$results = getRealTimeInformationForStop($stopId);
        return $results;
    }
}
