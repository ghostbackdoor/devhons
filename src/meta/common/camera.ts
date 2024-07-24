import * as THREE from "three";
import { gsap } from "gsap"
import { IViewer } from "../scenes/models/iviewer";
import { IPhysicsObject } from "../scenes/models/iobject";
import { Canvas } from "./canvas";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
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

export class Camera extends THREE.PerspectiveCamera implements IViewer {
    private controls: OrbitControls
    private bakRotation: THREE.Euler
    private target: THREE.Mesh | THREE.Group | undefined
    private owner: Npc | undefined
    private viewMode: ViewMode
    private animate: gsap.core.Tween[] = []
    private timeline?: gsap.core.Timeline

    cityPos = new THREE.Vector3(-40, 50, 100)
    longPos = new THREE.Vector3(16, 24, 79)
    shortPos = new THREE.Vector3(0, 0, 0)
    debugMode = false
    backup = new THREE.Vector3()

    constructor(
        canvas: Canvas,
        private player: IPhysicsObject,
        private terrainer: IPhysicsObject,
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
        this.bakRotation = new THREE.Euler().copy(this.rotation.set(-0.27, 0.0, 0.03))

        this.viewMode = ViewMode.Long
        this.position.set(this.longPos.x, this.longPos.y, this.longPos.z)

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag, orbit: any[]) => {
            this.controls.enabled = false
            if (this.animate) this.animate.forEach(e => e.kill())
            if (this.timeline) this.timeline.kill()
            switch (mode) {
                case AppMode.Intro:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Long
                        this.eventCtrl.OnChangeCtrlObjEvent(this.portal)

                        this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                        this.rotation.x = -Math.PI / 4
                        this.position.set(this.cityPos.x, this.cityPos.y, this.cityPos.z)


                        if (this.timeline) this.timeline.kill()
                        this.timeline = gsap.timeline()
                        this.timeline
                            .to(this.cityPos, {
                                x: 10, y: 30, z: this.portal.CannonPos.z + 50,
                                duration: 10, ease: "power1.inOut", onUpdate: () => {
                                    this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                                    this.position.set(this.cityPos.x, this.cityPos.y,
                                        this.cityPos.z)
                                }
                            })
                            .to(this.cityPos, {
                                x: this.portal.CannonPos.x + 10,
                                z: this.portal.CannonPos.z + 30,
                                duration: 10, ease: "power1.inOut",
                                onUpdate: () => {
                                    this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                                    this.position.set(this.cityPos.x, this.cityPos.y,
                                        this.cityPos.z)
                                    this.lookAt(this.portal.CannonPos)
                                },
                            })

                        const owner = this.npcs.Owner
                        if (owner == undefined) break
                        this.timeline.to(this.cityPos, {
                            x: owner.CannonPos.x,
                            y: 20,
                            z: owner.CannonPos.z + 20,
                            duration: 10, ease: "power1.inOut", onStart: () => {
                                console.log(this.cityPos)
                            }, onUpdate: () => {
                                this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                                this.position.set(this.cityPos.x, this.cityPos.y,
                                    this.cityPos.z)
                                this.lookAt(owner.CannonPos)
                            },
                        })
                    }
                    break;
                case AppMode.CityView:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Long
                        this.eventCtrl.OnChangeCtrlObjEvent(this.portal)

                        this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                        this.rotation.x = -Math.PI / 4
                        this.position.set(this.cityPos.x, this.cityPos.y, this.cityPos.z)
                        this.animate.push(gsap.to(this.cityPos, {
                            x: 16, y: 30, z: 50,
                            duration: 10, ease: "power1.inOut", onUpdate: () => {
                                this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                                this.position.set(this.cityPos.x, this.cityPos.y,
                                    this.cityPos.z)
                            }
                        }))
                        this.animate.push(gsap.to(this.rotation, {
                            x: -0.5, y: 0, z: 0,
                            duration: 10, ease: "power1.inOut"
                        }))
                    }
                    break
                case AppMode.EditCity:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.target = this.terrainer.Meshs

