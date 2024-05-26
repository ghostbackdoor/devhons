import * as THREE from "three";
import {
    BatchedParticleRenderer,
    ParticleEmitter,
    QuarksLoader,
} from 'three.quarks';
import { IEffect } from "./effector";


export class QuarksVfx implements IEffect {
    totalTime = 0;
    refreshIndex = 0;
    refreshTime = 1;
    processFlag = false
    batchRenderer = new BatchedParticleRenderer();
    loaded = false
    target?: THREE.Group
   
    groups: THREE.Object3D[] = []
    constructor(private vfxPath: string) {}

    async initEffect(mesh: THREE.Group, game: THREE.Scene) {
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
        if(this.processFlag) return
        this.groups[this.refreshIndex].traverse((object) => {
            if (object instanceof ParticleEmitter) {
                object.system.restart();
            }
        });
        if (this.target) this.groups[this.refreshIndex].position.copy(this.target.position)
        console.log(this.target?.position)

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
        if (this.batchRenderer) this.batchRenderer.update(delta);
    }
}