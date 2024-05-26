import * as THREE from "three";
import { Damage } from "./damage"
import { Lightning } from "./lightning"
import { TextStatus } from "./status"
import { QuarksVfx } from "./quarksvfx";
import { Game } from "../scenes/game";
import { Trail } from "./trail";

export enum EffectType {
    Lightning,
    Damage,
    Explosion,
    BloodExplosion,
    Trail,
    Status
}

export interface IEffect {
    Start(...arg: any): void
    Update(delta: number): void
}

export class Effector {
    effects: IEffect[] = []
    meshs: THREE.Group = new THREE.Group()
    constructor(private game: Game) {
        this.meshs.name = "effector"
    }
    Enable(type: EffectType, ...arg: any) {
        switch(type) {
            case EffectType.Lightning:
                const lightning = new Lightning()
                this.effects[EffectType.Lightning] = lightning
                this.meshs.add(lightning.points)
                break;
            case EffectType.Status:
                const status = new TextStatus("0", "#ff0000")
                this.effects[EffectType.Status] = status
                this.meshs.add(status)
                break;
            case EffectType.Explosion:
                const explosion = new QuarksVfx('assets/vfx/ps.json')
                explosion.initEffect(arg[0], this.game)
                this.effects[EffectType.Explosion] = explosion
                break;
            case EffectType.BloodExplosion:
                const blood = new QuarksVfx('assets/vfx/BloodExplosion.json')
                blood.initEffect(arg[0], this.game)
                this.effects[EffectType.BloodExplosion] = blood
                break;
            case EffectType.Trail:
                const trail = new Trail()
                trail.initTrailEffect(arg[0], this.game)
                this.effects[EffectType.Trail] = trail
                break;
            case EffectType.Damage:
                const damage = new Damage(arg[0], arg[1], arg[2])
                this.effects[EffectType.Damage] = damage
                damage.Mesh.position.y += 2
                this.meshs.add(damage.Mesh)
                break;
        }
    }
    StartEffector(type: EffectType, ...arg: any) {
        this.effects[type].Start(...arg)
    }

    Update(delta: number): void {
        this.effects.forEach((e)=> {
            e.Update(delta)
        })
    }
}