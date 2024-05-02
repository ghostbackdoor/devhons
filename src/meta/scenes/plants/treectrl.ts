import * as THREE from "three";
import { PlantBox, PlantEntry, PlantState } from "./farmer";
import { PlantProperty } from "./plantdb";
import { IPhysicsObject } from "../models/iobject";

export interface ITreeMotions {
    SetProgress(ratio: number): void
    SetLevel(lv: number): void
    SetOpacity(opacity: number): void
    Death(): Promise<void>
    Delete(opt: number): void
    Plant(): void
    Enough(): void
    NeedWarter(): void
    Create(): void
}


export class TreeCtrl {
    position: THREE.Vector3
    lv = 1 // tree age
    timer = 0 // ms, 0.001 sec
    checktime = 0
    phybox: PlantBox
    mySaveData?: PlantEntry
    health = 3
    dom: HTMLDivElement
    msg: HTMLLabelElement
    progress: HTMLProgressElement
    get State() { return this.save.state }

    constructor(
        id: number, 
        private tree: IPhysicsObject, 
        private treeMotion: ITreeMotions,
        private property: PlantProperty,
        private save: PlantEntry,
    ) {
        this.position = tree.CannonPos
        const size = tree.Size
        console.log(size)
        const geometry = new THREE.BoxGeometry(size.x / 2, size.y, size.z / 2)
        const material = new THREE.MeshBasicMaterial({ 
            //color: 0xD9AB61,
            //transparent: true,
            //opacity: .5,
            //color: 0xff0000,
            //depthWrite: false,
        })
        this.phybox = new PlantBox(id, "farmtree", geometry, material, this)
        this.phybox.visible = false
        this.phybox.position.copy(this.tree.CannonPos)
        this.phybox.position.y += size.y / 2
        this.CheckWartering()
        this.dom = document.getElementById("edit-progress-bar-container") as HTMLDivElement
        this.progress = document.getElementById("edit-progress-bar") as HTMLProgressElement
        this.msg = document.getElementById("job_label") as HTMLLabelElement
    }
    SeedStart() {
        if (this.save.state != PlantState.NeedSeed) return
        this.timer = 0
        this.save.state = PlantState.Seeding
        this.msg.innerText = "나무를 심습니다."
        this.dom.style.display = "block"
    }
    SeedCancel() {
        if(this.save.state == PlantState.Seeding)
            this.save.state = PlantState.NeedSeed
        this.dom.style.display = "none"
    }
    WarteringStart() {
        if(this.save.state == PlantState.Death) return
        if(this.save.state != PlantState.Enough && this.save.state != PlantState.NeedWartering) return
        this.timer = 0
        this.save.state = PlantState.Wartering
    }
    WarteringCancel() {
        if(this.save.state == PlantState.Wartering) this.CheckWartering()
    }

    WaterDone() {
        this.save.state = PlantState.Enough
        this.timer = 0 
        this.save.lastWarteringTime = new Date().getTime() // ms, 0.001 sec
    }

    StartGrow() {
        if(this.save.state == PlantState.Death) return
        this.save.state = PlantState.NeedWartering
        const now = new Date().getTime() // ms, 0.001 sec
        this.save.lastWarteringTime = now - this.property.warteringTime
        this.treeMotion.Plant()
        this.dom.style.display = "none"
    }
    Delete(damage: number): number {
        console.log(this.health)
        if (!damage) {
            this.dom.style.display = "none"
        } else {
            this.msg.innerText = "나무를 제거합니다."
            this.dom.style.display = "block"
            this.health -= damage
            this.progress.value = 1 - this.health / 3
            this.treeMotion.Delete(this.health / 3)
        }

        return this.health
    }

    CheckWartering() {
        if(this.save.state == PlantState.NeedSeed) return

        const curr = new Date().getTime()
        const remainTime = curr - this.save.lastWarteringTime
        const remainRatio = 1 - remainTime / this.property.warteringTime
        this.treeMotion.SetProgress(remainRatio)
        // draw
        if( remainRatio < -1) {
            this.save.state = PlantState.Death
            this.treeMotion.Death()
        } else if (remainRatio > .5) {
            this.save.state = PlantState.Enough
            this.treeMotion.Enough()
        } else {
            this.save.state = PlantState.NeedWartering
            this.treeMotion.NeedWarter()
        }
    }

    update(delta: number) {
        this.checktime += delta
        if( Math.floor(this.checktime) < 1)  return
        this.checktime = 0

        switch(this.save.state) {
            case PlantState.NeedSeed:
            case PlantState.Death:
                return;
            case PlantState.Wartering: 
                {
                    this.timer += delta * 10
                    const ratio = this.timer / 5
                    this.treeMotion.SetProgress(ratio)
                    if (ratio > 1) {
                        this.WaterDone()
                    }
                }
                return;
            case PlantState.Seeding:
                this.timer += delta * 10
                const ratio = this.timer / 2
                //this.treeMotion.SetProgress(ratio)
                this.progress.value = ratio
                if(ratio > 1) {
                    this.StartGrow()
                }
                return;
            case PlantState.Enough:
                this.treeMotion.Enough()
                break;
        }
        this.CheckWartering()
    }
}