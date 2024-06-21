import * as THREE from "three";
import { BrickGuide, BrickGuideType } from "./brickguide";
import { Brick2 } from "./brick2";
import { EventController, EventFlag } from "../../event/eventctrl";
import { Lego, ModelStore } from "../../common/modelstore";
import { GPhysics } from "../../common/physics/gphysics";
import { IKeyCommand } from "../../event/keycommand";
import { IBuildingObject } from "../models/iobject";
import SConf from "../../configs/staticconf";
import { Player } from "../player/player";
import { AppMode } from "../../app";

export type BrickOption = {
    v?: THREE.Vector3,
    r?: THREE.Vector3,
    color?: string
    clear?: boolean
}
export class EventBrick implements IBuildingObject {
    brick?: Brick2
    get Size() { return this.size }
    get BoxPos() { return this.position }
    set Key(k: string) { this.key = k }
    get Key() { return this.key }

    key = ""
    constructor(private size: THREE.Vector3, private position: THREE.Vector3) {
    }
    Dispose() {
        if(this.brick) this.brick.Dispose()
    }
}

export class Bricks {
    brickGuide: BrickGuide | undefined
    brickfield: THREE.Mesh
    instancedBlock?: THREE.InstancedMesh
    bricks2: Brick2[] = []
    eventbricks: EventBrick[] = []
    deleteMode = false
    currentMode?: AppMode
    dom: HTMLDivElement

    protected brickType = BrickGuideType.Event
    protected brickSize: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
    protected brickColor: THREE.Color = new THREE.Color(0xFFFFFF)
    protected subV = new THREE.Vector3(0.1, 0.1, 0.1)
    protected movePos = new THREE.Vector3()
    protected fieldWidth = SConf.LegoFieldW
    protected fieldHeight = SConf.LegoFieldH

    protected checkEx?: Function
    
    set LegoStore(save: Lego[]) { this.save = save }

