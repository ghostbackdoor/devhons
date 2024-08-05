import { EditHome } from "./edithome"
import App, { AppMode } from "../meta/app"
import { FurnProperty, LocType } from "../meta/scenes/furniture/furndb"
import { ItemParam, MenuParam, TabList } from "./tablist"
import { PlantProperty, PlantType } from "../meta/scenes/plants/plantdb"
import { Char } from "../meta/loader/assetmodel"



export class EditFurniture {
    visible = false
    furnDb = this.meta.Furnitures
    plantDb = this.meta.Plants
    itemDb = this.meta.Items
    firstloading = false
    tablist = new TabList()
    constructor(private meta: App, private editor: EditHome) { }

    loadHtml() {
        const child: MenuParam[] = []
        const items: ItemParam[] = []
        const itemlist = [...this.furnDb.Items.values()]
        const plantChild: MenuParam[] = []
        const plantItems: ItemParam[] = []
        const plantItemlist = [...this.plantDb.Items.values()]

        Object.keys(LocType).filter((v)=> isNaN(Number(v))).forEach((key, idx) => {
            const furnlist = itemlist.filter((e) => e.loc == idx)
            const html: string[] = []
            furnlist.forEach((v)=> {
            html.push(`
    <div class="container">
    <div class="row handcursor" id="furnslot_${v.id}">
        <div class="col-auto ms-1 me-0 pb-1">
            <div class="rounded inven_slot p-1">
                <img src="assets/thumb/${Char[v.assetId]}_thumb.png" style="width:32px">
            </div>
        </div>
        <div class="col p-1 pe-3 text-start"> ${v.namekr}를 만듭니다.<br>${this.makeMaterial(v)} (beta)</div>
    </div>
    </div>
            `)
            })
            items.push({ tabId: key, itemList: html })
            child.push({ id: key, title: key })
        })
        Object.keys(PlantType).filter((v)=> isNaN(Number(v))).forEach((key, idx) => {
            const furnlist = plantItemlist.filter((e) => e.type == idx)
            const html: string[] = []
            furnlist.forEach((v)=> {
            html.push(`
    <div class="container">
    <div class="row handcursor" id="plantslot_${v.plantId}">
        <div class="col-auto ms-1 me-0 pb-1">
            <div class="rounded inven_slot p-1">
                <img src="assets/thumb/${Char[v.assetId]}_thumb.png" style="width:32px">
            </div>
        </div>
        <div class="col p-1 pe-3 text-start"> ${v.namekr}를 만듭니다.<br>${this.makeMaterial(v)} (beta)</div>
    </div>
    </div>
            `)
            })
            plantItems.push({ tabId: key, itemList: html })
            plantChild.push({ id: key, title: key })
        })

        const menuhtml = this.tablist.MakeTabMenu([{
            id: "funi",
            title: "가구",
            child: child
        }, {
            id: "plan",
            title: "식물",
            child: plantChild
        }])
        let html = ""
        items.forEach((item) =>{
            const itemhtml = this.tablist.MakeTabItem(item)
            html += itemhtml
        })
        plantItems.forEach((item) =>{
            const itemhtml = this.tablist.MakeTabItem(item)
            html += itemhtml
        })
        html = `
        <div class="row handcursor"><div class="col">${menuhtml}</div></div>
        <div class="row handcursor"><div class="col tab-content">${html}</div></div>
        `
        const tag = document.getElementById("furniturectrl") as HTMLDivElement
        tag.insertAdjacentHTML("beforeend", html)
    }
    toggle() {
        if(this.visible) {
            this.unbinding()
            this.visible = false
        } else {
            this.binding()
            this.visible = true
        }
    }
    makeMaterial(property: FurnProperty | PlantProperty) {
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
        this.loadHtml()

        /*
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
        */

        this.furnDb.Items.forEach(v => {
            const slot0 = document.getElementById("furnslot_" + v.id) as HTMLDivElement
            slot0.onclick = () => {
                this.visible = false
                ctrl.style.display = "none"
                this.editor.mode = AppMode.Furniture
                this.meta.ModeChange(this.editor.mode, v.id)
                this.editor.UpdateMenu()
            }
        })
        this.plantDb.Items.forEach(v => {
            const slot0 = document.getElementById("plantslot_" + v.plantId) as HTMLDivElement
            slot0.onclick = () => {
                this.visible = false
                ctrl.style.display = "none"
                this.editor.mode = (this.editor.mode != AppMode.Farmer) ? AppMode.Farmer : AppMode.EditPlay
                this.meta.ModeChange(this.editor.mode, v.plantId)
                this.editor.UpdateMenu()
            }
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