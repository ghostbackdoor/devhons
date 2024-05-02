import * as THREE from "three";
import { AppMode } from "../app";
import { Canvas } from "../common/canvas";
import { EventController, EventFlag } from "../event/eventctrl";
import { IViewer } from "./models/iviewer";
import { Player } from "./player/player";
import { Portal } from "./models/portal";
import { PlayerCtrl } from "./player/playerctrl";
import { Monsters } from "./monsters/monsters";
import { InvenFactory } from "../inventory/invenfactory";
import { Alarm, AlarmType } from "../common/alarm";
import { CircleEffect } from "./models/circle";
import { IModelReload, ModelStore } from "../common/modelstore";
import { Deck, DeckId } from "../inventory/items/deck";
import { MonsterId } from "./monsters/monsterid";

export enum GameType {
    VamSer,
}

export type GameOptions = {
    OnEnd: Function
    OnSaveInven: Function
}
export type DeckInfo = {
    id: DeckId,
    monId: MonsterId,
    position: THREE.Vector3[]
    title: string
    max: number
    createCnt: number
    time: number
    rand: boolean
    uniq: boolean
    execute: boolean
}

export class GameCenter implements IViewer, IModelReload {
    // TODO
    // Start Game or Init or Exit
    // Game Info Load and Save (include Inven)
    // Game Type Setup
    //  - Timeout
    //  - Level Out
    //  - Monster Setup (type, respawning)
    //  - Boss
    opt?: GameOptions
    timer = 0
    safe = false
    playing = false
    dom = document.createElement("div")
    torus = new CircleEffect(10)
    saveData = this.store.Deck
    deckInfo: DeckInfo[] = []
    keytimeout?:NodeJS.Timeout
    deckEmpty = false

    constructor(
        private player: Player, 
        private playerCtrl: PlayerCtrl,
        private portal: Portal,
        private monster: Monsters,
        private invenFab: InvenFactory,
        canvas: Canvas,
        private alarm: Alarm,
        private game: THREE.Scene,
        private eventCtrl: EventController,
        private store: ModelStore,
    ) {
        console.log(this.playerCtrl, this.monster)
        store.RegisterStore(this)
        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if(mode != AppMode.Play) return
            switch (e) {
                case EventFlag.Start:
                    this.deckEmpty = false
                    this.invenFab.inven.Clear()
                    this.StartDeckParse()
                    //delayed start
                    setTimeout(() => {
                        this.createTimer()
                        this.timer = 0
                        this.playing = true
                    }, 3000)
                    break
                case EventFlag.End:
                    this.playing = false
                    this.torus.visible = false
                    this.invenFab.Merge()
                    this.invenFab.inven.Clear()
                    this.eventCtrl.OnChangeEquipmentEvent(this.invenFab.inven)
                    if(this.safe) {
                        this.opt?.OnSaveInven(invenFab.invenHouse.data)
                    }
                    if (this.keytimeout != undefined) clearTimeout(this.keytimeout)
                    break
            }
        })
        canvas.RegisterViewer(this)
        this.game.add(this.torus)
        this.torus.visible = false
        this.torus.position.copy(this.portal.CannonPos)
        this.dom.className = "timer h2"
    }

    createTimer() {
        const tag = document.getElementById("contents") as HTMLDivElement
        tag.appendChild(this.dom)
        this.dom.style.display = "block"
        this.dom.style.top = "20px"
        this.currentSec = 0
        this.currentMin = -1
    }
    currentSec = 0
    updateTimer(delta: number) {
        this.timer += delta
        if (this.currentSec == Math.floor(this.timer)) return false

        this.currentSec = Math.floor(this.timer)
        const remainSec = 15 * 60 - this.currentSec
        const min = Math.floor(remainSec / 60)
        const sec = remainSec % 60
        this.dom.innerText = ((min < 10) ? "0" + min : min) + ":" + ((sec < 10) ? "0" + sec : sec)
        return true
    }
    Setup(opt: GameOptions) {
        this.opt = opt
    }
    StartDeckParse() {
        this.saveData.forEach((e) => {
            if(!e.enable) return
            const deck = this.deckInfo.find((info) => info.id == e.id)
            if(deck) {
                deck.position.push(e.position)
            } else {
                const deck = Deck.DeckDb.get(e.id)
                if(!deck) throw new Error("unexpected data");
                
                this.deckInfo.push({
                    id: e.id,
                    monId: deck.monId,
                    title: deck.title,
                    position: [e.position],
                    time: e.time,
                    rand: e.rand,
                    uniq: deck?.uniq,
                    execute: false,
                    max: deck.maxSpawn,
                    createCnt: 0
                })
            }
        })
    }
    currentMin = -1
    ExecuteDeck() {
        if(this.deckEmpty) return
        if(this.deckInfo.length == 0) {
            //todo: random deck execute
            this.monster.InitMonster()
            this.deckEmpty = true
            return
        }
        const nowMin = Math.floor(this.currentSec / 60)
        if(this.currentMin != nowMin) { this.currentMin = nowMin } else { return }

        this.deckInfo.forEach((e) => {
            if(!e.execute && e.time <= this.currentMin) {
                //todo: execute
                this.alarm.NotifyInfo(`"${e.title}"이 발동되었습니다.`, AlarmType.Deck)
                e.execute = true
                if(e.rand) {
                    this.monster.CreateMonster(e.monId, true)
                } else {
                    const idx = THREE.MathUtils.randInt(0, e.position.length - 1)
                    this.monster.CreateMonster(e.monId, true, e.position[idx])
                } 
                e.createCnt++
                if(!e.uniq) {
                    this.Respawning(e)
                }
            }
        })
    }
    Respawning(deckInfo: DeckInfo) {
        if (deckInfo.max == deckInfo.createCnt) { console.log("end of creation"); return }
        const interval = THREE.MathUtils.randInt(4000, 8000)
        this.keytimeout = setTimeout(() => {
            const idx = THREE.MathUtils.randInt(0, deckInfo.position.length - 1)
            this.monster.CreateMonster(deckInfo.monId, true, deckInfo.position[idx])
            deckInfo.createCnt++
            this.Respawning(deckInfo)
        }, interval)
    }
    CheckPortal(delta: number) {
        const pos1 = this.player.CannonPos
        const pos2 = this.portal.CannonPos
        const dist = pos1.distanceTo(pos2)
        if(dist < 10) {
            this.torus.position.copy(this.portal.CannonPos)
            this.torus.position.y += 2
            this.torus.visible = true
            this.torus.rotateZ(Math.PI * delta * .5)
            if (!this.safe) {
                this.alarm.NotifyInfo("인벤토리를 저장할 수 있습니다.", AlarmType.Normal)
            }
            this.safe = true
        } else {
            this.torus.visible = false
            if (this.safe) {
                this.alarm.NotifyInfo("포탈과 멀어 인벤토리를 저장할 수 없습니다.", AlarmType.Normal)
            }
            this.safe = false
        }
    }
    resize(): void { }
    update(delta: number): void {
        if (!this.playing) return
        if(this.updateTimer(delta)) {
            this.ExecuteDeck()
        }
        this.CheckPortal(delta)
    }
    async Viliageload(): Promise<void> {
        this.deckInfo.length = 0
        this.saveData.length = 0
    }
    async Reload(): Promise<void> {
        this.deckInfo.length = 0
        this.saveData = this.store.Deck
    }
}