import * as THREE from "three";
import { EventController, EventFlag } from "../event/eventctrl";
import { Game } from "./game";
import { Player } from "./player/player";
import { AttackOption, PlayerCtrl } from "./player/playerctrl";
import { Loader } from "../loader/loader";
import { IViewer } from "./models/iviewer";
import { Canvas } from "../common/canvas";
import { AppMode } from "../app";
import { Deck, DeckId, DeckType } from "../inventory/items/deck";
import { Effector } from "../effects/effector";
import { IKeyCommand, KeyType } from "../event/keycommand";
import { Zombie } from "./monsters/zombie/zombie";
import { IPhysicsObject } from "./models/iobject";
import { CircleEffect } from "./models/circle";
import { IModelReload, ModelStore } from "../common/modelstore";
import { MonsterId } from "./monsters/monsterid";
import { MonsterDb } from "./monsters/monsterdb";

export type DeckMsg = {
    id: DeckId,
    time: number,
    locatOnOff: boolean,
    enable: boolean
    rand: boolean
}

export type DeckEntry = {
    id: DeckId,
    position: THREE.Vector3
    time: number
    enable: boolean
    rand: boolean
}

export class DeckBox extends THREE.Mesh {
    constructor(public Id: number, public ObjName: string,
        geo: THREE.BoxGeometry, mat: THREE.MeshBasicMaterial
    ) {
        super(geo, mat)
        this.name = ObjName
    }
}

export type DeckSet = {
    monModel: IPhysicsObject,
    effect: IPhysicsObject,
    box: DeckBox
    monId: MonsterId
    used: boolean
}

export class MonDeck implements IModelReload, IViewer {
    controllable = false
    saveData = this.store.Deck
    need2Reload = false
    deckSet: DeckSet[] = []
    torus = new CircleEffect(2)
    deck?: DeckType
    lastDeckMsg?: DeckMsg
    material = new THREE.MeshBasicMaterial({
        //color: 0xD9AB61,
        transparent: true,
        opacity: .5,
        color: 0xff0000,
    })

