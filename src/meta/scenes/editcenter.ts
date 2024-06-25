import { AppMode } from "../app";
import { EventController, EventFlag } from "../event/eventctrl";




export class EditCenter {
    constructor(
        private eventCtrl: EventController,
    ) {
        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if (mode != AppMode.EditPlay) return
            switch (e) {
                case EventFlag.Start:
                    this.Initialize()
                    break
                case EventFlag.End:
                    this.Uninitialize()
                    break
            }
        })
    }
    Initialize() {

    }
    Uninitialize() {
        const dom = document.getElementById("edit-progress-bar-container") as HTMLDivElement
        if (dom) dom.style.display = "none"
    }
}