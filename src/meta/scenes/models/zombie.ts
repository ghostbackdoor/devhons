import * as THREE from "three";
import { Loader } from "../../loader/loader";
import { FloatingName } from "../../common/floatingtxt";
import { EventController } from "../../event/eventctrl";
import { GhostModel } from "./ghostmodel";
import { Ani, IAsset } from "../../loader/assetmodel";
import { IPhysicsObject } from "./iobject";
import { GPhysics } from "../../common/physics/gphysics";
import { ActionType } from "./player";
import { Damage } from "../../effects/damage";
import { TextStatus } from "../../effects/status";
import { EffectType, Effector } from "../../effects/effector";

export class Zombie extends GhostModel implements IPhysicsObject {
    mixer?: THREE.AnimationMixer
    currentAni?: THREE.AnimationAction
    currentClip?: THREE.AnimationClip

    idleClip?: THREE.AnimationClip
    runClip?: THREE.AnimationClip
    punchingClip?: THREE.AnimationClip
    dyingClip?: THREE.AnimationClip

    private controllerEnable: boolean = false

    effector = new Effector()
    movePos = new THREE.Vector3()
    vFlag = true

    get BoxPos() { return this.asset.GetBoxPos(this.meshs) }
    get Model() { return this.asset.Id }
    set ControllerEnable(flag: boolean) { this.controllerEnable = flag }
    get ControllerEnable(): boolean { return this.controllerEnable }

    constructor(
        private loader: Loader, 
        private eventCtrl: EventController, 
        private gphysic: GPhysics,
        asset: IAsset
    ) {
        super(asset)
        this.text = new FloatingName("Zombie")
        this.effector.Enable(EffectType.Damage, 0, 1, 0)
        this.effector.Enable(EffectType.Status)
    }

    async Init(text: string) {
        if(this.text == undefined) return
        this.text.SetText(text)
        this.text.position.y = 3.5
    }

    async Loader(asset: IAsset, position: THREE.Vector3, text: string, id: number) {
        this.asset = asset

        const [meshs, exist] = await asset.UniqModel(text + id)
        this.meshs = meshs

        console.log(this.meshs)
        this.meshs.position.set(position.x, position.y, position.z)

        if (this.text != undefined) {
            this.meshs.remove(this.text)
        }

        if (this.text != undefined) {
            this.text.SetText(text)
            this.text.position.y = 3.5
            this.meshs.add(this.text)
        }
        this.meshs.add(this.effector.meshs)

        this.mixer = this.asset.GetMixer(text + id)
        if (this.mixer == undefined) throw new Error("mixer is undefined");
        
        this.idleClip = this.asset.GetAnimationClip(Ani.Idle)
        this.runClip = this.asset.GetAnimationClip(Ani.Run)
        this.punchingClip = this.asset.GetAnimationClip(Ani.Punch)
        this.dyingClip = this.asset.GetAnimationClip(Ani.Dying)
        this.changeAnimate(this.idleClip)

        this.Visible = false

    }
    changeAnimate(animate: THREE.AnimationClip | undefined, ) {
        if (animate == undefined) return

        const currentAction = this.mixer?.clipAction(animate)
        if (currentAction == undefined) return

        let fadeTime = 0.2
        this.currentAni?.fadeOut(0.2)
        if (animate == this.dyingClip) {
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
    ChangeAction(action: ActionType) {
        let clip: THREE.AnimationClip | undefined
        switch(action) {
            case ActionType.IdleAction:
                clip = this.idleClip
                break
            case ActionType.RunAction:
                clip = this.runClip
                break
            case ActionType.PunchAction:
                clip = this.punchingClip
                break
            case ActionType.DyingAction:
                clip = this.dyingClip
                break

        }
        this.changeAnimate(clip)
        return clip?.duration
    }
    clock = new THREE.Clock()
    flag = false

    DamageEffect(damage: number, effect?: EffectType) {
        switch(effect) {
            case EffectType.Damage:
            default:
                //this.effector.StartEffector(EffectType.Lightning)
                this.effector.StartEffector(EffectType.Damage)
                break;
            case EffectType.Lightning:
                this.effector.StartEffector(EffectType.Damage)
                //this.effector.StartEffector(EffectType.Lightning)
                break;
        }
        this.effector.StartEffector(EffectType.Status, damage.toString(), "#fff")
    }

    update() {
        const delta = this.clock.getDelta()
        this.effector.Update(delta)
        this.mixer?.update(delta)
    }
    UpdatePhysics(): void {

    }
}