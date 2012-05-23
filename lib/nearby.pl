use Modern::Perl;
use Data::Dumper;
our $ua;
sub findNearbyStops {
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
		$self->res->headers->cache_control('max-age=30');
		if (!($points)) {
			$self->render(text => '',
                    status => 204
                );
            
		} else {
			$self->render_json($points);
			undef $points;
		}
	}
}

1