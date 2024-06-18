import * as THREE from "three";
import { IEffect } from "./effector";

export class Sounds implements IEffect {
    private processFlag = false
    private audioLoader = new THREE.AudioLoader()
    private sound: THREE.PositionalAudio

    get Sound() { return this.sound }

    constructor(
        listener: THREE.AudioListener,
        audioPath: string,
    ) {
        this.sound = new THREE.PositionalAudio(listener)
        this.audioLoader.load(audioPath, (buffer) => {
            this.sound.setBuffer(buffer)
            this.sound.setRefDistance(20)
        })
    }

    Start() {
        this.processFlag = true
        this.sound.play()
    }
    Update(_: number) {
        if (!this.processFlag) return
    }
}