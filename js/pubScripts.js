var currOffice = "weg";
var officeDetails;

function togglePubOffice() {
  if (currOffice == "weg") {
    currOffice = "wwg";
  } else {
    currOffice = "weg";
  }

  toggleBurgerMenu();
  loadPubInfo();

}

function loadPubInfo() {
  var timeStamp = (new Date()).getTime();
  var jsonFileName = "pubRegions.json?" + timeStamp;
  console.log("Loading", jsonFileName, "...");
  jsonData = $.get(jsonFileName)
    .done(function(jsonData){

      $("#battleboard").empty();
      $("#pub-fx-list").empty();

      officeDetails = jsonData;

      // loop through the offices and set their details to what we want to deal with
      for (i=0; i<officeDetails.length; i++) {
        if (officeDetails[i].office == currOffice) {
          officeDetails = officeDetails[i];

          // we have found our requested office, now we fill out the buttons to choose from

          for (i=0; i<officeDetails.warnings.length; i++) {
            var linkURL = "https://weather.gc.ca/warnings/index_e.html?prov=" + officeDetails.warnings[i];
            var imgURL = "https://weather.gc.ca/data/warningmap/" + officeDetails.warnings[i] +"_e.png?" + timeStamp;
            $("#battleboard").append("<a href='" + linkURL + "'><img class='warn-map' src='" + imgURL + "'></a>");
          }

          for (i=0; i<officeDetails.products.length; i++) {
            var header = officeDetails.products[i].header;
            var issuer = officeDetails.products[i].issuer;
            var label = officeDetails.products[i].label;
            var id = header + "-" + issuer;
            $("#pub-fx-list").append("<li id='" + id + "' class='public-fx option-unselected show-pointer' onclick='getFx(\"" + header + "\", \"" + issuer + "\")'>" + label + "</li>");
          }

        }
      }

      getFx("FOCN45", "CWWG");

      return;

    })
    .fail(function(){
      console.log("Unable to open pubRegions.json");
    });
}

function getFx(bulletin, office) {

  // build the id string for the jQuery search below
  var selectedForecast = "#" + bulletin + "-" + office;

  // update the colouring of the selected forecast
  // first we clear the selected colours and re-add the deselected colours
  $("li.public-fx").removeClass("option-selected");
  $("li.public-fx").addClass("option-unselected");

  // now update the 'selected' state of the item that we clicked on
  $(selectedForecast).removeClass("option-unselected");
  $(selectedForecast).addClass("option-selected");

  // write out the 'working message'
  $("#public-fx-output").html("Loading " + bulletin + " " + office + "...");

  var url = "getFX.php?bulletin=" + bulletin + "&office=" + office;

	var htmlStream = $.get (url)
			.done (function(htmlStream) {
				$("#public-fx-output").html(htmlStream);
			})
			.fail (function() {
				$("#public-fx-output").html("<strong>Forecast not available. Check back again soon.</strong>")
			})
}

function updateStormData(dataType, baseURL, satChannel) {
  var url = "siteModules.php?request=" + dataType;
  if (satChannel != null) {
    url += "&channel=" + satChannel;
  }
  var elementId = "#" + dataType + "-image";

  var htmlStream = $.get (url)
      .done (function(htmlStream) {
        //update the source of the element
        baseURL += htmlStream;
        $(elementId).attr("src",baseURL);
      })
      .fail (function() {
        // do nothing
      })
}

function updateWarnings() {

	var randNum = parseInt(Math.random() * 100000000000000000);
	var warningImgs = document.getElementsByClassName("warn-map");
	var prov = ["ab","sk","nt","nu"];
	var warnURL = "https://weather.gc.ca/data/warningmap/";

	for (i = 0; i <=3; i ++) {
		warningImgs[i].src = warnURL + prov[i] + "_e.png?" + randNum;
	}

}

function refreshAllPublicData() {
	updateWarnings();
}
