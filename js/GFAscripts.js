var gfaSelected = "32";
var panSelected = "cldwx";
var timeSelected = "000";
var showPIREPs = 0;

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

	// method of saving GFAs to a local directory isn't currently working (2016.01.31) so using hotlinking method
	// $("#gfaImage").attr("src", "images/gfa/" + gfaRgn + "_" + panType + "_" + panTime + ".png?" + randNum);
	$("#gfa-image").attr("src", urlBase + "gfacn" + gfaRgn + "/Latest-gfacn" + gfaRgn + "_" + panType + "_" + panTime + ".png?" + randNum);

	// update the colouring of the selected panels
	// first we clear the selected colours and re-add the deselected colours
	$(".gfa-regions button, .gfa-panels button").removeClass("option-selected");

	// next we grab the two buttons that are the valid combination (region + time&type)
	// and add the 'selected' classes to them
	$(selectedRegion).addClass("option-selected");
	$(selectedPanel).addClass("option-selected");

	// lastly, let's display the SIGMETs/AIRMETs/PIREPs valid for the GFA region selected
	// for now, PIREPs will default to always-shown
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