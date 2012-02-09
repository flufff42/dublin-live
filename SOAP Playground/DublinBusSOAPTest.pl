#!/usr/bin/env perl
use Modern::Perl;
use Data::Dumper;
use SOAP::Lite;
my $routes = getRoutesServicedByStopNumber(12);
say "Stop 12 served by: " . Dumper $routes;
$routes = getRoutesServicedByStopNumber(747);
say "Stop 747 served by: " . Dumper $routes;
$routes = getRoutesServicedByStopNumber(201);
say "Stop 201 served by: " . Dumper $routes;
sub getRoutesServicedByStopNumber {
 my $soap = SOAP::Lite->new( proxy => 'http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx');
 
 $soap->on_action( sub { "http://dublinbus.ie/GetRoutesServicedByStopNumber" });
 $soap->autotype(0);
 $soap->default_ns('http://dublinbus.ie/');
 
 my $som = $soap->call("GetRoutesServicedByStopNumber",
    SOAP::Data->name('stopId')->value(shift),
);
 
 die $som->fault->{ faultstring } if ($som->fault);
 my $routes = $som->result->{Route};
 my $routeNumbers = "";
 for my $route (@$routes) {say $route->{Number} . " to " . $route->{Towards}; $routeNumbers .= $route->{Number} . " "};
 return $routeNumbers;
 
}