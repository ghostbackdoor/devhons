
export enum SkillJob {
    Warrior,
    Wizard,
    Archer,
}

export interface ISkill {
    Start(): void
    Update(delta: number, v: THREE.Vector3, dist: number): boolean
}

export class SkillTree {
    skills: ISkill[][] = []
}