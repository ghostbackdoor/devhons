import { AppMode } from "../app";
import { Canvas } from "../common/canvas";
import { IModelReload, ModelStore, StoreData } from "../common/modelstore";
import { EventController, EventFlag } from "../event/eventctrl";
import { IViewer } from "./models/iviewer";
import { Terrain } from "./terrain/terrain";

export class CityCenter implements IViewer, IModelReload {
    constructor(
        private terrain: Terrain,
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
        this.terrain.LoadHouse(this.store.CityHouses)

        const data = this.store.UserHouseData
        if(!data) return
        data.forEach((user) => {
            if(user.length == 0) return
            const data = JSON.parse(user) as StoreData
            this.terrain.Build(data)
        })
    }

    async Reload(): Promise<void> {}

    update(delta: number): void {
        this.terrain.update(delta)
    }
}