import * as THREE from "three";
import { Effector } from "@Effector/effector";
import { FireballSk } from "./fire/fireball";
import { FireBlastSk } from "./fire/fireblast";

export enum SkillType {
    Fireball,
    FireBlast,
}

export interface ISkill {
    Start(...arg: any): void
    Update(delta: number, ...arg: any): void
}
export class Skill {
    skills: ISkill[] = []
    constructor(
        private effector: Effector,
        private game: THREE.Scene
    ) {
    }
    Enable(type: SkillType, ...arg: any) {
        let ret: ISkill
        switch (type) {
            case SkillType.Fireball:
                {
                    ret = new FireballSk(this.effector)
                    break
                }
            case SkillType.FireBlast:
                {
                    ret = new FireBlastSk(this.effector)
                    break
                }
        }
        this.skills[type] = ret
    }
    Start(type: SkillType, ...arg: any) {
        this.skills[type].Start(...arg)
    }
    Update(delta: number, ...arg: any) {
        this.skills.forEach((e) => {
            e.Update(delta, ...arg)
        })
    }
}