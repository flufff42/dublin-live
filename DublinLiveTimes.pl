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
use Digest::SHA;

use EV;
use AnyEvent;
use AnyEvent::Util;
use threads;
#use Anyevent::Util;aaa

require "lib/suggestions.pl";
require "lib/nearby.pl";
require "lib/stopInformation.pl";
require "lib/positions.pl";
require "lib/efaTrip.pl";
app->config(hypnotoad => {listen => ['http://*:3001']});

app->secret("Dubh Linn");
#app->log("Testing logging");
binmode STDOUT, ':utf8';
say "42 Dublin Bus Live Departure Times - Development. Loading…";
open J, "<", "DublinBusStopListing.json";
my $stopsMTime = (stat J)[9];
say "Stop last modified at: $stopsMTime";
my $stopsJSON = <J>;
while (<J>) { chomp; $stopsJSON .= $_; }
our $json  = Mojo::JSON->new;
our $stops = ();
our $routes = ();

$stops = $json->decode("$stopsJSON");
say $json->error if ($json->error);

populateRoutes();

our $ua = Mojo::UserAgent->new;

get '/stopInfoUpdated' => sub {
	shift->render_json({modified => $stopsMTime});
};

get '/stopInfo/' => sub {
	my $self = shift;
	$self->render_json($stops);
};

get '/routeInfo/' => sub {
	shift->render_json($routes);
};

