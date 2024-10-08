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
    refreshTime = 2;
    processFlag = false
    batchRenderer = new BatchedParticleRenderer();
    loaded = false
    target?: THREE.Vector3
   
    groups: THREE.Object3D[] = []
    constructor(private vfxPath: string) {}

    initEffect(pos: THREE.Vector3, game: THREE.Scene) {
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
                this.refreshTime = obj.system.duration
            }
            game.add(this.batchRenderer, obj)
            this.groups.push(obj);
            this.target = pos
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
        if (this.target) this.groups[this.refreshIndex].position.copy(this.target)
        console.log(this.target)

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