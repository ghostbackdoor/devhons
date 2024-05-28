import * as THREE from "three";
import {
    BatchedParticleRenderer,
    ParticleEmitter,
    QuarksLoader,
} from 'three.quarks';
import { IEffect } from "./effector";
import { IPhysicsObject } from "../scenes/models/iobject";


export class QuarksVfx implements IEffect {
    totalTime = 0;
    refreshIndex = 0;
    refreshTime = 1;
    processFlag = false
    batchRenderer = new BatchedParticleRenderer();
    loaded = false
    target?: IPhysicsObject
   
    groups: THREE.Object3D[] = []
    constructor(private vfxPath: string) {}

    async initEffect(mesh: IPhysicsObject, game: THREE.Scene) {
        if(this.loaded) return
        this.loaded = true
        new QuarksLoader().load(this.vfxPath, (obj) => {
            obj.traverse((child) => {
                if (child instanceof ParticleEmitter) {
                    this.batchRenderer.addSystem(child.system);
                }
            });
            if (obj instanceof ParticleEmitter) {
                this.batchRenderer.addSystem(obj.system);
            }
            game.add(this.batchRenderer, obj)
            this.groups.push(obj);
            this.target = mesh
        });
    }

    Start(): void {
        if (this.processFlag || !this.loaded) return
        try {
            this.groups[this.refreshIndex].traverse((object) => {
                if (object instanceof ParticleEmitter) {
                    object.system.restart();
                }
            });
        } catch (e) {
            console.log(e, this.groups)
        }
        if (this.target) this.groups[this.refreshIndex].position.copy(this.target.CenterPos)
        console.log(this.target?.CenterPos)

        this.processFlag = true
    }

    Update(delta: number): void {
        if(!this.processFlag) return
        this.groups.forEach((group) =>
            group.traverse((object) => {
                if (object.userData && object.userData.func) {
                    object.userData.func.call(object, delta);
                }
            })
        );
        this.totalTime += delta;
        if (this.totalTime > this.refreshTime) {
            this.totalTime = 0;
            this.processFlag = false
        }
        if (this.batchRenderer) {
            const tmp = console.warn
            console.warn = () => { }
            this.batchRenderer.update(delta);
            console.warn = tmp
        }
    }
}