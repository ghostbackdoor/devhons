import * as THREE from "three";
import { GPhysics, IGPhysic } from "../../../common/physics/gphysics"
import { IPhysicsObject } from "../../models/iobject";
import { Legos } from "../../bricks/legos";
import { EventBricks } from "../../bricks/eventbricks";
import { AttackMState, DyingMState, IdleMState, RunMState } from "./minataurstate";
import { Minataur } from "./minataur";
import { IPlayerAction, MonsterBox } from "../../monsters/monsters";
import { MonsterId } from "../monsterid";


export class MinataurCtrl implements IGPhysic{
    IdleSt = new IdleMState(this, this.monster, this.gphysic)
    AttackSt = new AttackMState(this, this.monster, this.gphysic)
    RunSt = new RunMState(this, this.monster, this.gphysic)
    DyingSt = new DyingMState(this, this.monster, this.gphysic)

    currentState: IPlayerAction = this.IdleSt
    raycast = new THREE.Raycaster()
    dir = new THREE.Vector3(0, 0, 0)
    moveDirection = new THREE.Vector3()
    health = 10
    phybox: MonsterBox

    constructor(
        id: number,
        private player: IPhysicsObject, 
        private monster: Minataur, 
        private legos: Legos,
        private eventBricks: EventBricks,
        private gphysic: GPhysics
    ) {
        gphysic.Register(this)
        const size = monster.Size
        const geometry = new THREE.BoxGeometry(size.x * 3, size.y, size.z * 3)
        const material = new THREE.MeshBasicMaterial({ 
            //color: 0xD9AB61,
            transparent: true,
            opacity: 0,
            color: 0xff0000,
        })
        this.phybox = new MonsterBox(id, "Minataur", MonsterId.Minotaur, geometry, material)
        this.phybox.position.copy(this.monster.CannonPos)
        this.phybox.position.y += size.y / 2
    }

    update(delta: number): void {
        if (!this.monster.Visible) return

        const dist = this.monster.CannonPos.distanceTo(this.player.CannonPos)

        if (this.health > 0) {
            this.dir.subVectors(this.player.CannonPos, this.monster.CannonPos)
            this.raycast.set(this.monster.CannonPos, this.dir.normalize())

            let find = false
            if (this.legos.instancedBlock != undefined)
                find = this.CheckVisible(this.legos.instancedBlock, dist)
            if (this.legos.bricks2.length > 0 && !find)
                find = this.CheckVisibleMeshs(this.legos.bricks2, dist)
            if (this.eventBricks.instancedBlock != undefined && !find)
                find = this.CheckVisible(this.eventBricks.instancedBlock, dist)
            if (this.eventBricks.bricks2.length > 0 && !find)
                find = this.CheckVisibleMeshs(this.eventBricks.bricks2, dist)

            if (find) {
                // not visible player
                this.moveDirection.set(0, 0, 0)
            } else {
                this.moveDirection.copy(this.dir)
            }
        }

        this.currentState = this.currentState.Update(delta, this.moveDirection, dist)
        this.monster.update()

        this.phybox.position.copy(this.monster.CannonPos)
    }
    ReceiveDemage(demage: number): boolean {
        if (this.health <= 0) return false
        this.monster.DamageEffect(demage)
        this.health -= demage
        if (this.health <= 0) {
            this.DyingSt.Init()
            this.currentState = this.DyingSt
            return false
        }
        return true
    }
    CheckVisible(physBox: THREE.InstancedMesh, dist: number): boolean {
        const intersects = this.raycast.intersectObject(physBox, false)
        if (intersects.length > 0 && intersects[0].distance < dist) {
            return true //keep searching
        }
        return false
    }
    CheckVisibleMeshs(physBox: THREE.Mesh[], dist: number): boolean {
        const intersects = this.raycast.intersectObjects(physBox, false)
        if (intersects.length > 0 && intersects[0].distance < dist) {
            return true //keep searching
        }
        return false
    }
}