<?php

$office = strtolower($_GET["office"]);
$bulletin = strtolower($_GET["bulletin"]);

$referencePattern = "/(\n[-]{2,})\n?((.+)\n){1,}([-]{2,})/";
$regionNamesPattern = "((.+\.)\n)(?:((TODAY|TONIGHT)\.\.(.+\n?){1,}\n))"; //also picks up the "remainder unchanged" in AMDs
$amendmentTimePattern = "(\d{6}\s)(?:\w{3}\n)";
$fxHeaderPattern = ".{6}\s\w{4}\s\d{6}\n(.+\s){1,}";

$fxSectionPattern = "(.+\.)\n(TODAY|TONIGHT)\.\.(.+\n?){1,}\n"; //WORK IN PROGRESS

$endOfAmend = "REMAINDER UNCHANGED.

END
$$$$^^";

$ch = curl_init();

if ($bulletin == "focn45") {

	//FO45 is stored as text, so no need to adjust things
	$fxURL = "https://tgftp.nws.noaa.gov/data/raw/fo/focn45.cwwg..txt";

	curl_setopt($ch, CURLOPT_URL, $fxURL);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	$response = curl_exec($ch);

	if (strlen($response) == 0) {
		echo "There was an error retrieving the FOCN45 - you can try visiting <a style=\"color: blue;\" target=\"_blank\" href=\"{$fxURL}\">this link</a> to view it.";
		return;
	}

	//trim whitespace
	$response = trim($response);




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

	//trim the whitespace
	$fxContent = strtoupper(trim($fxContent));
	$fxContent = preg_replace($referencePattern, "", $fxContent);
	$response = $fxContent;

}

echo $response;

?>
