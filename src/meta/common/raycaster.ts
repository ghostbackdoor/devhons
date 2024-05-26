import * as THREE from "three";
import { IPhysicsObject } from "../scenes/models/iobject";
import { Camera } from "./camera";
import { Legos } from "../scenes/bricks/legos";
import { EventBricks } from "../scenes/bricks/eventbricks";
import { Canvas } from "./canvas";
import { IViewer } from "../scenes/models/iviewer";
import { EventController } from "../event/eventctrl";
import { NonLegos } from "../scenes/bricks/nonlegos";


export class RayViwer extends THREE.Raycaster implements IViewer {
    dir = new THREE.Vector3(0, 0, 0)
    pos = new THREE.Vector3(0, 0, 0)
    objs: THREE.Object3D[] = []
    color = new THREE.Color()
    constructor(
        private target: IPhysicsObject, 
        private _camera: Camera, 
        private legos: Legos,
        private nonlegos: NonLegos,
        private eventBricks: EventBricks,
        canvas: Canvas,
        eventCtrl: EventController
    ) {
        super()
        canvas.RegisterViewer(this)
        eventCtrl.RegisterChangeCtrlObjEvent((obj: IPhysicsObject) => {
            console.log("change obj", obj)
            this.target = obj
        })
    }
    resize(): void { }

    update(): void {
        if (this.target == undefined) {
            this.opacityBox.forEach((box)=> {
                if (box.length) {
                    this.ResetBox(box)
                }
            })
            return
        }

        this.dir.subVectors(this._camera.position, this.target.CenterPos)
        this.set(this.target.CenterPos, this.dir.normalize())

        if (this.legos.instancedBlock != undefined)
            this.CheckVisible(this.legos.instancedBlock)
        if( this.legos.bricks2.length > 0)
            this.CheckVisibleMeshs(this.legos.bricks2, this.opacityBox[0])
        if (this.nonlegos.instancedBlock != undefined)
            this.CheckVisible(this.nonlegos.instancedBlock)
        if( this.nonlegos.bricks2.length > 0)
            this.CheckVisibleMeshs(this.nonlegos.bricks2, this.opacityBox[1])
        if (this.eventBricks.instancedBlock != undefined)
            this.CheckVisible(this.eventBricks.instancedBlock)
        if( this.eventBricks.bricks2.length > 0)
            this.CheckVisibleMeshs(this.eventBricks.bricks2, this.opacityBox[2])

    }
    opacityBox: THREE.Mesh[][] = [[],[], []]
    CheckVisible(physBox: THREE.InstancedMesh) {
        const intersects = this.intersectObject(physBox, false)
        const dis = this.target.CenterPos.distanceTo(this._camera.position)
        if (intersects.length > 0 && intersects[0].distance < dis) {
            this._camera.position.copy(intersects[0].point);
            //(physBox.material as THREE.MeshStandardMaterial).opacity = 0.5;
        } else {
            //(physBox.material as THREE.MeshStandardMaterial).opacity = 1;
        } 
    }
    CheckVisibleMeshs(physBox: THREE.Mesh[], opacityBox: THREE.Mesh[]) {
        const intersects = this.intersectObjects(physBox, false)
        const dis = this.target.CenterPos.distanceTo(this._camera.position)
        if (intersects.length > 0 && intersects[0].distance < dis) {
            this._camera.position.copy(intersects[0].point)
            /*
            intersects.forEach((obj) => {
                if (obj.distance > dis) return false
                const mesh = obj.object as THREE.Mesh
                if ((mesh.material as THREE.MeshStandardMaterial).opacity != 0.1) {
                    opacityBox.push(mesh);
                    mesh.castShadow = false;
                    (mesh.material as THREE.MeshStandardMaterial).opacity = 0.1
                }
            })
            */
        } else {
            this.ResetBox(opacityBox)
        }
    }
    ResetBox(box: THREE.Mesh[]) {
        box.forEach((mesh) => {
            mesh.castShadow = true;
            (mesh.material as THREE.MeshStandardMaterial).opacity = 1;
        })
        box.length = 0
    }
}