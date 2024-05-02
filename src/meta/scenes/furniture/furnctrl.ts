import * as THREE from "three";
import { FurnBox, FurnEntry, FurnState } from "./carpenter"
import { IPhysicsObject } from "../models/iobject"
import { FurnProperty } from "./furndb"
import { GPhysics } from "../../common/physics/gphysics";


export interface IFurnMotions {
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
    health = 3
    phybox: FurnBox
    dom: HTMLDivElement
    msg: HTMLLabelElement
    progress: HTMLProgressElement
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
        this.dom = document.getElementById("edit-progress-bar-container") as HTMLDivElement
        this.progress = document.getElementById("edit-progress-bar") as HTMLProgressElement
        this.msg = document.getElementById("job_label") as HTMLLabelElement

    }
    BuildingStart() {
        if(this.state == FurnState.Done) return
        this.timer = 0
        this.state = FurnState.Building
        const now = new Date().getTime() // ms, 0.001 sec
        this.lastBuildingTime = now - this.property.buildingTime
        this.msg.innerText = "제작하고 있습니다."
        this.dom.style.display = "block"
    }
    BuildingCancel() {
        if(this.state == FurnState.Building)
            this.state = FurnState.Suspend
        this.dom.style.display = "none"
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
        this.dom.style.display = "none"
        console.log("done", this.save, JSON.stringify(this.save))
    }
    Delete(damage: number) {
        console.log(this.health)
        if (!damage) {
            this.dom.style.display = "none"
        } else {
            this.msg.innerText = "가구를 제거합니다."
            this.dom.style.display = "block"
            this.health -= damage
            this.progress.value = 1 - this.health / 3
        }
        return this.health
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
                    this.progress.value = ratio
                    //this.treeMotion.SetProgress(ratio)
                    if (ratio > 1) {
                        this.BuildingDone()
                    }
                }
                return;
        }
    }
}