                        this.focusAt(this.terrainer.CannonPos, new THREE.Vector3(0, 40, 50))
                    }
                    break;
                case AppMode.Portal:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target

                        this.target = this.portal.Meshs
                        this.focusAt(this.portal.CannonPos, new THREE.Vector3(0, 30, 30))
                    }
                    break;
                case AppMode.Furniture:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.target = this.carp.target?.Meshs
                        if (!this.target) break;

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.Farmer:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.target = this.farmer.target?.Meshs
                        if (!this.target) break;

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.NonLego:
                    if (e == EventFlag.Start) {
                        this.backup.copy(this.position)
                        this.viewMode = ViewMode.Edit
                        this.target = this.nonlegos.GetBrickGuide(this.player.CenterPos)
                        this.position.x = this.target.position.x + 10
                        this.position.y = this.target.position.y + 10
                        this.position.z = this.target.position.z + 10
                        this.controls.target.copy(this.target.position)
                        this.controls.enabled = true
                        this.controls.update()

                    } else if (e == EventFlag.End) {
                        this.position.copy(this.backup)
                        this.focusAt(this.player.CenterPos)
                    }
                    break;
                case AppMode.LegoDelete:
                case AppMode.Lego:
                    if (e == EventFlag.Start) {
                        this.backup.copy(this.position)
                        this.viewMode = ViewMode.Edit
                        this.target = this.legos.GetBrickGuide(this.player.CenterPos)
                        this.position.x = this.target.position.x + 10
                        this.position.y = this.target.position.y + 10
                        this.position.z = this.target.position.z + 10
                        this.controls.target.copy(this.target.position)
                        this.controls.enabled = true
                        this.controls.update()
                    } else if (e == EventFlag.End) {
                        this.position.copy(this.backup)
                        this.focusAt(this.player.CenterPos)
                    }
                    break;
                case AppMode.Brick:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.target = this.brick.GetBrickGuide(this.player.CenterPos)

                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.EditPlay:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Target
                        this.target = this.player.Meshs
                        this.focusAt(this.target.position)
                    }
                    break;
                case AppMode.Play:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Play

                        this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                        this.rotation.x = -Math.PI / 4

                        const position = this.player.CannonPos

                        this.animate.push(gsap.to(this.position, {
                            x: position.x, y: position.y + 13, z: position.z + 13,
                            duration: 2, ease: "power1.inOut",
                            onComplete: () => {
                                this.position.set(position.x, position.y, position.z)
                                this.shortPos.set(0, 13, 13)
                                this.lookAt(position.x, position.y, position.z)
                                this.viewMode = ViewMode.PlayDone
                            }
                        }))
                    }
                    break;
                case AppMode.Close:
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Close
                        this.owner = this.npcs.Owner
                        if (this.owner == undefined) return
                        this.focusAt(this.owner.CannonPos)
                    }
                    break;
                case AppMode.Long:
                    if (orbit && orbit[0]) {
                        this.controls.enabled = true
                    } else {
                        this.controls.enabled = false
                    }
                    if (e == EventFlag.Start) {
                        this.viewMode = ViewMode.Long

                        this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                        this.rotation.x = -Math.PI / 4
                        this.position.set(this.longPos.x, this.longPos.y, this.longPos.z)

                        this.animate.push(gsap.to(this.longPos, {
                            x: 16, y: 4, z: 36,
                            duration: 4, ease: "power1.inOut", onUpdate: () => {
                                this.rotation.set(this.bakRotation.x, this.bakRotation.y, this.bakRotation.z)
                                this.position.set(this.longPos.x, this.longPos.y,
                                    this.longPos.z)
                            }
                        }))
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
                {
                    const target = this.target?.position
                    if (target == undefined) return
                    this.controls.enabled = true
                    this.controls.update()
                    break
                }
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
                if (this.controls.enabled) this.controls.update()
                break;
            case ViewMode.Play: break;
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