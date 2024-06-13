let activeData;

class DataController {

    #type;
    #url;
    #data;

    constructor(type, url) {
        this.#type = type;
        this.#url = url;
        this.#data = "";

        this.init();
    }    

    get json() {
        return this.#data;
    }

    async loadJSONData(url) {

        let datafile = await fetch(url);
        let output = await datafile.json();
    
        this.#data = output;
        this.sortJSON();
    }

    init(){
        console.log("initializing a dataController for", this.#type, "from", this.#url);
        this.loadJSONData(this.#url);
    }

    refresh(){
        console.log("refreshing data for", this.#type);
        this.loadJSONData(this.#url);
    }

    sortJSON() {
        var sorted = {},
        key, a = [];
    
        for (key in this.#data) {
            if (this.#data.hasOwnProperty(key)) {
                    a.push(key);
            }
        }
    
        a.sort();
    
        for (key = 0; key < a.length; key++) {
            sorted[a[key]] = this.#data[a[key]];
        }

        this.#data = sorted;
        
    }


}

class UI {

    #mode;
    #parent;

    constructor(mode) {
        this.#mode = mode;
        this.#parent = document.getElementsByTagName("main")[0];
        
    }

    get mode() {
        return this.#mode;
    }

    changeMode(mode){
        this.#mode = mode;
        localStorage.setItem("mode", this.#mode);
        setActiveData(dataSources[this.#mode]);
        this.clearScreen();
        this.addElements();
    }

    clearScreen() {

        const p = this.#parent;

        console.log("parent has", p.childElementCount, "children to delete");
        
        while(p.childElementCount > 0){
            p.removeChild[0];
        }
    }

    addElements(){
        console.log("adding elements for mode:", this.#mode);
    }
}

function setActiveData(data) {
    activeData = data;
    console.log("activeData is", activeData.dc.json);
}