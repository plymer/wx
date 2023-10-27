function getObs() {
	var siteID = $("#siteID").val();
	var obHrs = $("#hrs").val();

	var url = "getObs.php?siteID=" + siteID + "&hrs=" + obHrs;

	//"working" message for DIV
	$("#metar-taf-output").html("<p>Loading METARs/TAFs...</p>");

	var htmlStream = $.get (url)
		.done (function(htmlStream) {
			//since the PHP does the formatting, dump the output into the div
			$("#metar-taf-output").html(htmlStream);
	 		//auto-scroll the view to the bottom to view the TAF and the most-recent obs
			$("#metar-taf-output").scrollTop($("#metar-taf-output").height());
			return;
		})
		.fail (function() {
			$("#metar-taf-output").html("<p>Error. Check your internet connection.</p>");
		})
}

function clearID() {
	var siteID = $("#siteID");
	siteID.val("");
}
