import { EditHome } from "./edithome"
import App, { AppMode } from "./meta/app"



export class EditFurniture {
    visible = false
    furnDb = this.meta.Furnitures
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
        <div class="col p-1"> ${v.namekr}를 만듭니다.<br>가죽: 20, 나무: 5</div>
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
    }
    unbinding() {
        const ctrl = document.getElementById("furniturectrl") as HTMLDivElement
        this.visible = false
        ctrl.style.display = "none"
    }
}