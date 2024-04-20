import * as THREE from "three";
import { AppMode } from "../../app";
import { EventController, EventFlag } from "../../event/eventctrl";
import { IKeyCommand, KeyType } from "../../event/keycommand";
import { GPhysics } from "../../common/physics/gphysics";
import { IPhysicsObject } from "../models/iobject";
import { IModelReload, ModelStore } from "../../common/modelstore";
import SConf from "../../configs/staticconf";
import { AppleTree } from "./appletree";
import { Loader } from "../../loader/loader";
import { Game } from "../game";
import { Player } from "../player/player";
import { PlantDb, PlantId, PlantProperty} from "./plantdb";
import { IViewer } from "../models/iviewer";
import { Canvas } from "../../common/canvas";
import { TreeCtrl } from "./treectrl";
import { AttackOption, AttackType, PlayerCtrl } from "../player/playerctrl";

export enum PlantState {
    NeedSeed,
    Seeding,
    Enough,
    NeedWartering,
    Wartering,
    Death,
    Delete,
}
export type PlantEntry = {
    id: string
    createTime: number // ms, 0.001 sec
    lv: number // tree age
    state: PlantState
    lastWarteringTime: number
    position: THREE.Vector3
}

export type PlantSet = {
    plantId: PlantId
    plant: IPhysicsObject
    plantCtrl: TreeCtrl
    used: boolean
}
export class PlantBox extends THREE.Mesh {
    constructor(public Id: number, public ObjName: string,
        geo: THREE.BoxGeometry, mat: THREE.MeshBasicMaterial, public ctrl: TreeCtrl
    ) {
        super(geo, mat)
        this.name = ObjName
    }
}

export class Farmer implements IModelReload, IViewer {
    controllable = false
    target?: IPhysicsObject
    targetId?: string
    plantDb = new PlantDb()
    plantsFab = new Map<string, IPhysicsObject>()
    plantset: PlantSet[] = []
    recycle: PlantSet[] = []
    saveData = this.store.Plants

