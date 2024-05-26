import * as THREE from "three";
import { GPhysics } from "../../common/physics/gphysics"
import { ActionType } from "../player/player"
import { Fly } from "./fly"
import { FlyCtrl } from "./flyctrl"
import { MonsterProperty } from "../monsters/monsterdb";
import { AttackType, PlayerCtrl } from "../player/playerctrl";
import { IMonsterAction } from "../monsters/monsters";


class State {
    protectDist = 5
    constructor(
        protected fCtrl: FlyCtrl,
        protected fly: Fly,
        protected gphysic: GPhysics
    ) { }

    CheckRun(v: THREE.Vector3) {
        if (v.x || v.z) {
            this.fCtrl.RunSt.Init()
            return this.fCtrl.RunSt
        }
    }
    CheckGravity() {
        this.fly.Meshs.position.y -= 0.5
        if (!this.gphysic.Check(this.fly)) {
            this.fly.Meshs.position.y += 0.5
            this.fCtrl.JumpSt.Init()
            this.fCtrl.JumpSt.velocity_y = 0
            return this.fCtrl.JumpSt
        }
        this.fly.Meshs.position.y += 0.5
    }
}


export class IdleFState extends State implements IMonsterAction {
    raycast = new THREE.Raycaster()
    attackDir = new THREE.Vector3()
    attackDist = 5
    ZeroV = new THREE.Vector3(0, 0, 0)
    YV = new THREE.Vector3(0, 1, 0)
    MX = new THREE.Matrix4()
    QT = new THREE.Quaternion()
    dir = new THREE.Vector3(0, 0, 0)
    time = 0
    watching = 2
    speed = 1

    constructor(zCtrl: FlyCtrl, zombie: Fly, private playerCtrl: PlayerCtrl, gphysic: GPhysics) {
        super(zCtrl, zombie, gphysic)
        this.Init()
    }
    Init(): void {
        console.log("helper: Idle Init!!")
        this.fly.ChangeAction(ActionType.Idle)
        this.time = 0
    }
    Uninit(): void {
        
    }
    Update(delta: number, v: THREE.Vector3, dist: number): IMonsterAction {
        if(dist > this.protectDist) {
            const checkRun = this.CheckRun(v)
            if (checkRun != undefined) return checkRun
        }
        const attack = this.checkAttack()
        if (attack) return attack

        this.time += delta

        if (this.time > this.watching) {
            this.time = 0

            this.dir.x = THREE.MathUtils.randFloat(0, 1)
            this.dir.y = v.y
            this.dir.z = THREE.MathUtils.randFloat(0, 1)
        }
        if (dist > this.protectDist - 0.3) {
            this.time = 0
            this.dir.copy(v.multiplyScalar(1 / dist))
        }

        const movX = this.dir.x * delta * this.speed
        const movY = this.dir.y * delta * this.speed
        const movZ = this.dir.z * delta * this.speed
        this.fly.Meshs.position.x += movX
        this.fly.Meshs.position.y += movY
        this.fly.Meshs.position.z += movZ

        this.dir.y = 0
        const mx = this.MX.lookAt(this.dir, this.ZeroV, this.YV)
        const qt = this.QT.setFromRotationMatrix(mx)
        this.fly.Meshs.quaternion.copy(qt)
        return this
    }

    checkAttack() {
        this.fly.Meshs.getWorldDirection(this.attackDir)
        this.raycast.set(this.fly.CenterPos, this.attackDir.normalize())
    
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
            this.fCtrl.AttackSt.InitWithTarget(intersects[0].object as THREE.Mesh)
            return this.fCtrl.AttackSt
        }
    }
}
export class JumpFState implements IMonsterAction {
    speed = 10
    velocity_y = 16
    dirV = new THREE.Vector3(0, 0, 0)
    ZeroV = new THREE.Vector3(0, 0, 0)
    YV = new THREE.Vector3(0, 1, 0)
    MX = new THREE.Matrix4()
    QT = new THREE.Quaternion()

    constructor(private ctrl: FlyCtrl, private zombie: Fly, private gphysic: GPhysics) { }
    Init(): void {
        console.log("helper: Jump Init!!")
        this.velocity_y = 16
    }
    Uninit(): void {
        this.velocity_y = 16
    }
    Update(delta: number, v: THREE.Vector3): IMonsterAction {
        const movX = v.x * delta * this.speed
        const movZ = v.z * delta * this.speed
        const movY = this.velocity_y * delta

        this.zombie.Meshs.position.x += movX
        this.zombie.Meshs.position.z += movZ

        if (movX || movZ) {
            this.dirV.copy(v)
            this.dirV.y = 0
            const mx = this.MX.lookAt(this.dirV, this.ZeroV, this.YV)
            const qt = this.QT.setFromRotationMatrix(mx)
            this.zombie.Meshs.quaternion.copy(qt)
        }

        if (this.gphysic.Check(this.zombie)) {
            this.zombie.Meshs.position.x -= movX
            this.zombie.Meshs.position.z -= movZ
        }

        this.zombie.Meshs.position.y += movY

        if (this.gphysic.Check(this.zombie)) {
            this.zombie.Meshs.position.y -= movY

            this.Uninit()
            this.ctrl.IdleSt.Init()
            return this.ctrl.IdleSt
        }
        this.velocity_y -= 9.8 * 3 *delta

        return this
    }
}
export class AttackFState extends State implements IMonsterAction {
    raycast = new THREE.Raycaster()
    dirV = new THREE.Vector3(0, 0, 0)
    ZeroV = new THREE.Vector3(0, 0, 0)
    YV = new THREE.Vector3(0, 1, 0)
    MX = new THREE.Matrix4()
    QT = new THREE.Quaternion()
    attackDist = 5
    attackDir = new THREE.Vector3()
    keytimeout?:NodeJS.Timeout
    attackSpeed = this.property.attackSpeed
    attackProcess = false
    attackTime = 0
    attackDamageMax = this.property.damageMax
    attackDamageMin = this.property.damageMin
    target?: THREE.Mesh

