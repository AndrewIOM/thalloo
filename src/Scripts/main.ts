import * as ES6Promise from "es6-promise";
ES6Promise.polyfill();

export async function mapApp(mapName) {
    const container = document.getElementById("thalloo-app");
    if (container !== null) {
        const m = await import("./thalloo-app");
        let vm = new m.ThallooViewModel(mapName);
        ko.applyBindings(vm);
    }
}