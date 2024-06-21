import * as THREE from "three";
import { IObject, IPhysicsObject } from "./iobject";
import { GhostModel2 } from "./ghostmodel";
//import { Gui } from "../../factory/appfactory"


export class Floor extends GhostModel2 implements IObject, IPhysicsObject {
    get BoxPos() {
        const v = this.CannonPos
        return new THREE.Vector3(v.x, v.y, v.z)
    }
    constructor(width: number) {
        width *= 10
        const geometry = new THREE.CircleGeometry(width, 6)
        /*
        const textureLoader = new THREE.TextureLoader();

        // 텍스처 로드
        const baseColor = textureLoader.load('assets/texture/basecolor.png');
        const metallic = textureLoader.load('assets/texture/roughness.png');
        const normal = textureLoader.load('assets/texture/normal.png');
        const roughness = textureLoader.load('assets/texture/roughness.png');

        // 텍스처 반복 설정
        const repeatX = 800; // X 축 반복 횟수
        const repeatY = 800; // Y 축 반복 횟수

        [baseColor, metallic, normal, roughness].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
        });
        */
        const material = new THREE.MeshStandardMaterial({ 
            color: 0xffcc66,
         //   map: baseColor,
         //   metalnessMap: metallic,
         //   normalMap: normal,
         //   roughnessMap: roughness
        })
        super(geometry, material)
        this.position.set(0, 0, 0)
        this.rotateX(-Math.PI / 2)
        this.receiveShadow = true


    }
}
