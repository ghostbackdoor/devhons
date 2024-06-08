import { Canvas } from "./common/canvas";
import { EventController, EventFlag } from "./event/eventctrl";
import { KeyAction1, KeyAction2, KeyAction3, KeyAction4, KeyAction5, KeyDown, KeyLeft, KeyRight, KeySpace, KeySystem0, KeyUp } from "./event/keycommand";
import { AppFactory } from "./factory/appfactory";
import { IScene } from "./scenes/models/iviewer";
import { ModelStore } from "./common/modelstore";
import { GPhysics } from "./common/physics/gphysics";
import { Char } from "./loader/assetmodel";
import { BrickOption } from "./scenes/bricks/bricks";
import { IBuffItem } from "./buff/buff";
import { GameOptions } from "./scenes/gamecenter";
import { LoadingManager } from "three";
import { TerrainOption } from "./scenes/terrain/terrainctrl";

export enum AppMode {
    Long,
    Close,
    Play,
    EditPlay,
    Brick,
    Face,
    Weapon,
    Furniture,
    Farmer,
    Portal,
    Lego,
    NonLego,
    LegoDelete,
    CityView,
    EditCity,
}


export default class App {
    factory = new AppFactory()
    canvas: Canvas
    physic: GPhysics
    currentScene: IScene
    eventCtrl: EventController
    loadingManager: LoadingManager
    store: ModelStore
    initFlag: boolean = false
    renderFlag: boolean = false
    loadingVisible = true
    initCallbackFunc?: Function

    get Furnitures() { return this.factory.Furnitures }
    get Plants() { return this.factory.Plants }
    get Items() { return this.factory.Items }

    constructor() {
        this.canvas = this.factory.Canvas
        this.currentScene = this.factory.Scene
        this.eventCtrl = this.factory.EventCtrl
        this.store = this.factory.ModelStore
        this.physic = this.factory.Physics
        this.loadingManager = this.factory.LoadingManager

        this.eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            if(mode != AppMode.Play) return
            switch (e) {
                case EventFlag.Start:
                    this.loadingVisible = false
                    break
                case EventFlag.End:
                    this.loadingVisible = true
                    break
            }
        })
    }

    async init() {
        if (this.initFlag) return false

        const progressBarContainer = document.querySelector('#progress-bar-container') as HTMLDivElement
        progressBarContainer.style.display = "flex"

        await this.factory.GltfLoad()
        this.factory.InitScene()

        window.addEventListener("resize", () => this.resize())
        window.addEventListener("keydown", (e) => {
            switch (e.code) {
                case "ArrowUp": this.eventCtrl.OnKeyDownEvent(new KeyUp); break
                case "ArrowDown": this.eventCtrl.OnKeyDownEvent(new KeyDown); break;
                case "ArrowLeft": this.eventCtrl.OnKeyDownEvent(new KeyLeft); break;
                case "ArrowRight": this.eventCtrl.OnKeyDownEvent(new KeyRight); break;
            }
            switch (e.key) {
                case '0':
                    if (window.location.hostname != "hons.ghostwebservice.com") {
                        this.eventCtrl.OnKeyDownEvent(new KeySystem0);
                    }
                    break;
                case `1`: this.eventCtrl.OnKeyDownEvent(new KeyAction1); break;
                case '2': this.eventCtrl.OnKeyDownEvent(new KeyAction2);break;
                case '3': this.eventCtrl.OnKeyDownEvent(new KeyAction3);break;
                case '4': this.eventCtrl.OnKeyDownEvent(new KeyAction4);break;
                case '5': this.eventCtrl.OnKeyDownEvent(new KeyAction5);break;
                case ' ': this.eventCtrl.OnKeyDownEvent(new KeySpace); break;
            }
        })
        window.addEventListener("keyup", (e) => {
            switch (e.code) {
                case "ArrowUp": this.eventCtrl.OnKeyUpEvent(new KeyUp); break
                case "ArrowDown": this.eventCtrl.OnKeyUpEvent(new KeyDown); break;
                case "ArrowLeft": this.eventCtrl.OnKeyUpEvent(new KeyLeft); break;
                case "ArrowRight": this.eventCtrl.OnKeyUpEvent(new KeyRight); break;
                case "Space": this.eventCtrl.OnKeyUpEvent(new KeySpace); break;
            }
        })
        this.initFlag = true

        if (window.location.hostname != "hons.ghostwebservice.com") {
            this.eventCtrl.OnKeyDownEvent(new KeySystem0)
        }

        progressBarContainer.style.display = 'none'

        if (this.initCallbackFunc) this.initCallbackFunc(true)
        return true
    }

    RegisterInitEvent(call: Function) {
        if(this.initFlag) {
            call(this.initFlag)
            return
        }
        this.initCallbackFunc = call
    }

    despose() {
        this.factory.Despose()
    }

    loop() {
        window.requestAnimationFrame(() => {
            this.factory.Helper?.CheckStateBegin()
            this.currentScene.play()
            this.canvas.update()
            this.physic.update()
            //this.factory.phydebugger.update()

            this.factory.Helper?.CheckStateEnd()
            this.loop()
        })       
    }
    Setup(opt: GameOptions) {
        this.factory.GameCenter.Setup(opt)
    }

    render() {
        if(this.renderFlag) return
        this.renderFlag = true
        this.loop()
    }
    ChangeCharactor(model: Char) {
        this.factory.ModelStore.ChangeCharactor(model)
    }
    ChangeBrickInfo(opt: BrickOption) {
        this.eventCtrl.OnChangeBrickInfo(opt)
    }
    ChangeTerrainInfo(opt: TerrainOption) {
        this.eventCtrl.OnChangeTerrainInfo(opt)
    }
    ModeChange(mode: AppMode, ...arg: any) {
        this.eventCtrl.OnAppModeEvent(mode, ...arg)
    }
    SendModeMessage(...arg: any) {
        this.eventCtrl.OnAppModeMessage(...arg)
    }

    ModelStore() {
        return this.store.StoreModels()
    }

    async LoadModel(models: string, name: string, playerModel: string | undefined) {
        this.eventCtrl.OnSceneClearEvent()
        await this.store.LoadModels(models, name, playerModel)
    }
    async LoadModelEmpty(name: string, playerModel: string | undefined) {
        this.eventCtrl.OnSceneClearEvent()
        await this.store.LoadModelsEmpty(name, playerModel)
    }
    async LoadVillage(users: Map<string, string>, playerModel: string | undefined) {
        this.eventCtrl.OnSceneClearEvent()
        await this.store.LoadVillage(users, playerModel)
    }
    resize() {
        this.canvas.resize()
    }
    RegisterChangePlayerStatusEvent (callback: (...e: any[]) => void) {
        this.eventCtrl.RegisterChangePlayerStatusEvent(callback)
    }
    GetRandomBuff() {
        return this.factory.Buff.GetRandomBuff()
    }
    SelectRandomBuff(buff: IBuffItem) {
        this.factory.Buff.SelectBuff(buff)
    }
    GetDeckInfo() {
        return this.factory.ModelStore.Deck
    }
}