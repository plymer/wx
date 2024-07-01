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
        app = new UI(mode, this);


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

    storeTAFSite(json){
        this.#data["taf-site"] = json;
    }
}

class MapController {

    #mapConfigs = {"wx" : "wx-map", "pub" : "public-map"};
    #mode;
    #mapObject;
    #container;
    #mapData;

    constructor(mapMode) {
        mapboxgl.accessToken = "pk.eyJ1IjoicGx5bWVyIiwiYSI6ImNsb2x3ZWZyMDFjcWEyanFvcjNzMm1qNHEifQ.V6wmuoD1GQM5tvPkRb2MvA";
        this.#mode = mapMode;

        this.init();
    }

    init(){

        this.#container = this.#mapConfigs[this.#mode];

        console.log("container", this.#container);

        this.#mapData = app.dc.data.sat; // add all the data in the configuration to make it available

        this.#mapObject = new mapboxgl.Map({
            container: this.#container,
            // Choose from Mapbox's core styles, or make your own style with Mapbox Studio
            style: "mapbox://styles/plymer/cly2zivrf008e01r12tt04gwp/draft",
            zoom: 3,
            center: [-100, 62]
        });

        this.#mapObject.on("load", () => {

            // add all the sources first
            for (const sourceType in this.#mapData) {
                for (const source in this.#mapData[sourceType]) {
                    let s = this.#mapData[sourceType][source];

                    this.#mapObject.addSource(s.name,
                        {
                            "type" : s.type,
                            "tiles" : [s.url],
                            "tileSize" : s.tileSize
                        }
                    );


                    // we may NOT want to add all layers at once so this will likely get split out
                    this.#mapObject.addLayer(
                        {
                            "id" : s.id,
                            "type" : s.type,
                            "source" : s.name,
                            "paint" : {}
                        },
                        s.after
                    );
                }
            }
        });
    }
    
}

class UI {

    #appMode;
    #submode;
    #parent;
    #dataController;
    #elementList;
    #configController;
    #decode;
    #decodeModes = ["raw", "can", "usa"];
    #appModeList = ["pub", "avn", "obs", "sat"];
    #publicOffice;
    #publicHeader;
    #publicIssuer;
    #wxmap;

