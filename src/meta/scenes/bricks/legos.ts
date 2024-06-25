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

export class Legos extends Bricks implements IModelReload {
    viliage?: THREE.InstancedMesh
    get Size(): THREE.Vector3 { return (this.brickGuide) ? this.brickGuide.Size : this.brickSize }

    constructor(
        scene: THREE.Scene,
        eventCtrl: EventController,
        store: ModelStore,
        physics: GPhysics,
        player: Player
    ) {
        super(scene, eventCtrl, store, physics, player, AppMode.Lego, store.Legos)
        store.RegisterStore(this)
        this.brickType = BrickGuideType.Lego
        

        eventCtrl.RegisterBrickInfo((opt: BrickOption) => {
            this.ChangeOption(opt)
        })

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.currentMode = mode
            this.deleteMode = (mode == AppMode.LegoDelete)

            if (mode == AppMode.Lego || mode == AppMode.LegoDelete) {
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
            if (
                p.x >= bfp.x && p.x + s.x <= bfp.x + this.fieldWidth &&
                p.z >= bfp.z && p.z + s.z <= bfp.z + this.fieldHeight){
                this.brickGuide.Creation = true
            } else {
                this.brickGuide.Creation = false
            }
        }
        eventCtrl.RegisterSceneClearEvent(() => {
            this.ClearBlock()
            this.ClearEventBrick()
            this.DeleteViliage()
        })
    }
    EditMode() {
        this.ClearBlock()
        this.CreateBricks(this.store.Legos)
    }
    async Viliageload(): Promise<void> {
        this.LegoStore = this.store.Legos
        this.viliage = this.CreateInstacedMesh(this.store.Legos)
        if (this.viliage) this.scene.add(this.viliage)
    }
    async Reload(): Promise<void> {
        this.LegoStore = this.store.Legos
        this.CreateBricks(this.store.Legos)
    }

    DeleteViliage() {
        if (!this.viliage) return

        this.scene.remove(this.viliage)
        this.viliage.dispose()
    }
}