import { EditHome } from "./edithome"
import App, { AppMode } from "../meta/app"
import { FurnProperty } from "../meta/scenes/furniture/furndb"



export class EditFurniture {
    visible = false
    furnDb = this.meta.Furnitures
    itemDb = this.meta.Items
    firstloading = false
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
    makeMaterial(property: FurnProperty) {
        if(!property.madeby) return ""
        let result = ""
        property.madeby.forEach((e, i) => {
            const item = this.itemDb.GetItem(e.itemId)
            const name = item.namekr ?? item.name
            result += name + ": " + e.count

            if (property.madeby?.length != i + 1) {
                result += ", "
            }
        })
        return result
    }
    binding() {
        const ctrl = document.getElementById("furniturectrl") as HTMLDivElement
        ctrl.style.display = "block"

        if(this.firstloading) return 
        this.firstloading = true

        let html = ""
        let idx = 0
        this.furnDb.Items.forEach(v => {
            html += `
    <div class="row handcursor" id="furnslot${idx++}">
        <div class="col-auto ms-1 me-0 pb-1">
            <div class="rounded inven_slot p-1">
                <img src="assets/icons/Misc/Crate.png">
            </div>
        </div>
        <div class="col p-1 pe-3 text-start"> ${v.namekr}를 만듭니다.<br>${this.makeMaterial(v)} (beta)</div>
    </div>
            `
        });
        ctrl.insertAdjacentHTML("beforeend", html)

        idx = 0
        this.furnDb.Items.forEach(v => {
            const slot0 = document.getElementById("furnslot" + idx) as HTMLDivElement
            slot0.onclick = () => {
                this.visible = false
                ctrl.style.display = "none"
                this.editor.mode = AppMode.Furniture
                this.meta.ModeChange(this.editor.mode, v.id)
                this.editor.UpdateMenu()
            }
            idx++
        })
        const exit = document.getElementById("furniturectrlexit")
        if(exit) exit.onclick = () => {
            this.unbinding()
        }
    }
    unbinding() {
        const ctrl = document.getElementById("furniturectrl") as HTMLDivElement
        this.visible = false
        ctrl.style.display = "none"
    }
    htmlRelease() {
        this.firstloading = false
    }
}