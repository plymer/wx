/*

This script file contains functions that don't have a home inside of the main classes

This script file will likely be empty by the time we go live

*/


async function getObs() {
    let site = document.getElementById("site-id");
    let hrs = document.getElementById("hrs");

    site = site.value.toUpperCase();
    hrs = hrs.value;
    console.log("getting obs for", hrs, "hrs at", site);

    let url = "./utilities/getObs.php?siteID=" + site + "&hrs=" + hrs;

    // let url = "../data/dummy-site.json";

    let siteJSON = await fetch(url);
    let data = await siteJSON.json();

    app.dc.storeTAFSite(data);  // app.dc.data["taf-site"][<"metars"|"metadata"|"[taf"]>]
    app.populateTAFData();


    

}

function toggleTAFNOTAM(mode) {
    console.log(mode);
}


