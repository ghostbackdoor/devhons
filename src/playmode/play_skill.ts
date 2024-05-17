
type SkillInfo = {
    name: string
    explain: string
}

export class UiSkill {
    warriorSkills: SkillInfo[] = []
    archerSkills: SkillInfo[] = []
    wizardSkills: SkillInfo[] = []

    constructor() {
        this.warriorSkills.push({
            name: "", 
            explain: ""
        })
    }
}