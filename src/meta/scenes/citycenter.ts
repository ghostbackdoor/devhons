import { AppMode } from "../app";
import { Canvas } from "../common/canvas";
import { IModelReload, ModelStore } from "../common/modelstore";
import { EventController, EventFlag } from "../event/eventctrl";
import { IViewer } from "./models/iviewer";
import { TerrainCtrl } from "./terrain/terrainctrl";

export class CityCenter implements IViewer, IModelReload {
    constructor(
        private terrainCtrl: TerrainCtrl,
        eventCtrl: EventController,
        canvas: Canvas,
        store: ModelStore,
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
    async Viliageload(): Promise<void> {
        
    }
    async Reload(): Promise<void> {
        
    }
    resize(): void { }
    update(delta: number): void {
        this.terrainCtrl.update(delta)
    }
}