import * as THREE from "three";
import { Loader } from "../../loader/loader"
import { MonsterSet } from "./monsters"
import { EventController } from "../../event/eventctrl"
import { Player } from "../player/player"
import { Legos } from "../bricks/legos"
import { EventBricks } from "../bricks/eventbricks"
import { GPhysics } from "../../common/physics/gphysics"
import { Zombie } from "./zombie/zombie"
import { MonsterCtrl } from "./zombie/monctrl"
import { MonsterDb } from "./monsterdb"
import { MonsterId } from "./monsterid";
import { NonLegos } from "../bricks/nonlegos";
import { Game } from "../game";
import { Effector } from "../../effects/effector";

export class CreateMon {
    constructor(
        private loader: Loader,
        private eventCtrl: EventController,
        private player: Player,
        private legos: Legos,
        private nonlegos: NonLegos,
        private eventBricks: EventBricks,
        private gphysic: GPhysics,
        private game: Game,
        private monDb: MonsterDb,
    ) {
    }
    async Call(monId: MonsterId, id: number, pos?: THREE.Vector3): Promise<MonsterSet> {
        if(!pos) pos = new THREE.Vector3(10, 0, 15)
        const property = this.monDb.GetItem(monId)
        const asset = this.loader.GetAssets(property.model)
        const monster = new Zombie(asset, monId, new Effector(this.game))
        await monster.Loader(pos, monId as string, id)

        const zCtrl = new MonsterCtrl(id, this.player, monster, this.legos, this.nonlegos, this.eventBricks, this.gphysic,
            this.eventCtrl, property)
        const monSet: MonsterSet =  { 
            monModel: monster, monCtrl: zCtrl, live: true, respawn: false, deadtime: new Date().getTime()
        }
        return monSet
    }
}