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

    constructor(mapMode) {
        mapboxgl.accessToken = "pk.eyJ1IjoicGx5bWVyIiwiYSI6ImNsb2x3ZWZyMDFjcWEyanFvcjNzMm1qNHEifQ.V6wmuoD1GQM5tvPkRb2MvA";
        this.#mode = mapMode;

        this.init();
    }

    get getLayersList() { return this.#layerSources; }
    get mapObject() { return this.#mapObject; }

    init(){

        // read the map container we are targetting from the baked-in config
        this.#container = this.#mapConfigs[this.#mode];
        
        
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
            center: [-100, 55] // lon, lat of centre of map view
        });

        this.#mapObject.on("load", () => {

            // read through all of our map data sources first, then add them all to the map object

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
                        this.makeLayer(product, productName, p.type, productID, p.paint, p.after);


                    }
                }
            }

            // we want to add at least one layer of satellite, and the CLDN for now
            this.addLayer(this.#layerSources[app.wxmapSat]);
            if (app.cldnStatus) {
                this.addLayer(this.#layerSources["cldn-data"]);
            }
            this.addLayer(this.#layerSources["rainrate"])
            
        });
    }

    makeLayer(product, source, type, id, paint, after, add = false){
        // create a sourceData object that contains all of our metaData
        let sourceData = {
            "source" : source, // source name i.e. East-DayNightMicro
            "type" : type, // type of data i.e. raster
            "id" : id, // id of the layer that the dom/mapbox references
            "paint" : paint, // used for non-raster data
            "after" : after // specify the layer we are drawing *underneath*
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
        // get all of the currently-displayed layers
        // get all of the base tile URLs
        // check the 'getcapabilities' time dimension
        // create an array of time strings that we can append to the tile url as we loop through
        // QUESTION:: how do we deal with the fact that radar is 6 minutes and sat/cldn is 10 minutes

        /////////
        // looping info
        // this.#mapObject.getSource("CLDN-Lightning-Density").tiles -- shows all the tiles in the array
        // this.#mapObject.getSource("CLDN-Lightning-Density").tiles = ["some url"] -- set the tiles to the new url array
        // this.#mapObject.style._sourceCaches["other:CLDN-Lightning-Density"].clearTiles()  -- removes the currently-drawn layer
        // this.#mapObject.style._sourceCaches["other:CLDN-Lightning-Density"].update(this.#mapObject.transform) -- repaints the layer

        
        let parser = new DOMParser();
        let capabilities = await fetch("https://geo.weather.gc.ca/geomet/?lang=en&service=WMS&version=1.3.0&request=GetCapabilities&layer=Lightning_2.5km_Density");
        let xmlText = await capabilities.text();

        let dimString = parser.parseFromString(xmlText, "text/xml").getElementsByTagName("Dimension")[0].childNodes[0].nodeValue.split("/");

        // dimString will look something like this: 2024-07-05T11:50:00Z/2024-07-05T14:50:00Z/PT10M

        let timeStart = Date.parse(dimString[0]); // in unix epox milliseconds
        let timeEnd = Date.parse(dimString[1]);
        let timeDiff = parseInt(dimString[2].replaceAll(/[a-zA-Z]/g, "")) * 1000 * 60; // this should be milliseconds equiv of whatever the PTxxM is

        let timeSlices = (timeEnd - timeStart) / timeDiff; // determine how many time slices there are between the start and end of the range
        let timeStrings = []; // contains all of the strings we will concatenate onto our base URL

        for (let i = 0; i < timeSlices; i++) {
            // create each time string based on our calculated time diff and number of slices
            timeStrings[i] = timeStart + (i * timeDiff); // need to convert this back to the YYY-MM-DDTHH:mm:ssZ format
        }

        // we will store all of these new URLs in this.#loopURLs;
        console.log(this.#loopURLs);
        

        

    }


    
}