import * as THREE from "three";
import { GPhysics, IGPhysic } from "../../common/physics/gphysics";
import { PlayerCtrl } from "../player/playerctrl";
import { IPhysicsObject } from "../models/iobject";



export class ProjectileCtrl implements IGPhysic {
    raycast = new THREE.Raycaster()
    moveDirection = new THREE.Vector3()
    src = new THREE.Vector3()
    attackDist = 3
    
    speed = 7
    
    constructor(
        private projectile: IPhysicsObject,
        private playerCtrl: PlayerCtrl,
        gphysic: GPhysics,
    ){
        gphysic.Register(this)

    }
    start(dst: THREE.Vector3, src: THREE.Vector3) {
        const dist = src.distanceTo(dst)
        this.moveDirection.subVectors(dst, src)
        this.moveDirection.copy(this.moveDirection.multiplyScalar(1 / dist))
        this.src.copy(src)
    }
    update(delta: number): void {
        const v = this.moveDirection
        
        const movX = v.x * delta * this.speed
        const movY = v.y * delta * this.speed
        const movZ = v.z * delta * this.speed
        this.projectile.Meshs.position.x += movX
        this.projectile.Meshs.position.y += movY
        this.projectile.Meshs.position.z += movZ
    }
    checkAttack() {
        this.raycast.set(this.src, this.moveDirection.normalize())
        const intersects = this.raycast.intersectObjects(this.playerCtrl.targets)
        if (intersects.length > 0 && intersects[0].distance < this.attackDist) {
        }
    }
}