import * as THREE from "three";
import { FurnBox, FurnEntry, FurnState } from "./carpenter"
import { IPhysicsObject } from "../models/iobject"
import { FurnProperty } from "./furndb"
import { GPhysics } from "../../common/physics/gphysics";


export interface IFurnMotions {
    SetProgress(ratio: number): void
    Building(): void
    Done(): void
    Create(): void
}


export class FurnCtrl {
    position: THREE.Vector3
    lv = 1 // tree age
    timer = 0 // ms, 0.001 sec
    lastBuildingTime = 0
    checktime = 0
    phybox: FurnBox
    get State() { return this.state }

    constructor(
        id: number, 
        private funi: IPhysicsObject, 
        private treeMotion: IFurnMotions,
        private property: FurnProperty,
        private gphysic: GPhysics,
        private save: FurnEntry[],
        private state: FurnState,
    ) {
        this.position = funi.CannonPos
        const size = funi.Size
        const geometry = new THREE.BoxGeometry(size.x , size.y, size.z)
        const material = new THREE.MeshBasicMaterial({ 
            //color: 0xD9AB61,
            //transparent: true,
            //opacity: .5,
            color: 0xff0000,
            depthWrite: false,
        })
        this.phybox = new FurnBox(id, "furniture", geometry, material, this)
        this.phybox.visible = false
        const scale = 1.2
        this.phybox.scale.set(scale, 1, scale)
        this.phybox.position.copy(this.funi.BoxPos)
        this.phybox.rotation.copy(this.funi.Meshs.rotation)
        if(state == FurnState.Done) {
            this.treeMotion.Done()
        }
    }
    BuildingStart() {
        if(this.state == FurnState.Done) return
        this.timer = 0
        this.state = FurnState.Building
        const now = new Date().getTime() // ms, 0.001 sec
        this.lastBuildingTime = now - this.property.buildingTime
    }
    BuildingCancel() {
        if(this.state == FurnState.Building)
            this.state = FurnState.Suspend
    }

    BuildingDone() {
        this.state = FurnState.Done
        this.timer = 0 
        this.lastBuildingTime = new Date().getTime() // ms, 0.001 sec
        this.treeMotion.Done()
        this.save.push({
            id: this.property.id, 
            createTime: this.lastBuildingTime, 
            state: this.state,
            position: this.funi.CannonPos,
            rotation: this.funi.Meshs.rotation
        })
        console.log("done", this.save, JSON.stringify(this.save))
    }

    update(delta: number) {
        this.checktime += delta
        if( Math.floor(this.checktime) < 1)  return
        this.checktime = 0
        do {
            this.funi.CannonPos.y -= 0.2
        } while (!this.gphysic.Check(this.funi) && this.funi.CannonPos.y >= 0)
        this.funi.CannonPos.y += 0.2

        switch(this.state) {
            case FurnState.NeedBuilding:
                return;
            case FurnState.Building:
                {
                    this.timer += delta * 10
                    const ratio = this.timer / 5
                    this.treeMotion.SetProgress(ratio)
                    if (ratio > 1) {
                        this.BuildingDone()
                    }
                }
                return;
        }
    }
}