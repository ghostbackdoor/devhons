import { AppMode } from "../../app";
import { GPhysics } from "../../common/physics/gphysics";
import { EventController, EventFlag } from "../../event/eventctrl";
import { IKeyCommand } from "../../event/keycommand";
import { Loader } from "../../loader/loader";
import { Arrow } from "../models/arrow";
import { Terrainer } from "./terrainer";
export enum TerOptType {
    Rotate,
    Camera
}

export type TerrainOption = {
    to: TerOptType,
    clear?: boolean
    orbitcontrol?: boolean
}

export class TerrainCtrl {
    mode = false
    checktime = 0
    arrow: Arrow

    constructor(
        eventCtrl: EventController,
        game: THREE.Scene,
        private terrainer: Terrainer,
        private physics: GPhysics,
        loader: Loader,
    ) {
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if(mode != AppMode.EditCity) return
            switch (e) {
                case EventFlag.Start:
                    this.mode = true
                    game.add(this.terrainer, this.arrow.Meshs)
                    break
                case EventFlag.End:
                    this.mode = false
                    game.remove(this.terrainer, this.arrow.Meshs)
                    break
            }
        })
        eventCtrl.RegisterTerrainInfo((opt: TerrainOption) => {
            if(opt.to == TerOptType.Rotate) {
                this.terrainer.rotateZ(Math.PI / 2)
            }
        })
        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if (!this.mode) return
            const position = keyCommand.ExecuteKeyDown()
            this.moveEvent(position)
            this.arrow.CannonPos.copy(terrainer.position)
        })
        this.arrow = new Arrow(loader.ArrowAsset)
        this.arrow.Loader(terrainer.position)
    }
    moveEvent(v: THREE.Vector3) {
        const vx = (v.x > 0) ? 1 : (v.x < 0) ? - 1 : 0
        const vz = (v.z > 0) ? 1 : (v.z < 0) ? - 1 : 0
        this.terrainer.position.x += vx// * this.brickSize.x
        this.terrainer.position.z += vz// * this.brickSize.z

        this.CheckCollision()
    }
    CheckCollision() {
        if (this.physics.CheckBox(this.terrainer.position, this.terrainer.Box)) {
            do {
                this.terrainer.CannonPos.y += .5
            } while (this.physics.CheckBox(this.terrainer.position, this.terrainer.Box))
        } else {
            do {
                this.terrainer.CannonPos.y -= .5
            } while (!this.physics.CheckBox(this.terrainer.position, this.terrainer.Box) && this.terrainer.CannonPos.y > 0)
            this.terrainer.CannonPos.y += .5
        }
    }
    update(delta: number) {
        this.arrow.update(delta)

        this.checktime += delta
        if( Math.floor(this.checktime) < 1)  return
        this.checktime = 0   

        this.CheckCollision()
        this.arrow.CannonPos.copy(this.terrainer.position)
    }
}