get '/stopFeatures/:route' => sub {
	my $self = shift;
	my $stopFeatures = ();
	$stopFeatures->{"type"} = "FeatureCollection";
	$stopFeatures->{"features"} = ();
	my $stopCoordinatesInbound = ();
	my $stopCoordinatesOutbound = ();
	my $id = 0;
	foreach my $stop (keys %$stops) {
		my $matchExpression = $self->param('route');
		say Dumper $matchExpression;
		if ($stops->{$stop}->{"routes"} && $stops->{$stop}->{"routes"} =~ (/(^|\|)$matchExpression(\||$)/)) {
		say Dumper $stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')};
		my $directionsServed = "";
		if ($stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')}->{"Inbound"}) {
			#$directionsServed .= "I";
			$stopCoordinatesInbound->{$stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')}->{"Inbound"}} = [$stops->{$stop}->{"long"}+0.0,$stops->{$stop}->{"lat"}+0.0];
			
		}
		if ($stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')}->{"Outbound"}) {
			#$directionsServed .= "O";
			$stopCoordinatesOutbound->{$stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')}->{"Outbound"}} = [$stops->{$stop}->{"long"}+0.0,$stops->{$stop}->{"lat"}+0.0];
		}
		
		push(@{$stopFeatures->{"features"}},
		{"type" => "Feature",
		"id" => $id++,
		"geometry" => {"type" => "Point","coordinates" => [$stops->{$stop}->{"long"}+0.0,$stops->{$stop}->{"lat"}+0.0]},
		"properties" => {"name" => $stop . $directionsServed, "routes" => $stops->{$stop}->{"routes"}, 
		"inboundSequenceForKeyRoute" => $stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')}->{"Inbound"},
		"outboundSequenceForKeyRoute" => $stops->{$stop}->{"sequenceNumbers"}->{$self->param('route')}->{"Outbound"}}}
		);
		
		}
	}
	my $stopCoordinatesSortedInbound = ();
	my $stopCoordinatesSortedOutbound = ();
	foreach my $stopCoords (sort {$a <=> $b} keys %$stopCoordinatesInbound) {
		say $stopCoords . " " . Dumper $stopCoordinatesInbound->{$stopCoords};
		push(@{$stopCoordinatesSortedInbound},$stopCoordinatesInbound->{$stopCoords});
	}
	foreach my $stopCoords (sort {$a <=> $b} keys %$stopCoordinatesOutbound) {
		say $stopCoords . " " . Dumper $stopCoordinatesOutbound->{$stopCoords};
		push(@{$stopCoordinatesSortedOutbound},$stopCoordinatesOutbound->{$stopCoords});
	}
	push(@{$stopFeatures->{"features"}},
		{"type" => "Feature",
		"id" => $id++,
		"geometry" => {"type" => "LineString","coordinates" => ($stopCoordinatesSortedInbound > 0) ? $stopCoordinatesSortedInbound : ""},
		"properties" => {"name" => "Inbound Line String for route " . $self->param('route')}}
		);
	push(@{$stopFeatures->{"features"}},
		{"type" => "Feature",
		"id" => $id++,
		"geometry" => {"type" => "LineString","coordinates" => ($stopCoordinatesSortedOutbound > 0) ? $stopCoordinatesSortedOutbound : ""},
		"properties" => {"name" => "Outbound Line String for route " . $self->param('route')}}
		);
	$self->render_json($stopFeatures);
};


get '/map/:route' => 'index';

get '/line/:route' => 'index';
get '/efaTrip/' => \&findEFATrips;
get '/:stopId' => {stopId => ''} => 'index';

get '/db/:stopId' => sub {
	my $self = shift;
	my $stop = $self->param('stopId');
	my $results = getJourneysStopData($stop);
	$self->render(text => '', status => 204) unless ($results);
	$self->render_json($results);
};

post '/' => => sub {
    my $self = shift;
    my $stop = $self->param('stop');
    say $stop;
    say $self->param('route');
    $self->res->headers->cache_control('max-age=0');
    my $results = queryStopForAllRoutes( $stop, 1 );
    $self->render(text => '', status => 204) unless ($results);
    $self->render_json($results);
};
post '/near/' => \&findNearbyStops;
post '/suggestion/' => \&findSuggestions;
post '/suggestionEFA/' => \&findEFASuggestions;

app->start;

sub populateRoutes {
	my $routesDiscovered = ();
	foreach my $stop (keys %$stops) {
		for my $route (split /\|/, $stops->{$stop}->{"routes"}) {
			if ($stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Inbound"}) {
				$routesDiscovered->{$route}->{"Inbound"}->{$stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Inbound"}} = $stop;
			}
			if ($stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Outbound"}) {
				$routesDiscovered->{$route}->{"Outbound"}->{$stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Outbound"}} = $stop;
			}
		}
	}
	for my $route (keys %$routesDiscovered) {
		my $smallestInboundSequence = (sort {$a <=> $b} keys %{$routesDiscovered->{$route}->{"Inbound"}})[0];
		my $largestInboundSequence = (sort {$b <=> $a} keys %{$routesDiscovered->{$route}->{"Inbound"}})[0];
		my $smallestOutboundSequence = (sort {$a <=> $b} keys %{$routesDiscovered->{$route}->{"Outbound"}})[0];
		my $largestOutboundSequence = (sort {$b <=> $a} keys %{$routesDiscovered->{$route}->{"Outbound"}})[0];
		say $route . " inbound from " . $routesDiscovered->{$route}->{"Inbound"}->{$smallestInboundSequence} . " to " . $routesDiscovered->{$route}->{"Inbound"}->{$largestInboundSequence} . " and outbound from" . $routesDiscovered->{$route}->{"Outbound"}->{$smallestOutboundSequence} . " to "  . $routesDiscovered->{$route}->{"Outbound"}->{$largestOutboundSequence};
		$routes->{$route}->{"InboundFrom"} = $routesDiscovered->{$route}->{"Inbound"}->{$smallestInboundSequence};
		$routes->{$route}->{"InboundTo"} = $routesDiscovered->{$route}->{"Inbound"}->{$largestInboundSequence};
		$routes->{$route}->{"OutboundFrom"} = $routesDiscovered->{$route}->{"Outbound"}->{$smallestOutboundSequence};
		$routes->{$route}->{"OutboundTo"} = $routesDiscovered->{$route}->{"Outbound"}->{$largestOutboundSequence};
	}
}

