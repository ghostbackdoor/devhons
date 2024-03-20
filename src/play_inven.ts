import App from "./meta/app";
import { Inventory, InventorySlot } from "./meta/inventory/inventory";
import { Bind, IItem } from "./meta/inventory/items/item";


export class UiInven {
    inven?: Inventory
    slots: InventorySlot[] = []
    colCont = 5

    constructor(private meta: App) { }

    Clear() {
        this.slots.length = 0
    }

    LoadInven(inven: Inventory) {
        this.inven = inven
    }

    bindClickEvent(bind: Bind) {
        if (this.inven == undefined) throw new Error("inventory undefined");
        const itemInfo = document.getElementById("item_info") as HTMLDivElement
        itemInfo.replaceChildren()
        itemInfo.style.display = "none"

        const item = this.inven.GetBindItem(bind)
        if (item == undefined) {
            return
        }
        const infos = item.MakeInformation()
        let htmlString = ""
        infos.forEach((info) => {
            if (info.k) htmlString += info.k + " "
            htmlString += info.v + "<br>"
        })


        itemInfo.insertAdjacentHTML("afterbegin", htmlString)
        itemInfo.style.display = "block"
        if (item.Bindable) {
            const equipBtn = document.createElement("button")
            equipBtn.className = "btn btn-outline-primary"
            equipBtn.style.width = "100%"
            equipBtn.textContent = "해제"
            equipBtn.onclick = () => {
                this.toInvenItem(bind)
                itemInfo.style.display = "none"
                itemInfo.removeChild(equipBtn)
            }
            itemInfo.appendChild(equipBtn)
        }
    }
    toInvenItem(bind: Bind) {
        if (this.inven == undefined) throw new Error("inventory undefined");
        this.inven.MoveToInvenFromBindItem(bind)
        this.inven = this.meta.store.LoadInventory(this.inven)

        this.reloadSlot()
    }
    equipmentItem(item: IItem) {
        if (item.Bind == undefined) return

        this.inven?.MoveToBindFromInvenItem(item.Bind, item)
        this.inven = this.meta.store.LoadInventory(this.inven)

        this.reloadSlot()
    }
    slotClickEvent(id: number) {
        if (this.inven == undefined) throw new Error("inventory undefined");
        const itemInfo = document.getElementById("item_info") as HTMLDivElement
        itemInfo.replaceChildren()
        itemInfo.style.display = "none"

        const slot = this.slots[id]
        if (slot == undefined) {
            return
        }
        const item = slot.item
        const infos = item.MakeInformation()
        let htmlString = ""
        infos.forEach((info) => {
            if (info.k) htmlString += info.k + " "
            htmlString += info.v + "<br>"
        })


        itemInfo.insertAdjacentHTML("afterbegin", htmlString)
        itemInfo.style.display = "block"
        if (item.Bindable) {
            const equipBtn = document.createElement("button")
            equipBtn.className = "btn btn-outline-primary"
            equipBtn.style.width = "100%"
            equipBtn.textContent = "장착"
            equipBtn.onclick = () => {
                this.equipmentItem(item)
                itemInfo.style.display = "none"
                itemInfo.removeChild(equipBtn)
            }
            itemInfo.appendChild(equipBtn)
        }
    }
    reloadSlot() {
        if (this.inven == undefined) throw new Error("inventory undefined");
        const slot = document.getElementById("headslot") as HTMLDivElement
        slot.onclick = () => { this.bindClickEvent(Bind.Head) }
        const head = this.inven.GetBindItem(Bind.Head)
        if (head) {
            slot.innerHTML = `<img src="assets/icons/${head.IconPath}">`
        } else {
            slot.replaceChildren()
        }
        const lslot = document.getElementById("l_handslot") as HTMLDivElement
        lslot.onclick = () => { this.bindClickEvent(Bind.Hands_L) }
        const left = this.inven.GetBindItem(Bind.Hands_L)
        if (left) {
            lslot.innerHTML = `<img src="assets/icons/${left.IconPath}">`
        } else {
            lslot.replaceChildren()
        }
        const rslot = document.getElementById("r_handslot") as HTMLDivElement
        rslot.onclick = () => { this.bindClickEvent(Bind.Hands_R) }
        const right = this.inven.GetBindItem(Bind.Hands_R)
        if (right) {
            rslot.innerHTML = `<img src="assets/icons/${right.IconPath}">`
        } else {
            rslot.replaceChildren()
        }
        this.slots.length = 0

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < this.colCont; j++) {
                const id = j + i * this.colCont
                const slotTag = document.getElementById(`slot${id}`) as HTMLDivElement
                const slot = this.inven.GetInventory(id)
                if(slot == undefined) continue
                let htmlImg = `<img src="assets/icons/${slot.item.IconPath}">`
                htmlImg += (slot.count > 1) ? `<span class="position-absolute top-100 start-100 translate-middle badge rounded-pill bg-secondary"
                                    id="slot${id}count">
                                        ${slot.count}
                                    </span>
                ` : ""
                slotTag.innerHTML = htmlImg
                slotTag.onclick = () => {
                    this.slotClickEvent(id)
                }
                this.slots.push(slot)
            }
        }
    }
    loadSlot() {
        if (this.inven == undefined) throw new Error("inventory undefined");

        const invenSlots = document.getElementById("invenslots") as HTMLDivElement
        let htmlString = ""
        for (let i = 0; i < 3; i++) {
            htmlString += `<div class="row">`
            for (let j = 0; j < this.colCont; j++) {
                const id = j + i * this.colCont
                htmlString += `
                    <div class="col ps-1 pe-0 pb-1">
                        <div class="popmenu-wrap rounded inven_slot p-1" id="slot${id}"></div>
                    </div>
                `
            }
            htmlString += `</div>`
        }
        invenSlots.insertAdjacentHTML("beforeend", htmlString)
        this.reloadSlot()
    }
    binding() {
        const invenBtn = document.getElementById("invenBtn") as HTMLDivElement
        const invenCont = document.getElementById("invenContent") as HTMLDivElement
        invenBtn.onclick = () => {
            if (invenCont.style.display == "none" || invenCont.style.display == "") {
                this.inven = this.meta.store.LoadInventory(this.inven)
                this.reloadSlot()
                invenCont.style.display = "block"
            } else {
                const itemInfo = document.getElementById("item_info") as HTMLDivElement
                itemInfo.style.display = "none"
                invenCont.style.display = "none"
            }
        }

        const fullscreen = document.getElementById("fullscreen") as HTMLSpanElement
        fullscreen.onclick = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen()
                fullscreen.innerText = "fullscreen"
            } else {
                document.documentElement.requestFullscreen()
                fullscreen.innerText = "fullscreen_exit"
            }
        }

        const getback = document.getElementById("returnSns") as HTMLSpanElement
        getback.onclick = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen()
                fullscreen.innerText = "fullscreen"
            }
            history.back()
            //this.UiOn()
        }
    }
}