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
our %stops = ();
our $stops = $json->decode("$stopsJSON");

#say Dumper $stops;
say $json->error if ($json->error);
our $ua = Mojo::UserAgent->new;

get '/'             => 'index';
require "lib/suggestions.pl";
require "lib/nearby.pl";
require "lib/stopInformation.pl";

post '/' => => sub {
    my $self = shift;

    #say Dumper $self->req->content->headers->accept;
    #say Dumper $self->param;
    my $stop = $self->param('stop');
    say $stop;
    say $self->param('route');
    $self->res->headers->cache_control('max-age=0');
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
};
app->start;

