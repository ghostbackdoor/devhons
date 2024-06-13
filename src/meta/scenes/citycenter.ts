import { AppMode } from "../app";
import { Canvas } from "../common/canvas";
import { IModelReload, ModelStore, StoreData } from "../common/modelstore";
import { EventController, EventFlag } from "../event/eventctrl";
import { IViewer } from "./models/iviewer";
import { TerrainCtrl } from "./terrain/terrainctrl";

export class CityCenter implements IViewer, IModelReload {
    private data: StoreData[] = []
    constructor(
        private terrainCtrl: TerrainCtrl,
        eventCtrl: EventController,
        canvas: Canvas,
        private store: ModelStore,
    ){
        store.RegisterStore(this)
        canvas.RegisterViewer(this)
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if(mode != AppMode.CityView) return
            switch (e) {
                case EventFlag.Start:
                    break
                case EventFlag.End:
                    break
            }
        })
    }
    async Cityload(): Promise<void> {
        const houses = this.store.Houses
        if(!houses) return
        houses.forEach((user) => {
            if(user.length == 0) return
            const data = JSON.parse(user) as StoreData
            this.data.push(data)
        })
    }
    async Reload(): Promise<void> {}

    update(delta: number): void {
        this.terrainCtrl.update(delta)
    }
}