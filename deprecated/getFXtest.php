<?php

$office = strtolower($_GET["office"]);
$bulletin = strtolower($_GET["bulletin"]);

$referencePattern = "/([-]{2,})\n?((.+)\n){1,}([-]{2,})/";
$regionNamesPattern = "((?:\s\n).{1,}\.).*"; //also picks up the "remainder unchanged" in AMDs
$amendmentTimePattern = "(\d{6}\s)(?:\w{3}\n)";
$fxHeaderPattern = ".{6}\s\w{4}\s\d{6}\n(.+\s){1,}";

$fxSectionPattern = "(.+\.)\n(TODAY|TONIGHT)\.\.(.+\n?){1,}\n"; //WORK IN PROGRESS

$endOfAmend = "REMAINDER UNCHANGED.

END
$$$$^^";

$ch = curl_init();

if ($bulletin == "focn45") {
	//FO45 is stored as text, so no need to adjust things
	$fxURL = "https://weather.noaa.gov/pub/data/raw/fo/focn45.cwwg..txt";
	curl_setopt($ch, CURLOPT_URL, $fxURL);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);
	
	//wrap the text in pre tags and trim whitespace
	$response = "<pre>" . trim($response) . "</pre>";

} else {
	$fxURL = "https://weather.gc.ca/forecast/public_bulletins_e.html?Bulletin=" . $bulletin . "." . $office;
	curl_setopt($ch, CURLOPT_URL, $fxURL);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);

	//do string stuff to $response

	$endOfFx = strpos($response, "</pre>");
	$startOfFx = strpos($response, "<pre>") + 5;
	$fxLength = $endOfFx - $startOfFx;
	$fxContent = substr($response, $startOfFx, $fxLength);
	$response = $fxContent;

	//wrap the <pre> tags and trim the whitespace
	$fxContent = "<pre>" . strtoupper(trim($fxContent)) . "</pre>";
	$fxContent = preg_replace($referencePattern, "", $fxContent);
	$fxContent = preg_replace("/\n{4}/", "REPLACED", $fxContent);
	$response = $fxContent;

}

echo $response;

?>
