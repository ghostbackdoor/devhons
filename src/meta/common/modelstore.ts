import * as THREE from "three";
import SConf from "../configs/staticconf";
import { EventController } from "../event/eventctrl";
import { Char } from "../loader/assetmodel";
import { BrickShapeType } from "../scenes/bricks/legos";
import { ActionType, Player } from "../scenes/player/player";
import { InvenData } from "../inventory/inventory";
import { InvenFactory } from "../inventory/invenfactory";
import { PlantEntry } from "../scenes/plants/farmer";
import { FurnEntry } from "../scenes/furniture/carpenter";
import { DeckEntry } from "../scenes/mondeck";

export type Lego = {
    position: THREE.Vector3
    size: THREE.Vector3
    rotation: THREE.Euler
    color: THREE.Color
    type: BrickShapeType
}

type Brick = {
    position: THREE.Vector3
    color: THREE.Color
}
export type House = {
    position: THREE.Vector3
    rotation: THREE.Euler
}

export type StoreData = {
    furn: FurnEntry[]
    plants: PlantEntry[]
    monDeck: DeckEntry[]
    bricks: Brick[]
    legos: Lego[]
    nonlegos: Lego[]
    owner: THREE.Vector3 | undefined
    ownerModel: Char | undefined
    ownerAction: ActionType
    portal: THREE.Vector3 | undefined
}
type StoreCityData = {
    house: House[]
    portal: THREE.Vector3 | undefined
}

export interface IModelReload {
    Reload(): Promise<void>
    Viliageload?(): Promise<void>
    Cityload?(): Promise<void>
}

export class ModelStore {
    private mgrs: IModelReload[] = []
    //private owner: Npc | undefined
    private player: Player | undefined
    private playerModel: Char = Char.Male
    private data: StoreData = { 
        furn: [],
        plants: [],
        monDeck: [],
        bricks: [], 
        legos: [], 
        nonlegos: [],
        owner: undefined, 
        ownerModel: Char.Male, 
        ownerAction: ActionType.Idle,
        portal: undefined,
    }
    private cityData: StoreCityData = {
        house: [],
        portal: undefined,
    }
    private userdata?: Map<string, string>
    private owners = new Array<THREE.Vector3 | undefined>()
    private ownerModels = new Array<Char | undefined>()
    private name: string = "unknown"

    get UserHouseData() { return this.userdata } // indivisual user
    get CityHouses() { return this.cityData.house }
    get CityPortal(): THREE.Vector3 | undefined { return this.cityData.portal }
    set CityPortal(pos: THREE.Vector3) { 
        this.cityData.portal = (this.cityData.portal == undefined) ? 
            new THREE.Vector3().copy(pos) : this.cityData.portal.copy(pos)
    }
    set Portal(pos: THREE.Vector3) { 
        this.data.portal = (this.data.portal == undefined) ? 
            new THREE.Vector3().copy(pos) : this.data.portal.copy(pos)
    }
    get Portal(): THREE.Vector3 | undefined { return this.data.portal }
    get Plants() { return (this.data.plants) ? this.data.plants : this.data.plants = [] }
    get Deck() { return (this.data.monDeck) ? this.data.monDeck : this.data.monDeck = [] }
    get Furn() { return (this.data.furn) ? this.data.furn : this.data.furn = [] }
    get Legos() { return (this.data.legos) ? this.data.legos : this.data.legos = [] }
    get NonLegos() { return (this.data.nonlegos) ? this.data.nonlegos : this.data.nonlegos = [] }
    get Bricks() { return this.data.bricks }
    get Owner() { return this.data.owner }
    set Owner(v: THREE.Vector3 | undefined) {
        if (v && this.data.owner != undefined) {
            this.data.owner.x = v.x
            this.data.owner.y = v.y
            this.data.owner.z = v.z
        }
    }
    get OwnerModel() { return this.data.ownerModel }
    get OwnerAction() { return this.data.ownerAction }
    get PlayerModel() { return this.playerModel }
    get Name() {return this.name}
    constructor(
        private eventCtrl: EventController, 
        private invenFab: InvenFactory
    ) {
        this.eventCtrl.RegisterReloadEvent(async () => {
            const promise = this.mgrs.map(async (mgr) => {
                await mgr.Reload()
            })
            await Promise.all(promise)
        })
    }