    constructor(
        protected scene: THREE.Scene,
        protected eventCtrl: EventController,
        protected store: ModelStore,
        protected physics: GPhysics,
        protected player: Player,
        protected mode: AppMode,
        protected save: Lego[]
    ) {

        this.dom = document.createElement("div")
        this.drawHtml(this.dom)
        eventCtrl.RegisterInputEvent((e: any, _real: THREE.Vector3, vir: THREE.Vector3) => {
            if (this.brickGuide == undefined || !this.brickGuide.ControllerEnable) return
            if (this.currentMode != AppMode.LegoDelete && this.mode != this.currentMode) return
            if (e.type == "move") {
                this.movePos.copy(vir)
                this.moveEvent(this.movePos)
            } else if (e.type == "end") {
                this.moveEvent(this.movePos)
            }
        })


        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if (this.brickGuide == undefined || !this.brickGuide.ControllerEnable) return
            if (this.currentMode != AppMode.LegoDelete && this.mode != this.currentMode) return
            const position = keyCommand.ExecuteKeyDown()
            this.moveEvent(position)
        })

        this.brickfield = new THREE.Mesh(
            new THREE.PlaneGeometry(this.fieldWidth, this.fieldHeight),
            new THREE.MeshBasicMaterial({
                color: 0x0000FF, side: THREE.DoubleSide, opacity: 0.3,
                transparent: true,
            })
        )
        this.brickfield.position.z += this.fieldHeight / 2
        this.brickfield.position.y = 0.01
        this.brickfield.rotation.x = Math.PI / 2
        this.brickfield.visible = false
        this.scene.add(this.brickfield)

    }
    moveEvent(v: THREE.Vector3) {
        if (this.brickGuide == undefined) return

        const vx = (v.x > 0) ? 1 : (v.x < 0) ? - 1 : 0
        const vz = (v.z > 0) ? 1 : (v.z < 0) ? - 1 : 0
        if (v.y > 0) {
            if (this.deleteMode) this.DeleteBrick()
            else this.CreateBrickEvent()
        } else {
            this.brickGuide.position.x += vx// * this.brickSize.x
            this.brickGuide.position.y = Math.ceil(this.brickGuide.position.y)
            this.brickGuide.position.z += vz// * this.brickSize.z

        }
        this.CheckCollision()
        console.log("loc: ", this.brickGuide.position)
    }

    GetCollisionBox(): [IBuildingObject | undefined, string[]] {
        if (this.brickGuide == undefined) return [undefined, [""]]
        this.brickGuide.position.y -= 1
        const box = this.brickGuide.Box
        let [target, keys] = this.physics.GetCollisionBox(this.brickGuide.position, box)
        this.brickGuide.position.y += 1
        if(target) {
            const [_, key] = this.physics.GetCollisionBox(target.pos, target.box)
            keys = key
        }
        return [target?.model, keys]
    }

    DeleteBrick() {
        const [target, keys] = this.GetCollisionBox()
        if (target == undefined) return
        this.physics.DeleteBox(keys, target)
        const b = (target instanceof Brick2) ? target as Brick2 : (target as EventBrick).brick
        if (b != undefined) {
            this.bricks2.splice(this.bricks2.indexOf(b), 1)
            this.scene.remove(b)
            b.Dispose()
            this.DeleteLegos(b)
        } else {
            throw "error"
        }
    }
    DeleteLegos(b: Brick2) {
        const l = this.save
        for (let i = 0; i < l.length; i++) {
            if (this.VEqual(l[i].position, b.position)) {
                console.log("delete", b.position)
                l.splice(i, 1)
                i--
            }
        }
    }

    VEqual(v1: THREE.Vector3, v2: THREE.Vector3): boolean {
        return v1.x == v2.x && v1.y == v2.y && v1.z == v2.z
    }
    CreateBrickEvent() {
        if (this.brickGuide == undefined || !this.brickGuide.Creation) return

        const b = new Brick2(this.brickGuide.position, this.brickSize, this.brickColor)
        b.rotation.copy(this.brickGuide.Meshs.rotation)
        this.save.push({
            position: b.position,
            size: new THREE.Vector3().copy(this.brickSize),
            rotation: b.rotation,
            color: (b.Meshs.material as THREE.MeshStandardMaterial).color,
            type: this.brickGuide.ShapeType,
        })
        this.scene.add(b)
        this.bricks2.push(b)

        const subV = new THREE.Vector3(0.1, 0.1, 0.1)
        const size = new THREE.Vector3().copy(this.brickSize).sub(subV)


        const eventbrick = new EventBrick(this.brickSize, b.position)
        eventbrick.brick = b
        this.eventbricks.push(eventbrick)
        this.physics.addBuilding(eventbrick, b.position, size, b.rotation)

        b.Visible = true
    }

    ClearBlock() {
        this.bricks2.forEach((b) => {
            this.scene.remove(b);
            b.Dispose()
        })
        this.bricks2.length = 0

        if (this.instancedBlock != undefined) {
            this.scene.remove(this.instancedBlock)
            this.instancedBlock.geometry.dispose();
            (this.instancedBlock.material as THREE.MeshStandardMaterial).dispose()
            this.instancedBlock.dispose()
            this.instancedBlock = undefined
        }
    }

    GetBrickGuide(pos?: THREE.Vector3) {
        if (pos == undefined) pos = new THREE.Vector3().copy(this.brickfield.position)
        pos.x = Math.ceil(pos.x)
        pos.y = Math.ceil(pos.y)
        pos.z = Math.ceil(pos.z)
        if (pos.y < 2) pos.y = 2
        if (this.brickGuide == undefined) {
            this.brickGuide = new BrickGuide(pos, this.brickSize, this.brickType)
            this.scene.add(this.brickGuide)
            this.brickfield.visible = true
        } else {
            this.brickGuide.Init(pos)
            this.brickGuide.Visible = true
            this.brickfield.visible = true
        }
        this.eventCtrl.OnChangeCtrlObjEvent(this.brickGuide)
        this.CheckCollision()

        return this.brickGuide
    }
    CheckCollision() {
        if (this.brickGuide == undefined) return
        //this.brickGuide.CannonPos.x = Math.ceil(this.brickGuide.CannonPos.x)
        //this.brickGuide.CannonPos.z = Math.ceil(this.brickGuide.CannonPos.z)
        const min = this.brickGuide.Size.y / 2
        this.brickGuide.CannonPos.y = (this.brickGuide.CannonPos.y < min) ? min : this.brickGuide.CannonPos.y
        
        if (this.physics.CheckBox(this.brickGuide.position, this.brickGuide.Box)) {
            do {
                this.brickGuide.CannonPos.y += .5
            } while (this.physics.CheckBox(this.brickGuide.position, this.brickGuide.Box))
        } else {
            do {
                this.brickGuide.CannonPos.y -= .5
            } while (!this.physics.CheckBox(this.brickGuide.position, this.brickGuide.Box) 
                && this.brickGuide.CannonPos.y >= min)
            this.brickGuide.CannonPos.y += .5
        }
      
        if (this.currentMode != AppMode.LegoDelete && this.checkEx) this.checkEx()
    }
    ChangeEvent(e: EventFlag) {
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
                }
                this.brickGuide.ControllerEnable = false
                this.brickGuide.Visible = false
                this.brickfield.visible = false
                break
        }
    }
    ChangeOption(opt: BrickOption) {
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
    }
    ClearEventBrick() {
        this.eventbricks.length = 0
    }
    CreateBricks(userBricks: Lego[]) {

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
    CreateInstacedMesh(userBricks: Lego[]) {
        if(!userBricks?.length) {
            return
        }
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshToonMaterial({ 
            //color: 0xD9AB61,
            color: 0xffffff,
            transparent: true,
        })
        const instancedBlock = new THREE.InstancedMesh(
            geometry, material, userBricks.length
        )
        instancedBlock.castShadow = true
        instancedBlock.receiveShadow = true
        const matrix = new THREE.Matrix4()
        const collidingBoxSize = new THREE.Vector3()
        const q = new THREE.Quaternion()

        userBricks.forEach((brick, i) => {
            q.setFromEuler(brick.rotation)
            matrix.compose(brick.position, q, brick.size)
            instancedBlock?.setColorAt(i, new THREE.Color(brick.color))
            instancedBlock?.setMatrixAt(i, matrix)

            collidingBoxSize.copy(brick.size).sub(this.subV)
            const eventbrick = new EventBrick(this.brickSize, brick.position)
            this.eventbricks.push(eventbrick)
            this.physics.addBuilding(eventbrick, brick.position, collidingBoxSize, brick.rotation)
        })
        return instancedBlock
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