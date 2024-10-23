import * as THREE from "three";
import { Effector, EffectType, IEffect } from "@Effector/effector";

enum FireballStep {
    Launch,
    Explosion,
    End
}

interface SkillState {
    Update(delta: number): FireballStep
}

export class FireballSk {
    enable = false
    fire: IEffect
    smoke: IEffect
    flame: IEffect
    expl: IEffect 
    currState?: SkillState
    currStep = FireballStep.Launch
    dst = new THREE.Vector3() 
    constructor(
        private effector: Effector,
        private speed: number = 8,
    ) {
        this.fire = effector.Enable(EffectType.Fireball)
        this.smoke = effector.Enable(EffectType.Smoke, 1, .5)
        this.flame = effector.Enable(EffectType.FlameSmoke, 1, 2, new THREE.Vector3(181, 156, 24))
        this.expl = effector.Enable(EffectType.FireExplosion)
    }
    Start(src: THREE.Vector3, dst: THREE.Vector3,) {
        this.dst = dst
        this.currState = new FireballLaunch(
            this.effector, this.fire, this.flame, this.smoke,
            src, dst, this.speed
        )
        this.enable = true
    }
    Update(delta: number) {
        if (!this.currState || !this.enable) return
        const next = this.currState.Update(delta)
        if(next != this.currStep) {
            switch (next) {
                case FireballStep.Explosion:
                    this.currState = new FireballExplosion(this.effector, this.expl, this.dst)
                    break;
                case FireballStep.End:
                    this.enable = false
                    break;
            }

            this.currStep = next
        }
    }
}

class FireballLaunch implements SkillState {
    moveDirection = new THREE.Vector3()
    constructor(
        private effector: Effector,
        private fire: IEffect,
        private flame: IEffect,
        private smoke: IEffect,
        private src: THREE.Vector3,
        private dst: THREE.Vector3,
        private speed: number,
    ) { 
        const dir = new THREE.Vector3().subVectors(dst, src)
        this.effector.StartEffector(EffectType.Fireball)
        this.effector.StartEffector(EffectType.FlameSmoke, dir)
        this.effector.StartEffector(EffectType.Smoke, dir)
        const startPos = new THREE.Vector3().copy(this.src).addScaledVector(dir, 3)
        startPos.y += 2
        this.fire.Mesh.position.copy(startPos)
        this.flame.Mesh.position.copy(startPos)
        this.smoke.Mesh.position.copy(startPos)

        const ndir = dir.clone().negate()
        this.calcStartPos(this.flame.Mesh, ndir)
        this.calcStartPos(this.smoke.Mesh, ndir)
    }
    calcStartPos(mesh: THREE.Group | THREE.Mesh, dir: THREE.Vector3) {
        const box = new THREE.Box3().setFromObject(mesh)
        const width = box.max.x - box.min.x
        const newPos = new THREE.Vector3().copy(mesh.position).addScaledVector(dir, width / 2)
        mesh.position.copy(newPos)
    }
    Update(delta: number) {
        this.moveDirection.subVectors(this.dst, this.src).normalize()
        this.fire.Mesh.position.addScaledVector(this.moveDirection, delta * this.speed)
        this.flame.Mesh.position.addScaledVector(this.moveDirection, delta * this.speed)
        this.smoke.Mesh.position.addScaledVector(this.moveDirection, delta * this.speed)

        const dist = this.dst.distanceTo(this.fire.Mesh.position)
        if(dist < 2.5) {
            this.effector.Complete(EffectType.Fireball)
            this.effector.Complete(EffectType.FlameSmoke)
            this.effector.Complete(EffectType.Smoke)
            return FireballStep.Explosion
        }
        return FireballStep.Launch
    }
}

class FireballExplosion implements SkillState {
    enable = true
    constructor(
        private effector: Effector,
        private expl: IEffect,
        private dst: THREE.Vector3,
    ) {
        this.effector.StartEffector(EffectType.FireExplosion, dst, () => { this.Complete() })
    }
    Complete() {
        this.enable = false
    }
    Update(): FireballStep {
        if (!this.enable) {
            this.effector.Complete(EffectType.FireExplosion)
            return FireballStep.End
        }
        return FireballStep.Explosion
    }
}