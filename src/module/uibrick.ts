import * as THREE from "three";
import App, { AppMode } from "../meta/app";
import ColorPicker from "@thednp/color-picker";

export class UiBrick {
    mode = AppMode.EditPlay
    myPicker?: ColorPicker
    color: string = "#fff"
    brickSize = new THREE.Vector3(3, 3, 1)
    brickRotate = new THREE.Vector3()
    updateEvent?: Function

    html: string = ""
    get Html() { return this.html }

    constructor(
        private meta: App, 
    ) { 
        this.LoadHtml()
    }
    Initialize(mode: AppMode, update: Function) {
        this.mode = mode
        this.updateEvent = update
    }
    async LoadHtml() {
        return await fetch("views/common/brick.html")
            .then(response => { return response.text(); })
            .then(data => {
                this.html = data
            })
    }
    GetElement() {
        //const rect = document.getElementById("rect") as HTMLDivElement
        //const roun = document.getElementById("rounded_corner") as HTMLDivElement
        const x_up = document.getElementById("x_up") as HTMLDivElement
        const x_down = document.getElementById("x_down") as HTMLDivElement
        const y_up = document.getElementById("y_up") as HTMLDivElement
        const y_down = document.getElementById("y_down") as HTMLDivElement
        const z_up = document.getElementById("z_up") as HTMLDivElement
        const z_down = document.getElementById("z_down") as HTMLDivElement
        const y_rotation = document.getElementById("y_rotation") as HTMLSpanElement
        const x_rotation = document.getElementById("x_rotation") as HTMLSpanElement
        const brickmodeExit = document.getElementById("brickmodeexit") as HTMLSpanElement

        x_up.onclick = () => this.ChangeBrickSize("x", 1)
        x_down.onclick = () => this.ChangeBrickSize("x", -1)
        y_up.onclick = () => this.ChangeBrickSize("y", 1)
        y_down.onclick = () => this.ChangeBrickSize("y", -1)
        z_up.onclick = () => this.ChangeBrickSize("z", 1)
        z_down.onclick = () => this.ChangeBrickSize("z", -1)
        y_rotation.onclick = () => this.ChangeRotation(0, 90, 0)
        x_rotation.onclick = () => this.ChangeRotation(90, 0, 0)
        brickmodeExit.onclick = () => {
            this.meta.ModeChange(this.mode)
            if (this.updateEvent) this.updateEvent(this.mode)
        }
        this.myPicker = new ColorPicker("#myPicker")
        this.myPicker.pointerMove = () => {
            const colorPick = document.getElementById("myPicker") as HTMLInputElement
            if (colorPick.value == this.color) return
            this.color = colorPick.value
            this.meta.ChangeBrickInfo({ color: colorPick.value })
        }
    }
    ChangeBrickSize(xyz: string, value: number) {
        if (xyz == "x" && this.brickSize.x + value < 1) { return }
        else if (xyz == "y" && this.brickSize.y + value < 1) { return }
        else if (xyz == "z" && this.brickSize.z + value < 1) { return }

        switch(xyz) {
            case "x": this.brickSize.x += value; break;
            case "y": this.brickSize.y += value; break;
            case "z": this.brickSize.z += value; break;
        }
        this.UpdateBrickUI()
        this.meta.ChangeBrickInfo({ v: this.brickSize })
    }
    ChangeRotation(x: number, y: number, z: number) {
        this.brickRotate.set(x, y, z)
        this.meta.ChangeBrickInfo({ r: this.brickRotate })
    }
    UpdateBrickUI() {
        const x_value = document.getElementById("x_value") as HTMLDivElement
        x_value.innerText = this.brickSize.x.toString()
        const y_value = document.getElementById("y_value") as HTMLDivElement
        y_value.innerText = this.brickSize.y.toString()
        const z_value = document.getElementById("z_value") as HTMLDivElement
        z_value.innerText = this.brickSize.z.toString()
    }
}