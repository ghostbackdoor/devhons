import { Lang } from "../../lang/lang"
import { IAsset } from "../../loader/assetmodel"
import { ItemProperty } from "./itemdb"

export enum ItemType {
    Attack,
    Shield,
    Armor,
    Potion,
    Material,
}

export enum AttackItemType {
    Blunt, //둔기 
    Axe,
    Knife,
    Sword,
    Bow,
    Gun,
    Wand,
}

export enum Bind {
    Body, // chainmail, platemail, wizard robe
    Hands_L, //Gloves
    Hands_R, //Gloves
    Head,
    Legs,
    Feet,
}

export enum Level {
    Common,
    Uncommon,
    Rare,
    Unique,
    Legendary,
    Mythic,
}

export interface IItem {
    get DamageMin(): number
    get DamageMax(): number
    get Speed(): number
    get IconPath(): string
    get Bindable(): boolean
    get Bind(): Bind | undefined
    get Mesh(): THREE.Group | undefined
    get AttackType(): AttackItemType | undefined
    MakeInformation(): Array<{k?: string, v: string}>
}
export class Item {
    get DamageMin() { return (this.property.damageMin == undefined) ? 0 : this.property.damageMin }
    get DamageMax() { return (this.property.damageMax == undefined) ? 0 : this.property.damageMax }
    get Speed() { return (this.property.speed == undefined) ? 0 : this.property.speed }
    get IconPath() { return this.property.icon }
    get Bindable() { return this.property.binding }
    get Bind() { return this.property.bind }
    get Mesh() { return this.property.meshs }
    get AttackType() { return this.property.weapon }
    constructor(protected property: ItemProperty) {}

    MakeInformation() {
        const infos = new Array<{k?: string, v: string}>()
        const p = this.property
        infos.push({v: p.name})
        switch(p.type) {
            case ItemType.Attack: 
                switch (p.weapon) {
                    case AttackItemType.Blunt:  infos.push({ k: "Weapon", v: "Blunt" }); break;
                    case AttackItemType.Axe:    infos.push({ k: "Weapon", v: "Axe" }); break;
                    case AttackItemType.Bow:    infos.push({ k: "Weapon", v: "Bow" }); break;
                    case AttackItemType.Gun:    infos.push({ k: "Weapon", v: "Gun" }); break;
                    case AttackItemType.Knife:  infos.push({ k: "Weapon", v: "Knife" }); break;
                    case AttackItemType.Sword:  infos.push({ k: "Weapon", v: "Sword" }); break;
                    case AttackItemType.Wand:   infos.push({ k: "Weapon", v: "Wand" }); break;
                }
                break;
            case ItemType.Shield:   infos.push({v: "Shield"}); break;
            case ItemType.Armor:    infos.push({v: "Armor"}); break;
            case ItemType.Potion:   infos.push({v: "Potion"}); break;
            case ItemType.Material: infos.push({v: "Material"}); break;
        }
        if (p.damageMax != undefined) {
            infos.push({ k:"공격력",  v: p.damageMin + " ~ " + p.damageMax })
        }
        if (p.speed != undefined) {
            infos.push({ k: "공속", v: p.speed.toString() })
        }
        return infos
    }
}