    RegisterStore(mgr: IModelReload) {
        this.mgrs.push(mgr)
    }
    
    RegisterPlayer(player: Player, mgr: IModelReload) {
        this.player = player
        this.mgrs.push(mgr)
    }
    ChangeCharactor(model: Char) {
        this.data.ownerModel = model
        this.mgrs.forEach(async (mgr) => {
            await mgr.Reload()
        })
    }
    StoreInventory(): InvenData {
        return this.invenFab.invenHouse.data
    }
    LoadInventory(inven: InvenData | undefined) {
        if (inven != undefined) {
            this.invenFab.invenHouse.Copy(inven)
            this.eventCtrl.OnChangeEquipmentEvent(this.invenFab.invenHouse)
        }
        return this.invenFab.invenHouse
    }
    ChangeInventory(inven: InvenData | undefined) {
        if (inven != undefined) {
            this.invenFab.inven.Copy(inven)
            this.eventCtrl.OnChangeEquipmentEvent(this.invenFab.inven)
        }
        return this.invenFab.inven
    }
    GetEmptyInventory() {
        return this.invenFab.inven
    }


    StoreModels() {
        this.data.owner = this.player?.Meshs.position
        this.data.ownerModel = this.player?.Model
        this.data.ownerAction = (this.player) ? this.player.ActionType : ActionType.Idle

        const json = JSON.stringify(this.data)
        return json
    }
    SaveCity() {
        const json = JSON.stringify(this.cityData)
        return json
    }

    async LoadModelsEmpty(name: string, playerModel: string | undefined)  {
        if (playerModel != undefined) {
            const playerData = JSON.parse(playerModel)
            this.playerModel = playerData.ownerModel
        }
        this.name = name
        this.data.legos.length = 0
        if (this.data.bricks) this.data.bricks.length = 0
        this.data.plants.length = 0
        this.data.owner = undefined
        this.data.ownerModel = Char.Male
        this.data.portal = SConf.DefaultPortalPosition
        this.data.furn.length = 0

        const promise = this.mgrs.map(async (mgr) => {
            await mgr.Reload()
        })
        await Promise.all(promise)
    }
    async LoadModels(data: string, name: string, playerModel: string | undefined) {
        if (playerModel != undefined) {
            const playerData = JSON.parse(playerModel)
            this.playerModel = playerData.ownerModel
        }
        this.name = name
        this.data = JSON.parse(data)
        this.data.portal = new THREE.Vector3(this.data.portal?.x, this.data.portal?.y, this.data.portal?.z)
        const promise = this.mgrs.map(async (mgr) => {
                await mgr.Reload()
            })
        await Promise.all(promise)
    }
    async LoadCity(users: Map<string, string>, city: string | undefined, playerModel: string | undefined) {
        if (playerModel) {
            const playerData = JSON.parse(playerModel)
            this.playerModel = playerData.ownerModel
        }
        if (city) {
            this.cityData = JSON.parse(city)
        }
        this.userdata = users
        const promise = this.mgrs.map(async (mgr) => {
            await mgr.Cityload?.()
        })
        await Promise.all(promise)
    }
    async LoadVillage(users: Map<string, string>, playerModel: string | undefined) {
        if (playerModel != undefined) {
            const playerData = JSON.parse(playerModel)
            this.playerModel = playerData.ownerModel
        }
        this.data.legos.length = 0
        this.owners.length = 0
        this.ownerModels.length = 0

        let i = -1
        users.forEach((user) => {
            if(user.length == 0) return
            i++
            const data = JSON.parse(user) as StoreData
            if(i == 0) {
                this.data.legos.push(...data.legos)
                return
            }
            data.legos.forEach((lego) => {
                lego.position.x -= SConf.LegoFieldW * i
            })
            this.data.legos.push(...data.legos)
            this.data.portal = new THREE.Vector3(data.portal?.x, data.portal?.y, data.portal?.z)
            this.owners.push(data.owner)
            this.ownerModels.push(data.ownerModel)
        })
        const promise = this.mgrs.map(async (mgr) => {
            await mgr.Viliageload?.()
        })
        await Promise.all(promise)
    }
}