    constructor(
        private loader: Loader,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private game: Game,
        private store: ModelStore,
        private gphysic: GPhysics,
        canvas: Canvas,
        private eventCtrl: EventController,
    ){
        canvas.RegisterViewer(this)
        store.RegisterStore(this)
        this.plantsFab.set(PlantId.AppleTree, new AppleTree(this.loader.AppleTreeAsset))

        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag, id: string) => {
            if(mode != AppMode.Farmer) return

            switch (e) {
                case EventFlag.Start:
                    this.target = this.plantsFab.get(id)
                    if (!this.target) return
                    this.targetId = id
                    this.controllable = true
                    this.game.add(this.target.Meshs)
                    this.target.Visible = true
                    this.target.CannonPos.x = this.player.CannonPos.x
                    this.target.CannonPos.z = this.player.CannonPos.z
                    this.eventCtrl.OnChangeCtrlObjEvent(this.target)
                    console.log(id)
                    break
                case EventFlag.End:
                    this.controllable = false
                    if (!this.target) return
                    this.target.Visible = false
                    this.game.remove(this.target.Meshs)
                    break
            }
        })

        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if(!this.controllable) return
            switch(keyCommand.Type) {
                case KeyType.Action0:
                    if (!this.target || !this.targetId) return
                    const e: PlantEntry = {
                        position: this.target.CannonPos, 
                        id: this.targetId, 
                        state: PlantState.NeedSeed,
                        lastWarteringTime: 0,
                        lv: 1,
                        createTime: 0
                    }
                    this.saveData.push(e)
                    this.CreatePlant(e)
                    eventCtrl.OnAppModeEvent(AppMode.EditPlay)
                    break;
                default:
                    const position = keyCommand.ExecuteKeyDown()
                    this.moveEvent(position)
                    break;
            }
        })

        eventCtrl.RegisterAttackEvent("farmtree", (opts: AttackOption[]) => {
            opts.forEach((opt) => {
                let obj = opt.obj as PlantBox
                if (obj == null) return
                const z = this.plantset[obj.Id]

                if(opt.type == AttackType.PlantAPlant) {
                    if (opt.damage) {
                        z.plantCtrl.SeedStart()
                    } else {
                        z.plantCtrl.SeedCancel()
                    }
                } else if(opt.type == AttackType.Wartering) {
                    if (opt.damage) {
                        z.plantCtrl.WarteringStart()
                    } else {
                        z.plantCtrl.WarteringCancel()
                    }
                } else if(opt.type == AttackType.Delete) {
                    if (!z.plantCtrl.Delete()) this.DeletePlant(obj.Id)
                }
            })
        })
    }
    resize(): void { }
    update(delta: number): void {
        for (let i = 0; i < this.plantset.length; i++) {
            this.plantset[i].plantCtrl.update(delta)
        }
    }

    async Viliageload(): Promise<void> {
        this.ReleaseAllPlantPool()
    }
    async Reload(): Promise<void> {
        this.ReleaseAllPlantPool()
        this.saveData = this.store.Plants
        if (this.saveData) this.saveData.forEach((e) => {
            this.CreatePlant(e)
        })
        
    }
    DeletePlant(id: number) {
        const plantset = this.plantset[id];
        plantset.used = false
        const idx = this.saveData.findIndex((item) => item.position.x == plantset.plant.CannonPos.x && item.position.z == plantset.plant.CannonPos.z)
        if (idx > -1) this.saveData.splice(idx, 1)
        this.playerCtrl.remove(plantset.plantCtrl.phybox)
        this.game.remove(plantset.plant.Meshs, plantset.plantCtrl.phybox)
    }
    async CreatePlant(plantEntry: PlantEntry) {
        const property = this.plantDb.get(plantEntry.id)
        if (!property) return
        
        let plantset = this.AllocatePlantPool(property, plantEntry.position)
        if (!plantset) plantset = await this.NewPlantEntryPool(plantEntry, property)
        this.playerCtrl.add(plantset.plantCtrl.phybox)
        this.game.add(plantset.plant.Meshs, plantset.plantCtrl.phybox)
    }
    async FarmLoader() {
        const p = SConf.DefaultPortalPosition
        // TODO need refac
        const tree = this.plantsFab.get(PlantId.AppleTree) as AppleTree
        const meshs = await this.loader.AppleTreeAsset.CloneModel()
        const ret = await Promise.all([
            tree.MassLoader(meshs, 1, p)
        ])
        return ret
    }
    moveEvent(v: THREE.Vector3) {
        if(!this.target) return
        const vx = (v.x > 0) ? 1 : (v.x < 0) ? - 1 : 0
        const vz = (v.z > 0) ? 1 : (v.z < 0) ? - 1 : 0

        this.target.Meshs.position.x += vx
        //this.meshs.position.y = 4.7
        this.target.Meshs.position.z += vz

        if (this.gphysic.Check(this.target)) {
            this.target.Meshs.position.x -= vx
            this.target.Meshs.position.z -= vz
        }
        // Check Collision Plant
    }
    allocPos = 0
    AllocatePlantPool(property: PlantProperty, pos: THREE.Vector3) {
        for (let i = 0; i < this.plantset.length; i++, this.allocPos++) {
            const e = this.plantset[i]
            if(e.plantId == property.plantId && e.used == false) {
                e.used = true
                e.plant.CannonPos.copy(pos)
                e.plantCtrl.phybox.position.copy(pos)
                return e
            }
            this.allocPos %= this.plantset.length
        }
    }
    ReleaseAllPlantPool() {
        this.plantset.forEach((set) => {
            set.used = false
            this.playerCtrl.remove(set.plantCtrl.phybox)
            this.game.remove(set.plant.Meshs, set.plantCtrl.phybox)
        })
    }
    async NewPlantEntryPool(plantEntry: PlantEntry, property: PlantProperty): Promise<PlantSet> {
        let tree;
        let meshs;
        switch (plantEntry.id) {
            case PlantId.AppleTree:
                tree = new AppleTree(this.loader.AppleTreeAsset)
                const [_meshs, _exist] = await this.loader.AppleTreeAsset.UniqModel("appletree" + this.plantset.length)
                
                meshs = _meshs
                break;
        }
        if (!tree || !meshs) {
            throw new Error("unexpected allocation");
        }

        await tree.MassLoader(meshs, 1, plantEntry.position)
        tree.Create()
        tree.Visible = true
        const treeCtrl = new TreeCtrl(this.plantset.length, tree, tree, property, plantEntry) 
        const plantset: PlantSet = { plantId: plantEntry.id, plant: tree, plantCtrl: treeCtrl, used: true }
        this.plantset.push(plantset)
        return plantset
    }
}