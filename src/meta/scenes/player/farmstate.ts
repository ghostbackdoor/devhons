import * as THREE from "three";
import { GPhysics } from "../../common/physics/gphysics"
import { InvenFactory } from "../../inventory/invenfactory"
import { IItem } from "../../inventory/items/item"
import { ItemId } from "../../inventory/items/itemdb"
import { ActionType, Player } from "./player"
import { AttackOption, AttackType, PlayerCtrl } from "./playerctrl"
import { IPlayerAction, State } from "./playerstate"
import { EventController } from "../../event/eventctrl";
import { Bind } from "../../loader/assetmodel";
import { PlantBox, PlantState } from "../plants/farmer";
import { FurnBox, FurnState } from "../furniture/carpenter";

export class PickFruitState extends State implements IPlayerAction {
    next: IPlayerAction = this

    constructor(playerPhy: PlayerCtrl, player: Player, gphysic: GPhysics) {
        super(playerPhy, player, gphysic)
    }
    Init(): void {
        console.log("Pick!!")
        this.player.ChangeAction(ActionType.PickFruit) ?? 2
        this.playerCtrl.RunSt.PreviousState(this.playerCtrl.IdleSt)
    }
    Uninit(): void { }
    Update(): IPlayerAction {
        const d = this.DefaultCheck()
        if (d != undefined) {
            this.Uninit()
            return d
        }

        return this.next
    }
}
export class PickFruitTreeState extends State implements IPlayerAction {
    next: IPlayerAction = this

    constructor(playerPhy: PlayerCtrl, player: Player, gphysic: GPhysics) {
        super(playerPhy, player, gphysic)
    }
    Init(): void {
        console.log("Pick Tree!!")
        this.player.ChangeAction(ActionType.PickFruitTree) ?? 2
        this.playerCtrl.RunSt.PreviousState(this.playerCtrl.IdleSt)
    }
    Uninit(): void { }
    Update(): IPlayerAction {
        const d = this.DefaultCheck()
        if (d != undefined) {
            this.Uninit()
            return d
        }

        return this.next
    }
}
export class PlantAPlantState extends State implements IPlayerAction {
    next: IPlayerAction = this
    attackDist = 3
    attackDir = new THREE.Vector3()
    raycast = new THREE.Raycaster()
    target?: string
    targetMsg?: AttackOption
    trigger = false

    constructor(playerPhy: PlayerCtrl, player: Player, gphysic: GPhysics, private eventCtrl: EventController) {
        super(playerPhy, player, gphysic)
    }
    Init(): void {
        console.log("Plant a Plant!!")
        this.player.ChangeAction(ActionType.PlantAPlant) ?? 2
        this.playerCtrl.RunSt.PreviousState(this.playerCtrl.IdleSt)
        this.trigger = true
    }
    plant() {
        if(!this.trigger) return
        this.trigger = false
        this.player.Meshs.getWorldDirection(this.attackDir)
        this.raycast.set(this.player.CenterPos, this.attackDir.normalize())
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
            for(let i = 0; i < intersects.length; i++) {
                const obj = intersects[i]
                if (obj.distance> this.attackDist) return 
                const k = obj.object.name
                if (k == "furniture") {
                    this.playerCtrl.BuildingSt.Init()
                    return this.playerCtrl.BuildingSt
                }
                if (k == "farmtree") {
                    const ctrl = (obj.object as PlantBox).ctrl
                    if(ctrl.State == PlantState.Death) {
                        this.playerCtrl.DeleteSt.Init()
                        return this.playerCtrl.DeleteSt
                    }
                }
                if (k == "deck") {
                    this.playerCtrl.DeckSt.Init()
                    return this.playerCtrl.DeckSt
                }
                const msg = {
                    type: AttackType.PlantAPlant,
                    damage: 1,
                    obj: obj.object
                }
                this.eventCtrl.OnAttackEvent(k, [msg])
                this.target = k
                this.targetMsg = msg
            }
        } else {
            this.playerCtrl.IdleSt.Init()
            return this.playerCtrl.IdleSt
        }
    }
    Uninit(): void {
        if(!this.target || !this.targetMsg) return
        this.targetMsg.damage = 0
        this.eventCtrl.OnAttackEvent(this.target, [this.targetMsg])
    }
    Update(): IPlayerAction {
        const d = this.DefaultCheck()
        if (d != undefined) {
            this.Uninit()
            return d
        }
        const p = this.plant()
        if(p != undefined) {
            this.Uninit()
            return p
        }

        return this.next
    }
}
export class WarteringState extends State implements IPlayerAction {
    warteringCan?: IItem
    attackDist = 3
    attackDir = new THREE.Vector3()
    raycast = new THREE.Raycaster()
    target?: string
    targetMsg?: AttackOption
    
    trigger = false

