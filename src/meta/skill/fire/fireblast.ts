import * as THREE from "three";
import { Effector, EffectType, IEffect } from "@Effector/effector";

enum FireBlastStep {
    Launch,
    Explosion,
    End
}

interface SkillState {
    Update(delta: number): FireBlastStep
}

export class FireBlastSk {
    enable = false
    fire: IEffect
    expl: IEffect 
    currState?: SkillState
    currStep = FireBlastStep.Launch
    dst = new THREE.Vector3() 
    constructor(
        private effector: Effector,
        private speed: number = 8,
    ) {
        this.fire = effector.Enable(EffectType.Flame)
        this.expl = effector.Enable(EffectType.FireExplosion)
    }
    Start(src: THREE.Vector3, dst: THREE.Vector3,) {
        this.dst = dst
        this.currState = new FireBlastLaunch(
            this.effector, this.fire,
            src, dst, this.speed
        )
        this.enable = true
    }
    Update(delta: number) {
        if (!this.currState || !this.enable) return
        const next = this.currState.Update(delta)
        if(next != this.currStep) {
            switch (next) {
                case FireBlastStep.Explosion:
                    this.currState = new FireBlastExplosion(this.effector, this.dst)
                    break;
                case FireBlastStep.End:
                    this.enable = false
                    break;
            }

            this.currStep = next
        }
    }
}

class FireBlastLaunch implements SkillState {
    moveDirection = new THREE.Vector3()
    constructor(
        private effector: Effector,
        private fire: IEffect,
        private src: THREE.Vector3,
        private dst: THREE.Vector3,
        private speed: number,
    ) { 
        const dir = new THREE.Vector3().subVectors(dst, src)
        this.effector.StartEffector(EffectType.Flame, dir)
        const startPos = new THREE.Vector3().copy(this.src).addScaledVector(dir, 3)
        startPos.y += 2
        this.fire.Mesh.position.copy(startPos)

        const ndir = dir.clone().negate()
        this.calcStartPos(this.fire.Mesh, ndir)
    }
    calcStartPos(mesh: THREE.Group | THREE.Mesh, dir: THREE.Vector3) {
        const box = new THREE.Box3().setFromObject(mesh)
        const width = box.max.x - box.min.x
        const newPos = new THREE.Vector3().copy(mesh.position).addScaledVector(dir, width / 2)
        mesh.position.copy(newPos)
    }
    time = 0
    Update(delta: number) {
        this.time += delta
        if(this.time > 5) {
            return FireBlastStep.Explosion
        }
        return FireBlastStep.Launch
    }
}

class FireBlastExplosion implements SkillState {
    enable = true
    constructor(
        private effector: Effector,
        private dst: THREE.Vector3,
    ) {
        this.effector.StartEffector(EffectType.FireExplosion, dst, () => { this.Complete() })
    }
    Complete() {
        this.enable = false
    }
    Update(): FireBlastStep {
        if (!this.enable) {
            this.effector.Complete(EffectType.FireExplosion)
            return FireBlastStep.End
        }
        return FireBlastStep.Explosion
    }
}