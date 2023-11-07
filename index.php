<?php include "siteModules.php"; ?>

<!DOCTYPE html>

<html lang="en-CA">

<head>
  <title>PubAvnWx</title>
  <meta charset="UTF-8">
  <meta http-equiv="cache-control" content="max-age=0">
  <meta http-equiv="cache-control" content="no-cache">
  <meta http-equiv="expires" content="0">
  <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT">
  <meta http-equiv="pragma" content="no-cache">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black">
  <link rel="apple-touch-icon" href="images/pubavnwx.png">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="css/style-new.css">

  <script src="js/jquery-3.3.1.min.js"></script>
  <script src="js/GFAscripts.js"></script>
  <script src="js/public-scripts.js"></script>
  <script src="js/metars.js"></script>
  <script src="js/player.js"></script>
  <script src="js/siteFunctions.js"></script>

  <script>
    //window.applicationCache.addEventListener('updateready', updateCache, false);

    // load the T+0 GFA 32 Clouds & Weather as default
    $(document).ready(function(){
      productType = "sat";
      container = $("#satellite-image");
      getJSONData();
      playButtonVal = $("#play").attr("value");
    });
  </script>

</head>

<body>

<header class="align-center">
  <ul class="flex-around">
    <li             class="hide-for-portrait"                                            ><img class="grey-inverted" src="images/pubavnwx-icon.png"></li>
    <li id="public" class="show-pointer tab-button"             onclick="changeDisplay('public')">PUB<span class="hide-for-portrait">LIC<br>PRODUCTS</span></li>
    <li id="cmac"   class="show-pointer tab-button" onclick="changeDisplay('cmac')"  ><span class="hide-for-portrait">CMAC<br>PRODUCTS</span><span class="hide-for-landscape">AVN</span></li>
    <li id="obs"    class="show-pointer tab-button obs-colour"             onclick="changeDisplay('obs')"   ><span class="hide-for-portrait">METAR/<br>TAF</span><span class="hide-for-landscape">OBS</span></li>
    <li id="data"   class="show-pointer tab-button "             onclick="changeDisplay('data')"   ><span class="hide-for-portrait">WEATHER<br></span>DATA</li>
    <li             class="show-pointer" onclick="toggleBurgerMenu()">
      <img id="burger-icon" class="grey-inverted" src="images/burger-icon.png"> <!-- maybe convert this to SVG? rounded end-caps? -->
    </li>
  </ul>
</header>

<div id="burger-menu-container" class="hidden">
  <ul>
    <li class="show-pointer" onclick="togglePubOffice()">&#187; Switch Public Office</li>
    <li class="show-pointer" onclick="toggleOverlay('<?php getChartURL(0); ?>')">&#187; CanSigWx</li>
    <li class="show-pointer" onclick="toggleOverlay('<?php getChartURL(1); ?>')">&#187; Canadian HLT</li>
    <li class="show-pointer" onclick="toggleOverlay('<?php getChartURL(2); ?>')">&#187; N. Atl SigWx</li>
    <li class="show-pointer" onclick="toggleOverlay('<?php getChartURL(3); ?>')">&#187; 11Z N. Atl HLT</li>
    <li class="show-pointer" onclick="toggleOverlay('<?php getChartURL(4); ?>')">&#187; 00Z N. Atl HLT</li>
    <li>&#187; Options</li>
  </ul>
</div>

<div id="cmac-section" class="content-section cmac-colour bg-pattern flex-around hidden">
  <div class="gfa-regions flex-between">
    <button id="31" onclick="gfaSelection('31','noChange','noChange')"><span class="hide-for-portrait">GFA </span>31</button>
    <button id="32" onclick="gfaSelection('32','noChange','noChange')"><span class="hide-for-portrait">GFA </span>32</button>
    <button id="33" onclick="gfaSelection('33','noChange','noChange')"><span class="hide-for-portrait">GFA </span>33</button>
    <button id="34" onclick="gfaSelection('34','noChange','noChange')"><span class="hide-for-portrait">GFA </span>34</button>
    <button id="35" onclick="gfaSelection('35','noChange','noChange')"><span class="hide-for-portrait">GFA </span>35</button>
    <button id="36" onclick="gfaSelection('36','noChange','noChange')"><span class="hide-for-portrait">GFA </span>36</button>
    <button id="37" onclick="gfaSelection('37','noChange','noChange')"><span class="hide-for-portrait">GFA </span>37</button>
  </div>
  <div class="gfa-panels flex-between">
    <button id="cldwx000" onclick="gfaSelection('noChange','cldwx','000')"><?php svgIcon("cldwx","T+00"); ?></button>
    <button id="cldwx006" onclick="gfaSelection('noChange','cldwx','006')"><?php svgIcon("cldwx","T+06"); ?></button>
    <button id="cldwx012" onclick="gfaSelection('noChange','cldwx','012')"><?php svgIcon("cldwx","T+12"); ?></button>
    <button id="turbc000" onclick="gfaSelection('noChange','turbc','000')"><?php svgIcon("turbc","T+00"); ?></button>
    <button id="turbc006" onclick="gfaSelection('noChange','turbc','006')"><?php svgIcon("turbc","T+06"); ?></button>
    <button id="turbc012" onclick="gfaSelection('noChange','turbc','012')"><?php svgIcon("turbc","T+12"); ?></button>
  </div>

	<img id="gfa-image" src="">

  <section class="taf-plus-container full-width flex-around">
    <h2>SIGMETs/AIRMETs</h2>
    <div id="sigmet-airmet-output" class="full-width align-left text-product-container"></div>
  </section>

