import * as THREE from "three";
import { GhostModel } from "./ghostmodel";
import { IAsset } from "../../loader/assetmodel";

export class Grass extends GhostModel {
    constructor(asset: IAsset) {
        super(asset)
    }

    async Init() {
    }

    async MassLoader(scale: number, position: THREE.Vector3, x: number) {
        this.meshs = await this.asset.CloneModel()
        this.meshs.scale.set(scale, scale, scale)
        this.meshs.position.set(position.x, position.y, position.z)
        this.meshs.castShadow = true
        this.meshs.receiveShadow = false
        this.meshs.traverse(child => {
            child.castShadow = true
            child.receiveShadow = false
        })
        this.meshs.rotateY(x)
    }
}