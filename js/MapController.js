/*



*/

class MapController {

    #mapConfigs = {"wx" : "wx-map", "pub" : "public-map"};
    #mode;
    #mapObject;
    #container;
    #mapRasterData;
    #mapVectorData;
    #layerSources = {};
    #loopURLs = {};
    #loopIndex;
    #loopLength;
    #timeStrings;
    #infoBox;

    constructor(mapMode) {
        mapboxgl.accessToken = "pk.eyJ1IjoicGx5bWVyIiwiYSI6ImNsb2x3ZWZyMDFjcWEyanFvcjNzMm1qNHEifQ.V6wmuoD1GQM5tvPkRb2MvA";
        this.#mode = mapMode;

        this.init();
    }

    get layerSources() { return this.#layerSources; }
    get mapObject() { return this.#mapObject; }
    get timeStrings() { return this.#timeStrings; }
    get infoBox() { return this.#infoBox; }

    set infoBox(content) { this.#infoBox.innerHTML = content; }

    init(){

        // read the map container we are targetting from the baked-in config
        this.#container = this.#mapConfigs[this.#mode];
        this.#infoBox = app.elementList[this.#container + "-info"];
        this.#loopIndex = 0;
        
        // add all the data in the configuration to make it available
        ////////////////////////////////////
        // for now this is all WMS data!! //
        ////////////////////////////////////
        this.#mapRasterData = app.dc.data.raster;
        this.#mapVectorData = app.dc.data.vector;

        // initialize the map object with the style we have defined in Mapbox Studio
        this.#mapObject = new mapboxgl.Map({
            container: this.#container,
            style: "mapbox://styles/plymer/cly2zivrf008e01r12tt04gwp",
            zoom: 3, // 3 is a roughly continental view, smaller number is zoomed out
            center: [-100, 55], // lon, lat of centre of map view
            dragRotate: false,
            touchPitch: false,
            pitchWithRotate: false,
            boxZoom: false
        });

        this.#mapObject.on("load", () => {

            // read through all of our map data sources first, then add them all to the map object
            this.createLayerSources();

            // we want to add at least one layer of satellite, and the CLDN for now
            this.addLayer(this.#layerSources[app.wxmapSat]);
            if (app.cldnStatus) {
                this.addLayer(this.#layerSources["cldn-data"]);
            }
            // this.addLayer(this.#layerSources["rainrate"])

            // finally, initialize the loop URLs that would be required for each layer in the map
            this.initializeLoop();
            
        });



    }

    createLayerSources() {
        // IMPORTANT::right now, this is all sourced the the GeoMet WMS server
        for (const sourceType in this.#mapRasterData) {
            for (const product in this.#mapRasterData[sourceType]) {

                // "product" will be used as a grouping method for when we store the source data for later use

                let p = this.#mapRasterData[sourceType][product];

                for (const l in p.layerList) {
                    let productName = p.layerList[l].name + "-" + p.nameBase;
                    let productURL = p.urlBase + p.layerList[l].layer;
                    let productID = (p.type + "-" + p.nameBase + "-" + p.layerList[l].name).toString().toLowerCase();
                    
                    
                    this.#mapObject.addSource(productName,
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

        if (!this.#layerSources[product]) {
            // if we haven't added this product to the layerSources yet, set up an array to store the incoming sourceData for this product type
            this.#layerSources[product] = [];
        }

        // add the source data to our list so we can rebuild it later if we have removed it from the display
        this.#layerSources[product].push(sourceData);

    }

    addLayer(layerSource){
        // we need to loop through all of the possible sources per layer, since we are likely dealing with a goes-east+goes-west situation
        for (let i = 0; i < layerSource.length; i++){
            // adding a layer to the map object will cause it to be displayed
            // we do this by running the Mapbox GL JS method "addLayer"
            this.#mapObject.addLayer(
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
            this.#mapObject.removeLayer(layerSource[i].id);
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
        this.#timeStrings = []; // contains all of the strings we will concatenate onto our base URL

        for (let i = 0; i < timeSlices; i++) {
            // create each time string based on our calculated time diff and number of slices
            // this returns the timestamp for each image in the YYY-MM-DDTHH:mm:ssZ format
            // -- the replace() removes the milliseconds from the string which would break the WMS lookup
            this.#timeStrings[i] = new Date(timeStart + (i * timeDiff)).toISOString().replace(/.\d+Z$/g, "Z"); 
        }

        this.#timeStrings.reverse();

        this.#loopLength = this.#timeStrings.length - 1;

        for (const ls in this.#layerSources) {
            for (let i = 0; i < this.#layerSources[ls].length; i++) {
                let source = this.#layerSources[ls][i].source;
                let tiles = this.#layerSources[ls][i].tiles
                layerData.push({"source" : source, "tiles" : tiles});
            }
        }

        for (const lid in layerData) {
            let temp = [];
            for (const ts in this.#timeStrings) {                
                temp.push(layerData[lid].tiles + "&time=" + this.#timeStrings[ts]);
            }

            loopCoords[layerData[lid].source] = temp.reverse();

            // loopCoords now contains all of the layer sources with an array of URLs that can be used to loop through multiple images
            /* i.e.
            {
                "CLDN-Lightning-Density" : [
                    "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&layers=RADAR_1KM_RRAI&style=Radar-Rain_Dis-14colors&time=2024-07-08T16:10:00Z",
                    "https://geo.weather.gc.ca/geomet?service=WMS&version=1.3.0&request=GetMap&format=image/png&bbox={bbox-epsg-3857}&crs=EPSG:3857&width=256&height=256&layers=RADAR_1KM_RRAI&style=Radar-Rain_Dis-14colors&time=2024-07-08T16:20:00Z",
                    ...
                ]
            }
            */
        }

        // we will store all of these new URLs in this.#loopURLs;
        this.#loopURLs = loopCoords;

        this.updateMapDisplay();


    }

    // loop controls follow
    
    startLoop(){

    }

    pauseLoop() {

    }

    prevFrame() {
        // find the previous frame to display
        // the loop uses the 0th index as the newest image
        // then 1th index is the next newest, and so on
        // since this is looking backward in time, we want to 
        //   look positively in the index
        let n = this.#loopIndex + 1;
        if (n >= this.#loopLength) {
            console.log("setting loopIndex to", 0);
            this.#loopIndex = 0;
        } else {
            console.log("setting loopIndex to", n);
            this.#loopIndex = n;
        }

        this.updateMapDisplay();

    }

    nextFrame() {
        // find the next frame to display
        // the loop uses the 0th index as the newest image
        // then 1th index is the next newest, and so on
        // since this is looking forward in time, we want to 
        //   look negatively in the index

        let n = this.#loopIndex - 1;
        if (n < 0) {
            console.log("setting loopIndex to", this.#loopLength - 1);
            this.#loopIndex = this.#loopLength - 1;
        } else {
            console.log("setting loopIndex to", n);
            this.#loopIndex = n;
        }

        this.updateMapDisplay();

    }

    updateMapDisplay() {

        for (const layer in this.#layerSources) {
            for (const source in this.#layerSources[layer]) {

                let sourceName = this.#layerSources[layer][source].source;
                let currentTiles = this.#loopURLs[sourceName][this.#loopIndex];
                let currentSource = this.#mapObject.getSource(sourceName);

                currentSource.setTiles([currentTiles]);
                currentSource.reload();

            }
            
        }

        // update the infoBox content with the current timestamp
        this.infoBox = this.#timeStrings[this.#loopIndex];

    }


    
}