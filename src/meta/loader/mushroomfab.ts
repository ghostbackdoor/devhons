import * as THREE from "three";
import { Loader } from "./loader";
import { AssetModel, Char, IAsset, ModelType } from "./assetmodel";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";


export class MushroomFab extends AssetModel implements IAsset {
    id = Char.Mushroom1

    get Id() {return this.id}

    constructor(loader: Loader, type: number) { 
        super(loader, ModelType.Gltf, "assets/custom_island/mushroom" + type + ".glb", (gltf: GLTF) => {
            this.meshs = gltf.scene
            this.meshs.castShadow = true
            this.meshs.receiveShadow = true
            this.meshs.traverse(child => {
                child.castShadow = true
                child.receiveShadow = true
            })
        })
        this.id = (type == 1)? Char.Mushroom1: Char.Mushroom2
    }
    GetSize(mesh: THREE.Group): THREE.Vector3 {
        const bbox = new THREE.Box3().setFromObject(mesh)
        this.size = bbox.getSize(new THREE.Vector3)
        this.size.x = Math.ceil(this.size.x)
        this.size.z = Math.ceil(this.size.z)
        return this.size 
    }

    GetBoxPos(mesh: THREE.Group) {
        const v = mesh.position
        return new THREE.Vector3(v.x, v.y, v.z)
    }
}