import * as THREE from "three";
import * as CANNON from "cannon-es"
import { ICtrlObject, IObject, IPhysicsObject } from "../../scenes/models/iobject";

export class Physics extends CANNON.World {
    clock = new THREE.Clock()
    models: IPhysicsObject[]
    keyCtrlModels: ICtrlObject[]

    constructor() {
        super()

        this.models = this.keyCtrlModels = []
        this.gravity = new CANNON.Vec3(0, -12.82, 0)
        this.broadphase = new CANNON.SAPBroadphase(this)
        this.allowSleep = true
        this.addEventListener('postStep', () => {
            this.keyCtrlModels.forEach((model) => {
                model.PostStep()
            })
        })
    }
    RegisterKeyControl(...models: ICtrlObject[]) {
        this.keyCtrlModels.push(...models)
    }
    add(...models: IPhysicsObject[]) {
        models.forEach((model) => {
        })
        this.models = models
    }
    update() {
        const deltaTime = this.clock.getDelta()
        this.step(1 / 60, deltaTime)

        /*
        this.models.forEach((model) => {
            if (model.Body) {
                model.UpdatePhysics()
            }
        })
        */
    }
    dispose() {
        this.models.forEach((model) => {
        })
    }
}