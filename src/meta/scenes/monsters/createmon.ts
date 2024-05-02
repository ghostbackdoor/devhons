import * as THREE from "three";
import { Loader } from "../../loader/loader"
import { MonsterSet } from "./monsters"
import { EventController } from "../../event/eventctrl"
import { Player } from "../player/player"
import { Legos } from "../bricks/legos"
import { EventBricks } from "../bricks/eventbricks"
import { GPhysics } from "../../common/physics/gphysics"
import { Zombie } from "./zombie/zombie"
import { ZombieCtrl } from "./zombie/zombiectrl"
import { MonsterDb } from "./monsterdb"
import { Char } from "../../loader/assetmodel";
import { MonsterId } from "./monsterid";
import { NonLegos } from "../bricks/nonlegos";

export class CreateMon {
    monsterMap = new Map<MonsterId, Function>()
    constructor(
        private loader: Loader,
        private eventCtrl: EventController,
        private player: Player,
        private legos: Legos,
        private nonlegos: NonLegos,
        private eventBricks: EventBricks,
        private gphysic: GPhysics,
        private monDb: MonsterDb,
    ) {
        this.monsterMap.set(MonsterId.Zombie, async (id: number, pos?: THREE.Vector3) => await this.CreateZombie(id, pos))
    }
    async Call(monId: MonsterId, id: number, pos?: THREE.Vector3): Promise<MonsterSet> {
        const func = this.monsterMap.get(monId)
        return (func) ? await func(id, pos) : undefined
    }
    async CreateZombie(id: number, pos?: THREE.Vector3): Promise<MonsterSet> {
        if(!pos) pos = new THREE.Vector3(10, 0, 15)
        const zombie = new Zombie(this.loader.ZombieAsset)
        await zombie.Loader(this.loader.GetAssets(Char.Zombie),
                pos, "Zombie", id)

        const zCtrl = new ZombieCtrl(id, this.player, zombie, this.legos, this.nonlegos, this.eventBricks, this.gphysic,
            this.eventCtrl, this.monDb.GetItem(MonsterId.Zombie))
        const monSet: MonsterSet =  { monModel: zombie, monCtrl: zCtrl, live: true, respawn: false}
        return monSet
    }
}