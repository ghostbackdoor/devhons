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
        /*
        const textureLoader = new THREE.TextureLoader();

        // 텍스처 로드
        const baseColor = textureLoader.load('assets/texture/patern_1_basecolor.png');
        const metallic = textureLoader.load('assets/texture/patern_1_metallic.png');
        const normal = textureLoader.load('assets/texture/patern_1_normal.png');
        const roughness = textureLoader.load('assets/texture/patern_1_roughness.png');

        // 텍스처 반복 설정
        const repeatX = 800; // X 축 반복 횟수
        const repeatY = 800; // Y 축 반복 횟수

        [baseColor, metallic, normal, roughness].forEach(texture => {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(repeatX, repeatY);
        });
        */
       /*
        // Default
        const geometry = new THREE.CircleGeometry(width, 6)
        const material = new THREE.MeshStandardMaterial({ 
            //color: 0x9BF22B,
            //color: 0xB2C655, //grass color
            //color: 0x81D287,
            color: 0xffcc66,
           //map: baseColor,
           //metalnessMap: metallic,
           //normalMap: normal,
           //roughnessMap: roughness
        })

        super(geometry, material)
        */
        const geometry = new THREE.PlaneGeometry(width, width, 100, 100)
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            //color: 0x228b22, 
            side: THREE.DoubleSide,
        })
        super(geometry, material)
        this.rotateX(-Math.PI / 2)

        const colors = []
        const positionAttr = geometry.attributes.position
        const range = 80
        for (let i = 0; i < positionAttr.count; i++) {
            const x = positionAttr.getX(i)
            const z = positionAttr.getY(i)
            const colorCode = (x <= range && x >= -range && z <= range && z >= -range) ? 0xffcc66 : 0xb2c655
            const color = new THREE.Color(colorCode)
            //const color = this.getRandomGreen()
            colors.push(color.r, color.g, color.b)
        }
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
        this.position.set(0, 0, 0)
        this.receiveShadow = true
    }
    getRandomGreen() {
        if (Math.random() < 0.3) return new THREE.Color(1, .8, .4)
        const r = Math.random() * 0.2
        const g = 0.1 + Math.random() * 0.5
        const b = Math.random() * 0.2
        return new THREE.Color(r, g, b)
    }
}
