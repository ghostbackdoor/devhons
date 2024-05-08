import * as THREE from "three";
import { Loader } from "../../loader/loader"
import { EventController, EventFlag } from "../../event/eventctrl"
import { Game } from "../game"
import { GPhysics } from "../../common/physics/gphysics";
import { AppMode } from "../../app";
import { Legos } from "../bricks/legos";
import { EventBricks } from "../bricks/eventbricks";
import { Player } from "../player/player";
import { AttackOption, PlayerCtrl } from "../player/playerctrl";
import { math } from "../../../libs/math";
import { Drop } from "../../drop/drop";
import { MonDrop, MonsterDb  } from "./monsterdb";
import { EffectType } from "../../effects/effector";
import { IPhysicsObject } from "../models/iobject";
import { CreateMon } from "./createmon";
import { MonsterId } from "./monsterid";
import { NonLegos } from "../bricks/nonlegos";
import { DeckType } from "../../inventory/items/deck";

export type MonsterSet = {
    monModel: IPhysicsObject,
    monCtrl: IMonsterCtrl
    live: boolean
    respawn: boolean
    deadtime: number
    initPos?: THREE.Vector3
}
export interface IMonsterCtrl {
    get MonsterBox(): MonsterBox
    get Drop(): MonDrop[] | undefined
    Respawning(): void
    ReceiveDemage(demage: number, effect?: EffectType): boolean 
}

export class MonsterBox extends THREE.Mesh {
    constructor(public Id: number, public ObjName: string, public MonId: MonsterId,
        geo: THREE.BoxGeometry, mat: THREE.MeshBasicMaterial
    ) {
        super(geo, mat)
        this.name = ObjName
    }
}
export interface IPlayerAction {
    Init(): void
    Uninit(): void
    Update(delta: number, v: THREE.Vector3, dist: number): IPlayerAction
}

export class Monsters {
    monsters = new Map<MonsterId, MonsterSet[]>()
    keytimeout?:NodeJS.Timeout
    respawntimeout?:NodeJS.Timeout
    mode = AppMode.Close
    createMon = new CreateMon(this.loader, this.eventCtrl, this.player, this.legos, this.nonlegos, this.eventBricks, this.gphysic, this.monDb)

