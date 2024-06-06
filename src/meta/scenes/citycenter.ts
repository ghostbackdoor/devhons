import { AppMode } from "../app";
import { IModelReload, ModelStore } from "../common/modelstore";
import { EventController, EventFlag } from "../event/eventctrl";
import { TerrainCtrl } from "./terrain/terrainctrl";

export class CityCenter implements IModelReload {
    constructor(
        _: TerrainCtrl,
        eventCtrl: EventController,
        store: ModelStore,
    ){
        store.RegisterStore(this)
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if(mode != AppMode.EditCity) return
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
}