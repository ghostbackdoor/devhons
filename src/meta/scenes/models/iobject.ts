import * as THREE from "three";

export interface IObject {
    get Meshs(): THREE.Mesh
}

export interface IPhysicsObject {
    get Velocity(): number
    set Velocity(n: number)
    get Size() : THREE.Vector3
    get BoxPos() : THREE.Vector3
    get Box(): THREE.Box3
    get CannonPos(): THREE.Vector3
    set CannonPos(v: THREE.Vector3)
    set Visible(flag: boolean)
    get Meshs(): THREE.Group | THREE.Mesh
}
export interface IBuildingObject {
    get Size() : THREE.Vector3
    get BoxPos() : THREE.Vector3
}

export interface ICtrlObject {
    PostStep(): void
}