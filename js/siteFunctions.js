var menuOpen = 0;
var overlayOpen = 0;
var oldSelection = "obs"; // this is the defauly tab that is open on pageload

function updateCache(event) {
	console.log("Cache has changed, updating the cache.");
  window.applicationCache.swapCache();
}

function changeDisplay (button) {

	// generate the class & id variables based on our old and current selection
	var oldColourClass = oldSelection + "-colour";
	var colourClass = button + "-colour";
	var selectedTab = "#" + button;
	var selectedSection = "#" + button + "-section";

	// set the old selection to the current selection for the next time we click on a tab
	oldSelection = button;

	// we want to make all of the buttons have a see-through background
	// we also want to toggle the visibility of all of the sections

	$(".tab-button").removeClass(oldColourClass);
	$(".tab-button").addClass("no-colour");
	$(selectedTab).removeClass("no-colour");
	$(selectedTab).addClass(colourClass);

	// do the same for the section visibility
	// this is easier since we're only using a
	// 'hidden' class to change the display
	// from block to none and vice-versa
	$(".content-section").addClass("hidden");
	$(selectedSection).removeClass("hidden");

	switch (selectedSection) {
		case "#public-section":
			loadPubInfo();
			// getFx("FOCN45", "CWWG");
			// refreshAllPublicData();
			break;
		case "#data-section":
			var randNum = parseInt(Math.random() * 10000000000000);
			document.getElementById("radar-image").setAttribute("src", "https://www.ryanpimiskern.com/wx/images/latest.gif?" + randNum)
			updateStormData("lightning", "https://weather.gc.ca/data/lightning_images/");
			break;
		case "#cmac-section":
			changeGFA("GFACN32","CLDWX",0);
			break;
	}
}

function toggleBurgerMenu() {

	var burgerMenu = $("#burger-menu-container");
	var menuIcon = $("#burger-icon");

	if (menuOpen == 0) {
		burgerMenu.removeClass("hidden");
		menuIcon.addClass("rotated");
		menuOpen = 1;
	} else if (menuOpen == 1) {
		burgerMenu.addClass("hidden");
		menuIcon.removeClass("rotated");
		menuOpen = 0;
	}

}

function toggleOverlay(chartURL) {
	var overlayViewer = $(".image-overlay-viewer-container");
	var chart = $("#extra-chart");

	if (overlayOpen == 0) {
		overlayViewer.removeClass("hidden");
		chart.attr("style", "background-image: url('" + chartURL + "');");
		overlayOpen = 1;
	} else if (overlayOpen == 1) {
		overlayViewer.addClass("hidden");
		overlayOpen = 0;
	}

}
