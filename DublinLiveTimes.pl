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

use EV;
use AnyEvent;
use AnyEvent::Util;
use threads;
#use Anyevent::Util;

require "lib/suggestions.pl";
require "lib/nearby.pl";
require "lib/stopInformation.pl";
require "lib/positions.pl";
app->config(hypnotoad => {listen => ['http://*:3001']});

app->secret("Dubh Linn");

binmode STDOUT, ':utf8';
say "42 Dublin Bus Live Departure Times - Development. Loading…";
open J, "<", "DublinBusStopListing.json";

my $stopsJSON = <J>;
while (<J>) { chomp; $stopsJSON .= $_; }
my $json  = Mojo::JSON->new;
our $stops = ();

$stops = $json->decode("$stopsJSON");

#say Dumper $stops;
say $json->error if ($json->error);
our $ua = Mojo::UserAgent->new;

get '/stopInfo/' => sub {
	my $self = shift;
	$self->render_json($stops);
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
		"geometry" => {"type" => "LineString","coordinates" => $stopCoordinatesSortedInbound},
		"properties" => {"name" => "Inbound Line String for route " . $self->param('route')}}
		);
	push(@{$stopFeatures->{"features"}},
		{"type" => "Feature",
		"id" => $id++,
		"geometry" => {"type" => "LineString","coordinates" => $stopCoordinatesSortedOutbound},
		"properties" => {"name" => "Outbound Line String for route " . $self->param('route')}}
		);
	$self->render_json($stopFeatures);
};


get '/map/:route' => 'map';

get '/line/:route' => 'line';

get '/:stopId' => {stopId => ''} => 'index';



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

app->start;

