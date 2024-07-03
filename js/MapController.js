class MapController {

    #mapConfigs = {"wx" : "wx-map", "pub" : "public-map"};
    #mode;
    #mapObject;
    #container;
    #mapData;
    #layerSources = [];

    constructor(mapMode) {
        mapboxgl.accessToken = "pk.eyJ1IjoicGx5bWVyIiwiYSI6ImNsb2x3ZWZyMDFjcWEyanFvcjNzMm1qNHEifQ.V6wmuoD1GQM5tvPkRb2MvA";
        this.#mode = mapMode;

        this.init();
    }

    init(){

        // read the map container we are targetting from the baked-in config
        this.#container = this.#mapConfigs[this.#mode];
        
        
        // add all the data in the configuration to make it available
        ////////////////////////////////////
        // for now this is all WMS data!! //
        ////////////////////////////////////
        this.#mapData = app.dc.data.sat; 

        // initialize the map object with the style we have defined in Mapbox Studio
        this.#mapObject = new mapboxgl.Map({
            container: this.#container,
            style: "mapbox://styles/plymer/cly2zivrf008e01r12tt04gwp/draft",
            zoom: 3, // 3 is a roughly continental view, smaller number is zoomed out
            center: [-100, 62] // lon, lat of centre of map view
        });

        this.#mapObject.on("load", () => {

            // read through all of our map data sources first, then add them all to the map object

            // IMPORTANT::right now, this is all sourced the the GeoMet WMS server
            for (const sourceType in this.#mapData) {
                for (const source in this.#mapData[sourceType]) {

                    

                    let s = this.#mapData[sourceType][source];

                    for (const l in s.layerList) {
                        let sourceName = s.layerList[l].name + "-" + s.nameBase;
                        let sourceURL = s.urlBase + s.layerList[l].layer;
                        let sourceID = s.type + "-" + s.nameBase + "-" + s.layerList[l].name;
                        
                        
                        this.#mapObject.addSource(sourceName,
                            {
                                "type" : s.type, // type of data, i.e. raster
                                "tiles" : [sourceURL], // tiles are requested from the URL in an array
                                "tileSize" : s.tileSize, // limits the number of pixels pulled from WMS server
                                "bounds" : s.layerList[l].bounds // clip the data
                            }
                        );

                        // we may NOT want to add all layers at once so this will likely get split out

                        this.makeLayer(sourceName, s.type, sourceID, s.paint, s.after, true);


                    }
                }
            }
        });
    }

    makeLayer(source, type, id, paint, after, add = false){
        // create a sourceData object that contains all of our metaData
        let sourceData = {
            "source" : source, // source name i.e. East-DayNightMicro
            "type" : type, // type of data i.e. raster
            "id" : id, // id of the layer that the dom/mapbox references
            "paint" : paint, // used for non-raster data
            "after" : after // specify the layer we are drawing *underneath*
        };

        // add the source data to our list so we can rebuild it later if we have removed it from the display
        this.#layerSources.push(sourceData);

        // if we specified we want to add the layer, we run the addLayer function with this new layer object
        if (add) {
            this.addLayer(sourceData)
        }
    }

    addLayer(sourceData){
        // adding a layer to the map object will cause it to be displayed
        // we do this by running the Mapbox GL JS method "addLayer"
        this.#mapObject.addLayer(
            {
                "id" : sourceData.id,
                "type" : sourceData.type,
                "source" : sourceData.source,
                "paint" : sourceData.paint
            },
            sourceData.after            
        );
    }

    removeLayer(sourceData){
        // deletes the layer from the map object (but leaves the source data intact)
        // we run the Mapbox GL JS method "removeLayer" with the layer's id reference
        console.log("remove layer:", sourceData.id);
        this.#mapObject.removelayer(sourceData.id)
    }

    get getLayersList() { return this.#layerSources; }
    
}