import * as THREE from "three";
import { Loader } from "./loader";

export enum Bind {
    Body, // chainmail, platemail, wizard robe
    Hands_L, //Gloves
    Hands_R, //Gloves
    Head,
    Legs,
    Feet,
}

export enum Ani {
    Idle,
    Run,
    Jump,
    Punch,
    FightIdle,
    Dying,
    Shooting,
    Sword,
    MagicH1,
    MagicH2,
    Dance0,

    Wartering,
    Hammering,
    PickFruit,
    PickFruitTree,
    PlantAPlant,

    MonBiting,
    MonScream,
    MonHurt,
}

export enum Char{
    Male,
    Female,
    Tree,
    DeadTree,
    Mushroom1,
    Mushroom2,
    Portal,
    Test,
    Zombie,
    Minataur,
    BatPig,
    Bilby,
    BilbyMon,
    BirdMon,
    CrabMon,
    Gorillish,
    PantherBlackWhite,
    PantherBlue,
    PantherRed,
    AnimalPack,

    Bat,
    Gun,
    WarteringCan,
    Hammer,
    AppleTree,

    Bed,
    Stone,
}
export enum ModelType {
    Gltf,
    Fbx
}

export interface IAsset {
    get Id(): Char
    get Clips(): Map<Ani, THREE.AnimationClip | undefined>
    GetAnimationClip(id: Ani): THREE.AnimationClip | undefined 
    GetBox(mesh: THREE.Group): THREE.Box3
    GetBoxPos(mesh: THREE.Group): THREE.Vector3
    GetSize(mesh: THREE.Group): THREE.Vector3
    CloneModel(): Promise<THREE.Group>
    UniqModel(id: string): Promise<[THREE.Group, boolean]>
    GetMixer(id: string): THREE.AnimationMixer | undefined
    GetBodyMeshId(bind?: Bind) : string | undefined
}

export class AssetModel {
    protected meshs?: THREE.Group
    protected size?: THREE.Vector3
    protected mixer?: THREE.AnimationMixer
        protected clips = new Map<Ani, THREE.AnimationClip | undefined>()
    private models = new Map<string, THREE.Group>()
    private mixers = new Map<string, THREE.AnimationMixer>()

    get Clips() { return this.clips }
    get Mixer() { return this.mixer }
    constructor(
        protected loader: Loader, 
        private loaderType: ModelType,
        private path: string, 
        private afterLoad: Function
    ) { }

    GetAnimationClip(id: Ani): THREE.AnimationClip | undefined {
        return this.clips.get(id)
    }

    async UniqModel(id: string): Promise<[THREE.Group, boolean]> {
        const has = this.models.get(id)
        if (has != undefined) {
            return [has, true]
        }

        const ret = await this.NewModel()
        this.models.set(id, ret)
        return [ret, false]
    }
    async LoadAnimation(url: string, type: Ani) {
        const obj = await this.loader.FBXLoader.loadAsync(url)
        this.clips.set(type, obj.animations[0])
    }

    GetMixer(id: string): THREE.AnimationMixer | undefined {
        const has = this.mixers.get(id)
        if (has != undefined) {
            return has
        }
        const model = this.models.get(id)
        if (model == undefined) return undefined
        const ret = new THREE.AnimationMixer(model)
        this.mixers.set(id, ret)
        return ret
    }
    async NewModel(): Promise<THREE.Group> {
        if (this.loaderType == ModelType.Gltf) {
            return await new Promise(async (resolve) => {
                await this.loader.Load.load(this.path, async (gltf) => {
                    this.meshs = gltf.scene
                    await this.afterLoad(gltf)
                    resolve(gltf.scene)
                })
            })
        }
        return await new Promise(async (resolve) => {
            await this.loader.FBXLoader.load(this.path, async (obj) => {
                await this.afterLoad(obj)
                resolve(obj)
            })
        })
    }

    async CloneModel(): Promise<THREE.Group> {
        if(this.meshs != undefined) {
            return this.meshs.clone()
            /*
                    if(this.meshs instanceof THREE.Mesh) {
                        this.meshs.material = this.meshs.material.clone()
                    }
            */
        }
        return await this.NewModel()
    }
}