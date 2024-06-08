import * as THREE from "three";
import { GhostModel2 } from "../models/ghostmodel";
import { IPhysicsObject } from "../models/iobject";
import SConf from "../../configs/staticconf";


export class Terrainer extends GhostModel2 implements IPhysicsObject {
    get BoxPos() {
        const v = this.CannonPos
        return new THREE.Vector3(v.x, v.y, v.z)
    }
    constructor() {
        const geometry = new THREE.PlaneGeometry(SConf.LegoFieldW, SConf.LegoFieldH)
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: .8
        })
        super(geometry, material)
        this.rotateX(-Math.PI / 2)
        this.position.set(0, 50, 0)
    }
}

