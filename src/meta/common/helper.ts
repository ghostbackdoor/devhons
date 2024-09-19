import * as THREE from "three";
import { GUI } from "lil-gui"
import { Player } from "../scenes/player/player"
import { EventController } from "../event/eventctrl"
import { Game } from "../scenes/game"
import { IKeyCommand, KeyType } from "../event/keycommand"
import Stats from "stats.js";
import { NpcManager } from "../scenes/npcmanager";
import { Portal } from "../scenes/models/portal";
import { Floor } from "../scenes/models/floor";
import { GPhysics } from "./physics/gphysics";
import { Legos } from "../scenes/bricks/legos";
import { Camera } from "./camera";
import { RayViwer } from "./raycaster";
import { IViewer } from "../scenes/models/iviewer";
import { Canvas } from "./canvas";
import { PlayerCtrl } from "../scenes/player/playerctrl";
import { Drop } from "../inventory/drop";
import { Light } from "./light";

export const gui = new GUI()
gui.hide()


export class Helper implements IViewer {
    gui = gui
    debugMode = false
    axesHelper: THREE.AxesHelper = new THREE.AxesHelper(300)
    gridHelper: THREE.GridHelper = new THREE.GridHelper(300)
    lightHelper: THREE.DirectionalLightHelper = new THREE.DirectionalLightHelper(this.light)
    stats = new Stats()
    arrowHelper: THREE.ArrowHelper
    arrowAttackHelper: THREE.ArrowHelper

    constructor(
        private scene: Game,
        private light: Light,
        player: Player,
        private playerCtrl: PlayerCtrl,
        npcs: NpcManager,
        portal: Portal,
        floor: Floor,
        legos: Legos,
        camera: Camera,
        private rayViewer: RayViwer,
        private physics: GPhysics,
        canvas: Canvas,
        eventCtrl: EventController,
        drop: Drop
    ) {
        this.gui.hide()
        this.gui.close()
        this.CreateMeshGui(player.meshs, "Player")
        this.CreateMeshGui(npcs.Owner.Meshs, "Owner")
        this.CreateMeshGui(npcs.Helper.Meshs, "Helper1")
        this.CreateMeshGui(npcs.Helper2.Meshs, "Helper2")
        this.CreateMeshGui(portal.Meshs, "Portal")
        this.CreateMeshGui(drop.points, "drop")
        this.CreateMeshGui(this.light, "light")

        const cp = this.CreateMeshGui(camera, "Camera")
        cp.add(camera, "debugMode").listen()

        const bp = this.CreateMeshGui(legos.brickfield, "Brick Field")
        bp.add(legos.brickfield, 'visible').listen().name("visible")

        const ffp = this.CreateMeshGui(floor, "floor")
        ffp.add(floor, 'visible').listen().name("visible")

        this.arrowHelper = new THREE.ArrowHelper(rayViewer.ray.direction, rayViewer.ray.origin, 300, 0x00ff00)
        this.arrowAttackHelper = new THREE.ArrowHelper(
            this.playerCtrl.AttackSt.raycast.ray.direction, 
            this.playerCtrl.AttackSt.raycast.ray.origin, 300, 0xff0000)

        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if (keyCommand.Type == KeyType.System0) {
                this.On()
            }
        })
        canvas.RegisterViewer(this)
    }
    resize(): void { }
    update(): void {
        this.arrowHelper.position.copy(this.rayViewer.ray.origin)
        this.arrowHelper.setDirection(this.rayViewer.ray.direction)

        this.arrowAttackHelper.position.copy(this.playerCtrl.AttackSt.raycast.ray.origin)
        this.arrowAttackHelper.setDirection(this.playerCtrl.AttackSt.raycast.ray.direction)
    }

    On() {
        if (this.debugMode) {
            this.scene.remove(
                this.axesHelper,
                this.gridHelper,
                this.arrowHelper,
                this.arrowAttackHelper,
                this.lightHelper,
            )
            document.body.removeChild(this.stats.dom)
            this.gui.hide()
            this.debugMode = false
            this.physics.DebugMode(true)
            console.log("Debugging mode Off")
        } else {
            this.scene.add(
                this.axesHelper,
                this.gridHelper,
                this.arrowHelper,
                this.arrowAttackHelper,
                this.lightHelper,
            )
            document.body.appendChild(this.stats.dom)
            this.stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom

            this.gui.show()
            this.debugMode = true
            this.physics.DebugMode(false)
            console.log("Debugging mode On")
        }
    }
    CheckStateBegin() {
        if (this.debugMode) {
            //this.stats.begin()
        }
    }
    CheckStateEnd() {
        if (this.debugMode) {
            this.stats.update()
        }
    }

    CreateVectorGui(f: GUI, v: THREE.Vector3 | THREE.Euler, name: string) {
        f.add(v, "x", -100, 100, 0.1).listen().name(name + "X")
        f.add(v, "y", -100, 100, 0.1).listen().name(name + "Y")
        f.add(v, "z", -100, 100, 0.1).listen().name(name + "Z")
    }
    CreateMeshGui(meshs: THREE.Group | THREE.Mesh | Camera | Light | THREE.Sprite | THREE.Points, name: string) {
        const fp = this.gui.addFolder(name)
        this.CreateVectorGui(fp, meshs.position, "Pos")
        this.CreateVectorGui(fp, meshs.rotation, "Rot")
        this.CreateVectorGui(fp, meshs.scale, "Scale")
        fp.add(meshs, "visible").listen().name("Visible")
        fp.close()
        return fp
    }
}