use Test::More;
use Test::Mojo;

use FindBin;
$ENV{MOJO_HOME} = "$FindBin::Bin/../";
require "$ENV{MOJO_HOME}/DublinLiveTimes.pl";

my $t = Test::Mojo->new;
$t->get_ok('/');
$t->post_form_ok('/suggestion' => {prefix => 'failstop' })->status_is(204);
$t->post_form_ok('/suggestion' => {prefix => '3665' })->status_is(200)->json_is('/3665|Dublin Airport, Arrivals Terminal/lat' => "53.428116");
$t->post_form_ok('/' => {stop => '7453|Arran Quay, At Ocean house'})->json_has('/747');
$t->post_form_ok('/' => {stop => '4086|Enniskerry Road, Garden Centre'})->status_is(204);
done_testing;