use Modern::Perl;
our $stops;
get '/vehiclePositions/:direction/:route' => [direction => ['inbound','outbound']] => sub {
	my $self = shift;
	my $route = $self->param('route');
	my $direction = $self->param('direction');
	my $inboundStops = "";
	my $outboundStops = "";
	foreach my $stop (keys %$stops) {
		my $matchExpression = $route;
		#die Dumper $matchExpression;
		if ($stops->{$stop}->{"routes"} && $stops->{$stop}->{"routes"} =~ (/(^|\|)$matchExpression(\||$)/)) {
		$stop =~ /^(\d+)|/;
		my $stopId = $1;
		#my $vehicleIDs = getVehiclesForStopAndRoute($1,$route);
		#say Dumper $stops->{$stop}->{"sequenceNumbers"}->{$route};
		my $directionsServed = "";
		if ($stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Inbound"}) {
			$inboundStops .= $stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Inbound"} . " " . $stopId . " ";
			$directionsServed .= "I";
		}
		if ($stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Outbound"}) {
			$outboundStops .= $stops->{$stop}->{"sequenceNumbers"}->{$route}->{"Outbound"} . " " . $stopId . " ";
			$directionsServed .= "O";
		}
		}
	}
	if ($direction eq "inbound") {
	say "perl DublinBusVehiclePositionFetcher.pl $route Inbound $inboundStops";
	fork_call {
		open my $p, '-|',qq/perl DublinBusVehiclePositionFetcher.pl $route Inbound $inboundStops/ or die "Something went terribly wrong: $!";
		local $/;
		return <$p>;
	}
	sub {
		my $positions = shift;
		my $stopFeatures = ();
		my $id = 0;
		foreach my $stop (keys %$stops) {
		foreach my $stopId (split /\s/,$positions) {
			#say "Stop ID " . $stopId;
			#say "Stop " . $stop;
			if ($stop =~ /^$stopId\|/) {
				push(@{$stopFeatures->{"features"}},
				{"type" => "Feature",
				"id" => $id++,
				"geometry" => {"type" => "Point","coordinates" => [$stops->{$stop}->{"long"}+0.0,$stops->{$stop}->{"lat"}+0.0]},
				"properties" => {"name" => $stop, "direction" => $self->param('direction') eq "inbound" ? "Inbound" : "Outbound"}}
				)
			}
		}
		}
		if (!(defined $stopFeatures)) {
			$self->render_json({},status => 204);
		} else {
			$self->render_json($stopFeatures);
		}
	};
	} elsif ($direction eq "outbound") {
	fork_call {
		open my $p, '-|',qq/perl DublinBusVehiclePositionFetcher.pl $route Outbound $outboundStops/ or die "Something went terribly wrong: $!";
		local $/;
		return <$p>;
	}
	sub {
		my $positions = shift;
		my $stopFeatures = ();
		my $id = 0;
		foreach my $stop (keys %$stops) {
		foreach my $stopId (split /\s/,$positions) {
			#say "Stop ID " . $stopId;
			#say "Stop " . $stop;
			if ($stop =~ /^$stopId\|/) {
				push(@{$stopFeatures->{"features"}},
				{"type" => "Feature",
				"id" => $id++,
				"geometry" => {"type" => "Point","coordinates" => [$stops->{$stop}->{"long"}+0.0,$stops->{$stop}->{"lat"}+0.0]},
				"properties" => {"name" => $stop, "direction" => $self->param('direction') eq "inbound" ? "Inbound" : "Outbound"}}
				)
			}
		}
		}
		if (!(defined $stopFeatures)) {
			$self->render_json({},status => 204);
		} else {
			$self->render_json($stopFeatures);
		}
	};
	}
};
