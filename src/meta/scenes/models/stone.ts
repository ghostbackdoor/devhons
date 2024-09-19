import * as THREE from "three";
import { GhostModel } from "./ghostmodel";
import { IAsset } from "@Loader/assetmodel";

export class Stone extends GhostModel {
    constructor(asset: IAsset) {
        super(asset)
    }

    async Init() {
    }

    async MassLoader(meshs:THREE.Group, scale: number, position: THREE.Vector3) {
        const rotate = THREE.MathUtils.randFloat(0, 1)
        this.meshs = meshs.clone()
        this.meshs.scale.set(scale, scale, scale)
        this.meshs.position.set(position.x, position.y, position.z)
        this.meshs.rotateX(rotate)
        this.meshs.rotateZ(rotate)
        this.meshs.castShadow = true
        this.meshs.receiveShadow = true
        this.meshs.traverse(child => {
            child.castShadow = true
            child.receiveShadow = true
        })
    }
}