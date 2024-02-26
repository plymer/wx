var gfaSelected = "GFACN32";
var panSelected = "CLDWX";
var timeSelected = 0;
var showPIREPs = 0;
var GFAList;

function initializeGFAs() {
	// this will load the json file "current-gfas.json" in order to know where to retrieve the GFA images from
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
	  if (this.readyState == 4 && this.status == 200) {
		console.log("loading GFA data");
		GFAs = JSON.parse(this.responseText);

		GFAList = GFAs;
  
	  }
	};
  
	xhttp.open("GET", "current-gfas.json");
	xhttp.send();
}

function changeGFA (gfaRgn, panType, panTime) {
	var randNum = parseInt(Math.random() * 10000000000000);
	var urlBase = "https://flightplanning.navcanada.ca/Latest/gfa/anglais/produits/uprair/gfa/";

	// push selected GFA panel to global variables
	gfaSelected = gfaRgn;
	panSelected = panType;
	timeSelected = panTime;

	// build the id string for the jQuery search below
	var selectedPanel = "#" + panType + panTime;
	var selectedRegion = "#" + gfaRgn;

	// update the source of the GFA image and check for new images	
	$("#gfa-image").attr("src", GFAList[gfaSelected][panSelected][timeSelected]);

	// update the colouring of the selected panels
	// first we clear the selected colours and re-add the deselected colours
	$(".gfa-regions button, .gfa-panels button").removeClass("option-selected");

	// next we grab the two buttons that are the valid combination (region + time&type)
	// and add the 'selected' classes to them
	$(selectedRegion).addClass("option-selected");
	$(selectedPanel).addClass("option-selected");

	// lastly, let's display the SIGMETs/AIRMETs/PIREPs valid for the GFA region selected
	getSIGMET(gfaRgn, showPIREPs);

}

function gfaSelection(gfa,type,time){
	//update the global variables before drawing the new GFA
	//check for "empty" variables first to maintain consistency
	if (gfa  != "noChange") {gfaSelected = gfa;}
	if (type != "noChange") {panSelected = type;}
	if (time != "noChange") {timeSelected = time;}

	//grab the new GFA and draw it
	changeGFA(gfaSelected,panSelected,timeSelected);
}

function getSIGMET(gfaRgn) {
  var url = "siteModules.php?gfaRgn=" + gfaRgn;
  var outputElementId = "#sigmet-airmet-output";

  var htmlStream = $.get (url)
      .done (function(htmlStream) {
        //ouput the content to the container
        $(outputElementId).html(htmlStream);
      })
      .fail (function() {
        $(outputElementId).html("SIGMETs/AIRMETs unavailable at this time");
      })
}
