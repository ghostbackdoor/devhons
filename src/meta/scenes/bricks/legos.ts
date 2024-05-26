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

export class Legos extends Bricks implements IModelReload {
    get Size(): THREE.Vector3 { return (this.brickGuide) ? this.brickGuide.Size : this.brickSize }
    dom: HTMLDivElement

    constructor(
        scene: THREE.Scene,
        eventCtrl: EventController,
        store: ModelStore,
        physics: GPhysics,
        player: Player
    ) {
        super(scene, eventCtrl, store, physics, player, AppMode.Lego, store.Legos)
        store.RegisterStore(this)
        this.brickType = BrickGuideType.Lego
        this.dom = document.createElement("div")
        this.drawHtml(this.dom)
        

        eventCtrl.RegisterBrickInfo((opt: BrickOption) => {
            if (opt.clear) {
                const legos = this.store.Legos
                if (legos) {
                    legos.length = 0
                }
                const nonLegos = this.store.NonLegos
                if (nonLegos) {
                    nonLegos.length = 0
                }
                const userBricks = this.store.Bricks
                if (userBricks) {
                    userBricks.length = 0
                }
            }

            if (this.brickGuide == undefined) return

            if (opt.v) {
                this.brickSize.copy(opt.v)
                this.brickGuide.Meshs.scale.copy(opt.v)
                const pos = this.brickGuide.Meshs.position 
                console.log(pos, opt.v)
                this.brickGuide.Meshs.position.set(
                    Math.floor(pos.x) + (opt.v.x % 2) * (.5),
                    Math.floor(pos.y) + (opt.v.y % 2) * (.5),
                    Math.floor(pos.z) + (opt.v.z % 2) * (.5)
                ) 
                console.log(pos)
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

            if (mode == AppMode.Lego || mode == AppMode.LegoDelete) {
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
                            this.dom.style.display = "block"
                            this.brickGuide.scale.set(1, 1, 1)
                            this.brickSize.set(1, 1, 1)
                            console.log(this.brickGuide.position)
                        }
                        this.eventCtrl.OnChangeCtrlObjEvent(this.brickGuide)
                        this.CheckCollision()
                        break
                    case EventFlag.End:
                        if (this.deleteMode) {
                            this.dom.style.display = "none"
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
            if (
                p.x >= bfp.x && p.x + s.x <= bfp.x + this.fieldWidth &&
                p.z >= bfp.z && p.z + s.z <= bfp.z + this.fieldHeight){
                this.brickGuide.Creation = true
            } else {
                this.brickGuide.Creation = false
            }
        }
    }

    ChangeGuide() {
        
    }
    EditMode() {
        this.ClearBlock()
        this.CreateBricks()
    }
    CreateBricks() {
        const userBricks = this.store.Legos
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
        const userBricks = this.store.Legos
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
    drawHtml(dom: HTMLDivElement) {
        dom.className = "brickctrl border rounded p-2 m-1"
        dom.innerHTML = `
        <div class="row">
            <div class="col text-white">
                <div class="border rounded bg-secondary p-2 d-inline-block">space</div> or
                <span class="material-symbols-outlined align-middle">
                close
                </span> = 삭제
            </div>
            <div class="col p-2 text-center handcursor">
                <span class="material-symbols-outlined" id="lego_exit">
                    disabled_by_default
                </span>
            </div>
        </div>
        `
        dom.style.display = "none"
        document.body.appendChild(dom)
        const exit = document.getElementById("lego_exit")
        if(exit)exit.onclick = () => {
            this.eventCtrl.OnAppModeEvent(AppMode.EditPlay)
            exit.style.display = "none"
        }
    }
}