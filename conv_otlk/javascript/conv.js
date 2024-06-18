activeSector = 'prairies';
activePane = 'day_1';
activeText = 'focn';
activeOffice = 'paspc'
activeOrient = 'horizontal';
orientCheck = 0;
nav = 0;
graphic = 1;
img = 2;


function changeSector (sectorID) {
	var currSector = document.getElementsByClassName(activeSector);
	var newSector = document.getElementsByClassName(sectorID);
	currSector[nav].classList.remove('active');
	currSector[graphic].classList.add('hidden');
	newSector[nav].classList.add('active');
	newSector[graphic].classList.remove('hidden');

	activeSector = sectorID;
	activePane = 'day_1';

	changeOffice(sectorID);
	changePane(activePane);

/*
	if ((sectorID == 'prairies') || (sectorID == 'mk-mk')) {
		document.getElementById('orient').style.display = "block";
	} else {
		document.getElementById('orient').style.display = "none";
	}
*/
}


function changePane (paneTime) {
	var d = new Date();
	var t = d.getTime();
	var currSector = document.getElementsByClassName(activeSector);
	var currTime = document.getElementsByClassName('subnav');

	for (i = 0; i < currTime.length; i++) {
		if(currTime[i].classList.contains(paneTime)) {
			currTime[i].classList.add('active');
		} else {
			currTime[i].classList.remove('active');
		}
	}

	currSector[img].src = "images/today/" + activeOffice + "/" + activeSector + "-" + paneTime + ".png?" + t;
	activePane = paneTime;
	if ((activeSector == 'prairies') || (activeSector == 'mk-mk')) {
		changeText(activeText);
	}
}

function changeText(text) {
	var d = new Date();
	var t = d.getTime();
	var textAreas = document.getElementsByClassName("textnav");
	for (i = 0; i < textAreas.length; i++) {
		if(textAreas[i].classList.contains(text)) {
			textAreas[i].classList.add('active');
		} else {
			textAreas[i].classList.remove('active');
		}
	}

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			document.getElementById(activeSector + '_text').innerHTML =
			this.responseText;
		}
	};
    if (text == 'focn') {
        xhttp.open("GET", 'text/' + text + '.txt?' + t, true);
    } else {
        xhttp.open("GET", 'text/' + text + '_' + activePane + '.txt?' + t, true);
    }
	xhttp.send();

	activeText = text;
}

function changeOffice (sectorID) {
	var officeName = '';

	if ((sectorID == 'prairies') || (sectorID =='mk-mk')) {
		officeName = 'Storm Prediction Centres Edmonton and Winnipeg';
		activeOffice = 'paspc';
	} else if (sectorID == 'on') {
		officeName = 'Ontario Storm Prediction Centre';
		activeOffice = 'ospc';
	} else if (sectorID == 'bc-yt') {
		officeName = 'Storm Prediction Centre Vancouver';
		activeOffice = 'pspc';
	} else if (sectorID == 'qc') {
		officeName = 'Quebec Storm Prediction Centre';
		activeOffice = 'qspc';
	} else if (sectorID == 'atlantic') {
		officeName = 'Atlantic Storm Prediction Centre';
		activeOffice = 'aspc';
	}

	var offices = document.getElementsByClassName('office');
	for (i = 0; i < offices.length; i++) {
		offices[i].innerHTML = officeName;
	}
}

function modalDisplay(lang) {
	modals = document.getElementsByClassName("modal");
	for (i = 0; i < modals.length; i++) {
		modals[i].style.display = "none";
	}
	document.getElementById(lang).style.display = "block";
}

function modalClose() {
	modals = document.getElementsByClassName("modal");
	for (i = 0; i < modals.length; i++) {
		modals[i].style.display = "none";
	}
}

function changeOrient() {
	document.getElementById(activeOrient).style.display = "block";
	if (activeOrient == 'horizontal') {
		document.getElementsByClassName('flex-container')[0].style.flexDirection = "column";
		document.getElementsByClassName('flex-container')[1].style.flexDirection = "column";
		activeOrient = 'vertical';
	} else if (activeOrient == 'vertical') {
		document.getElementsByClassName('flex-container')[0].style.flexDirection = "row";
		document.getElementsByClassName('flex-container')[1].style.flexDirection = "row";
		activeOrient = 'horizontal';
	}
	document.getElementById(activeOrient).style.display = "none";

	if (orientCheck == 0) {
		window.alert("orientCheck");
		var tempPane = activePane;
		var tempSector = activeSector;
		if (activeSector == 'prairies') {
			changeSector('mk-mk');
		} else {
			changeSector('prairies');
		}
		changeSector(tempSector);
		changePane(tempPane);
		orientCheck++;
	}
}

function openNav() {
  document.getElementById("mySidenav").style.width = "250px";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}
