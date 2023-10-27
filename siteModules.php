<?php

$request    = isset($_GET["request"])    ? $_GET["request"]    : "";
$gfaRgn     = isset($_GET["gfaRgn"])     ? $_GET["gfaRgn"]     : "";
$channel    = isset($_GET["channel"])    ? $_GET["channel"]    : "";

if ($request != null) {
  getExternalImagery($request, $channel);
}

if ($gfaRgn != null) {
  getSIGMET($gfaRgn);
}

function svgIcon($iconSelected, $validTime) {
  if ($iconSelected == "cldwx") {
    $output = "
		<svg class='svg-icon' viewBox='0 0 800 310'>
			<path class='line-symbol' d='M 30 65 V 265 M 10 65 H 170 L 80 185 L 170 260'/>
			<path class='line-symbol' d='M 150 260 H 170 V 235 Z'/>
      <text class='panel-time' x='250' y='240'>{$validTime}</text>
		</svg>
    ";
  } else if ($iconSelected == "turbc") {
    $output = "
    <svg class='svg-icon' viewBox='0 0 800 310'>
      <path class='line-symbol' d='M 10 95 H 60 L 100 45 L 140 95 H 190'/>
      <path class='line-symbol' d='M 20 160 C 40 270, 150 270, 180 160'/>
      <path class='line-symbol' d='M 80 180 V 290'/>
      <path class='line-symbol' d='M 120 180 V 290'/>
      <text class='panel-time' x='250' y='240'>{$validTime}</text>
    </svg>
    ";
  }

  echo $output;

}

function getExternalImagery($request, $channel) {

  // check for the type of imagery we are wanting
  // set the url and regex pattern based on that selection
  if ($request == "radar") {
    $url = "https://weather.gc.ca/radar/index_e.html?id=WRN";
    $pattern = "/(?:\/.+\/)(.+\.GIF)/";
    $useCURL = TRUE;
  } else if ($request == "lightning") {
    $url = "https://weather.gc.ca/lightning/index_e.html?id=WRN";
    $pattern = "/(?:src.+)(WRN_\d{12}\.png)/";
    $useCURL = TRUE;
  } else if ($request == "satellite") {
    if ($channel == "prairie-snow") {
      $url = "prairies_vis_nightmp_048.jpeg";
    }
    $useCURL = FALSE;
  }

  if ($useCURL) {
    // perform the cURL operation
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $htmlString = curl_exec($ch);

    // grab the source based on the selected RegEx pattern
    preg_match_all($pattern, $htmlString, $source);

    // echo the result
    echo $source[1][0];
  } else if (!$useCURL) {
    echo $url;
  }

}

function getChartURL($index) {
  $urlArray = array(
    "https://flightplanning.navcanada.ca/Latest/anglais/produits/uprair/sigwx/FL100-FL240/Latest-sigwx-fl100-fl240.png",
    "https://flightplanning.navcanada.ca/Latest/anglais/produits/uprair/turb-haut-niv/Latest-hltcan.png",
    "https://flightplanning.navcanada.ca/Latest/anglais/produits/uprair/sigwx/atlantic/Latest-sigwx-atlantic.png",
    "https://flightplanning.navcanada.ca/Latest/anglais/produits/uprair/turb-haut-niv/Latest11-ouest.png",
    "https://flightplanning.navcanada.ca/Latest/anglais/produits/uprair/turb-haut-niv/Latest00-est.png"
  );

  echo $urlArray[$index];

}

function getSIGMET($gfaRgn) {

  $gfaRgn = $gfaRgn - 10;

  $sigmetURL = "https://dd.weather.gc.ca/cgi-bin/bulletin_search.pl?product=ws,wc,wv&header={$gfaRgn}&location=cn";
  $airmetURL = "https://dd.weather.gc.ca/cgi-bin/bulletin_search.pl?product=wa&header={$gfaRgn}&location=cn";

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $sigmetURL);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  $sigmets = curl_exec($ch);

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $airmetURL);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
  $airmets = curl_exec($ch);

  // break up the bulletins by the trailing '=' sign
  // this will also clean up the whitespace caused by the explode command
  $sigmets = array_filter(array_map('trim',(explode("=", $sigmets))));
  $airmets = array_filter(array_map('trim',(explode("=", $airmets))));

  if (count($sigmets) > 0) {
    for ($i = 0; $i < count($sigmets); $i++) {
      // check if we actually found a SIGMET or if it's just a false alarm
      if (strpos($sigmets[$i], "No bulletins found.") === FALSE) {
        // we have a SIGMET, now we check if it's valid
        if (strpos($sigmets[$i], "CNCL SIGMET") === FALSE ) {
          echo "<p class=\"sigmet-airmet-content\">" . $sigmets[$i] . "=</p>";
        } else {
          // we have an old SIGMET, so we skip ahead
          $i++;
        }
      } else {
        echo "<p class=\"sigmet-airmet-content\">No SIGMETs in effect.</p>";
      }
    }
  } else {
    echo "<p class=\"sigmet-airmet-content\">Error: Could not retrieve SIGMETs.</p>";
  }

  if (count($airmets) > 0) {
    for ($i = 0; $i < count($airmets); $i++) {
      // check if we actually found a SIGMET or if it's just a false alarm
      if (strpos($airmets[$i], "No bulletins found.") === FALSE) {
        // we have a SIGMET, now we check if it's valid
        if (strpos($airmets[$i], "CNCL AIRMET") === FALSE ) {
          echo "<p class=\"sigmet-airmet-content\">" . $airmets[$i] . "=</p>";
        } else {
          // we have an old SIGMET, so we skip ahead
          $i++;
        }
      } else {
        echo "<p class=\"sigmet-airmet-content\">No AIRMETs in effect.</p>";
      }
    }
  } else {
    echo "<p class=\"sigmet-airmet-content\">Error: Could not retrieve AIRMETs</p>";
  }

}

?>
