import { EditHome } from "./edithome"
import App, { AppMode } from "./meta/app"




export class EditPlant {
    visible = false
    firstloading = false
    plantDb = this.meta.Plants

    constructor(private meta: App, private editor: EditHome) { }

    toggle() {
        if(this.visible) {
            this.unbinding()
            this.visible = false
        } else {
            this.binding()
            this.visible = true
        }
    }

    binding() {
        const ctrl = document.getElementById("plantctrl") as HTMLDivElement
        ctrl.style.display = "block"

        if(this.firstloading) return 
        this.firstloading = true

        let html = ""
        let idx = 0
        this.plantDb.Items.forEach(v => {
            html += `
    <div class="row handcursor" id="plantslot${idx++}">
        <div class="col-auto ms-1 me-0 pb-1">
            <div class="rounded inven_slot p-1">
                <img src="assets/icons/Misc/Crate.png">
            </div>
        </div>
        <div class="col p-1"> ${v.namekr}를 심습니다.</div>
    </div>
            `
        });
        ctrl.insertAdjacentHTML("beforeend", html)

        idx = 0
        this.plantDb.Items.forEach(v => {
            const slot0 = document.getElementById("plantslot" + idx) as HTMLDivElement
            slot0.onclick = () => {
                this.visible = false
                ctrl.style.display = "none"
                this.editor.mode = (this.editor.mode != AppMode.Farmer) ? AppMode.Farmer : AppMode.EditPlay
                this.meta.ModeChange(this.editor.mode, v.plantId)
                this.editor.UpdateMenu()
            }
            idx++
        })

        const exit = document.getElementById("plantctrlexit")
        if(exit) exit.onclick = () => {
            this.unbinding()
        }
    }
    unbinding() {
        const plantCtrl = document.getElementById("plantctrl") as HTMLDivElement
        plantCtrl.style.display = "none"
        this.visible = false
    }
    htmlRelease() {
        this.firstloading = false
    }
}