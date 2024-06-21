import * as THREE from "three";
import { EventController, EventFlag } from "../../event/eventctrl";
import { Brick } from "./brick";
import { BrickGuideType } from "./brickguide";
import { Brick2 } from "./brick2";
import { IModelReload, ModelStore } from "../../common/modelstore";
import { GPhysics } from "../../common/physics/gphysics";
import { Bricks, EventBrick } from "./bricks";
import { AppMode } from "../../app";
import { Player } from "../player/player";



export class EventBricks extends Bricks implements IModelReload{
    bricks: Brick[] = []

    get Size(): THREE.Vector3 { return this.brickSize }

    constructor(
        scene: THREE.Scene,
        eventCtrl: EventController,
        store: ModelStore,
        physics: GPhysics,
        player: Player
    ) {
        super(scene, eventCtrl, store, physics, player, AppMode.Brick, store.Legos)
        this.brickType = BrickGuideType.Event
        this.brickSize.set(3, 3, 3)

        store.RegisterStore(this)

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.currentMode = mode
            this.deleteMode = (mode == AppMode.LegoDelete)
            if (mode != AppMode.Brick) return
            if (this.brickGuide == undefined) return
            switch (e) {
                case EventFlag.Start:
                    this.brickGuide.ControllerEnable = true
                    this.brickGuide.Visible = true
                    this.brickfield.visible = true
                    this.eventCtrl.OnChangeCtrlObjEvent(this.brickGuide)
                    this.CheckCollision()
                    break
                case EventFlag.End:
                    this.brickGuide.ControllerEnable = false
                    this.brickGuide.Visible = false
                    this.brickfield.visible = false
                    break
            }
        })
        this.checkEx = () => {
            if(!this.brickGuide) return

            const bfp = new THREE.Vector3().copy(this.brickfield.position)
            bfp.x -= this.fieldWidth / 2
            bfp.z -= this.fieldHeight / 2
            const p = new THREE.Vector3().copy(this.brickGuide.position)
            const s = this.brickGuide.Size
            p.x -= s.x / 2
            p.z -= s.z / 2
            //console.log(p, s, bfp)
            if (
                p.x >= bfp.x && p.x + s.x <= bfp.x + this.fieldWidth &&
                p.z >= bfp.z && p.z + s.z <= bfp.z + this.fieldHeight){
                this.brickGuide.Creation = false
            } else {
                this.brickGuide.Creation = true
            }
        }
    }
    async Init() { }

    EditMode() {
        this.ClearBlock()
        this.ClearEventBrick()

        const userBricks = this.store.Bricks
        const collidingBoxSize = new THREE.Vector3()

        userBricks.forEach((brick) => {
            const b = new Brick2(brick.position, this.brickSize, brick.color)
            //b.rotation.copy(brick.rotation)
            this.scene.add(b)
            this.bricks2.push(b)
            collidingBoxSize.copy(this.brickSize).sub(this.subV)
            this.physics.addBuilding(b, brick.position, collidingBoxSize, b.rotation)
        })
    }
    CreateInstacedMeshEventBrick2(length: number) {
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshStandardMaterial({ 
            //color: 0xD9AB61,
            color: 0xffffff,
            transparent: true,
        })
        this.instancedBlock = new THREE.InstancedMesh(
            geometry, material, length
        )
        this.instancedBlock.castShadow = true
        this.instancedBlock.receiveShadow = true
        return this.instancedBlock
    }
    async Viliageload(): Promise<void> {
        this.ClearBlock()
        this.ClearEventBrick()
    }
    async Reload(): Promise<void> {
        this.ClearBlock()
        this.ClearEventBrick()

        if (!this.store.Bricks) return
        const userBricks = this.store.Bricks
        if(userBricks.length == 0) {
            return
        }
        if (this.deleteMode) {
            this.EditMode()
            return
        }
        this.instancedBlock = this.CreateInstacedMeshEventBrick2(userBricks.length)

        const matrix = new THREE.Matrix4()
        const q = new THREE.Quaternion()
        const size = new THREE.Vector3().copy(this.brickSize).sub(this.subV)

        userBricks.forEach((brick, i) => {
            matrix.compose(brick.position, q, this.brickSize)
            this.instancedBlock?.setMatrixAt(i, matrix)
            const eventbrick = new EventBrick(this.brickSize, brick.position)
            this.eventbricks.push(eventbrick)
            this.physics.addBuilding(eventbrick, brick.position, size)
        })
        this.scene.add(this.instancedBlock)
    }
}