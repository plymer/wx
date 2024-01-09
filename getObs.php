<?php
// input variables passed through the URL request from getObs function
$ident = strtoupper($_GET['siteID']);
$numHrs = $_GET['hrs'];
$tafWrapPattern = "/(TEMPO|PROB30|PROB40|BECMG)/";

if ($ident === "ILY") {
	$randNum = rand(0,6);
	if ($randNum == 0) {
		echo "<h2>I love you too, Heather Lynn &lt;3</h2>";
		return;
	} else if ($randNum == 1) {
		echo "<h2>You are my sunshine - I love you!</h2>";
		return;
	}	else if ($randNum == 2) {
		echo "<h2>Je t'aime, ma belle &lt;3</h2>";
		return;
	} else if ($randNum == 3) {
		echo "<h2>IFLYRB!</h2>";
		return;
	} else if ($randNum == 4) {
		echo "<h2>You are my wife, my best friend, my partner in crime, and the absolute love of my life &lt;3</h2>";
		return;
	} else if ($randNum == 5) {
		echo "<h2>I love you right back... have an amazing day babu &lt;3</h2>";
		return;
	} else if ($randNum == 6) {
		echo "<h2>Babu, you are the freaking best &lt;3 I'll love you until the end of time!</h2>";
		return;
	}


}

if (strlen($ident) == 3) {
	// guesses that you're looking for a Canadian site
	$ident = "C" . $ident;
} else if ((strlen($ident) < 3) || (strlen($ident) > 4)) {
	// need a 3- or 4-character Ident
	echo "Unable to retrieve data. Please enter a valid 3- or 4-character Identifier.";
	return;
}

// build the URL
// avwx.gov updated on 2023-10-16 to a new retrieval method
$metarURL = "https://aviationweather.gov/cgi-bin/data/metar.php?ids={$ident}&hours={$numHrs}";
$tafURL = "https://aviationweather.gov/cgi-bin/data/taf.php?ids={$ident}";

if (file_get_contents($metarURL) == false) {
	// we probably don't have a good internet connection, or something got borked along the way
	// get out now, while we still can
	echo "<strong>Something went wrong - we can't contact the ADDS.</strong>";
	return;
}

// if we've made it this far, everything is working as intended

// grab the json file for the station list and nab the metadata for the site
$metaJSON = file_get_contents("https://aviationweather.gov/cgi-bin/data/location.php?id={$ident}");
$metaJSON = json_decode($metaJSON, true);

$siteName = $metaJSON["site"];
$siteLat = round($metaJSON["lat"], 1);
$siteLon = round($metaJSON["lon"], 1);
$siteElevF = round($metaJSON["elev"] * 3.281);
$siteElevM = $metaJSON["elev"];

//TODO: this is not working on the AWS EC2 instance -- need to investigate permissions or something has changed in php8 for passthru

ob_start();
$command = "/bin/python3 www/wx/sun-calc.py " . $siteLat . " " . $siteLon;
passthru($command);
$sunTimes = ob_get_contents();
ob_end_clean();

$siteLat = ($siteLat > 0) ? $siteLat . "&#176;N" : ($siteLat * -1) . "&#176;S";
$siteLon = ($siteLon > 0) ? $siteLon . "&#176;E" : ($siteLon * -1) . "&#176;W";

// grab the TAF (if it exists)
$taf = file_get_contents($tafURL);
$tafString = "";
$delta = 0;

if ($taf) {
	$taf = strip_tags($taf);
	$tafString =  "<div class=\"taf-content\"><span class=\"taf-main\">";
	$taf = preg_replace($tafWrapPattern, "</span><span class=\"taf-part-period\">$0", $taf);
	$taf = preg_replace("/FM\d{6}/", "</span><span class=\"taf-fm-group\">$0", $taf);
	$taf = preg_replace("/RMK/", "</span><span class=\"taf-rmk\">$0", $taf);
	$taf = preg_replace("/ TAF/", "", $taf);
	$tafString = $tafString . trim($taf) . "</span></div>";
	$delta = 1;
} else {
	$taf = "No TAF found for {$ident}.";
	$delta = 0;
}

// grab the METARs
$metars = file_get_contents($metarURL);
$metars = explode($ident, $metars);
$numOfMETARS = count($metars);

echo "<div class=\"metar-list\">";  // start the METAR list
for ($i = $numOfMETARS; $i > $delta; $i--) {
	$metars[$i-$delta] = preg_replace("/ TAF/", "", $metars[$i-$delta]);
	echo "  <span class=\"metar-string\">" . $ident . " " . trim($metars[$i-$delta]) . "</span>";
}
echo "</div>";                      // close the METAR list

// output the metadata
echo "<div class=\"site-meta\"><span id=\"site-name\">{$siteName}</span><span id=\"lat-lon\">{$siteLat} {$siteLon}</span><span 
id=\"elevation\">{$siteElevF}ft / {$siteElevM}m</span><span id=\"sun-times\">{$sunTimes}</span></div>";

// print the TAF (if necessary)
echo $tafString;



?>