    constructor(mode, data) {
        console.log("initializing the UI running", mode, "mode...");
        this.#appMode = mode;
        // set a default for the submode, this will get overwritten almost immediately
        if (localStorage.getItem("submode")) {
            this.#submode = localStorage.getItem("submode");
        } else {
            this.#submode = "gfa";
            localStorage.setItem("submode", this.#submode);
        }

        // set the default office
        if (localStorage.getItem("publicOffice")) {
            this.#publicOffice = localStorage.getItem("publicOffice");
            this.#publicHeader = localStorage.getItem("publicHeader");
            this.#publicIssuer = localStorage.getItem("publicIssuer");
        } else {
            this.#publicOffice = "wwg";
            this.#publicHeader = "FOCN45";
            this.#publicIssuer = "CWWG";
            localStorage.setItem("publicOffice", this.#publicOffice);
            localStorage.setItem("publicHeader", this.#publicHeader);
            localStorage.setItem("publicIssuer", this.#publicIssuer);
            
        }

        // set a default for the ob decode mode
        if (localStorage.getItem("decode")) {
            this.#decode = localStorage.getItem("decode");
        } else {
            this.#decode = "raw";
            localStorage.setItem("decode", this.#decode);
        }
        
        this.#parent = document.getElementsByTagName("main")[0];
        this.#dataController = data;
        this.#elementList = {};
        this.#configController = {};



        
        // start building the UI for the app since we now have everything set up
        this.init();
        
    }

    // getters
    get mode() { return this.#appMode; }
    get dc() { return this.#dataController; }
    get elementList(){ return this.#elementList; }
    get config() { return this.#configController; }

    async init() {

        this.#configController = await this.readUIConfig("./data/config/ui-config.json");

        // bind all of our UI buttons (mode selections) with eventHandlers
        let p = document.getElementById("pub");
        p.addEventListener("click", function(){ app.changeAppMode("pub"); });
        this.#elementList["pub"] = p;

        let a = document.getElementById("avn");
        a.addEventListener("click", function(){ app.changeAppMode("avn")});
        this.#elementList["avn"] = a;

        let o = document.getElementById("obs");
        o.addEventListener("click", function(){ app.changeAppMode("obs")});
        this.#elementList["obs"] = o;

        let d = document.getElementById("sat");
        d.addEventListener("click", function(){ app.changeAppMode("sat")});
        this.#elementList["sat"] = d;

        let l = document.getElementById("outlook");
        l.addEventListener("click", function(){ window.open("/conv_otlk/", "_self"); });
        this.#elementList["outlook"] = l;

        this.changeAppMode(this.#appMode)

    }

    async readUIConfig(url) {
        console.log("reading UI config from file...");
        let configFile = await fetch(url);
        return await configFile.json();
    }

    changeAppMode(mode){

        console.log(mode);
        this.#appMode = mode;
        localStorage.setItem("mode", this.#appMode);

        let btns = document.querySelectorAll(".mode-toggle");
        btns.forEach(b => {
            b.classList.remove("selected");
        });

        this.clearScreen();
        this.addElements();

        // now that we've cleared out everything and added the appropriate elements back to the screen, make the appmode button selected
        this.#elementList[this.#appMode].classList.add("selected");
    }

    changeSubMode(submode) {
        this.#submode = submode;
        localStorage.setItem("submode", this.#submode);
        this.clearScreen();
        this.addElements();
    }

    changeDecodeMode(d){
        this.#decode = d;
        localStorage.setItem("decode", d);

        console.log("changing obs decode mode to", d);

        for (const m in this.#decodeModes) {
            let mode = this.#decodeModes[m];
            document.documentElement.classList.remove(mode);
            this.#elementList[mode].classList.remove("selected");
        }

        document.documentElement.classList.add(d);
        this.#elementList[this.#decode].classList.add("selected");
        
        // modify the data displayed in the metars

        // <...>
    }

    changePublicOffice(office) {
        this.#publicOffice = office;
        localStorage.setItem("publicOffice", this.#publicOffice);
        
        this.clearScreen();
        this.addElements();
    }

    clearScreen() {

        const p = this.#parent;

        console.log("parent has", p.childElementCount, "children to delete...");
        
        while(p.firstChild){
            p.removeChild(p.firstChild);
        }

        this.#elementList = {};

        // we now need to re-initialize the elementList with the static UI buttons
        for (const m in this.#appModeList) {
            let mode = this.#appModeList[m];
            this.#elementList[mode] = document.getElementById(mode);
        }
        
        this.#elementList["outlook"] = document.getElementById("outlook");

        console.log("screen cleared!")
    }

    async addElements(){
        console.log("adding elements for", this.#appMode, "mode...");

        // do we 'hard code' each element of each config, or read from a config file?

        if (this.#appMode == "obs") {
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
                maxLength : 4,
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

            this.#decodeModes.forEach(m => {
                let btog = document.createElement("button");
                btog.setAttribute("id", m);
                btog.setAttribute("class", "has-icon decode-toggle");
                if (m == localStorage.getItem("decode")) {
                    btog.classList.add("selected");
                }
                btog.innerHTML = m.toUpperCase();
                btog.addEventListener("click", function(){app.changeDecodeMode(m)});
                this.#elementList[m] = btog;
                n.appendChild(btog);
            });

            this.#parent.appendChild(n);

            let output = document.createElement("section");
            output.setAttribute("id", "metar-output");

            this.#parent.appendChild(output);
            this.#elementList["metars"] = output;

            let meta = document.createElement("section");
            meta.setAttribute("id", "site-meta");

            this.#parent.appendChild(meta);
            this.#elementList["metadata"] = meta;

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
            ntmBtn.innerHTML = "NOTAM (coming soon)";

            tafNotam.appendChild(tafbtn);
            tafNotam.appendChild(ntmBtn);

            this.#parent.appendChild(tafNotam);
            this.#elementList["taf-notam"] = tafNotam;



        } else if (this.#appMode == "sat") {

            let n = document.createElement("nav");
            n.setAttribute("id", "wx-map-control");

            let satLabel = document.createElement("label");
            satLabel.innerHTML = "Satellite Channel:";
            satLabel.setAttribute("for", "sat-type");
            satLabel.setAttribute("class", "has-icon");

            let satType = document.createElement("select");
            satType.setAttribute("id", "sat-type");
            satType.addEventListener("change", function(){ console.log(this.value); });

            for (const products in app.dc.data.sat) {
                console.log(products);
            }

            
            
            // hard code this stuff as well, because it also won't change
            let m = document.createElement("div");
            m.setAttribute("id", "wx-map");

            this.#parent.appendChild(m);

            const wxmap = new MapController("wx");           
            
        } else {
            await this.buildUIFromConfig();
        }



    }

    async buildUIFromConfig() {

        let config = this.#configController[this.#appMode];

        // set up the section that will contain all of the nav elements for the navigation of products
        let s = document.createElement("section");
        s.setAttribute("id", "product-nav");

        let n = document.createElement("nav");

        if (this.#appMode == "avn") {

            if(!localStorage.getItem("hub")) {
                localStorage.setItem("hub", "CYYC");
            }

            if(!localStorage.getItem("submode")) {
                localStorage.setItem("submode", "gfa");
                this.changeSubMode("gfa");
            }

            if (this.#submode == "gfa") {

                n.setAttribute("id", "gfa-region-controller");

                // set some default values if the user has never accessed the GFAs before
                if(!localStorage.getItem("gfaRegion")) {
                    localStorage.setItem("gfaRegion", "GFACN31");
                }

                if (!localStorage.getItem("avnTimeStep")) {
                    localStorage.setItem("avnTimeStep", "0");
                }

                if (!localStorage.getItem("avnProdType")) {
                    localStorage.setItem("avnProdType", "cldwx");
                }
                
                for (const product in config["gfa"]) {
                    let b = document.createElement("button");
                    b.dataset.shorttext = config["gfa"][product]["shorttext"];
                    b.dataset.longtext = config["gfa"][product]["longtext"];
                    b.innerHTML = config["gfa"][product]["longtext"];
                    b.setAttribute("id", config["gfa"][product]["id"]);
                    // b.setAttribute("class", "text-changes region-control");
                    b.setAttribute("class", "region-control");

                    if (b.getAttribute("id") == localStorage.getItem("gfaRegion")) {
                        b.classList.add("selected");
                    }

                    b.addEventListener("click", function(){
                        console.log("changing to", this.getAttribute("id"));
                        
                        localStorage.setItem("gfaRegion", this.getAttribute("id"));
                        
                        let rb = document.querySelectorAll(".region-control");
                        rb.forEach(rbtn => { rbtn.classList.remove("selected"); });
                        this.classList.add("selected");

                        // add function to change the UI to show the buttons for time & type, and update the image

                        app.buildProductSelectors();

                        let t = document.getElementById(localStorage.getItem("avnProdType") + "-" + localStorage.getItem("avnTimeStep"));
                        app.updateCMACGraphic(t.dataset.url);

                    });
    
                    n.appendChild(b);

                }

                // end of gfa mode
            } else if (this.#submode == "upper") {
                // do other
            }

            s.appendChild(n);
            this.#parent.appendChild(s);
            this.#elementList["product-nav"] = s;
            // now we build the product selectors and append them to the section
            this.buildProductSelectors();

            const imgContainer = document.createElement("section");
            imgContainer.setAttribute("id", "cmac-graphic-container");

                            
            const img = document.createElement("img");
            img.setAttribute("id", "cmac-graphic");
            imgContainer.appendChild(img);            
            this.#elementList["cmac-graphic"] = img;

            this.#parent.appendChild(imgContainer);

            // get the URL for the selected p and build the img src
            let t = document.getElementById(localStorage.getItem("avnProdType") + "-" + localStorage.getItem("avnTimeStep"));
            this.updateCMACGraphic(t.dataset.url);
            
            //-------------------------------------------------//
            //                 TAF PLUS ELEMENTS               //
            //-------------------------------------------------//

            let td = document.createElement("section");
            td.setAttribute("id", "tafplus");

            let title = document.createElement("h1");
            title.innerHTML = "Hub TAF Discussions";
            title.setAttribute("class", "has-icon")

            td.appendChild(title);


            // now lets create all the buttons what we can click to select one of the hubs
            let hubs = app.dc.data["tafplus"];

            for (const h in hubs) {

                const b = document.createElement("button");
                b.innerHTML = h;
                b.setAttribute("id", h+"-plus");
                b.setAttribute("class", "tafplus-hub")
                b.dataset.hub = h;

                if (b.dataset.hub == localStorage.getItem("hub")){
                    b.classList.add("selected");
                }

                b.addEventListener("click", function(){
                    localStorage.setItem("hub", this.dataset.hub);

                    let tb = document.querySelectorAll(".tafplus-hub");
                    tb.forEach(tbtn => { tbtn.classList.remove("selected"); });
                    this.classList.add("selected");

                    app.parseTAFPlus(this.dataset.hub);
                });

                td.appendChild(b);

            }

            let header = document.createElement("h2");
            header.innerHTML = "Header:";
            td.appendChild(header);

            let headerText = document.createElement("p");
            headerText.setAttribute("id", "tafplus-header-text");
            headerText.setAttribute("class", "tafplus-content");
            this.#elementList["tafplus-header"] = headerText;
            td.appendChild(headerText);

            let discuss = document.createElement("h2");
            discuss.innerHTML = "Discussion:";
            td.appendChild(discuss);

            let discussText = document.createElement("p");
            discussText.setAttribute("id", "tafplus-discussion-text");
            discussText.setAttribute("class", "tafplus-content");
            this.#elementList["tafplus-discussion"] = discussText;
            td.appendChild(discussText);

            let forecaster = document.createElement("h2");
            forecaster.innerHTML = "Forecaster:";
            td.appendChild(forecaster);

            let forecasterText = document.createElement("p");
            forecasterText.setAttribute("id", "tafplus-forecaster-text");
            forecasterText.setAttribute("class", "tafplus-content");
            this.#elementList["tafplus-forecaster"] = forecasterText;
            td.appendChild(forecasterText);

            this.#parent.appendChild(td);

            this.parseTAFPlus(localStorage.getItem("hub"));

            //-------------------------------------------------//
            //        PIREPS and SIGMET/AIRMET Elements        //
            //-------------------------------------------------//

            // do some stuff here




            // end of aviation mode ui setup
        } else if (this.#appMode == "pub") {

            let sel = document.createElement("select");
            sel.setAttribute("id", "public-office");
            sel.addEventListener("change", function(){
                app.changePublicOffice(this.value);
                app.buildProductSelectors();

            });

            for (const o in config) {
                let opt = document.createElement("option");
                opt.setAttribute("value", o);
                opt.innerHTML = config[o]["longtext"];
                if (opt.value == this.#publicOffice) {
                    opt.setAttribute("selected", true);
                }

                sel.appendChild(opt);
                
            }

            n.appendChild(sel);
            this.#elementList["public-office"] = sel;

            s.appendChild(n);
            this.#parent.appendChild(s);
            this.#elementList["product-nav"] = s;

            // now we build the product selectors and append them to the section
            this.buildProductSelectors();

            let forecastContainer = document.createElement("section");
            forecastContainer.setAttribute("id", "forecast-container");

            let forecastText = document.createElement("p");
            forecastText.setAttribute("id", "forecast-text");
            this.#elementList["public-forecast"] = forecastText;

            forecastContainer.appendChild(forecastText);

            this.#parent.appendChild(forecastContainer);

            if (document.querySelectorAll("#public-forecast-products > .selected")[0]) {
                let selectedFx = document.querySelectorAll("#public-forecast-products > .selected")[0];
                this.getPublicForecast(selectedFx.dataset.header, selectedFx.dataset.issuer)
            }
            

            ///////////////////////////////////////////////////////////////////////////////////
            // this will create a list of all of the warnings from the current-alerts.json file
            //  --- this is a stopgap measure until the warnings/outlook map is operational
            ///////////////////////////////////////////////////////////////////////////////////

            

            let warnList = document.createElement("section");
            warnList.setAttribute("id", "alerts-list");

            let warnHeading = document.createElement("h1");
            warnHeading.setAttribute("class", "has-icon");
            warnHeading.innerHTML = "Active Alerts";
            warnList.appendChild(warnHeading);

            const alerts = this.#dataController.data.alerts;
            const aor = this.#configController.pub[this.#publicOffice].warnings;

            console.log("building warning list for", this.#publicOffice);

            

            for (const a in alerts) {                
                for (const p in aor) {                  
                    
                    if (alerts[a].prov == aor[p]) {
                        let aType = alerts[a].alertType;
                        let aTime = alerts[a].issueTime;
                        let aText = alerts[a].text;
                        let aRegions = alerts[a].parentName; // this should be an array

                        let container = document.createElement("div");
                        let aTyC = document.createElement("h2");
                        aTyC.innerHTML = aType;
                        container.appendChild(aTyC);

                        let aTiC = document.createElement("h3");
                        aTiC.innerHTML = aTime;
                        container.appendChild(aTiC);

                        for (const r in aRegions) {
                            let aR = document.createElement("p");
                            aR.innerHTML = aRegions[r];
                            container.appendChild(aR);
                        }

                        let aTxt = document.createElement("p");
                        aTxt.innerHTML = aText;
                        container.appendChild(aTxt);

                        warnList.appendChild(container);
                    }
                }
            }

            this.#parent.appendChild(warnList);


            // end of the warnings list
            ////////////////////////////////////////////////////////////

            let mapHead = document.createElement("h1");
            mapHead.innerHTML = "Outlooks and Warnings Map";
            this.#parent.appendChild(mapHead);

            let mapContent = document.createElement("section");
            mapContent.setAttribute("id", "public-map");
            this.#parent.appendChild(mapContent);

        }




    }

    buildProductSelectors() {

        let s = this.#elementList["product-nav"];
        let mode = this.#appMode;

        // remove the nav element we may have built previously
        const oldn = document.querySelectorAll(".forecast-control");
        
        oldn.forEach(o => {
            s.removeChild(o);
        });        

        this.#elementList["product-nav"] = s;

        if (mode =="avn") {
            let selectedRegion = localStorage.getItem("gfaRegion");
            let selectedTime = localStorage.getItem("avnTimeStep");
            let selectedType = localStorage.getItem("avnProdType");



            console.log("building product selectors for", selectedRegion + "...");
            const products = app.dc.data[this.#submode][selectedRegion]; //app.dc.data.gfa.GFACN31
            
            for (const p in products) {

                const n = document.createElement("nav");
                n.setAttribute("class", "forecast-control");
                n.setAttribute("id", p.toLowerCase()+"-nav");

                for (let i = 0; i < products[p].length; i++) {
                    let rb = document.createElement("button");
                    rb.setAttribute("id", p.toLowerCase() +"-" + i);
                    rb.dataset.timestep = i;
                    rb.dataset.product = p.toLowerCase();

                    rb.setAttribute("class", "product-control " + p.toLowerCase());
                    rb.dataset.url = products[p][i];

                    if (rb.dataset.timestep == selectedTime && rb.dataset.product == selectedType) {
                        rb.classList.add("selected");
                    }
                    rb.addEventListener("click", function(){
                        console.log("changing product to", selectedRegion, p, i*6);

                        localStorage.setItem("avnProdType", this.dataset.product);
                        selectedType = localStorage.getItem("avnProdType");
                        localStorage.setItem("avnTimeStep", this.dataset.timestep);
                        selectedTime = localStorage.getItem("avnTimeStep");

                        let tb = document.querySelectorAll(".product-control");
                        tb.forEach(tbtn => { tbtn.classList.remove("selected") });
                        this.classList.add("selected");
                        
                        // add function to change the UI to update the image
                        app.updateCMACGraphic(rb.dataset.url);
                        
                    });
                    rb.innerHTML = "T+" + i*6;

                    n.appendChild(rb);

                }
                // add this forecast-control to the product nav container
                s.appendChild(n);
                
            }

        } else if (mode == "pub") {

            let pubHeader = localStorage.getItem("publicHeader");
            let pubIssuer = localStorage.getItem("publicIssuer");

            const products = app.config.pub[this.#publicOffice].products; //app.config.pub.weg.products

            let n = document.createElement("nav");
            n.setAttribute("id", "public-forecast-products");
            n.setAttribute("class", "forecast-control");

            console.log("building product selectors for", this.#publicOffice + "...");

            for (const p in products) {
                let b = document.createElement("button");
                b.setAttribute("class", "region-control");
                b.innerHTML = products[p].label;
                b.dataset.issuer = products[p].issuer;
                b.dataset.header = products[p].header;

                if (products[p].header == pubHeader && products[p].issuer == pubIssuer) {
                    b.classList.add("selected");
                }
                b.addEventListener("click", function(){
                    localStorage.setItem("publicHeader", this.dataset.header);
                    localStorage.setItem("publicIssuer", this.dataset.issuer);
                    app.getPublicForecast(this.dataset.header, this.dataset.issuer);
                    let fb = document.querySelectorAll(".region-control");
                    fb.forEach(fpb => { fpb.classList.remove("selected") });
                    this.classList.add("selected");
                });

                n.appendChild(b);




            }

            s.appendChild(n);
            

        }

        // update the product nav container to the main element list
        
        this.#elementList["product-nav"] = s;

    }

    async getPublicForecast(header, issuer){
        
        let url = "./utilities/getFX.php?bulletin=" + header + "&office=" + issuer;
        // let url = "../data/dummy-fx.json";
        let fxText = await fetch(url);
        fxText = await fxText.json();

        this.#elementList["public-forecast"].innerHTML = fxText.text;

    }

    updateCMACGraphic(url){
        const img = document.getElementById("cmac-graphic");
        img.setAttribute("src", url);
        this.#elementList["cmac-graphic"] = img;
    }

    populateTAFData(){

        let dc = this.#dataController.data["taf-site"]; 

        let m = dc["metars"];
        let d = dc["metadata"];
        let t = dc["taf"];

        // clear out old data
        this.#elementList["metars"].innerHTML = "";
        this.#elementList["metadata"].innerHTML = "";
        this.#elementList["taf-notam"].innerHTML = "";

        for (let i = 0; i<m.length; i++) {
            let o = document.createElement("p");
            o.setAttribute("class", "metar-string");
            o.innerHTML = m[i];
            this.#elementList["metars"].appendChild(o);
        }

        /*
        // THIS IS HUUUUUUUUUUUUUUUUUGE!!!!!
        // https://aviationweather.gov/api/data/metar?ids=cyeg&format=json&taf=false&hours=24
        // https://aviationweather.gov/api/data/taf?ids=cyeg&format=json
        // this is fully decoded METARs/TAFs !!!!!!!!!!!!!!!!!

        // this is for when we have parsed the metars into objects, for now they are strings in an array
        for (const ob in m) {
            let o = document.createElement("p");
            o.setAttribute("class", "metar-string");
            // we will add the data for the temp and wind later using
            // o.dataset.<tt|td|ff|gg> and anything else we might want to tag
            // we may programatically create spans throughout the <p>
            // since we will probably parse the entirety of the METAR at some point
            o.innerHTML = ob;
            this.#elementList["metars"].appendChild(o);
        }

        */

        for (const md in d) {
            let o = document.createElement("span"); // not really sure why we're using a span
            o.setAttribute("id", md);
            o.setAttribute("class", "has-icon");
            o.innerHTML = d[md];
            this.#elementList["metadata"].appendChild(o);
        }

        let taf = document.createElement("p");
        let tafMeta = document.createElement("span");
        tafMeta.setAttribute("class", "taf-meta");
        tafMeta.innerHTML = t["meta"];

        let tafMain = document.createElement("span");
        tafMain.setAttribute("class", "taf-main");
        tafMain.innerHTML = t["main"];

        taf.appendChild(tafMeta);
        taf.appendChild(tafMain);

        // now loop through all of the part periods and append those to the taf

        for (let i = 0; i < t["part-periods"].length; i++){
            let o = document.createElement("span");
            if (t["part-periods"][i]["type"] == "FM"){
                o.setAttribute("class", "taf-fm-group");
            } else {
                o.setAttribute("class", "taf-part-period");
            }
            
            o.innerHTML = t["part-periods"][i]["raw"];
            taf.appendChild(o);
        }

        // grab the remark if it exists
        if (t["rmk"]) {
            let o = document.createElement("span");
            o.setAttribute("class", "taf-rmk");
            o.innerHTML = t["rmk"]
            taf.appendChild(o);
        }

        // all elements of the TAF have been added, now add the TAF to the DOM
        this.#elementList["taf-notam"].appendChild(taf);


        

    }

    parseTAFPlus(hub) {        
    
        // read the data out of the datacontroller and then push the text to the appropriate elements
        let hubData = app.dc.data.tafplus[hub];
    
        this.#elementList["tafplus-header"].innerHTML = hubData.strheaders;
        this.#elementList["tafplus-discussion"].innerHTML = hubData.strdiscussion;
        this.#elementList["tafplus-forecaster"].innerHTML = hubData.strforecaster + "/" + hubData.stroffice;  
    
    
    }

}

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

function buildMap(mapMode) {

    const mapConfigs = {"wx" : "wx-map", "pub" : "public-map"};
    mapboxgl.accessToken = "pk.eyJ1IjoicGx5bWVyIiwiYSI6ImNsb2x3ZWZyMDFjcWEyanFvcjNzMm1qNHEifQ.V6wmuoD1GQM5tvPkRb2MvA";
    // this.#mapObject.addSource("goes-east", {
    //     "type": "raster",
    //     // use the tiles option to specify a WMS tile source URL
    //     // https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/sources/
    //     "tiles": [
    //         "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&layers=GOES-East_1km_DayCloudType-NightMicrophysics"
    //     ],
    //     "tileSize": 256
    // });
    // this.#mapObject.addSource("goes-west", {
    //     "type": "raster",
    //     // use the tiles option to specify a WMS tile source URL
    //     // https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/sources/
    //     "tiles": [
    //         "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&layers=GOES-West_1km_DayCloudType-NightMicrophysics"
    //     ],
    //     "tileSize": 256
    // });
    // this.#mapObject.addSource("cldn", {
    //     "type": "raster",
    //     // use the tiles option to specify a WMS tile source URL
    //     // https://docs.mapbox.comhttps://docs.mapbox.com/style-spec/reference/sources/
    //     "tiles": [
    //         "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&layers=Lightning_2.5km_Density" // loopable time using &time=2024-07-01T15:30:00Z (for example)
    //     ],
    //     "tileSize": 256
    // });
    
}

