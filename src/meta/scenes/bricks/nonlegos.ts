import * as THREE from "three";
import { IModelReload, ModelStore } from "../../common/modelstore";
import { GPhysics } from "../../common/physics/gphysics";
import { EventController, EventFlag } from "../../event/eventctrl";
import { Brick2 } from "./brick2";
import { BrickGuideType } from "./brickguide";
import { BrickOption, Bricks, EventBrick } from "./bricks";
import { AppMode } from "../../app";
import { Player } from "../player/player";

export enum BrickShapeType {
    Rectangle,
    RoundCorner,
}

export class NonLegos extends Bricks implements IModelReload {
    get Size(): THREE.Vector3 { return (this.brickGuide) ? this.brickGuide.Size : this.brickSize }

    constructor(
        scene: THREE.Scene,
        eventCtrl: EventController,
        store: ModelStore,
        physics: GPhysics,
        player: Player
    ) {
        super(scene, eventCtrl, store, physics, player, AppMode.NonLego, store.NonLegos)
        store.RegisterStore(this)
        this.brickType = BrickGuideType.NonLego

        eventCtrl.RegisterBrickInfo((opt: BrickOption) => {
            if (this.brickGuide == undefined) return

            if (opt.v) {
                this.brickSize.copy(opt.v)
                this.brickGuide.Meshs.scale.copy(opt.v)
            }
            if (opt.r) {
                this.brickGuide.Meshs.rotateX(THREE.MathUtils.degToRad(opt.r.x))
                this.brickGuide.Meshs.rotateY(THREE.MathUtils.degToRad(opt.r.y))
                this.brickGuide.Meshs.rotateZ(THREE.MathUtils.degToRad(opt.r.z))
            }
            if (opt.color) {
                this.brickColor.set(opt.color)
            }

            this.CheckCollision()
        })

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.currentMode = mode
            this.deleteMode = (mode == AppMode.LegoDelete)

            if (mode == AppMode.NonLego || mode == AppMode.LegoDelete) {
                if (this.brickGuide == undefined) {
                    this.brickGuide = this.GetBrickGuide(this.player.CenterPos)
                }
                switch (e) {
                    case EventFlag.Start:
                        this.brickGuide.ControllerEnable = true
                        this.brickGuide.Visible = true
                        this.brickGuide.position.copy(this.player.CannonPos)
                        this.brickfield.visible = true
                        if (this.deleteMode) {
                            this.brickGuide.scale.set(1, 1, 1)
                            this.brickSize.set(1, 1, 1)
                            console.log(this.brickGuide.position)
                        }
                        this.eventCtrl.OnChangeCtrlObjEvent(this.brickGuide)
                        this.CheckCollision()
                        break
                    case EventFlag.End:
                        if (this.deleteMode) {
                            //this.EditMode()
                            //this.physics.PBoxDispose()
                            //this.eventCtrl.OnSceneReloadEvent()
                        }
                        this.brickGuide.ControllerEnable = false
                        this.brickGuide.Visible = false
                        this.brickfield.visible = false
                        break
                }
            }
        })
        this.checkEx = () => {
            if(!this.brickGuide) return

            const bfp = new THREE.Vector3().copy(this.brickfield.position)
            bfp.x -= this.fieldWidth / 2
            bfp.z -= this.fieldHeight / 2
            const p = new THREE.Vector3().copy(this.brickGuide.position)
            const s = this.brickGuide.Size // rotatio 이 적용된 형상
            p.x -= s.x / 2
            p.z -= s.z / 2
            if ( p.x >= bfp.x && p.x <= bfp.x + this.fieldWidth &&
                p.z >= bfp.z && p.z <= bfp.z + this.fieldHeight){
                this.brickGuide.Creation = false
            } else {
                this.brickGuide.Creation = true
            }
        }
    }
    EditMode() {
        this.ClearBlock()
        this.CreateBricks()
    }
    CreateBricks() {
        const userBricks = this.store.NonLegos
        //const subV = new THREE.Vector3(0.1, 0.1, 0.1)
        //const size = new THREE.Vector3().copy(this.brickSize).sub(subV)

        const collidingBoxSize = new THREE.Vector3()
        userBricks.forEach((brick) => {
            const b = new Brick2(brick.position, brick.size, brick.color)
            b.rotation.copy(brick.rotation)
            this.scene.add(b)
            this.bricks2.push(b)
            collidingBoxSize.copy(brick.size).sub(this.subV)
            this.physics.addBuilding(b, brick.position, collidingBoxSize, b.rotation)
        })
    }
    CreateInstacedMesh() {
        const userBricks = this.store.NonLegos
        if(!userBricks?.length) {
            return
        }
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshToonMaterial({ 
            //color: 0xD9AB61,
            color: 0xffffff,
            transparent: true,
        })
        this.instancedBlock = new THREE.InstancedMesh(
            geometry, material, userBricks.length
        )
        this.instancedBlock.castShadow = true
        this.instancedBlock.receiveShadow = true
        const matrix = new THREE.Matrix4()
        const collidingBoxSize = new THREE.Vector3()
        const q = new THREE.Quaternion()

        userBricks.forEach((brick, i) => {
            q.setFromEuler(brick.rotation)
            matrix.compose(brick.position, q, brick.size)
            this.instancedBlock?.setColorAt(i, new THREE.Color(brick.color))
            this.instancedBlock?.setMatrixAt(i, matrix)

            collidingBoxSize.copy(brick.size).sub(this.subV)
            const eventbrick = new EventBrick(this.brickSize, brick.position)
            this.eventbricks.push(eventbrick)
            this.physics.addBuilding(eventbrick, brick.position, collidingBoxSize, brick.rotation)
        })
        this.scene.add(this.instancedBlock)
    }
    async Viliageload(): Promise<void> {
        this.ClearBlock()
        this.ClearEventBrick()
        this.CreateInstacedMesh()
    }
    async Reload(): Promise<void> {
        this.ClearBlock()
        this.ClearEventBrick()

        /*
        if (this.deleteMode) {
            return
        }
        */
        this.CreateBricks()
        //this.CreateInstacedMesh()
    }
}