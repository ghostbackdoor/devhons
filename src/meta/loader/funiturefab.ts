import * as THREE from "three";
import { Loader } from "./loader";
import { AssetModel, Char, IAsset, ModelType } from "./assetmodel";
import { GLTF } from "three/examples/jsm/loaders/GLTFLoader";


export class BedFab extends AssetModel implements IAsset {
    id = Char.Bed

    get Id() {return this.id}

    constructor(loader: Loader) { 
        super(loader, ModelType.Gltf, "assets/furniture/bed.glb", (gltf: GLTF) => {
            this.meshs = new THREE.Group()
            this.meshs.add(gltf.scene)
            this.meshs.castShadow = true
            this.meshs.receiveShadow = true
            this.meshs.traverse(child => {
                child.castShadow = true
                child.receiveShadow = true
            })
            const scale = .8
            this.meshs.children[0].scale.set(0.96, scale, scale)
            this.meshs.children[0].position.z += 0.34
        })
    }
    
    GetBox(mesh: THREE.Group) {
        if (this.meshs == undefined) this.meshs = mesh
        if (this.box == undefined) {
            const s = this.GetSize(mesh)
            this.box = new THREE.Mesh(
                new THREE.BoxGeometry(s.x, s.y, s.z), this.boxMat)
        }

        const p = this.GetBoxPos(mesh)
        this.box.position.set(p.x, p.y, p.z)
        return new THREE.Box3().setFromObject(this.box)
    }
    GetSize(mesh: THREE.Group): THREE.Vector3 {
        if (this.meshs == undefined) this.meshs = mesh
        if (this.size) return this.size
        const bbox = new THREE.Box3().setFromObject(mesh)
        this.size = bbox.getSize(new THREE.Vector3)
        this.size.x = Math.ceil(this.size.x) - 1.5
        this.size.y = Math.ceil(this.size.y)
        this.size.z = Math.ceil(this.size.z)
        console.log(this.meshs, this.size)
        return this.size 
    }

    GetBodyMeshId() { return "mixamorigRightHand" }
}