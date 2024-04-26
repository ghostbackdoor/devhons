import * as THREE from "three";
import { IObject, IPhysicsObject } from "./iobject";
import { GhostModel2 } from "./ghostmodel";


export class ProgressBar extends GhostModel2 implements IObject, IPhysicsObject {
    get BoxPos() {
        const v = this.CannonPos
        return new THREE.Vector3(v.x, v.y, v.z)
    }
    gauge: THREE.Mesh
    constructor(rTop: number, rBottom: number, private depth: number) {
        const geometry = new THREE.CylinderGeometry(rTop, rBottom, depth, 5)
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity:0.5,
        })
        super(geometry, material)
        const gGeo = new THREE.CylinderGeometry(rTop, rBottom, depth, 5)
        const gMat = new THREE.MeshStandardMaterial({
            color: 0x00ff00,
        })
        this.gauge = new THREE.Mesh(gGeo, gMat)
        this.gauge.scale.set(.9, .01, .9)
        this.gauge.position.y = depth / 2
        this.add(this.gauge)

        this.rotation.x = Math.PI / 2
        this.rotation.y = Math.PI / 2
        this.rotation.z = Math.PI / 2
    }
    SetProgress(ratio: number) {
        if (ratio > 1) ratio = 1
        else if (ratio < 0) ratio = 0
        this.gauge.scale.y = ratio
        this.gauge.position.y = (this.depth / 2) * (1 - ratio)
    }
}