    constructor(zCtrl: FlyCtrl, protected fly: Fly, gphysic: GPhysics, private playerCtrl: PlayerCtrl, private property: MonsterProperty) {
        super(zCtrl, fly, gphysic)
    }
    Init(): void {
        console.log("helper: Attack Init!!")
        const duration = this.fly.ChangeAction(ActionType.Punch)
        if (duration != undefined) this.attackSpeed = duration * 0.8
        this.attackTime = this.attackSpeed
    }
    InitWithTarget(target: THREE.Mesh) {
        this.target = target
        this.Init()
    }
    Uninit(): void {
        if (this.keytimeout != undefined) clearTimeout(this.keytimeout)
    }
    Update(delta: number, v: THREE.Vector3, dist: number): IMonsterAction {
        if (dist > this.attackDist) {
            const checkRun = this.CheckRun(v)
            if (checkRun != undefined) return checkRun
        }
        if(this.attackProcess) return this
        this.attackTime += delta
        if (this.attackTime / this.attackSpeed < 1) {
            return this
        }
        this.attackTime -= this.attackSpeed
        this.attackProcess = true

        this.keytimeout = setTimeout(() => {
            this.attack()
        }, this.attackSpeed * 1000 * 0.4)

        return this
    }
    attack() {
        if(!this.target) return
        this.attackDir.subVectors(this.target.position, this.fly.CenterPos)
    
        const mx = this.MX.lookAt(this.attackDir, this.ZeroV, this.YV)
        const qt = this.QT.setFromRotationMatrix(mx)
        this.fly.Meshs.quaternion.copy(qt)

        this.raycast.set(this.fly.CenterPos, this.attackDir.normalize())
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
            const msgs = new Map()
            intersects.forEach((obj) => {
                if (obj.distance> this.attackDist) return false
                const mons = msgs.get(obj.object.name)
                const msg = {
                        type: AttackType.NormalSwing,
                        damage: THREE.MathUtils.randInt(this.attackDamageMin, this.attackDamageMax),
                    }
                if(mons == undefined) {
                    msgs.set(obj.object.name, [msg])
                } else {
                    mons.push(msg)
                }
            })
        }

        this.attackProcess = false
    }
}

export class DyingFState extends State implements IMonsterAction {
    fadeMode = false
    fade = 1
    constructor(zCtrl: FlyCtrl, zombie: Fly, gphysic: GPhysics) {
        super(zCtrl, zombie, gphysic)
    }
    Init(): void {
        this.fadeMode = (this.fly.dyingClip == undefined)
        this.fade = 1
        if (this.fadeMode) this.fly.StopAnimation()
        else this.fly.ChangeAction(ActionType.Dying)
    }
    Uninit(): void {
        
    }
    Update(): IMonsterAction {
        return this
    }
}
export class RunFState extends State implements IMonsterAction {
    speed = this.property.speed
    constructor(fCtrl: FlyCtrl, fly: Fly, gphysic: GPhysics, private property: MonsterProperty) {
        super(fCtrl, fly, gphysic)
    }
    Init(): void {
        this.fly.ChangeAction(ActionType.Run)
    }
    Uninit(): void {
        
    }

    ZeroV = new THREE.Vector3(0, 0, 0)
    YV = new THREE.Vector3(0, 1, 0)
    MX = new THREE.Matrix4()
    QT = new THREE.Quaternion()

    Update(delta: number, v: THREE.Vector3, dist: number): IMonsterAction {
        const checkGravity = this.CheckGravity()
        if (checkGravity != undefined) return checkGravity

        if(dist < this.protectDist) {
            this.fCtrl.IdleSt.Init()
            return this.fCtrl.IdleSt
        }
        

        const movX = v.x * delta * this.speed
        const movY = v.y * delta * this.speed
        const movZ = v.z * delta * this.speed
        this.fly.Meshs.position.x += movX
        this.fly.Meshs.position.y += movY
        this.fly.Meshs.position.z += movZ

        v.y = 0
        const mx = this.MX.lookAt(v, this.ZeroV, this.YV)
        const qt = this.QT.setFromRotationMatrix(mx)
        this.fly.Meshs.quaternion.copy(qt)

        /*
        if (this.gphysic.Check(this.fly)){
            this.fly.Meshs.position.x -= movX
            this.fly.Meshs.position.z -= movZ
        }
        */
        return this
    }
}
