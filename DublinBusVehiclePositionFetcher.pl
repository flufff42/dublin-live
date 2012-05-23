use Mojo::UserAgent;
use Data::Dumper;
use Modern::Perl;
use Mojo::IOLoop;

my $ua = Mojo::UserAgent->new;
#say Dumper @ARGV;
my $sequenceStops = ();
for (my $i = 2; $i < scalar @ARGV; $i = $i + 2) {
	$sequenceStops->{$ARGV[$i]} = $ARGV[$i+1];
}
my $delay = Mojo::IOLoop->delay;
my $dir = $ARGV[1];
my $route = $ARGV[0];
#say Dumper $sequenceStops;

for my $stopId (values $sequenceStops) 
{
  #say "Looking up Services for Stop ID " . $stopId;
  $delay->begin;
  my $tx = $ua->post('http://rtpi.dublinbus.biznetservers.com/DublinBusRTPIService.asmx' => {"Content-Type" => "text/xml; charset=utf-8", "SOAPAction" => '"http://dublinbus.ie/GetRealTimeStopData"'} =>'<?xml version="1.0" encoding="utf-8"?>
  <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
    <soap:Body>
      <GetRealTimeStopData xmlns="http://dublinbus.ie/">
  	<stopId>'.$stopId.'</stopId><forceRefresh>false</forceRefresh>
      </GetRealTimeStopData>
    </soap:Body>
  </soap:Envelope>' => sub {
    my ($ua,$tx) = @_;
    my $stopVehicles = ();
    $tx->res->dom->find('diffgram DocumentElement StopData')->each(
      sub {my $service = shift;
           if ($service->at('MonitoredVehicleJourney_PublishedLineName')->text eq $route && $service->at('MonitoredVehicleJourney_DirectionRef')->text eq $dir) {
           push (@$stopVehicles,$service->at('FramedVehicleJourneyRef_DatedVehicleJourneyRef')->text);
           }
           #say Dumper {"stopId" => $stopId, "services" => \@stopServices};
           
    });
    $delay->end({"stopId" => $stopId, "vehicles" => $stopVehicles});
  });
}
my @services = $delay->wait;
#say Dumper @services;
my $vehicleStops = ();
foreach my $stopSequence (sort {$a <=> $b} keys %$sequenceStops) {
  
  foreach my $stopServices (@services) {
    if ($stopServices->{stopId} eq $sequenceStops->{$stopSequence}) {
      foreach my $vehicle (@{$stopServices->{vehicles}}) {
        if (!$vehicleStops->{$vehicle}) {
          $vehicleStops->{$vehicle} = $stopServices->{stopId};
        }
      }
    }
  }
}
my $responseString = "";
say Dumper $vehicleStops;
if (defined $vehicleStops) {
foreach my $vehicle (keys $vehicleStops) {
	$responseString .= $vehicleStops->{$vehicle} . " ";
}
}
say $responseString;