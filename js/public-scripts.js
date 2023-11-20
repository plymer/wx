var currOffice = "weg";
var officeDetails;
var currentAlerts;
var filteredAlerts;

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
  var jsonFileName = "public-config.json?" + timeStamp;
  console.log("Loading", jsonFileName, "...");

  var xhttp = new XMLHttpRequest;

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {

      var fxList = document.getElementById("pub-fx-list");
      
      // clear out the fxList element and remove all existing buttons
      while (fxList.firstChild) {
        fxList.removeChild(fxList.firstChild);
      }      

      jsonData = JSON.parse(this.responseText);
      officeDetails = jsonData[currOffice];     

      // fill out the buttons to choose which forecast products are available

      for (i=0; i<officeDetails.products.length; i++) {

        var fxItem = document.createElement("li");
        fxItem.setAttribute("id", officeDetails.products[i].header + "-" + officeDetails.products[i].issuer);
        fxItem.setAttribute("class", "public-fx option-unselected show-pointer");
        fxItem.addEventListener("click", getFx(officeDetails.products[i].header, officeDetails.products[i].issuer));
        console.log("listener added");
        fxItem.innerHTML = officeDetails.products[i].label;

        fxList.appendChild(fxItem);
        
      }

      getFx("FOCN45", "CWWG");
      return;
    }
  }

  xhttp.open("GET", jsonFileName, true);
  xhttp.send();
}

function getFx(bulletin, office) {

  console.log("calling", bulletin, office);

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

function getAlerts(p) {

  // first empty the array holding the filtered results
  filteredAlerts = [];
  
  // now start pulling the latest results from the alert list
  var xhttp = new XMLHttpRequest();

  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      console.log("Getting alerts for", p);
      currentAlerts = JSON.parse(this.responseText);
      
      for (var id in currentAlerts) {
        if (currentAlerts.hasOwnProperty(id)) {
          if (currentAlerts[id]["prov"] == p) {

            console.log(currentAlerts[id]["issueTime"], currentAlerts[id]["alertType"], currentAlerts[id]["parentName"]);
            console.log(currentAlerts[id]["text"]);

          }
        }
      }

    }
  };

  xhttp.open("GET", "current-alerts.json");
  xhttp.send();

}
