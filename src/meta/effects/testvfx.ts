import * as THREE from "three";
import { IEffect } from "./effector";

export class TestVfx implements IEffect {
    processFlag = false

    constructor(_: THREE.Scene) {
    }
    Start() {
        this.processFlag = true
    }
    Complet() {
        this.processFlag = false
    }
    Update(_: number) {
        if (!this.processFlag) return
    }
}