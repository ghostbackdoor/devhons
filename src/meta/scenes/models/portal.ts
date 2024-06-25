import * as THREE from "three";
import { GhostModel } from "./ghostmodel";
import { IAsset } from "../../loader/assetmodel";
import { EventController, EventFlag } from "../../event/eventctrl";
import { IKeyCommand } from "../../event/keycommand";
import { GPhysics } from "../../common/physics/gphysics";
import { IPhysicsObject } from "./iobject";
import { AppMode } from "../../app";
import { IModelReload, ModelStore } from "../../common/modelstore";
import SConf from "../../configs/staticconf";
//import { Gui } from "../../factory/appfactory";

export class Portal extends GhostModel implements IPhysicsObject, IModelReload {
    controllerEnable = false
    movePos = new THREE.Vector3()

    get BoxPos() { return this.asset.GetBoxPos(this.meshs) }

    constructor(
        asset: IAsset, 
        private store: ModelStore,
        eventCtrl: EventController, 
        private gphysic: GPhysics
    ) {
        super(asset)

        store.RegisterStore(this)

        eventCtrl.RegisterInputEvent((e: any, _real: THREE.Vector3, vir: THREE.Vector3) => { 
            if(!this.controllerEnable) return
            if (e.type == "move") {
                this.movePos.copy(vir)
            } else if (e.type == "end") {
                this.moveEvent(this.movePos)
            }
        })
        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if(!this.controllerEnable) return

            const position = keyCommand.ExecuteKeyDown()
            this.moveEvent(position)
        })
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if(mode != AppMode.Portal) return
            switch (e) {
                case EventFlag.Start:
                    this.controllerEnable = true
                    break
                case EventFlag.End:
                    this.controllerEnable = false
                    break
            }
        })
    }
    moveEvent(v: THREE.Vector3) {
        const vx = v.x * this.Size.x / 2
        const vz = v.z * this.Size.z / 2


        this.meshs.position.x += vx
        this.meshs.position.y = 0
        this.meshs.position.z += vz

       if (this.gphysic.Check(this)) {
            do {
                this.meshs.position.y += 0.2
            } while (this.gphysic.Check(this))
        } else {
            do {
                this.meshs.position.y -= 0.2
            } while (!this.gphysic.Check(this) && this.meshs.position.y >= 4.7)
            this.meshs.position.y += 0.2
        }

        this.store.Portal = this.meshs.position
        this.store.CityPortal = this.meshs.position
        console.log(this.meshs.position)
    }
    async Viliageload(): Promise<void> {
        this.meshs.position.copy(SConf.DefaultPortalPosition)
    }

    async Reload(): Promise<void> {
        this.meshs.position.copy(SConf.DefaultPortalPosition)

        const pos = this.store.Portal
        if (pos != undefined) {
            this.meshs.position.copy(pos)
        }
    }
    async Cityload(): Promise<void> {
        this.meshs.position.copy(SConf.DefaultPortalPosition)
        const pos = this.store.CityPortal
        if (pos != undefined) {
            this.meshs.position.copy(pos)
        }
    }

    async Loader(position: THREE.Vector3) {
        this.meshs = await this.asset.CloneModel()
        this.meshs.position.copy(position)
        this.meshs.castShadow = true
        this.meshs.receiveShadow = true
        this.meshs.traverse(child => {
            child.castShadow = true
            child.receiveShadow = true
        })
    }
}