import * as THREE from "three";
import { Camera } from "./camera";
import { Canvas } from "./canvas";
import { IViewer } from "../scenes/models/iviewer";

export class Renderer extends THREE.WebGLRenderer implements IViewer{

    constructor(private camera: Camera, private scene: THREE.Scene, canvas: Canvas) {
        super({ /*alpha: true,*/ antialias: true, canvas: canvas.Canvas })

        THREE.ColorManagement.enabled = true
        this.outputColorSpace = THREE.SRGBColorSpace
        this.shadowMap.enabled = true
        this.shadowMap.type = THREE.PCFSoftShadowMap

        this.setClearColor(0x66ccff, 1)
        this.setSize(canvas.Width, canvas.Height)
        this.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        canvas.RegisterViewer(this)

    }

    setScene(scene: THREE.Scene) {
        this.scene = scene
    }

    resize(width: number, height: number) {
        this.setSize(width, height)
        this.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    update() {
        this.render(this.scene, this.camera)
    }
}