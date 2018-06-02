import * as ES6Promise from "es6-promise";
ES6Promise.polyfill();

// Set dynamic public path based on body data attribute
declare var  __webpack_public_path__:string;
let baseUrl = document.body.getAttribute("data-baseurl");
if (baseUrl != null) __webpack_public_path__ = baseUrl + __webpack_public_path__;

export async function mapApp() {
    const container = document.getElementById("thalloo-app");
    if (container !== null) {
        let mapName = container.getAttribute("data-mapname");
        if (mapName !== null) {
            const m = await import("./thalloo-app");
            const ko = await import("knockout");
            let vm = new m.ThallooViewModel(mapName);
            ko.applyBindings(vm);
        }
    }
}

mapApp();