let app; // contains the UI controller, but we will create that once we have loaded the DOM elements we need

class DataController {

    #dataSources;
    #data = {};
    
    constructor(dataSources) {

        this.#dataSources = dataSources;
        this.init();
    }    

    get data() {
        // we acess this with <variable>.data["property"]
        return this.#data;
    }

    async loadAllJSONData() {

        console.log("loading JSON...");
        let dataCollection = {};

        for (const source in this.#dataSources) {
            let name = source;

            dataCollection[name] = this.#dataSources[name];
            let datafile = await fetch(dataCollection[name]["url"]);
            let output = await datafile.json();
            this.#data[name] = output;

            this.sortJSON(name, this.#data[name]);

        }

    }


    async init(){
        console.log("initializing DataController...");
        await this.loadAllJSONData();

        console.log("data loaded, ready to initialize UI...");

        let mode = localStorage.getItem("mode");

        if (!mode) {
            mode = "obs";
            localStorage.setItem("mode", mode);
        }


        // instantiate the UI in the selected mode
        app = new UI(mode);


    }

    async refresh(dataType){
        console.log("refreshing data for", dataType);

        
        
    }

    sortJSON(name, data) {
        var sorted = {},
        key, a = [];
    
        for (key in data) {
            if (data.hasOwnProperty(key)) {
                    a.push(key);
            }
        }
    
        a.sort();
    
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = data[a[key]];
        }

        this.#data[name] = sorted;   
    }
}

class UI {

    #mode;
    #parent;

    constructor(mode) {
        console.log("initializing the UI running", mode, "mode...");
        this.#mode = mode;
        this.#parent = document.getElementsByTagName("main")[0];

        this.init();
        
    }

    get mode() {
        return this.#mode;
    }

    init() {

        this.addElements();

    }

    changeMode(mode){
        this.#mode = mode;
        localStorage.setItem("mode", this.#mode);
        this.clearScreen();
        this.addElements();
    }

    clearScreen() {

        const p = this.#parent;

        console.log("parent has", p.childElementCount, "children to delete...");
        
        while(p.childElementCount > 0){
            p.removeChild[0];
        }

        console.log("screen cleared!")
    }

    async addElements(){
        console.log("adding elements for", this.#mode, "mode...");

        // do we 'hard code' each element of each config, or read from a config file?

        if (this.#mode == "obs") {
            // hard code this stuff, because it won't change

            let n = document.createElement("nav");

            let lsite = document.createElement("label");
            lsite.setAttribute("for", "site-id");
            lsite.setAttribute("class", "has-icon");
            lsite.innerHTML = "Site ID:";

            n.appendChild(lsite);
            
            let i = document.createElement("input");
            Object.assign(i, {
                type: "text",
                name: "site-id",
                autofocus: "",
                maxlength : 4,
                id: "site-id"
            });

            i.addEventListener("keyup", function(e){
                if (e.key === "Enter") {
                    getObs();
                }
            });

            n.appendChild(i);

            let load = document.createElement("button");
            Object.assign(load, {
                type: "submit",
                id: "load-button",
                classList: "has-icon"
            });
            load.addEventListener("click", function(){ getObs(); });

            load.innerHTML = "Load"

            n.appendChild(load);

            let s = document.createElement("select");
            s.setAttribute("id", "hrs");

            let hrs = { 7 : "6 hrs", 13 : "12 hrs", 19 : "18 hrs", 25 : "24 hrs", 37 : "36 hrs", 49 : "48 hrs", 97 : "96 hrs"};

            for (const o in hrs) {
                let opt = document.createElement("option");
                opt.setAttribute("value", o);
                opt.innerHTML = hrs[o];
                if (o == 25) {
                    opt.setAttribute("selected", "");
                }

                s.appendChild(opt);
            }

            n.appendChild(s);

            let lunit = document.createElement("label");
            lunit.innerHTML = "Units:";

            n.appendChild(lunit);

            let modes = ["avn", "can", "usa"];
            modes.forEach(m => {
                let btog = document.createElement("button");
                btog.setAttribute("id", m + "-toggle");
                btog.setAttribute("class", "has-icon");
                if (m == "avn") {
                    btog.setAttribute("class", "has-icon selected");
                }
                btog.innerHTML = m.toUpperCase();
                btog.addEventListener("click", function(){toggleObsDecode(m)});
                n.appendChild(btog);
            });

            this.#parent.appendChild(n);

            let output = document.createElement("section");
            output.setAttribute("id", "metar-output");

            this.#parent.appendChild(output);

            let meta = document.createElement("section");
            meta.setAttribute("id", "site-meta");

            this.#parent.appendChild(meta);

            let tafNotam = document.createElement("section");
            tafNotam.setAttribute("id", "taf-notam");

            let tafbtn = document.createElement("button");
            Object.assign(tafbtn, {
                id: "taf-toggle",
                classList: "has-icon selected"
            });

            tafbtn.addEventListener("click", function(){ toggleTAFNOTAM("taf")});
            tafbtn.innerHTML = "TAF";
            
            let ntmBtn = document.createElement("button");
            Object.assign(ntmBtn, {
                id: "notam-toggle",
                classList: "has-icon"
            });

            ntmBtn.addEventListener("click", function(){ toggleTAFNOTAM("notam")});
            ntmBtn.innerHTML = "NOTAM";

            tafNotam.appendChild(tafbtn);
            tafNotam.appendChild(ntmBtn);

            this.#parent.appendChild(tafNotam);



        } else if (this.#mode == "sat") {
            // hard code this stuff as well, because it also won't change
        } else {
            await this.buildUIFromConfig();
        }



    }

    async buildUIFromConfig() {
        console.log("reading UI config from file...");
        let configFile = await fetch("./data/ui-config.json");
        let config = await configFile.json();

        console.log(config);
    }
}

function toggleObsDecode(mode) {
    console.log("changing obs decode mode to", mode);

    document.documentElement.classList.remove("can");
    document.documentElement.classList.remove("avn");
    document.documentElement.classList.remove("usa");
    document.documentElement.classList.add(mode);
    document.getElementById("avn-toggle").classList.remove("selected");
    document.getElementById("can-toggle").classList.remove("selected");
    document.getElementById("usa-toggle").classList.remove("selected");
    
    if (mode == "can") {
        document.getElementById("can-toggle").classList.add("selected");
    } else if (mode == "avn") {
        document.getElementById("avn-toggle").classList.add("selected");
    } else if (mode == "usa") {
        document.getElementById("usa-toggle").classList.add("selected");
    }
    
}

async function getObs() {
    let site = document.getElementById("site-id");
    let hrs = document.getElementById("hrs");

    site = site.value.toUpperCase();
    hrs = hrs.value();
    console.log("getting obs for", hrs, "hrs at", site);

    let url = "/utilties/getObs.php?siteID=" + site + "&hrs=" + hrs;

    let siteJSON = await fetch(url);
    let data = await siteJSON.json();

    console.log(data);

}

function toggleTAFNOTAM(mode) {
    console.log(mode);

    

}