    constructor(
        playerPhy: PlayerCtrl, 
        player: Player, 
        gphysic: GPhysics, 
        private invenFab: InvenFactory, 
        private eventCtrl: EventController
    ) {
        super(playerPhy, player, gphysic)
    }
    async Init() {
        console.log("Wartering!!")
        this.player.ChangeAction(ActionType.Watering) ?? 2
        this.playerCtrl.RunSt.PreviousState(this.playerCtrl.IdleSt)
        const id = this.player.Asset.GetBodyMeshId(Bind.Hands_R)
        if (id == undefined) return
        const mesh = this.player.Meshs.getObjectByName(id)
        if (!mesh) return 
        const item = await this.invenFab.GetNewItem(ItemId.WarterCan)
        if (item && item.Mesh != undefined) {
            const find = mesh.getObjectById(item.Mesh.id)
            if(find) {
                find.visible = true
            } else {
                mesh.add(item.Mesh)
            }
        }
        this.warteringCan = item
        this.trigger = true
    }
    Uninit(): void {
        if (this.warteringCan && this.warteringCan.Mesh) this.warteringCan.Mesh.visible = false
        1
        if (!this.target || !this.targetMsg) return
        this.targetMsg.damage = 0
        this.eventCtrl.OnAttackEvent(this.target, [this.targetMsg])
    }
    wartering() {
        if(!this.trigger) return
        this.trigger = false
        this.player.Meshs.getWorldDirection(this.attackDir)
        this.raycast.set(this.player.CenterPos, this.attackDir.normalize())
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
            intersects.forEach((obj) => {
                if (obj.distance> this.attackDist) return false
                const k = obj.object.name
                const msg = {
                    type: AttackType.Wartering,
                    damage: 1,
                    obj: obj.object
                }
                this.eventCtrl.OnAttackEvent(k, [msg])
                this.target = k
                this.targetMsg = msg
            })
        } else {
            this.playerCtrl.IdleSt.Init()
            return this.playerCtrl.IdleSt
        }
    }
    Update(): IPlayerAction {
        const d = this.DefaultCheck()
        if (d != undefined) {
            this.Uninit()
            return d
        }
        const p = this.wartering()
        if(p != undefined) {
            this.Uninit()
            return p
        }

        return this
    }
}
export class DeleteState extends State implements IPlayerAction {
    next: IPlayerAction = this
    attackDist = 3
    attackDir = new THREE.Vector3()
    raycast = new THREE.Raycaster()
    target?: string
    targetMsg?: AttackOption
    attackTime = 0
    attackSpeed = 2
    keytimeout?:NodeJS.Timeout

    constructor(playerPhy: PlayerCtrl, player: Player, gphysic: GPhysics, private eventCtrl: EventController) {
        super(playerPhy, player, gphysic)
    }
    Init(): void {
        console.log("Delete!!")
        this.player.ChangeAction(ActionType.Hammering, this.attackSpeed) 
        this.playerCtrl.RunSt.PreviousState(this.playerCtrl.IdleSt)
    }
    plant() {
        this.player.Meshs.getWorldDirection(this.attackDir)
        this.raycast.set(this.player.CenterPos, this.attackDir.normalize())
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
            for(let i = 0; i < intersects.length; i++) {
                const obj = intersects[i]
                if (obj.distance> this.attackDist) return 
                const k = obj.object.name
                const msg = {
                    type: AttackType.Delete,
                    damage: 1,
                    obj: obj.object
                }
                this.eventCtrl.OnAttackEvent(k, [msg])
                this.target = k
                this.targetMsg = msg
            }
        } else {
            this.playerCtrl.IdleSt.Init()
            return this.playerCtrl.IdleSt
        }
        return this
    }
    Uninit(): void {
        if (this.keytimeout != undefined) clearTimeout(this.keytimeout)
    }
    Update(delta: number): IPlayerAction {
        const d = this.DefaultCheck()
        if (d != undefined) {
            this.Uninit()
            return d
        }
        this.attackTime += delta

        if(this.attackTime / this.attackSpeed < 1) {
            return this
        }
        this.attackTime -= this.attackSpeed

        this.keytimeout = setTimeout(() => {
            this.plant()
        }, this.attackSpeed * 1000 * 0.6)

        return this
    }
}

export class BuildingState extends State implements IPlayerAction {
    hammer?: IItem
    attackDist = 3
    attackDir = new THREE.Vector3()
    raycast = new THREE.Raycaster()
    target?: string
    targetMsg?: AttackOption
    
    trigger = false

    constructor(
        playerPhy: PlayerCtrl, 
        player: Player, 
        gphysic: GPhysics, 
        private invenFab: InvenFactory, 
        private eventCtrl: EventController
    ) {
        super(playerPhy, player, gphysic)
    }
    async Init() {
        console.log("Building!!")
        this.player.ChangeAction(ActionType.Building) ?? 2
        this.playerCtrl.RunSt.PreviousState(this.playerCtrl.IdleSt)
        const id = this.player.Asset.GetBodyMeshId(Bind.Hands_R)
        if (id == undefined) return
        const mesh = this.player.Meshs.getObjectByName(id)
        if (!mesh) return 
        const item = await this.invenFab.GetNewItem(ItemId.Hammer)
        if (item && item.Mesh != undefined) {
            const find = mesh.getObjectById(item.Mesh.id)
            if(find) {
                find.visible = true
            } else {
                mesh.add(item.Mesh)
            }
        }
        this.hammer = item
        this.trigger = true
    }
    Uninit(): void { 
        if (this.hammer && this.hammer.Mesh) this.hammer.Mesh.visible = false
    }
    building() {
        if(!this.trigger) return
        this.trigger = false
        this.player.Meshs.getWorldDirection(this.attackDir)
        this.raycast.set(this.player.CenterPos, this.attackDir.normalize())
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
            intersects.forEach((obj) => {
                if (obj.distance> this.attackDist) return false
                const k = obj.object.name
                const ctrl = (obj.object as FurnBox).ctrl
                if (ctrl.State == FurnState.Done) {
                    this.playerCtrl.DeleteSt.Init()
                    return this.playerCtrl.DeleteSt
                }
                const msg = {
                    type: AttackType.Building,
                    damage: 1,
                    obj: obj.object
                }
                this.eventCtrl.OnAttackEvent(k, [msg])
                this.target = k
                this.targetMsg = msg
            })
        } else {
            this.playerCtrl.IdleSt.Init()
            return this.playerCtrl.IdleSt
        }
    }
    Update(): IPlayerAction {
        const d = this.DefaultCheck()
        if (d != undefined) {
            this.Uninit()
            return d
        }
        const b = this.building()
        if (b != undefined) {
            this.Uninit()
            return b
        }

        return this
    }
}