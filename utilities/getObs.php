<?php

$metarOutput;
$tafOutput;
$siteMetaOutput;
$jsonOutput = array();

// allows the script to be run via CLI or invoked via URL

if (@$argc == 3) {
    $ident = strtoupper($argv[1]);
    $numHrs = $argv[2];
} elseif (@$argc != 0) {
    echo "error: invalid arguments. this function requires two arguments - IDENT and NUMHRS";
    return;
} else {
    // input variables passed through the URL request from getObs function
    $ident = strtoupper($_GET['siteID']);
    $numHrs = $_GET['hrs'];
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

// we tweak the ident here for Eureka, NU since the ob is WEU and TAF is YEU
if ($ident == "CWEU") {
    $ident = "CYEU";
}

$tafURL = "https://aviationweather.gov/cgi-bin/data/taf.php?ids={$ident}";

if ($ident == "CYEU") {
    $ident = "CWEU";
}

$metarURL = "https://aviationweather.gov/cgi-bin/data/metar.php?ids={$ident}&hours={$numHrs}";

$metaURL = "https://aviationweather.gov/cgi-bin/data/location.php?id={$ident}";

// check if metars exist
if (file_get_contents($metarURL) == false) {
    $metarOutput[] = "No METARs available for {$ident}.";
} else {
    // grab the METARs
    $metars = file_get_contents($metarURL);
    $metars = explode($ident, $metars);
    $numOfMETARS = count($metars)-1;
    $temp = array();

    for ($i = $numOfMETARS; $i > 0; $i--) {
        $temp[] = $ident . " " . trim($metars[$i]) . "\n";
    }

    $metarOutput = $temp;
}

// have to do a slightly different check for validity for metadata
$metaJSON = file_get_contents($metaURL);
$metaJSON = json_decode($metaJSON, true);

if (!$metaJSON["site"]) {
    $metaOutput = array(
        "site-name" => "No metadata available for {$ident}.",
        "lat-lon" => "N/A",
        "elevation" => "N/A",
        "sun-times" => "N/A"        
    );
} else {
    // parse the json down the way we want it

    $siteName = $metaJSON["site"];
    $siteLat = round($metaJSON["lat"], 2);
    $siteLon = round($metaJSON["lon"], 2);
    $siteElevF = round($metaJSON["elev"] * 3.281);
    $siteElevM = $metaJSON["elev"];

    ob_start();
    $command = "/home/ryanpimi/virtual_env/bin/python3 /home/ryanpimi/public_html/wx/utilities/sun-calc.py " . $siteLat . " " . $siteLon;
    passthru($command);
    $sunTimes = ob_get_contents();
    ob_end_clean();

    $siteLat = ($siteLat > 0) ? $siteLat . "&#176;N" : ($siteLat * -1) . "&#176;S";
    $siteLon = ($siteLon > 0) ? $siteLon . "&#176;E" : ($siteLon * -1) . "&#176;W";

    // $metaOutput = array(
    //     "metadata" => array(
    //         "site-name" => $siteName,
    //         "lat-lon" => "{$siteLat} {$siteLon}",
    //         "elevation" => "{$siteElevF} ft  / {$siteElevM} m",
    //         "sun-times" => $sunTimes
    //     )
    // );

    $metaOutput = array(
        "site-name" => $siteName,
        "lat-lon" => "{$siteLat} {$siteLon}",
        "elevation" => "{$siteElevF} ft  / {$siteElevM} m",
        "sun-times" => $sunTimes        
    );
}

if (file_get_contents($tafURL) == false) {
    $tafOutput = array("meta" => "No TAF available for {$ident}.", "main" => "", "part-periods" => "", "rmk" => "");
} else {
// grab the TAF (if it exists)
    $taf = file_get_contents($tafURL);
    $tafString = "";

    $partPeriodPattern = "/(TEMPO.+|PROB30.+|PROB40.+|BECMG.+|FM\d{6}.+)/";
    $tafMetaPattern = "/((?:TAF\s)?(?:AMD\s)?(\w{4}\s\d{6}Z\s\d{4}\/\d{4}))/";
    $tafMainPattern = "/(((\d{5}|VRB\d{2})(G\d{2})?(KT.+)))/";
    $windDecode = "(((\d{3}|VRB)(\d{2})(G\d{2})?(KT)))";
    $visDecode = "((P?\d\s?\d?\/?\d?)(SM))";
    // we will deal with the cigs & cb decode later
    // $cigDecode = "((BKN|OVC|VV)([0]{2}\d))";
    // $cbCloudDecode = "(\w{2,3}\d{3}CB)";
    $fzPcpnDecode = "((-|\+|\s)(FZRA|PL|SNPL|FZRASN|FZDZ))";
    $tsDecode = "((-|\+)?(TSFZRAPL|TSFZRA|TSRAGR|TSRASN|TSRA|TSSN|TSGR|VCTS|TS))";

    $sigWxDecode = "/{$windDecode}{$visDecode}{$fzPcpnDecode}{$tsDecode}/";

    
    $taf = strip_tags($taf);

    // save and then strip the remark out first
    if(preg_match("/RMK.+/", $taf)) {
        preg_match("/RMK.+/", $taf, $matches);
        $rmk = $matches[0];
        $taf = preg_replace("/RMK.+/", "", $taf);
    } else {
        $rmk = null;
    }

    preg_match($tafMetaPattern, $taf, $matches);
    $tafMeta = trim($matches[2]);

    // match and decode the main condition
    preg_match($tafMainPattern, $taf, $matches);
    $tafMainRaw = trim($matches[2]);

    // echo $sigWxDecode;
    // preg_match_all($sigWxDecode, $tafMainRaw, $matches);
    // print_r($matches);

    
    
    $partPeriods = [];
    preg_match_all($partPeriodPattern, $taf, $matches);    

    for ($i = 0; $i < count($matches[0]); $i++) {
        
        preg_match("/(TEMPO|PROB30|PROB40|BECMG|FM)/", $matches[0][$i], $pp);

        $parperType = $pp[0];
        $parperText = trim($matches[0][$i]);

        $partPeriod = array("raw" => $parperText, "type" => $parperType);

        array_push($partPeriods, $partPeriod);
        
    }

    $tafOutput = array("meta" => $tafMeta, "main" => $tafMainRaw, "part-periods" => $partPeriods, "rmk" => $rmk);
}

// add all output into the output array
$jsonOutput["metars"] = $metarOutput;
$jsonOutput["metadata"] = $metaOutput;
$jsonOutput["taf"] = $tafOutput;

// encode the output as JSON
$jsonOutput = json_encode($jsonOutput, JSON_PRETTY_PRINT);

// output the resulting JSON string
echo $jsonOutput;

?>
