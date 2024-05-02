import { Char } from "../../loader/assetmodel"
import { MonDrop } from "../monsters/monsterdb"

export class PlantId {
    public static AppleTree = "appletree"
}

export enum PlantType {
    Tree,
    Vegetable,
    Fruit,
}

export type PlantProperty = {
    plantId: PlantId
    type: PlantType
    assetId: Char
    name: string
    namekr: string
    maxLevel: number
    levelUpTime: number
    warteringTime: number
    drop?: MonDrop[]
}

export class PlantDb {
    plantDb = new Map<string, PlantProperty>()
    get Items() { return this.plantDb }
    constructor() {
        this.plantDb.set(PlantId.AppleTree, {
            plantId: PlantId.AppleTree,
            type: PlantType.Tree,
            assetId: Char.AppleTree,
            name: "Apple Tree",
            namekr: "사과나무",
            maxLevel: 5,
            levelUpTime: 1000 * 60 * 60 * 24, // a day
            warteringTime: 1000 * 60 * 60, // an hour
        })
    }
    get(id: string) {
        return this.plantDb.get(id)
    }
}