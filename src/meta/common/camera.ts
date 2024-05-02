import * as THREE from "three";
import { gsap } from "gsap"
import { IViewer } from "../scenes/models/iviewer";
import { IPhysicsObject } from "../scenes/models/iobject";
import { Canvas } from "./canvas";
import { OrbitControls} from "three/examples/jsm/controls/OrbitControls"
import { Npc } from "../scenes/models/npc";
import { NpcManager } from "../scenes/npcmanager";
import { EventController, EventFlag } from "../event/eventctrl";
import { EventBricks } from "../scenes/bricks/eventbricks";
import { Portal } from "../scenes/models/portal";
import { Legos } from "../scenes/bricks/legos";
import { AppMode } from "../app";
import { Farmer } from "../scenes/plants/farmer";
import { Carpenter } from "../scenes/furniture/carpenter";
import { NonLegos } from "../scenes/bricks/nonlegos";

enum ViewMode {
    Close,
    Long,
    Target,
    Edit,
    Play, PlayDone,
}

export class Camera extends THREE.PerspectiveCamera implements IViewer{
    private controls: OrbitControls
    private longPos: THREE.Vector3
    private shortPos: THREE.Vector3
    private bakRotation: THREE.Euler
    private target: THREE.Mesh | THREE.Group | undefined
    private owner: Npc | undefined
    private viewMode: ViewMode
    private animate: gsap.core.Tween | undefined

    debugMode = false

    constructor(
        canvas: Canvas,
        private player: IPhysicsObject,
        private npcs: NpcManager,
        private brick: EventBricks,
        private legos: Legos,
        private nonlegos: NonLegos,
        private portal: Portal,
        private farmer: Farmer,
        private carp: Carpenter,
        private eventCtrl: EventController
    ) {
        super(75, canvas.Width / canvas.Height, 0.1, 800)
        canvas.RegisterViewer(this)
        this.controls = new OrbitControls(this, canvas.Canvas)
        this.longPos = new THREE.Vector3(16, 24, 79)
        this.shortPos = new THREE.Vector3(0, 0, 0)
        this.bakRotation = new THREE.Euler().copy(this.rotation.set(-0.27, 0.0, 0.03))
        
        this.viewMode = ViewMode.Long
        this.position.set(this.longPos.x, this.longPos.y, this.longPos.z)

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag, orbit: any[]) => {
            switch(mode) {
                case AppMode.Portal:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false

                        this.target = this.portal.Meshs
                        this.focusAt(this.portal.CannonPos, new THREE.Vector3(0, 30, 30))
                    }
                    break;
                case AppMode.Furniture:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false
                        this.target = this.carp.target?.Meshs
                        if (!this.target) break;

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.Farmer:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false
                        this.target = this.farmer.target?.Meshs
                        if (!this.target) break;

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.NonLego:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false
                        this.target = this.nonlegos.GetBrickGuide(this.player.CenterPos)
                        if (this.animate != undefined) this.animate.kill()

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.LegoDelete:
                case AppMode.Lego:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false
                        this.target = this.legos.GetBrickGuide(this.player.CenterPos)
                        if (this.animate != undefined) this.animate.kill()

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.Brick:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false
                        this.target = this.brick.GetBrickGuide(this.player.CenterPos)
                        if (this.animate != undefined) this.animate.kill()

                        this.focusAt(this.target.position)
                    }
                    break;
                    /*
                case AppMode.EditPlay:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Edit
                        this.controls.enabled = false
                        if (this.animate != undefined) this.animate.kill()

                        this.owner = this.npcs.Owner
                        if (this.owner == undefined) return
                        this.target = this.owner.Meshs
                        this.focusAt(this.owner.CannonPos)
                    }
                    break;
                    */
                case AppMode.EditPlay:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.controls.enabled = false
                        this.target = this.player.Meshs
                        if (this.animate != undefined) this.animate.kill()
                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.Play:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Play
                        this.controls.enabled = false
                        if (this.animate != undefined) this.animate.kill()

                        this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                        this.rotation.x = -Math.PI / 4

                        const position = this.player.CannonPos

                        this.animate = gsap.to(this.position, {
                            x: position.x, y: position.y + 13, z: position.z + 13,
                            duration: 2, ease: "power1.inOut",
                            onComplete: () => {
                                this.position.set(position.x, position.y, position.z)
                                this.shortPos.set(0, 13, 13)
                                this.lookAt(position.x, position.y, position.z)
                                this.viewMode = ViewMode.PlayDone
                            }
                        })
                    }
                    break;
                case AppMode.Close:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Close
                        this.controls.enabled = false
                        this.owner = this.npcs.Owner
                        if (this.owner == undefined) return
                        if (this.animate != undefined) this.animate.kill()
                        this.focusAt(this.owner.CannonPos)
                    }
                    break;
                case AppMode.Long:
                    if(orbit && orbit[0]) {
                        this.controls.enabled = true
                    } else {
                        this.controls.enabled = false
                    }
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Long
                        if (this.animate != undefined) this.animate.kill()

                        this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                        this.rotation.x = -Math.PI / 4
                        this.position.set(this.longPos.x, this.longPos.y, this.longPos.z)
                        /*
                        this.animate = gsap.to(this.rotation, {
                            y: 0,
                            duration: 4, ease: "power1.inOut", onComplete: () => {
                                this.rotateY(0)
                            }
                        })
                        */
                        this.animate = gsap.to(this.longPos, {
                            x: 16, y: 4, z: 36,
                            duration: 4, ease: "power1.inOut", onUpdate: () => {
                                this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                                this.position.set(this.longPos.x, this.longPos.y,
                                    this.longPos.z)
                            }
                        })
                    }
                    break;
            }
        })
    }

    resize(width: number, height: number) {
        this.aspect = width / height
        this.updateProjectionMatrix()
    }
    focusAt(position: THREE.Vector3, cameraPos?: THREE.Vector3) {
        this.rotation.copy(this.bakRotation)
        this.rotation.x = -Math.PI / 4

        this.position.copy(position)
        this.lookAt(position)

        if (cameraPos) 
            this.shortPos.copy(cameraPos)
        else
            this.shortPos.set(0, 13, 13)
    }

    update() {
        switch (this.viewMode) {
            case ViewMode.Edit:
            case ViewMode.Target: {
                    const target = this.target?.position
                    if (target == undefined) return
                    if (this.debugMode) {
                        this.controls.enabled = true
                        this.controls.update()
                        return
                    } else {
                        this.controls.enabled = false
                    }
                    this.rotation.x = -Math.PI / 4
                    this.position.set(
                        target.x + this.shortPos.x,
                        target.y + this.shortPos.y,
                        target.z + this.shortPos.z)
                    break;
                }
            case ViewMode.Close: {
                    const target = this.owner?.CannonPos
                    if (target == undefined) return
                    this.rotation.x = -Math.PI / 4
                    this.position.set(
                        target.x + this.shortPos.x,
                        target.y + this.shortPos.y,
                        target.z + this.shortPos.z)
                    break;
                }
            case ViewMode.Long:
                if(this.controls.enabled) this.controls.update()
                break;
            case ViewMode.Play:break;
            case ViewMode.PlayDone:
                //this.lookAt(position.x, position.y, position.z)
                const position = this.player.CannonPos
                this.rotation.x = -Math.PI / 4
                this.position.set(
                    position.x + this.shortPos.x, 
                    position.y + this.shortPos.y, 
                    position.z + this.shortPos.z)
                break;
        }
    }
}