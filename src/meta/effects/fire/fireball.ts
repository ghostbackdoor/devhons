import * as THREE from "three";
import shader from "./shader/firedef"
import { IEffect } from "../effector";

export class FireballVfx implements IEffect {
  processFlag = false
  vshader = shader.fireballVert
  fshader = shader.fireballFrag
  ball: THREE.Mesh
  uniforms = {
    u_time: { value: 0.0 },
    u_mouse: { value: { x: 0.0, y: 0.0 } },
    u_resolution: { value: { x: 0, y: 0 } },
    u_tex: { value: new THREE.TextureLoader().load("assets/texture/explosion.png") }
  }
  constructor(private scene: THREE.Scene) {

    const geometry = new THREE.IcosahedronGeometry(3, 4);

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vshader,
      fragmentShader: this.fshader
    });

    this.ball = new THREE.Mesh(geometry, material);
    this.resize()
    window.addEventListener('resize', () => {
      this.resize()
    });
  }
  resize() {
    this.uniforms.u_resolution.value.x = window.innerWidth;
    this.uniforms.u_resolution.value.y = window.innerHeight;
  }
  Start() {
    this.scene.add(this.ball);
    this.processFlag = true
  }
  Complet() {
    this.processFlag = false
  }
  Update(delta: number) {
    if (!this.processFlag) return
    this.uniforms.u_time.value += delta
  }
}
