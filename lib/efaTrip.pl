use Modern::Perl;
use Data::Dumper;
use Time::Piece;
our $ua;
sub findEFATrips {
	my $self = shift;
	say $self->param('originLat');
	say $self->param('originLong');
	say $self->param('destinationLat');
	say $self->param('destinationLong');
	say $self->param('origin');
	say $self->param('destination');
	my $t = localtime;
	my $originURLComponent;
	my $destinationURLComponent;
	if ($self->param('originLat') && $self->param('originLong')) {
		say "Origin coordinates given.";
		$originURLComponent = "type_origin=coord&name_origin=" . $self->param('originLong') . ":" . $self->param('originLat') . ":WGS84%5BDD.dddd%5D";
	} else {
		if (!$self->param('origin')) {
			$self->render(status => 400);
		} else {
			$originURLComponent = "type_origin=stop&name_origin=" . $self->param('origin'); #"51002133";
		}
	}
	if ($self->param('destinationLat') && $self->param('destinationLong')) {
		say "Destination coordinates given.";
		$destinationURLComponent = "type_destination=coord&name_destination=" . $self->param('destinationLong') . ":" . $self->param('destinationLat') . ":WGS84%5BDD.dddd%5D";
	} else {
		if (!$self->param('destination')) {
			$self->render(status => 400);
		} else {
			$destinationURLComponent = "type_destination=stop&name_destination=" . $self->param('destination');#"51015826";
		}
	}
	
	#say "http://194.97.141.172/nta/XML_TRIP_REQUEST2?language=en&sessionID=0&type_origin=coord&name_origin=-6.271599:53.365197:WGS84%5BDD.dddd%5D&name_destination=51015826&type_destination=stop&itdDate=". $t->ymd("") . "&itdTime=". $t->hms("") . "&outputFormat=JSON"; 
	#my $tx = $ua->get("http://194.97.141.172/nta/XML_TRIP_REQUEST2?language=en&sessionID=0&type_origin=coord&name_origin=-6.271599:53.365197:WGS84%5BDD.dddd%5D&name_destination=51015826&type_destination=stop&itdDate=". $t->ymd("") . "&itdTime=". $t->hms("") . "&outputFormat=JSON");
	if ($originURLComponent && $destinationURLComponent) {
	say "http://194.97.141.172/nta/XML_TRIP_REQUEST2?language=en&sessionID=0&" . $originURLComponent ."&" . $destinationURLComponent . "&itdDate=". $t->ymd("") . "&itdTime=". $t->hms("") . "&outputFormat=JSON";
	my $tx = $ua->get("http://194.97.141.172/nta/XML_TRIP_REQUEST2?language=en&sessionID=0&" . $originURLComponent ."&" . $destinationURLComponent . "&itdDate=". $t->ymd("") . "&itdTime=". $t->hms("") . "&outputFormat=JSON");
	
	if ($tx->success) {
		#say Dumper $tx->res->body;
		#say Dumper $tx->res->json;
		my $json  = Mojo::JSON->new;
		
		my $jsonBody = $tx->res->body;
		$jsonBody =~ s/\\//g;
		$jsonBody = $json->decode($jsonBody);
		say $json->error;
		say Dumper $jsonBody;
		$self->res->headers->cache_control('max-age=30');
		#$self->res->headers->content_type('application/json');
		$self->render_json($jsonBody);
	} else {
		$self->render($tx);
		$self->render_json($tx);
		
	}
	}
}

1