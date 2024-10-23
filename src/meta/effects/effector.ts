import * as THREE from "three";
import { LightningVfx } from "./lightning/lightning"
import { TextStatus } from "./status"
import { QuarksVfx } from "./quarksvfx";
import { Trail } from "./trail/trailquarks";
import { PointTrail } from "./trail/pointtrail";
import { FireballVfx } from "./fire/fireball";
import { FlameVfx } from "./flame/flame";
import { AuraVfx } from "./ground/aura";
import { TestVfx } from "./testvfx";
import { NebulaVfx } from "./nebula/nebula";
import { NebulaVfxCustom } from "./nebula/nebulacustom";
import { CometVfx } from "./fire/comet";
import { FlameSmokeVfx } from "./fire/flamesmoke";
import { SmokeVfx } from "./fire/smoke";

export enum EffectType {
    LightningStrike,
    Fireball,
    Smoke,
    Flame,
    FlameSmoke,
    Spark,
    Comet,
    Aura,
    Damage,
    Explosion,
    CartoonLightningBall,
    BloodExplosion,
    FireExplosion,
    Trail,
    PointTrail,
    BlueParticle,
    Status,
    Test,
}

export interface IEffect {
    get Mesh(): THREE.Group | THREE.Mesh
    Start(...arg: any): void
    Update(delta: number, ...arg: any): void
    Complete(): void
}

export class Effector {
    effects: IEffect[] = []
    meshs: THREE.Group = new THREE.Group()
    nonglow?: Function
    constructor(
        private game: THREE.Scene,
    ) {
        this.meshs.name = "effector"
    }
    SetNonGlow(nonglow: Function) {
        this.nonglow = nonglow
    }
    Enable(type: EffectType, ...arg: any) {
        let ret: IEffect
        switch (type) {
            case EffectType.LightningStrike:
                ret = new LightningVfx(this.game)
                break;
            case EffectType.Smoke:
                ret = new SmokeVfx(this.game, ...arg)
                break;
            case EffectType.Fireball:
                ret = new FireballVfx(this.game, ...arg)
                break;
            case EffectType.Aura:
                ret = new AuraVfx(this.game, this.nonglow)
                break;
            case EffectType.Comet:
                ret = new CometVfx(this.game)
                break;
            case EffectType.FlameSmoke:
                ret = new FlameSmokeVfx(this.game, ...arg)
                break;
            case EffectType.Flame:
                ret = new FlameVfx(this.game)
                break;
            case EffectType.BlueParticle:
                ret = new NebulaVfx(this.game, "")
                break;
            case EffectType.Spark: 
                ret = new NebulaVfxCustom(this.game)
                //ret = new SparkVfx(this.game)
                break;
            case EffectType.Status:
                const text = new TextStatus("0", "#ff0000")
                this.meshs.add(text)
                ret = text
                break;
            case EffectType.Explosion:
                const explosion = new QuarksVfx('assets/vfx/ps.json', this.game)
                explosion.initEffect(arg[0])
                ret = explosion
                break;
            case EffectType.CartoonLightningBall:
                const vfx = new QuarksVfx('assets/vfx/CartoonLightningBall.json', this.game)
                vfx.initEffect(arg[0])
                ret = vfx
                break;
            case EffectType.FireExplosion: {
                const blood = new QuarksVfx('assets/vfx/subEmitter4.json', this.game)
                blood.initEffect(arg[0])
                ret = blood
                break;
            }
            case EffectType.BloodExplosion:
                const blood = new QuarksVfx('assets/vfx/BloodExplosion.json', this.game)
                blood.initEffect(arg[0])
                ret = blood
                break;
            case EffectType.PointTrail:
                ret = new PointTrail(arg[0], this.game)
                break;
            case EffectType.Trail:
                const trail = new Trail()
                trail.initTrailEffect(arg[0], this.game)
                ret = trail
                break;
            case EffectType.Damage:{
                const vfx = new QuarksVfx('assets/vfx/CartoonEnergyExplosion.json', this.game)
                vfx.initEffect(arg[0])
                ret = vfx
                break;
            }
            case EffectType.Test:
            default:
                ret = new TestVfx(this.game)
                break
        }
        this.effects[type] = ret
        return ret
    }
    StartEffector(type: EffectType, ...arg: any) {
        this.effects[type].Start(...arg)
    }
    Complete(type:EffectType) {
        this.effects[type].Complete()
    }
    Update(delta: number, ...arg: any): void {
        this.effects.forEach((e) => {
            e.Update(delta, arg)
        })
    }
}