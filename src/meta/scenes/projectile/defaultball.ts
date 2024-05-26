import * as THREE from "three";
import { IPhysicsObject } from "../models/iobject"
import { GhostModel2 } from "../models/ghostmodel";

export class DefaultBall extends GhostModel2 implements IPhysicsObject {
    get BoxPos() {
        const v = this.CannonPos
        return new THREE.Vector3(v.x, v.y, v.z)
    }
    constructor(
        size: number
    ) {
        const geometry = new THREE.SphereGeometry(size, 4, 2)
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x00ff00,
        })

        super(geometry, material)
    }
}