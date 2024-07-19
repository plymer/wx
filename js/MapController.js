/*



*/

class MapController {

    #mapConfigs = {"wx" : "wx-map", "pub" : "public-map"};
    #mode;

    #map = {
        "object" : "",
        "container" : "",
        "data" : {
            "raster" : "",
            "vector" : ""
        },
        "layerSources" : {}
    }

    // loop contains all relevant data to looping the map layers
    #loop = {
        "urls" : {},
        "timeStrings" : [],
        "index" : 0,
        "length" : 0,
        "status" : false,
        "fps" : 8,
        "loopObject" : 0
    }
    // contains the timestamp for the currently displayed map data
    #infoBox;

    constructor(mapMode) {
        mapboxgl.accessToken = "pk.eyJ1IjoicGx5bWVyIiwiYSI6ImNsb2x3ZWZyMDFjcWEyanFvcjNzMm1qNHEifQ.V6wmuoD1GQM5tvPkRb2MvA";
        this.#mode = mapMode;

        this.init();
    }


    get map() { return this.#map; }
    get infoBox() { return this.#infoBox; }
    get loop() { return this.#loop; }
    get loopObject() { return this.#loop.loopObject; }

    set loopObject(obj) { this.#loop.loopObject = obj; }
    set infoBox(content) { this.#infoBox.innerHTML = content; }

    init(){

        // read the map container we are targetting from the baked-in config
        this.#map.container = this.#mapConfigs[this.#mode];
        this.#infoBox = app.elementList[this.#map.container + "-info"];
        
        // add all the data in the configuration to make it available
        ////////////////////////////////////
        // for now this is all WMS data!! //
        ////////////////////////////////////
        this.#map.data.raster = app.dc.data.raster;
        this.#map.data.vector = app.dc.data.vector;

        // initialize the map object with the style we have defined in Mapbox Studio
        this.#map.object = new mapboxgl.Map({
            container: this.#map.container,
            style: "mapbox://styles/plymer/cly2zivrf008e01r12tt04gwp",
            zoom: 3, // 3 is a roughly continental view, smaller number is zoomed out
            center: [-100, 55], // lon, lat of centre of map view
            dragRotate: false,
            touchPitch: false,
            pitchWithRotate: false,
            boxZoom: false
        });

        this.#map.object.on("load", () => {

            // read through all of our map data sources first, then add them all to the map object
            this.createLayerSources();

            // we want to add at least one layer of satellite, and the CLDN for now
            this.addLayer(this.#map.layerSources[app.wxmapSat]);

            if (app.cldnStatus) {
                this.addLayer(this.#map.layerSources["cldn-data"]);
            }
            // this.addLayer(this.#layerSources["rainrate"])

            // finally, initialize the loop URLs that would be required for each layer in the map
            this.initializeLoop();
            
        });



    }

    createLayerSources() {
        // IMPORTANT::right now, this is all sourced the the GeoMet WMS server
        for (const sourceType in this.#map.data.raster) {
            for (const product in this.#map.data.raster[sourceType]) {

                // "product" will be used as a grouping method for when we store the source data for later use

                let p = this.#map.data.raster[sourceType][product];

                for (const l in p.layerList) {
                    let productName = p.layerList[l].name + "-" + p.nameBase;
                    let productURL = p.urlBase + p.layerList[l].layer;
                    let productID = (p.type + "-" + p.nameBase + "-" + p.layerList[l].name).toString().toLowerCase();
                    
                    
                    this.#map.object.addSource(productName,
                        {
                            "type" : p.type, // type of data, i.e. raster
                            "tiles" : [productURL], // tiles are requested from the URL in an array
                            "tileSize" : p.tileSize, // limits the number of pixels pulled from WMS server
                            "bounds" : p.layerList[l].bounds // clip the data
                        }
                    );

                    // here we build a 'profile' for the layer if we want to add it to the map at some point
                    this.makeLayer(product, productName, p.type, productID, p.paint, p.after, productURL);

                }
            }
        }
    }

    makeLayer(product, source, type, id, paint, after, tileURL){
        // create a sourceData object that contains all of our metaData
        let sourceData = {
            "source" : source, // source name i.e. East-DayNightMicro
            "type" : type, // type of data i.e. raster
            "id" : id, // id of the layer that the dom/mapbox references
            "paint" : paint, // used for non-raster data
            "after" : after, // specify the layer we are drawing *underneath*
            "tiles" : tileURL // the base URL for the data from the WMS
        };

        if (!this.#map.layerSources[product]) {
            // if we haven't added this product to the layerSources yet, set up an array to store the incoming sourceData for this product type
            this.#map.layerSources[product] = [];
        }

        // add the source data to our list so we can rebuild it later if we have removed it from the display
        this.#map.layerSources[product].push(sourceData);

    }

    addLayer(layerSource){
        // we need to loop through all of the possible sources per layer, since we are likely dealing with a goes-east+goes-west situation
        for (let i = 0; i < layerSource.length; i++){
            // adding a layer to the map object will cause it to be displayed
            // we do this by running the Mapbox GL JS method "addLayer"
            this.#map.object.addLayer(
                {
                    "id" : layerSource[i].id,
                    "type" : layerSource[i].type,
                    "source" : layerSource[i].source,
                    "paint" : layerSource[i].paint
                },
                layerSource[i].after
            );

        }

    }

    removeLayer(layerSource){
        // deletes the layer from the map object (but leaves the source data intact)
        // we run the Mapbox GL JS method "removeLayer" with the layer's id reference
        // we have to loop through the layer source to remove all instances of the layer, for things like a goes-east+goes-west situation

        for (let i = 0; i < layerSource.length; i++){
            this.#map.object.removeLayer(layerSource[i].id);
        }
        
    }

    async initializeLoop() {
        console.log("initializing loop parameters");
        // get all of the currently-displayed layers
        // get all of the base tile URLs
        // check the 'getcapabilities' time dimension
        // create an array of time strings that we can append to the tile url as we loop through
        // QUESTION:: how do we deal with the fact that radar is 6 minutes and sat/cldn is 10 minutes

        let layerData = []; // store all of our layer source's ids so we can do a comparison against what is in the mapobject's layer list
        let loopCoords = {}; // this object will store all of the loop URLs that we generate, for each layer source id that we retrieve
        
        let parser = new DOMParser();
        let capabilities = await fetch("https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&version=1.3.0&request=GetCapabilities&layer=Lightning_2.5km_Density");
        let xmlText = await capabilities.text();

        let dimString = parser.parseFromString(xmlText, "text/xml").getElementsByTagName("Dimension")[0].childNodes[0].nodeValue.split("/");

        // dimString will look something like this: 2024-07-05T11:50:00Z/2024-07-05T14:50:00Z/PT10M

        let timeStart = Date.parse(dimString[0]); // in unix epox milliseconds
        let timeEnd = Date.parse(dimString[1]);
        let timeDiff = parseInt(dimString[2].replaceAll(/[a-zA-Z]/g, "")) * 1000 * 60; // this should be milliseconds equiv of whatever the PTxxM is

        let timeSlices = (timeEnd - timeStart) / timeDiff; // determine how many time slices there are between the start and end of the range

        for (let i = 0; i < timeSlices; i++) {
            // create each time string based on our calculated time diff and number of slices
            // this returns the timestamp for each image in the YYY-MM-DDTHH:mm:ssZ format
            // -- the replace() removes the milliseconds from the string which would break the WMS lookup
            this.#loop.timeStrings[i] = new Date(timeStart + (i * timeDiff)).toISOString().replace(/.\d+Z$/g, "Z"); 
        }

        this.#loop.timeStrings.reverse();
        this.#loop.length = this.#loop.timeStrings.length - 1;

        for (const ls in this.#map.layerSources) {
            for (let i = 0; i < this.#map.layerSources[ls].length; i++) {
                let source = this.#map.layerSources[ls][i].source;
                let tiles = this.#map.layerSources[ls][i].tiles
                layerData.push({"source" : source, "tiles" : tiles});
            }
        }

        for (const lid in layerData) {
            let temp = [];
            for (const ts in this.#loop.timeStrings) {                
                temp.push(layerData[lid].tiles + "&time=" + this.#loop.timeStrings[ts]);
            }

            // loopCoords now contains all of the layer sources with an array of URLs that can be used to loop through multiple images
            loopCoords[layerData[lid].source] = temp;            
            
        }

        // we will store all of these new URLs in this.#loop.urls;
        this.#loop.urls = loopCoords;

        this.updateMapDisplay();


    }

    // loop controls follow
    
    startLoop(){

        // we will want to include some kind of pre-load caching thing before we begin the loop in earnest
        let interval = 1000 / this.#loop.fps;
        console.log("starting loop at", this.#loop.fps, "fps");
        // this.#loop.loopObject = setInterval(() => this.nextFrame(), interval);

    }

    pauseLoop() {
        if (this.#loop.loopObject) {
            clearInterval(this.#loop.loopObject);
        } else {
            console.log("no loop object to pause");
        }
        

    }

    prevFrame() {
        // find the previous frame to display
        // the loop uses the 0th index as the newest image
        // then 1th index is the next newest, and so on
        // since this is looking backward in time, we want to 
        //   look positively in the index
        let n = this.#loop.index + 1;
        if (n >= this.#loop.length) {
            this.#loop.index = 0;
        } else {
            this.#loop.index = n;
        }

        this.updateMapDisplay();

    }

    nextFrame() {
        // find the next frame to display
        // the loop uses the 0th index as the newest image
        // then 1th index is the next newest, and so on
        // since this is looking forward in time, we want to 
        //   look negatively in the index

        let n = this.#loop.index - 1;
        if (n < 0) {
            this.#loop.index = this.#loop.length - 1;
        } else {
            this.#loop.index = n;
        }

        this.updateMapDisplay();

    }

    firstFrame() {
        this.#loop.index = this.#loop.length - 1;
        
        this.updateMapDisplay();
    }

    lastFrame() {
        this.#loop.index = 0;
        this.updateMapDisplay();
    }

    updateMapDisplay() {

        // this is a very expensive operation
        for (const layer in this.#map.layerSources) {
            for (const source in this.#map.layerSources[layer]) {

                let sourceName = this.#map.layerSources[layer][source].source;
                let currentTiles = this.#loop.urls[sourceName][this.#loop.index];
                let currentSource = this.#map.object.getSource(sourceName);

                currentSource.setTiles([currentTiles]);
                // currentSource.reload();

            }
            
        }

        // update the infoBox content with the current timestamp
        this.infoBox = this.#loop.timeStrings[this.#loop.index];

        // update the 'progress bar' with the current position of the loop

    }


    
}