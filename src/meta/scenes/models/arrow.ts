import * as THREE from "three";
import { GhostModel } from "./ghostmodel";
import { Ani, IAsset } from "../../loader/assetmodel";

export class Arrow extends GhostModel {
    mixer?: THREE.AnimationMixer
    currentAni?: THREE.AnimationAction
    currentClip?: THREE.AnimationClip
    idleClip?: THREE.AnimationClip

    constructor(asset: IAsset) {
        super(asset)
        this.meshs = new THREE.Group
    }

    async Init() {
    }

    async Loader(position: THREE.Vector3) {
        const [meshs, _] = await this.asset.UniqModel("arrow")
        this.meshs = meshs
        this.meshs.position.copy(position)
        this.meshs.castShadow = false
        this.meshs.receiveShadow = false

        this.mixer = this.asset.GetMixer("arrow")

        this.idleClip = this.asset.GetAnimationClip(Ani.Idle)
        if(!this.idleClip) return
        const currentAction = this.mixer?.clipAction(this.idleClip)
        if (currentAction == undefined) return
        currentAction.setLoop(THREE.LoopRepeat, 10000)
        currentAction.reset().fadeIn(.1).play()
    }
    update(delta: number) {
        this.mixer?.update(delta)
    }
}