    constructor(
        private loader: Loader,
        private eventCtrl: EventController,
        private game: Game,
        private player: Player,
        private playerCtrl: PlayerCtrl,
        private legos: Legos,
        private nonlegos: NonLegos,
        private eventBricks: EventBricks,
        private gphysic: GPhysics,
        private drop: Drop,
        private monDb: MonsterDb
    ) {
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.mode = mode
            if(mode != AppMode.Play) return
            switch (e) {
                case EventFlag.Start:
                    //this.InitMonster()
                    break
                case EventFlag.End:
                    this.ReleaseMonster()
                    break
            }
        })
        eventCtrl.RegisterAttackEvent("mon", (opts: AttackOption[]) => {
            if(this.mode != AppMode.Play) return
            opts.forEach((opt) => {
                let obj = opt.obj as MonsterBox
                if (obj == null) return

                const mon = this.monsters.get(obj.MonId)
                if(!mon) throw new Error("unexpected value");
                
                const z = mon[obj.Id]
                if (!z.live) return

                this.ReceiveDemage(z, opt.damage, opt.effect)
            })
        })
        eventCtrl.RegisterAttackEvent("monster", (opts: AttackOption[]) => {
            if(this.mode != AppMode.Play) return
            const pos = this.player.CannonPos
            const dist = opts[0].distance
            const damage = opts[0].damage
            const effect = opts[0].effect
            if(dist == undefined) return
            this.monsters.forEach((mon) => {
                for (let i = 0; i < mon.length; i++) {
                    const z = mon[i]
                    if (!z.live) continue
                    const betw = z.monModel.CannonPos.distanceTo(pos)
                    if (betw < dist) {
                        this.ReceiveDemage(z, damage, effect)
                    }
                }
            })
        })
    }
    ReceiveDemage(z: MonsterSet, damage: number, effect?: EffectType) {
        if (z && !z.monCtrl.ReceiveDemage(damage, effect)) {
            z.live = false
            z.deadtime = new Date().getTime()
            this.drop.DropItem(
                new THREE.Vector3(z.monModel.CannonPos.x, this.player.CenterPos.y, z.monModel.CannonPos.z), 
                z.monCtrl.Drop
            )
            this.playerCtrl.remove(z.monCtrl.MonsterBox)
            this.respawntimeout = setTimeout(() => {
                if(z.respawn) {
                    this.Spawning(z.monCtrl.MonsterBox.MonId, z.respawn, z, z.initPos)
                }
            }, THREE.MathUtils.randInt(8000, 15000))
        }
    }
    async RandomDeckMonsters(deck: DeckType) {
        console.log("Start Random Deck---------------")

        this.RandomSpawning(deck)
    }
    RandomSpawning(deck: DeckType) {
        let mon = this.monsters.get(deck.monId)
        if (!mon) {
            mon = []
            this.monsters.set(deck.monId, mon)
        }
        
        if(mon.length < deck.maxSpawn) {
            this.Spawning(deck.monId, true)
            this.keytimeout = setTimeout(() => {
                this.RandomSpawning(deck)
            }, 5000)
        }
    }
    async Resurrection(id: MonsterId) {
        let mon = this.monsters.get(id)
        if(!mon) {
            mon = []
            this.monsters.set(id, mon)
        }
        const now = new Date().getTime()
        const set = mon.find((e) => e.live == false && now - e.deadtime > 5000)
        return set
    }
    async CreateMonster(id: MonsterId, respawn: boolean, pos?: THREE.Vector3) {
        let set
        if (!respawn) {
            // respawn 이 트루면 죽을 때 타이머로 부활이 설정되어 있다.
            set = await this.Resurrection(id)
        }
        console.log("Create", set, this.monsters.get(id))
        this.Spawning(id, respawn, set, pos)
    }
    ReleaseMonster() {
        this.monsters.forEach((mon) => {
            mon.forEach((z) => {
                z.monModel.Visible = false
                z.live = false
                this.playerCtrl.remove(z.monCtrl.MonsterBox)
                this.game.remove(z.monModel.Meshs, z.monCtrl.MonsterBox)
            })
            console.log("Release", mon)
        })
        
        if (this.keytimeout != undefined) clearTimeout(this.keytimeout)
        if (this.respawntimeout != undefined) clearTimeout(this.respawntimeout)
    }

    async Spawning(monId: MonsterId, respawn:boolean, monSet?: MonsterSet, pos?: THREE.Vector3) {
        //const zSet = await this.CreateZombie()
        if (this.mode != AppMode.Play) return
        let mon = this.monsters.get(monId)
        if (!mon) {
            mon = []
            this.monsters.set(monId, mon)
        }

        if (!monSet) {
            monSet = await this.createMon.Call(monId, mon.length)
        }
        mon.push(monSet)

        if(!pos) {
            monSet.monModel.CannonPos.x = this.player.CannonPos.x + math.rand_int(-20, 20)
            monSet.monModel.CannonPos.z = this.player.CannonPos.z + math.rand_int(-20, 20)
        } else {
            monSet.monModel.CannonPos.copy(pos)
            monSet.initPos = pos
        }

        while (this.gphysic.Check(monSet.monModel)) {
            monSet.monModel.CannonPos.y += 0.5
        }
        monSet.respawn = respawn
        monSet.live = true
        monSet.monCtrl.Respawning()

        monSet.monModel.Visible = true
        console.log("Spawning", monSet, mon)

        this.playerCtrl.add(monSet.monCtrl.MonsterBox)
        this.game.add(monSet.monModel.Meshs, monSet.monCtrl.MonsterBox)
    }
}