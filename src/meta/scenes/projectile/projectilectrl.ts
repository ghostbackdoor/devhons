import * as THREE from "three";
import { AttackType, PlayerCtrl } from "../player/playerctrl";
import { IPhysicsObject } from "../models/iobject";
import { MonsterProperty } from "../monsters/monsterdb";
import { EventController } from "../../event/eventctrl";



export class ProjectileCtrl {
    raycast = new THREE.Raycaster()
    moveDirection = new THREE.Vector3()
    attackDist = 2
    maxTarget = 1
    live = false
    get Live() { return this.live }
    
    constructor(
        private projectile: IPhysicsObject,
        private playerCtrl: PlayerCtrl,
        private eventCtrl: EventController,
        private property: MonsterProperty,
    ){
    }
    Release () {
        this.projectile.Visible = false
        this.live = false
    }
    start(src: THREE.Vector3, dir: THREE.Vector3) {
        this.projectile.CannonPos.copy(src)
        this.moveDirection.copy(dir)
        this.projectile.Visible = true
        this.live = true
    }
    update(delta: number): void {
        if (!this.live) return
        const v = this.moveDirection
        
        this.projectile.Meshs.position.x += v.x * delta * this.property.speed
        this.projectile.Meshs.position.y += v.y * delta * this.property.speed
        this.projectile.Meshs.position.z += v.z * delta * this.property.speed
    }
    attack() {
        if (!this.live) return false
        const msgs = new Map()
        this.playerCtrl.targets.forEach(obj => {
            const dist = obj.position.distanceTo(this.projectile.CannonPos)
            if(this.attackDist < dist) return
            const mons = msgs.get(obj.name)
                const msg = {
                        type: AttackType.NormalSwing,
                        damage: THREE.MathUtils.randInt(this.property.damageMin, this.property.damageMax),
                        obj: obj
                    }
                if(mons == undefined) {
                    msgs.set(obj.name, [msg])
                } else {
                    mons.push(msg)
                }
        })
        if (msgs.size > 0) {
            msgs.forEach((v, k) => {
                this.eventCtrl.OnAttackEvent(k, v)
            })
            return true
        }
        
        return false
    }
}