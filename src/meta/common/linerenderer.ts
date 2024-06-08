import * as THREE from "three";
import { Camera } from "./camera";
import { Canvas } from "./canvas";
import { IViewer } from "../scenes/models/iviewer";

import { OutlineEffect } from "three/examples/jsm/effects/OutlineEffect"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass"
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass"
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass"

export class LineRenderer extends THREE.WebGLRenderer implements IViewer{
    effect = new OutlineEffect(this)
    bloomComposer: EffectComposer
    finalComposer: EffectComposer
    bloomLayer = new THREE.Layers()

    constructor(private camera: Camera, private scene: THREE.Scene, canvas: Canvas) {
        super({ /*alpha: true,*/ antialias: true, canvas: canvas.Canvas })

        THREE.ColorManagement.enabled = true
        this.outputColorSpace = THREE.SRGBColorSpace
        this.shadowMap.enabled = true
        this.shadowMap.type = THREE.PCFSoftShadowMap
        this.toneMapping = THREE.ReinhardToneMapping

        this.setClearColor(0x66ccff, 1)
        this.setSize(canvas.Width, canvas.Height)
        this.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        canvas.RegisterViewer(this)

        this.bloomComposer = new EffectComposer(this)
        this.finalComposer = new EffectComposer(this)
        this.setUnrealBloom(canvas.width, canvas.height)
    }
    setUnrealBloom(w: number, h: number) {
        const renderScene = new RenderPass(this.scene, this.camera)
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(w, h),
            1.5, 0.4, 0.85)
        bloomPass.threshold = 1
        bloomPass.strength = 1
        bloomPass.radius = 1
        this.bloomComposer.renderToScreen = false
        this.bloomComposer.addPass(renderScene)
        this.bloomComposer.addPass(bloomPass)

        const mixPass = new ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: {value: null},
                    bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
                },
                vertexShader :this.vertexShaderCode,
                fragmentShader: this.fragmentShaderCode,
                defines: {}
            }), 'baseTexture'
        )
        mixPass.needsSwap = true
        const outputPass = new OutputPass()
        this.finalComposer.addPass(renderScene)
        this.finalComposer.addPass(mixPass)
        this.finalComposer.addPass(outputPass)

        this.bloomLayer.set(1)
    }

    setScene(scene: THREE.Scene) {
        this.scene = scene
    }

    resize(width: number, height: number) {
        this.setSize(width, height)
        this.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    }

    update() {
        this.bloomComposer.render()
        this.finalComposer.render()
        this.effect.render(this.scene, this.camera)
    }

    vertexShaderCode = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `
    fragmentShaderCode = `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
            gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
        }
    `
}