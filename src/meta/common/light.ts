import * as THREE from "three";
import SConf from "../configs/staticconf";

export class Light extends THREE.DirectionalLight {
    constructor() {
        super(0xffffff, 2)
        //const pos = this.player.Position
        const pos = SConf.StartPosition
        this.position.set(pos.x + 100, 200, pos.z + 30)
        this.target.position.set(pos.x, 3, pos.z)
        this.castShadow = true
        this.shadow.radius = 1000
        this.shadow.mapSize.width = 4096
        this.shadow.mapSize.height = 4096
        this.shadow.camera.near = 1
        this.shadow.camera.far = 1000.0
        this.shadow.camera.left = 500
        this.shadow.camera.right = -500
        this.shadow.camera.top = 500
        this.shadow.camera.bottom = -500
    }
}