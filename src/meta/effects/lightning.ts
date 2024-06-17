import * as THREE from "three";
import { IEffect } from "./effector";

export class Lightning implements IEffect {
    process = false
    points: THREE.Points;
    startTime = 0
    start = new THREE.Vector3
    end = this.start.clone()
    count = 10
    constructor() {
        this.end.y += 10
        const particlesGeometry = new THREE.BufferGeometry()
        const lineVertex = this.lightning(this.start, this.end, THREE.MathUtils.randInt(5, 8), this.count)
        particlesGeometry.setFromPoints(lineVertex)

        const colors: number[] = []
        const r = THREE.MathUtils.randInt(Math.random(), .1)
        const g = THREE.MathUtils.randInt(.6, 1)
        const b = THREE.MathUtils.randInt(0, .8)
        for( let i = 0; i < lineVertex.length ; i++){
            colors.push(r, g, b)
        }
        particlesGeometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

        /*
        pointsGeometry.computeBoundingSphere()
        const textureLoader = new THREE.TextureLoader()
        let points = new THREE.Points(pointsGeometry, new THREE.PointsMaterial({
            size: 1.0,
            transparent: true,
            color: new THREE.Color(Math.random(), Math.random(), Math.random()),
            opacity: 1,
            depthWrite: false,
            alphaMap: textureLoader.load('./paticle.png')
        }))
        */

        ///// Shader /////
        const shaderPoint = THREE.ShaderLib.points
        const uniforms = THREE.UniformsUtils.clone(shaderPoint.uniforms)
        const image = new Image()
        uniforms.map.value = new THREE.Texture(image)
        image.onload = () => {
            uniforms.map.value.needsUpdate = true
        }
        image.src = "assets/texture/particle.png"

        const radius = THREE.MathUtils.randInt(2, 3)
        uniforms.size.value = radius
        uniforms.scale.value = 40

        this.points = new THREE.Points(particlesGeometry, new THREE.ShaderMaterial({
            uniforms: uniforms,
            defines: {
                USE_COLOR: "",
                USE_MAP:"",
                USE_SIZEATTENUATION: "",
            },
            transparent: true,
            // alphaTest: 4
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
            vertexShader: shaderPoint.vertexShader,
            fragmentShader: shaderPoint.fragmentShader,
        }))
        this.points.visible = false
    }
    Start() {
        this.points.visible = true
        this.start.set(0, 0, 0)
        this.end.copy(this.start)
        this.end.y += 5
        this.process = true
    }

    Update(delta: number) {
        if(!this.process) return 
        const particlesGeometry = this.points.geometry
        const lineVertex = this.lightning(this.start, this.end, 
            THREE.MathUtils.randInt(6, 10), this.count)
        particlesGeometry.setFromPoints(lineVertex)
        particlesGeometry.attributes.position.needsUpdate = true
        this.startTime += delta
        if(this.startTime > 1) {
            this.process = false
            this.points.visible = false
        }
    }


    lightning(start: THREE.Vector3, end: THREE.Vector3, iterations: number, max: number) {
        let result = [start, end]
        let temp:THREE.Vector3[] = []
        let mid, normal, randVec, l
        max = max || 100

        if (iterations < 1) {
            return result
        }

        while (iterations--) {
            l = result.length
            while (l--) {
                start = result[l]
                if (l < 1) {
                    temp.push(start);
                    break;
                }
                end = result[l - 1]
                mid = start.clone().lerp(end, .5)
                randVec = new THREE.Vector3(THREE.MathUtils.randInt(-1, 1), THREE.MathUtils.randInt(-1, 1), THREE.MathUtils.randInt(-1, 1))
                normal = randVec.cross(end.clone().sub(start).normalize())
                mid.add(normal.multiplyScalar(THREE.MathUtils.randInt(-max, max)))

                temp.push(start, mid)
            }
            result = temp.splice(0);
            max /= 2
        }

        return result
    }

    getPositions(
        points: THREE.BufferAttribute | THREE.InterleavedBufferAttribute, 
        count: number, alpha: number
    ) {
        let positions: number[] = []
        if (!points)
            return positions

        let l = count
        let vec3s = new THREE.Vector3()
        let vec3e = vec3s.clone()
        let vec3n = vec3s.clone()
        let dist, size, i
        while (l--) {
            vec3s.set(points.getX(l), points.getY(l), points.getZ(l))
            vec3n.set(vec3s.x, vec3s.y, vec3s.z)
            if (l < 1) {
                positions.push(vec3n.x, vec3n.y, vec3n.z)
                break;
            }
            vec3e.set(points.getX(l - 1), points.getY(l - 1), points.getZ(l - 1));

            dist = vec3n.distanceTo(vec3e);
            size = dist * alpha | 0

            for (i = 0; i < size; i++) {
                vec3n.set(vec3s.x, vec3s.y, vec3s.z)
                vec3n.lerp(vec3e, i / size)
                positions.push(vec3n.x, vec3n.y, vec3n.z)
            }
        }

        return positions
    }
}