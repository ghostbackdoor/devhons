import * as THREE from "three";
import * as CANNON from "cannon-es"
import { ICtrlObject, IPhysicsObject } from "./iobject";
import { EventController } from "../../event/eventctrl";
import { Loader } from "../../common/loader";
import { Gui } from "../../factory/appfactory"
import { PhysicsPlayer } from "./playerctrl";

export enum ActionType {
    IdleAction,
    RunAction,
    JumpAction,
    PunchAction,
}
const solidify = (mesh: THREE.Mesh) => {
    const THICKNESS = 0.02
    const geometry = mesh.geometry
    const material = new THREE.ShaderMaterial( {
        vertexShader: `
        void main() {
            vec3 newPosition = position + normal * ${THICKNESS};
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1);
        }
        `,
        fragmentShader: `
        void main() {
            gl_FragColor = vec4(0, 0, 0, 1);
        }
        `,
        side: THREE.BackSide
    })
    const outline = new THREE.Mesh(geometry, material)
    //scene.add(outline)
}

export class Player implements ICtrlObject, IPhysicsObject {
    private body: PhysicsPlayer
    private meshs: THREE.Group
    mixer?: THREE.AnimationMixer
    currentAni?: THREE.AnimationAction
    currentClip?: THREE.AnimationClip

    idleClip?: THREE.AnimationClip
    runClip?: THREE.AnimationClip
    jumpClip?: THREE.AnimationClip
    punchingClip?: THREE.AnimationClip

    visibleFlag: boolean = true

    get Body() { return this.body }
    get Position(): CANNON.Vec3 { return new CANNON.Vec3(
        this.meshs.position.x, this.meshs.position.y, this.meshs.position.z) }
    set Position(v: CANNON.Vec3) { this.meshs.position.set(v.x, v.y, v.z) }
    set Quaternion(q: CANNON.Quaternion) { this.meshs.quaternion.set(q.x, q.y, q.z, q.w) }
 
    set Visible(flag: boolean) {
        if (this.visibleFlag == flag) return
        this.meshs.traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.visible = flag
            }
        })
        this.visibleFlag = flag
    }   
    get Meshs() { return this.meshs }

    constructor(private loader: Loader, private eventCtrl: EventController) {
        this.meshs = new THREE.Group
        this.body = new PhysicsPlayer(new CANNON.Vec3(0, 0, 0), this.eventCtrl)

        this.eventCtrl.RegisterBrickModeEvent(() => {
            this.body.ControllerEnable = false
        })
        this.eventCtrl.RegisterEditModeEvent(() => {
            this.body.ControllerEnable = false
            this.Visible = false
        })
        this.eventCtrl.RegisterPlayModeEvent(() => {
            this.Init()
            this.body.ControllerEnable = true
            this.Visible = true
        })
        this.eventCtrl.RegisterCloseModeEvent(() => {
            this.body.ControllerEnable = false
            this.Visible = false
        })
        this.eventCtrl.RegisterLongModeEvent(() => {
            this.body.ControllerEnable = false
            this.Visible = false
        })
    }

    Init() {
        this.meshs.position.set(0, 5, 5)
        this.body.position.set(0, 5, 5)
    }

    async Loader(scale: number, position: CANNON.Vec3) {
        return new Promise((resolve) => {
            this.loader.Load.load("assets/male/male.gltf", (gltf) => {
                this.meshs = gltf.scene
                this.meshs.scale.set(scale, scale, scale)
                this.meshs.position.set(position.x, position.y, position.z)
                this.meshs.castShadow = true
                this.meshs.receiveShadow = false
                this.meshs.traverse(child => { 
                    child.castShadow = true 
                    child.receiveShadow = false
                })
                this.body.velocity.set(0, 0 ,0)
                this.body.position = position
                this.mixer = new THREE.AnimationMixer(gltf.scene)
                this.idleClip = gltf.animations[0]
                this.runClip = gltf.animations[1]
                this.jumpClip = gltf.animations[2]
                this.punchingClip = gltf.animations[3]
                this.changeAnimate(this.idleClip)
  
                resolve(gltf.scene)
            })
        })
    }
    changeAnimate(animate: THREE.AnimationClip | undefined) {
        if (animate == undefined || this.currentClip == animate) return
        
        let fadeTime = 0.2
        this.currentAni?.fadeOut(0.2)
        const currentAction = this.mixer?.clipAction(animate)
        if (currentAction == undefined) return

        if (animate == this.jumpClip) {
            fadeTime = 0
            currentAction.clampWhenFinished = true
            currentAction.setLoop(THREE.LoopOnce, 1)
        } else {
            currentAction.setLoop(THREE.LoopRepeat, 10000)
        }
        currentAction.reset().fadeIn(fadeTime).play()

        this.currentAni = currentAction
        this.currentClip = animate
    }

    clock = new THREE.Clock()

    PostStep(): void {
        switch(this.body.getState()) {
            case ActionType.IdleAction:
                this.changeAnimate(this.idleClip)
                break
            case ActionType.JumpAction:
                this.changeAnimate(this.jumpClip)
                break
            case ActionType.RunAction:
                this.changeAnimate(this.runClip)
                break
            case ActionType.PunchAction:
                this.changeAnimate(this.punchingClip)
                break
        }
        this.mixer?.update(this.clock.getDelta())
        this.body?.PostStep()
    }
    UpdatePhysics(): void {
        this.Position = this.body.position
        this.Quaternion = this.body.quaternion
    }
}