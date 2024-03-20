import { EffectType } from "../effects/effector"
import { EventController } from "../event/eventctrl"
import { AttackType, PlayerStatus } from "../scenes/player/playerctrl"
import { IBuffItem } from "./buff"



export class AttackUp implements IBuffItem {
    name = "헐크의혼"
    icon = "skill2/UI_Skill_Icon_Buff.png"
    lv = 0
    attack = .05
    get explain(): string {
        return `공격력이 ${Math.round(((.01 * (this.lv + 1)) + this.attack) * 100)}% 증가합니다.`
    }
    IncreaseLv(): number { return ++this.lv }
    GetAttackSpeed(): number { return 1 }
    GetMoveSpeed(): number { return 1 }
    GetDamageMax(): number {
        return 1 + this.attack + (.01 * this.lv)
    }
    Update(delta: number, status: PlayerStatus): void { }
}

export class AreaAttack implements IBuffItem {
    name = "영혼의공격"
    icon = "skill2/UI_Skill_Icon_PsycicAttack.png"
    lv = 0
    time = 4
    area = 3
    damage = 2
    get explain(): string {
        return `${this.time}초당 주변 ${this.area + (this.lv + 1)}이내 몬스터에게 ${this.damage * (this.lv + 1)} 피해를 줍니다. `
    }
    accTime = 0

    constructor(private eventCtrl: EventController) { }
    IncreaseLv(): number { return ++this.lv }
    GetAttackSpeed(): number { return 1 }
    GetMoveSpeed(): number { return 1 }
    GetDamageMax(): number { return 1 }
    Update(delta: number, status: PlayerStatus): void {
        if (status.health <= 0) return
        this.accTime += delta
        if(this.accTime / (this.time) < 1) {
            return
        }
        this.accTime -= this.time

        this.eventCtrl.OnAttackEvent("monster", [{
            type: AttackType.AOE,
            effect: EffectType.Lightning,
            damage: this.damage * this.lv,
            distance: this.area + this.lv,
        }])
    }
}
export class Healing implements IBuffItem {
    name = "성스러운느낌"
    icon = "skill2/UI_Skill_Icon_Heal.png"
    lv = 0
    time = 4
    heal = .01
    accTime = 0
    get explain(): string {
        return `${this.time}초당 ${(this.heal * (this.lv + 1)) * 100}%만큼 피가 차오릅니다.`
    }
    constructor(private eventCtrl: EventController) { }
    IncreaseLv(): number { return ++this.lv }
    GetAttackSpeed(): number { return 1 }
    GetMoveSpeed(): number { return 1 }
    GetDamageMax(): number { return 1 }
    Update(delta: number, status: PlayerStatus): void {
        if (status.health <= 0) return
        this.accTime += delta
        if(this.accTime / (this.time) < 1) {
            return
        }
        this.accTime -= this.time

        this.eventCtrl.OnAttackEvent("player", [{
            type: AttackType.Heal,
            damage: status.maxHealth * (this.heal * this.lv)
        }])
    }
}