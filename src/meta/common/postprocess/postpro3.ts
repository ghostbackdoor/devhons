import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass'
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass'
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader'
import { ColorCorrectionShader } from 'three/examples/jsm/shaders/ColorCorrectionShader'
import { IPostPro } from './postpro'


export class Postpro3 implements IPostPro {
  constructor(
    private scene: THREE.Scene,
    private camera: THREE.Camera,
    private renderer: THREE.WebGLRenderer
  ) {
  }
  resize(): void {
  }
  setGlow(_: THREE.Mesh) {
  }
  setNonGlow(_: THREE.Mesh | THREE.Group) {
  }
  render(delta: number) {
    this.renderer.render(this.scene, this.camera)
  }
}