</div>

<div id="obs-section" class="content-section obs-colour bg-pattern">
		<form autocomplete="off" action="javascript:getObs()">
			<ul class="flex-around">
				<li>
					<label for="siteID" class="hide-for-portrait">Site ID: </label>
					<input type="text" name="siteID" autofocus maxlength="4" id="siteID" onfocus="clearID()">
				</li>
				<li>
					<input type="submit" name="submit" value="Load" class="show-pointer">
				</li>
				<li>
					<select id="hrs">
						<option value="6">6 hrs</option>
						<option value="12">12 hrs</option>
						<option value="18">18 hrs</option>
						<option value="25" selected>24 hrs</option>
            <option value="36">36 hrs</option>
            <option value="48">48 hrs</option>
            <option value="96">96 hrs</option>
					</select>
				</li>
			</ul>
		</form>

	<div id="metar-taf-output" class="text-product-container vertical-scroll"></div>
</div>

<div id="public-section" class="content-section public-colour bg-pattern hidden">
<!--  <div id="battleboard" class="flex-around warnings-list">

  </div> -->
  <ul id="pub-fx-list" class="public-fx-selections flex-around align-center">

  </ul>

	<div id="public-fx-output" class="text-product-container wrap-whitespace vertical-scroll"></div>

</div>

<div id="data-section" class="content-section data-colour bg-pattern hidden">
	<!-- include satellite, radar from wunderground, and nwp links -->
	<!-- satellite/lightning source: http://www.atmos.washington.edu/images/ltng_common_full/YYYYMMDDhhmm_ir_ltng.gif -->
	<!-- satellite source: http://www.ssec.wisc.edu/data/geo/west/latest_west_vis_nh.gif (ir4 - 10.8nm/ir2 - 3.7nm)-->
  <!-- http://cirrus.unbc.ca/wxv/wxv_index.html -->
	<!-- wunderground radar: http://radblast.wunderground.com/cgi-bin/radar/WUNIDS_map?station=WKR&type=C0R&frame=40&scale=1 -->
	<!-- nwp viewer might be something to do, using vizaweb imagery (hot-link to it) -->
		<!-- <div class="imageContainer">
			<img id="nwp-image" src="http://weather.gc.ca/data/prog/regional/2015092900/2015092900_054_R1_canadian@arctic@west_I_QPFTYPES_t6_006.png">
		</div> -->

    <!-- begin the satellite player -->
    <div class="satellite-wrapper align-center">
      <h2>Satellite Viewer</h2>
      <img id="satellite-image" src="">
      <div class="progress-container">
        <div id="progress-content"></div>
      </div>
      <form>
        <ul class="flex-center player-controller">
          <li><input type="button" id="first" value="|<" class="player-control show-pointer" onclick="playerControl('sat','first')"></li>
          <li><input type="button" id="prev" value="<" class="player-control show-pointer" onclick="playerControl('sat','prev')"></li>
          <li><input type="button" id="play" value="&#9654;&#65038;" class="player-control show-pointer" onclick="playerControl('sat','play')"></li>
          <li><input type="button" id="next" value=">" class="player-control show-pointer" onclick="playerControl('sat','next')"></li>
          <li><input type="button" id="last" value=">|" class="player-control show-pointer" onclick="playerControl('sat','last')"></li>
        </ul>
        <ul class="flex-around player-controller">
          <li>
            <label for="channel-select">Channel</label>
            <select id="channel-select" class="show-pointer" onchange="playerControl('sat','load')"></select>
          </li>
        </ul>
      </form>
    </div>
    <!-- end the satellite player -->

    <div class="lightning-radar-wrapper align-center">
      <h2>Prairies Composite Radar</h2>
  		<div class="external-image-wrapper"><a href="https://weather.gc.ca/radar/index_e.html?id=WRN"><img id="radar-image" src=""></a></div>
      <h2>Prairies CLDN Strokes</h2>
  		<div class="external-image-wrapper"><a href="https://weather.gc.ca/lightning/index_e.html?id=WRN"><img id="lightning-image" src=""></a></div>
  	</div>



	</div>

	<div class="image-overlay-viewer-container align-center show-pointer hidden" onclick="toggleOverlay()">
			<div class="extra-chart-container">
        <div id="extra-chart" class="show-pointer">
		      <svg viewBox="0 0 20 20" class="svg-icon">
            <path d="M 0 0 L 20 20 M 0 20 L 20 0" class="svg-icon-stroke"/>
          </svg>
        </div>
			</div>
	</div>
</div>

</body>

</html>
