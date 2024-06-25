import * as THREE from "three";
import { IObject } from "./models/iobject";
import { IScene } from "./models/iviewer";
import { Light } from "../common/light";

export class Game extends THREE.Scene implements IScene {
    models: THREE.Mesh[]
    meshs: THREE.Mesh[]
    objs: IObject[]

    constructor(light: Light, ...objs: IObject[]) {
        super()
        const abmbient = new THREE.AmbientLight(0xffffff, 0.3)
        const hemispherelight = new THREE.HemisphereLight(0xffffff, 0x333333)
        hemispherelight.position.set(0, 20, 10)
        this.objs = objs
        this.models = objs.map((child: IObject) => child.Meshs)

        const fogColor = 0x87ceeb
        this.fog = new THREE.FogExp2(fogColor, 0.0025);
        //this.fog = new THREE.Fog(fogColor, 100, 400)
        this.add(
            abmbient, 
            hemispherelight, //new THREE.HemisphereLightHelper(hemispherelight, 5),
            light, light.target, //new THREE.DirectionalLightHelper(light, 5),
            ...this.models)
        this.meshs = this.models.filter((child: THREE.Mesh) => child.isMesh)
    }

    play() {
    }

    dispose() {
        this.objs.forEach((obj) => {
            const model = obj.Meshs
            if(model.isMesh) {
                model.geometry.dispose()
                if (model.material instanceof Array) {
                    model.material.map((m) => m.dispose())
                } else {
                    model.material.dispose()
                }
                this.remove(model)
            }
        })
    }
}