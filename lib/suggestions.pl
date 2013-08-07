use Modern::Perl;
use Data::Dumper;
our $stops;
our $ua;

sub findSuggestions() {
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
    $prefix =~ s/([A-Z]{2})/(Stop $1)/ if ($prefix =~ /[A-Z]{2}/);
    for my $stopId ( sort ( keys %$stops ) ) {        
        my @stopIdComponents = split /\|/,$stopId;
        if ( $stopIdComponents[0] =~ /$prefix/i || $stopIdComponents[1] =~ /$prefix/i) {
            $suggestions .= "$stopId\t$stops->{$stopId}->{'routes'}\n";
            $suggestionsHash->{$stopId} = $stops->{$stopId};
        }
    }
    #say Dumper $suggestionsHash;
    $self->stash( suggestions => $suggestions );
    $self->res->headers->cache_control('max-age=600');
    if ( $suggestions eq "" ) {
        
        $self->render_json({ "Error:" => "No suggestions found." },status => 204);
    }
    else {
        $self->render_json($suggestionsHash);
    }

}

sub findEFASuggestions() {
	my $self = shift;
	my $prefix = $self->param('prefix');
	$prefix =~ s=[^A-Za-z0-9/\,\-\(\)\. ]==;
        $prefix =~ s=\(=\(=;
        $prefix =~ s=\*==;
        $prefix =~ s=\)=\(=;
        $prefix =~ s=\.==;
     my $tx = $ua->get("http://194.97.141.172/nta/XSLT_STOPFINDER_REQUEST?language=en&name_sf=".$prefix."&outputFormat=JSON&itdLPxx_usage=origin&SpEncId=0&locationServerActive=1&stateless=1&reducedAnyWithoutAddressObjFilter_sf=103&reducedAnyPostcodeObjFilter_sf=64&reducedAnyTooManyObjFilter_sf=2&useHouseNumberList=true&doNotSearchForStops_sf=1&type_sf=any&anyObjFilter_sf=127&anyMaxSizeHitList=50");
	
	if ($tx->success) {
		say Dumper $tx->res->json;
		my $suggestions = ();
		if (ref $tx->res->json->{stopFinder}->{points} eq "HASH") {
			my $stop = $tx->res->json->{stopFinder}->{points}->{point};
			say $stop->{name} . ": " . $stop->{stateless};
			$suggestions->{$stop->{stateless}} = $stop->{name};
		} else {
			for my $stop (@{$tx->res->json->{stopFinder}->{points}}) {
				if ($stop->{stateless} =~ /:+/) {
					
				} else {
					say $stop->{name} . ": " . $stop->{stateless};
					$suggestions->{$stop->{stateless}} = $stop->{name};
				}
				
			}
		}
		if (!(defined $suggestions)) {
			$self->render_json(status => 204);
		} else {
			$self->render_json($suggestions);
		}
	}
     

}

1
