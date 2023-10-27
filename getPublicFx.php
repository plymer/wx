<?php

$REFERENCE = "/([-]{2,})\n?((.+)\n){1,}([-]{2,})/"; // used to remove reference elevation statements

$REGIONNAME = "/(?:\n\n)(\w.+-?\.\n)(?:\w+DAY\.\.|\w+NIGHT\.\.|\w+DAY NIGHT\.\.)/";

$FORECAST = "/(.+\.\.[\w\d\s\.\/]+\.\n\n)/";

$forecasts = array();

$ch = curl_init();

$url = "https://dd.weather.gc.ca/cgi-bin/bulletin_search.pl?product=fp&issuer=cwwg&header=16";

//$fxURL = "https://weather.gc.ca/forecast/public_bulletins_e.html?Bulletin=" . $bulletin . "." . $office;
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);

// split up all of the bulletins so we can systematically parse out each forecast region and update
//    each one as we find a newer version of it in the returned list of forecasts
$bulletins = explode("FPCN", $response);

for ($i=0; $i<count($bulletins); $i++){
  $bulletins[$i] = preg_replace($REFERENCE, "", $bulletins[$i]); // remove reference elevation statements


  preg_match_all($REGIONNAME, $bulletins[$i], $matches);


  for ($j=0; $j<count($matches[1]); $j++) {

    // i # of FP bulletins containing j # of regions

    // check to see if the region already exists in the list of regions collected so far
    //   if it doesn't, we add it to the list
    //   once we have checked for the region's existence, we then move to the next step of adding
    //   the forecast information for that region
    // we are using the forecast region name as the key


    preg_match_all($FORECAST, $bulletins[$i], $fxText);

    // print_r($fxText[1]);
    // $forecasts[$matches[1][$j]] = $fxText[1][$i];

    echo "------\n i = $i, j = $j\n\n" . trim($matches[1][$j]) . "\n" . trim($fxText[1][$j]) . "\n\n";


  }

  //echo "$bulletins[$i]\n\n";
}

//print_r($forecasts);

?>
