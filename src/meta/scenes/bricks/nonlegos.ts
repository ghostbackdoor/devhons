import * as THREE from "three";
import { IModelReload, ModelStore } from "../../common/modelstore";
import { GPhysics } from "../../common/physics/gphysics";
import { EventController, EventFlag } from "../../event/eventctrl";
import { BrickGuideType } from "./brickguide";
import { BrickOption, Bricks } from "./bricks";
import { AppMode } from "../../app";
import { Player } from "../player/player";

export enum BrickShapeType {
    Rectangle,
    RoundCorner,
}

export class NonLegos extends Bricks implements IModelReload {
    get Size(): THREE.Vector3 { return (this.brickGuide) ? this.brickGuide.Size : this.brickSize }

    constructor(
        scene: THREE.Scene,
        eventCtrl: EventController,
        store: ModelStore,
        physics: GPhysics,
        player: Player
    ) {
        super(scene, eventCtrl, store, physics, player, AppMode.NonLego, store.NonLegos)
        store.RegisterStore(this)
        this.brickType = BrickGuideType.NonLego

        eventCtrl.RegisterBrickInfo((opt: BrickOption) => {
            this.ChangeOption(opt)
        })

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.currentMode = mode
            this.deleteMode = (mode == AppMode.LegoDelete)

            if (mode == AppMode.NonLego || mode == AppMode.LegoDelete) {
                this.ChangeEvent(e)
            }
        })
        this.checkEx = () => {
            if(!this.brickGuide) return

            const bfp = new THREE.Vector3().copy(this.brickfield.position)
            bfp.x -= this.fieldWidth / 2
            bfp.z -= this.fieldHeight / 2
            const p = new THREE.Vector3().copy(this.brickGuide.position)
            const s = this.brickGuide.Size // rotatio 이 적용된 형상
            p.x -= s.x / 2
            p.z -= s.z / 2
            if ( p.x >= bfp.x && p.x <= bfp.x + this.fieldWidth &&
                p.z >= bfp.z && p.z <= bfp.z + this.fieldHeight){
                this.brickGuide.Creation = false
            } else {
                this.brickGuide.Creation = true
            }
        }
        eventCtrl.RegisterSceneClearEvent(() => {
            this.ClearBlock()
            this.ClearEventBrick()
        })
    }
    EditMode() {
        this.ClearBlock()
        this.CreateBricks(this.store.NonLegos)
    }
    async Viliageload(): Promise<void> { }
    async Reload(): Promise<void> {
        this.LegoStore = this.store.NonLegos
        this.CreateBricks(this.store.NonLegos)
    }
    async Cityload(): Promise<void> {
        this.LegoStore = this.store.CityNonlego
        this.CreateBricks(this.store.CityNonlego)
        
    }
}