import * as THREE from "three";
import { AppMode } from "../../app";
import { House, Lego, StoreData } from "../../common/modelstore";
import { GPhysics } from "../../common/physics/gphysics";
import { EventController, EventFlag } from "../../event/eventctrl";
import { IKeyCommand, KeyType } from "../../event/keycommand";
import { Loader } from "../../loader/loader";
import { EventBrick } from "../bricks/bricks";
import { TerrainCtrl } from "./terrainctrl";
import { Terrainer } from "./terrainer";
import SConf from "../../configs/staticconf";

export enum CityMessage {
    ChangeLocationS,
    ChangeLocationE,
}

export type TerrainMap = {
    terrainer: Terrainer
    data?: StoreData
    brick?: THREE.InstancedMesh
    eventBrick?: EventBrick[]
    alloc: boolean
}

export class Terrain {
    mode = false
    terrainers: TerrainMap[] = []
    terrainCtrl: TerrainCtrl
    terrains: Terrainer[] = []
    house?: House[]
    brick: THREE.InstancedMesh[] = []
    camera?: THREE.Camera
    raycaster = new THREE.Raycaster()
    mouse = new THREE.Vector2()
    locationMode = false


    get InstancedMeshs() { return this.brick}

    constructor(
        private terrainGuide: Terrainer,
        eventCtrl: EventController,
        private game: THREE.Scene,
        private gphysic: GPhysics,
        loader: Loader,
    ) {
        this.terrainCtrl = new TerrainCtrl(eventCtrl, game, this.terrainGuide, gphysic, loader)

        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag, arg: any[]) => {
            if(mode != AppMode.EditCity) return
            switch (e) {
                case EventFlag.Start:
                    this.mode = true
                    window.addEventListener("click", this.choiceTerrain.bind(this))
                    this.EditStart()
                    break
                case EventFlag.End:
                    this.mode = false
                    this.locationMode = false
                    window.removeEventListener("click", this.choiceTerrain.bind(this))
                    break
                case EventFlag.Message:
                    this.locationMode = (arg[0] == CityMessage.ChangeLocationS)
                    break
            }
        })
        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if (!this.mode) return
            if(keyCommand.Type == KeyType.Action0) {
                this.CreateTerrainer(this.terrainGuide)
            }
        })
        eventCtrl.RegisterSceneClearEvent(() => {
            this.ReleaseAll()
        })
    }
    SetCamera(c: THREE.Camera) {
        this.camera = c
    }
    EditStart() {
        this.game.add(...this.terrains)
    }
    choiceTerrain(e: MouseEvent) {
        if(!this.camera || !this.locationMode) return
        this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1

        this.raycaster.setFromCamera(this.mouse, this.camera)
        const intersects = this.raycaster.intersectObjects(this.terrains, true)
        if (intersects.length > 0) {
            const selectedObj = intersects[0].object
            console.log(selectedObj)
            const obj = this.terrainers.find(e => e.terrainer == selectedObj)
            if (!obj) return
            this.terrainGuide.Copy(obj.terrainer)
            this.DeleteStoreData(obj.terrainer)
            this.Release(obj)
        }
    }
    DeleteStoreData(entry: Terrainer) {
        const del = this.house?.find((e) => e.position.x == entry.position.x &&
            e.position.y == entry.position.y + 0.5 && e.position.z == entry.position.z)
        if (del) this.house?.splice(this.house.indexOf(del), 1)
    }
    Release(entry: TerrainMap) {
        entry.alloc = false
        this.game.remove(entry.terrainer)
        if (entry.brick) {
            this.game.remove(entry.brick)
            entry.brick.dispose()
            entry.brick = undefined
        }
        entry.eventBrick?.forEach((b) => {
            this.gphysic.DeleteBox(b.Key, b)
        })
        entry.eventBrick = undefined
    }
    ReleaseAll() {
        this.terrainers.forEach(t => {
            this.Release(t)
        })
        this.brick.length = 0
        this.terrainers.length = 0
        this.terrains.length = 0
    }
    Build(data: StoreData) {
        const instancedMesh = this.CreateInstacedMesh(data.legos)
        if (!instancedMesh) return false
        const empty = this.terrainers.find(e => e.alloc == false)
        if (!empty) return false
        empty.terrainer.position.y -= 0.5
        instancedMesh.position.copy(empty.terrainer.position)
        instancedMesh.rotation.copy(empty.terrainer.rotation)
        instancedMesh.rotateX(-Math.PI * 1.5)
        const dir = new THREE.Vector3()
        instancedMesh.getWorldDirection(dir)
        dir.negate()
        instancedMesh.position.addScaledVector(dir, SConf.LegoFieldH / 2)
        const bricks = this.MakePhysics(instancedMesh, data.legos.length)

        empty.alloc = true
        empty.brick = instancedMesh
        empty.eventBrick = bricks

        this.brick.push(instancedMesh)
        this.game.add(instancedMesh)
        return true
    }

    CreateTerrainer(src: Terrainer) {
        const terrain = new Terrainer()
        terrain.Copy(src)
        this.game.add(terrain)
        this.terrainers.push({ terrainer: terrain, alloc: false })
        this.terrains.push(terrain)
        this.house?.push({ position: terrain.position, rotation: terrain.rotation })
    }
    LoadHouse(house: House[]) {
        house.forEach(h => {
            const terrain = new Terrainer()
            terrain.Set(h.position, h.rotation)
            this.terrainers.push({ terrainer: terrain, alloc: false })
            this.terrains.push(terrain)
        })
        this.house = house
    }
    GetHouse() {
        const house: House[] = []
        this.terrainers.forEach(e => {
            const t = e.terrainer
            house.push({ position: t.position, rotation: t.rotation })
        })
        return house
    }
    update(delta: number) {
        this.terrainCtrl.update(delta)
    }

    protected brickSize: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
    protected subV = new THREE.Vector3(0.1, 0.1, 0.1)
    CreateInstacedMesh(userBricks: Lego[]) {
        if(!userBricks?.length) {
            return
        }
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshToonMaterial({ 
            //color: 0xD9AB61,
            color: 0xffffff,
            transparent: true,
        })
        const instancedBlock = new THREE.InstancedMesh(
            geometry, material, userBricks.length
        )
        instancedBlock.castShadow = true
        instancedBlock.receiveShadow = true
        const matrix = new THREE.Matrix4()
        const q = new THREE.Quaternion()

        userBricks.forEach((brick, i) => {
            q.setFromEuler(brick.rotation)
            matrix.compose(brick.position, q, brick.size)
            instancedBlock?.setColorAt(i, new THREE.Color(brick.color))
            instancedBlock?.setMatrixAt(i, matrix)
        })
        return instancedBlock
    }
    MakePhysics(mesh: THREE.InstancedMesh, length: number): EventBrick[] {
        const matrix = new THREE.Matrix4()
        const finalMatrix = new THREE.Matrix4()
        const instancedMatrix = new THREE.Matrix4()
        const q = new THREE.Quaternion()
        const collidingBoxSize = new THREE.Vector3()
        const ret: EventBrick[] = []
        mesh.updateMatrixWorld()
        instancedMatrix.copy(mesh.matrixWorld)

        for (let i = 0; i < length; i++) {
            mesh.getMatrixAt(i, matrix)
            finalMatrix.multiplyMatrices(instancedMatrix, matrix)
            const { position, scale, rotation } = this.getPosRotScaleFromMatrix(finalMatrix, q)
            const eventbrick = new EventBrick(this.brickSize, position)
            collidingBoxSize.copy(scale).sub(this.subV)
            this.gphysic.addBuilding(eventbrick, position, collidingBoxSize, rotation)
            ret.push(eventbrick)
        }
        return ret
    }
    getPosRotScaleFromMatrix(matrix: THREE.Matrix4, q: THREE.Quaternion) {
        const position = new THREE.Vector3()
        const scale = new THREE.Vector3
        matrix.decompose(position, q, scale)
        const rotation = new THREE.Euler().setFromQuaternion(q)
        return { position, scale, rotation }
    }
}