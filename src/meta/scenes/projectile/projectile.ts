import { AppMode } from "../../app";
import { Canvas } from "../../common/canvas";
import { EventController, EventFlag } from "../../event/eventctrl";
import { Loader } from "../../loader/loader";
import { Game } from "../game";
import { IPhysicsObject } from "../models/iobject";
import { IViewer } from "../models/iviewer";
import { MonsterDb } from "../monsters/monsterdb";
import { MonsterId } from "../monsters/monsterid";
import { PlayerCtrl } from "../player/playerctrl";
import { DefaultBall } from "./defaultball";
import { ProjectileCtrl } from "./projectilectrl";

export type ProjectileMsg = {
    id: MonsterId
    src: THREE.Vector3
    dir: THREE.Vector3
}

export type ProjectileSet = {
    model: IPhysicsObject
    ctrl: ProjectileCtrl
}

export class Projectile implements IViewer {
    projectiles = new Map<MonsterId, ProjectileSet[]>()
    mode = AppMode.Close
    processing = false

    constructor(
        _: Loader,
        canvas: Canvas,
        private eventCtrl: EventController,
        private game: Game,
        private playerCtrl: PlayerCtrl,
        private monDb: MonsterDb,
    ) {
        canvas.RegisterViewer(this)
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.mode = mode
            if(mode != AppMode.Play) return
            switch (e) {
                case EventFlag.Start:
                    this.processing = true
                    //this.InitMonster()
                    break
                case EventFlag.End:
                    this.processing = false
                    this.ReleaseAllProjPool()
                    break
            }
        })
        eventCtrl.RegisterProjectileEvent((opt: ProjectileMsg) => {
            this.AllocateProjPool(opt.id, opt.src, opt.dir)
        })
    }
    CreateProjectile(id: MonsterId, src: THREE.Vector3, dir: THREE.Vector3) {
        const property = this.monDb.GetItem(id)
        const ball = new DefaultBall(.1)
        const ctrl = new ProjectileCtrl(ball, this.playerCtrl, this.eventCtrl, property)
        ctrl.start(src, dir)

        const set: ProjectileSet = {
            model: ball, ctrl: ctrl
        }
        return set
    }
    update(delta: number): void {
        if (!this.processing) return
        this.projectiles.forEach(a => {
            a.forEach(s => {
                s.ctrl.update(delta)
                if (s.ctrl.attack()) {
                    this.Release(s)
                }
            })
        })
    }
    resize(): void { }

    Release(entry: ProjectileSet) {
        entry.ctrl.Release()
        this.game.remove(entry.model.Meshs)
    }
    AllocateProjPool(id: MonsterId, src: THREE.Vector3, dir: THREE.Vector3) {
        let pool = this.projectiles.get(id)
        if(!pool) pool = []
        let set = pool.find((e) => e.ctrl.Live == false)
        if (!set) {
            set = this.CreateProjectile(id, src, dir)
            pool.push(set)
        } else {
            set.ctrl.start(src, dir)
        }
        this.projectiles.set(id, pool)
        this.game.add(set.model.Meshs)
        return set
    }
    ReleaseAllProjPool() {
        this.projectiles.forEach(a => {
            a.forEach(s => {
                s.ctrl.Release()
                this.game.remove(s.model.Meshs)
            })
        })
    }
    async NewFurnEntryPool() {
    }
}