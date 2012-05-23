use Modern::Perl;
use Data::Dumper;
our $stops;

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

1