    constructor(
        private loader: Loader,
        eventCtrl: EventController,
        private game: Game,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        canvas: Canvas,
        private monDb: MonsterDb,
        private store: ModelStore,
    ) {
        canvas.RegisterViewer(this)
        store.RegisterStore(this)
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag, args: any) => {
            if (mode != AppMode.Weapon) return
            switch (e) {
                case EventFlag.Start:
                    this.LazyLoad()
                    this.VisibleOn()
                    break
                case EventFlag.End:
                    this.VisibleOff()
                    this.controllable = false
                    break
                case EventFlag.Message:
                    console.log(args[0])
                    const deckMsg: DeckMsg = args[0]
                    this.controllable = deckMsg.locatOnOff
                    this.lastDeckMsg = deckMsg
                    this.UpdateSetup(deckMsg)
                    if (deckMsg.locatOnOff) {
                        if (deckMsg.id) this.deck = Deck.DeckDb.get(deckMsg.id)
                        if (deckMsg.enable) {
                            this.DeckEnable(deckMsg.enable)
                        }
                    }
                    break
            }
        })

        eventCtrl.RegisterAttackEvent("deck", (opts: AttackOption[]) => {
            opts.forEach((opt) => {
                let obj = opt.obj as DeckBox
                if (obj == null) return
                this.DeleteDeck(obj.Id)
            })
        })

        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if (!this.controllable || !this.deck) return
            switch (keyCommand.Type) {
                case KeyType.Action1:
                    const e: DeckEntry = {
                        id: this.deck.id,
                        position: new THREE.Vector3().copy(this.player.CannonPos),
                        time: this.lastDeckMsg?.time ?? 0,
                        enable: this.lastDeckMsg?.enable ?? false,
                        rand: this.lastDeckMsg?.rand ?? true,
                    }
                    this.saveData.push(e)
                    this.CreateDeck(e)
                    break;
                default:
                    break;
            }
        })
    }
    UpdateSetup(msg: DeckMsg) {
        this.saveData.forEach((e) => {
            if (e.id == msg.id) {
                e.enable = msg.enable
                e.rand = msg.rand
                e.time = msg.time
            }
        })
    }
    DeckEnable(enable: boolean) {
        this.saveData.forEach((e) => e.enable = enable)
    }
    VisibleOn() {
        this.deckSet.forEach((set) => {
            if (!set.used) return
            this.playerCtrl.add(set.box)
            this.game.add(set.box, set.effect.Meshs, set.monModel.Meshs)
        })
    }
    VisibleOff() {
        this.deckSet.forEach((set) => {
            if (!set.used) return
            this.playerCtrl.remove(set.box)
            this.game.remove(set.box, set.effect.Meshs, set.monModel.Meshs)
        })
    }
    DeleteDeck(id: number) {
        const set = this.deckSet[id]
        set.used = false

        const idx = this.saveData.findIndex((item) => item.position.x == set.monModel.CannonPos.x && item.position.z == set.monModel.CannonPos.z)
        if (idx > -1) this.saveData.splice(idx, 1)

        this.playerCtrl.remove(set.box)
        this.game.remove(set.box, set.effect.Meshs, set.monModel.Meshs)
    }

    async CreateDeck(deckEntry: DeckEntry) {
        const deck = Deck.DeckDb.get(deckEntry.id)
        if (!deck) return

        let deckset = this.AllocateDeckPool(deck, deckEntry.position)
        if (!deckset) deckset = await this.NewDeckEntryPool(deck, deckEntry.position)

        this.playerCtrl.add(deckset.box)
        this.game.add(deckset.monModel.Meshs, deckset.effect.Meshs, deckset.box)
    }
    async LazyLoad() {
        if (!this.need2Reload) return
        this.need2Reload = false

        if (this.saveData) for (let i = 0; i < this.saveData.length; i++) {
            const e = this.saveData[i]
            await this.CreateDeck(e)
        }
    }
    async Viliageload(): Promise<void> { }
    async Reload(): Promise<void> {
        this.ReleaseAllDeckPool()
        this.saveData = this.store.Deck
        this.need2Reload = true
    }

    resize(): void { }
    update(): void {
        this.deckSet.forEach((e) => {
            if (e.monModel.update) e.monModel.update()
            if (e.effect.update) e.effect.update()
        })
    }
    allocPos = 0
    AllocateDeckPool(deckType: DeckType, pos: THREE.Vector3) {
        for (let i = 0; i < this.deckSet.length; i++, this.allocPos++) {
            const e = this.deckSet[i]
            if(e.monId == deckType.monId && e.used == false) {
                e.used = true
                e.monModel.CannonPos.copy(pos)
                e.effect.CannonPos.copy(pos)
                e.box.position.copy(pos)
                return e
            }
            this.allocPos %= this.deckSet.length
        }
    }
    ReleaseAllDeckPool() {
        this.deckSet.forEach((set) => {
            set.used = false
            this.playerCtrl.remove(set.box)
            this.game.remove(set.box, set.effect.Meshs, set.monModel.Meshs)
        })
    }
    async NewDeckEntryPool(deck: DeckType, pos: THREE.Vector3): Promise<DeckSet> {
        const property = this.monDb.GetItem(deck.monId)
        const asset = this.loader.GetAssets(property.model)
        const mon = new Zombie(asset, property.id, new Effector(this.game))
        const name = (deck.monId as string) + "Deck"
        await mon.Loader(pos, name, this.deckSet.length)
        mon.Visible = true

        const geometry = new THREE.BoxGeometry(mon.Size.x * 4, mon.Size.y, mon.Size.z * 3)
        const box = new DeckBox(this.deckSet.length, "deck", geometry, this.material)
        const eff = this.torus.clone()

        eff.visible = true
        box.visible = false
        eff.position.copy(mon.CenterPos)
        box.position.copy(mon.CenterPos)
        const deckset = { monModel: mon, effect: eff, box: box, monId: deck.monId, used: true }
        this.deckSet.push(deckset)
        return deckset
    }
}