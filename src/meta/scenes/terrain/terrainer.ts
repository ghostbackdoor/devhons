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

        const origin = new THREE.Vector3(0, 0, 0);
        const to = new THREE.Vector3(0, 1, 0);
        const length = SConf.LegoFieldH / 2 + 1;
        const hex = 0xff0000;
        const dir = to.subVectors(origin, to).normalize()

        const arrowHelper = new THREE.ArrowHelper(dir, origin, length, hex);
        this.Meshs.add(arrowHelper)
    }
    Copy(src: Terrainer) {
        this.position.copy(src.position)
        this.rotation.copy(src.rotation)
    }
    Set(pos: THREE.Vector3, rot: THREE.Euler) {
        this.position.copy(pos)
        this.rotation.copy(rot)
    }
}

