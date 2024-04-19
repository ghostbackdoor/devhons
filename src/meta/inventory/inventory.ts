import { Alarm, AlarmType } from "../common/alarm";
import { Bind } from "../loader/assetmodel";
import { IItem, Item } from "./items/item";
import { ItemDb } from "./items/itemdb";

export type InventorySlot = {
    item: IItem,
    count: number,
}

export type InvenData = {
    bodySlot: IItem []
    inventroySlot: InventorySlot []
}

const maxSlot = 15

export class Inventory {
    data: InvenData = {
        bodySlot: [],
        inventroySlot: []
    }

    constructor(private itemDb: ItemDb, private alarm: Alarm) {
    }
    InsertInventory(item: IItem) {
        const find = this.data.inventroySlot.find((slot) => slot.item.Id == item.Id)
        if (find && item.Stackable) {
           find.count++ 
           return
        }
        this.data.inventroySlot.push({ item: item, count: 1 })
    }
    async NewItem(key: string) {
        if(this.data.inventroySlot.length == maxSlot) {
            this.alarm.NotifyInfo("인벤토리가 가득찼습니다.", AlarmType.Warning)
            return 
        }
        const item = new Item(this.itemDb.GetItem(key))
        await item.Loader()

        const find = this.data.inventroySlot.find((slot) => slot.item.Id == item.Id)
        if (find && find.item.Stackable) {
           find.count++ 
           return item
        }

        this.data.inventroySlot.push({ item: item, count: 1 })
        return item
    }
    MoveToInvenFromBindItem(pos: Bind) {
        const item = this.data.bodySlot[pos]
        const index = this.data.bodySlot.indexOf(item)
        if (index < 0) throw new Error("there is no item");
        this.data.bodySlot.splice(index, 1)

        this.data.inventroySlot.push({ item: item, count: 1 })
    }
    MoveToBindFromInvenItem(pos: Bind, item:IItem) {
        const find = this.data.inventroySlot.find((slot) => slot.item.Id == item.Id)
        if (find == undefined) throw new Error("there is no item");
        const index = this.data.inventroySlot.indexOf(find)
        this.data.inventroySlot.splice(index, 1)
        
        this.data.bodySlot[pos] = item
    }
    GetInventory(i: number): InventorySlot {
        return this.data.inventroySlot[i]
    }

    GetBindItem(pos: Bind) {
        return this.data.bodySlot[pos]
    }
    GetItemInfo(key: string) {
        return this.itemDb.GetItem(key)
    }
    Copy(inven: InvenData) {
        this.data = inven
        let index = this.data.inventroySlot.length - 1
        while (index >= 0) {
            const slot = this.data.inventroySlot[index]
            const id = (slot.item as Item).property.id
            if (id) slot.item = new Item(this.itemDb.GetItem(id))
            else this.data.inventroySlot.splice(index, 1)
            index --
        }
    }
    Clear() {
        this.data.bodySlot.length = 0
        this.data.inventroySlot.length = 0
    }
}