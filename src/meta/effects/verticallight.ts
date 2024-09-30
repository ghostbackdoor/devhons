import * as THREE from 'three';
import { IEffect } from "./effector";

export class VerticalLight implements IEffect {
    processFlag = false
    groundLightMesh: THREE.Mesh
    groundLightMaterial: THREE.ShaderMaterial
    constructor(private game: THREE.Scene) {
        // 땅에서 빛이 솟구치는 쉐이더 코드
        const groundLightVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

        const groundLightFragmentShader = `
  uniform float time;
  varying vec2 vUv;

  void main() {
    // 빛의 강도는 시간에 따라 진동하는 효과
    float intensity = abs(sin(time * 2.0)); // 시간에 따라 밝기가 변하는 효과
    vec3 color = vec3(1.0, 0.9, 0.7) * intensity; // 따뜻한 빛 색상
    gl_FragColor = vec4(color, 1.0 - vUv.y); // y 좌표에 따라 위쪽이 더 희미해지도록
  }
`;
        // 빛이 솟구치는 Material 생성
        this.groundLightMaterial = new THREE.ShaderMaterial({
            vertexShader: groundLightVertexShader,
            fragmentShader: groundLightFragmentShader,
            uniforms: {
                time: { value: 0.0 }
            },
            transparent: true
        });

        // 빛이 솟구치는 Plane 생성
        const planeGeometry = new THREE.PlaneGeometry(5, 5);
        this.groundLightMesh = new THREE.Mesh(planeGeometry, this.groundLightMaterial);
        //this.groundLightMesh.rotation.x = -Math.PI / 2; // 땅에 평행하게 회전
    }
    Start() {
        this.processFlag = true
        this.game.add(this.groundLightMesh)
    }
    Complet() {
        this.processFlag = false
        this.game.remove(this.groundLightMesh)
    }
    Update(_: number) {
        if (!this.processFlag) return
        this.groundLightMaterial.uniforms.time.value += 0.05;
    }
}


// 시간에 따른 변화 업데이트

