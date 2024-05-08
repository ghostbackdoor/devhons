import * as THREE from "three";
import { Game } from "../scenes/game";
import { Floor } from "../scenes/models/floor";
import { Canvas } from "../common/canvas";
import { Camera } from "../common/camera";
import { Renderer } from "../common/renderer";
import { IScene } from "../scenes/models/iviewer";
import { Light } from "../common/light";
import { EventController } from "../event/eventctrl";
import { Player as Player } from "../scenes/player/player";
import { Loader } from "../loader/loader";
import { math } from "../../libs/math";
import { Mushroom } from "../scenes/models/mushroom";
import { DeadTree } from "../scenes/models/deadtree";
import { Portal } from "../scenes/models/portal";
import { EventBricks } from "../scenes/bricks/eventbricks";
import { NpcManager } from "../scenes/npcmanager";
import { ModelStore } from "../common/modelstore";
import SConf from "../configs/staticconf";
import { GPhysics } from "../common/physics/gphysics";
import { PlayerCtrl } from "../scenes/player/playerctrl";
import { Helper } from "../common/helper";
import { Legos } from "../scenes/bricks/legos";
import { Input } from "../common/inputs/input";
import { RayViwer } from "../common/raycaster";
import { Monsters } from "../scenes/monsters/monsters";
import { InvenFactory } from "../inventory/invenfactory";
import { Buff } from "../buff/buff";
import { Drop } from "../drop/drop";
import { MonsterDb } from "../scenes/monsters/monsterdb";
import { Alarm } from "../common/alarm";
import { Materials } from "../scenes/materials";
import { GameCenter } from "../scenes/gamecenter";
import { Farmer } from "../scenes/plants/farmer";
import { Carpenter } from "../scenes/furniture/carpenter";
import { Deck } from "../inventory/items/deck";
import { MonDeck } from "../scenes/mondeck";
import { NonLegos } from "../scenes/bricks/nonlegos";
import { FurnDb } from "../scenes/furniture/furndb";
import { PlantDb } from "../scenes/plants/plantdb";


export class AppFactory {
    phydebugger: any

    private alarm = new Alarm()

    private eventCtrl = new EventController()
    private canvas = new Canvas()
    private loader = new Loader()
    deckDb = new Deck()
    private gameCenter: GameCenter

    private store: ModelStore
    input: Input
    private game: Game
    private gphysics: GPhysics

    private invenFab: InvenFactory
    private drop : Drop
    private monDb = new MonsterDb()
    private furnDb = new FurnDb()
    private plantDb = new PlantDb()
    monDeck: MonDeck

    private player: Player
    private floor: Floor
    private portal: Portal
    private npcs: NpcManager
    private monsters: Monsters
    private materials: Materials
    private farmer: Farmer
    private carp: Carpenter

    private buff: Buff
    private playerCtrl : PlayerCtrl
    
    private deadtrees: DeadTree[]
    private mushrooms: Mushroom[]
    //island: Island

    private camera: Camera
    private light: Light
    renderer: Renderer
    private worldSize: number
    private brick: EventBricks
    private legos: Legos
    private nonLegos: NonLegos
    private rayViewer: RayViwer

    private currentScene: IScene

    public Helper?: Helper

    get PhysicDebugger(): any { return this.PhysicDebugger }
    get Physics() { return this.gphysics }
    get Canvas(): Canvas { return this.canvas }
    get Scene(): IScene { return this.currentScene }
    get EventCtrl(): EventController { return this.eventCtrl }
    get ModelStore() { return this.store }
    get Player() { return this.player }
    get Buff() { return this.buff }
    get GameCenter() { return this.gameCenter }
    get LoadingManager() { return this.loader.LoadingManager }
    get Furnitures() {return this.furnDb}
    get Plants() {return this.plantDb}

    constructor() {
        this.worldSize = 300
        this.floor = new Floor(this.worldSize)
        this.mushrooms = []
        this.deadtrees = []

        this.invenFab = new InvenFactory(this.loader, this.alarm)

        this.store = new ModelStore(this.eventCtrl, this.invenFab)
        this.input = new Input(this.eventCtrl)
        this.light = new Light()
        this.game = new Game(this.light)
        this.gphysics = new GPhysics(this.game, this.eventCtrl)


        this.portal = new Portal(this.loader.PortalAsset, this.store, this.eventCtrl, this.gphysics)

        this.player = new Player(this.loader, this.eventCtrl, this.portal, this.store, this.game)
        this.playerCtrl = new PlayerCtrl(this.player, this.invenFab.inven, this.invenFab, this.gphysics, this.eventCtrl)

        this.drop = new Drop(this.alarm, this.invenFab.inven, this.player, this.canvas, this.game, this.eventCtrl)

        this.brick = new EventBricks(this.game, this.eventCtrl, this.store, this.gphysics, this.player)
        this.legos = new Legos(this.game, this.eventCtrl, this.store, this.Physics, this.player)
        this.nonLegos = new NonLegos(this.game, this.eventCtrl, this.store, this.Physics, this.player)
        this.npcs = new NpcManager(this.loader, this.eventCtrl, this.game, this.canvas, this.store, this.gphysics)
        this.monsters = new Monsters(this.loader, this.eventCtrl, this.game, this.player, this.playerCtrl, this.legos, this.nonLegos, this.brick, this.gphysics, this.drop, this.monDb)
        this.buff = new Buff(this.eventCtrl, this.playerCtrl)
        this.materials = new Materials(this.player, this.playerCtrl, this.worldSize, this.loader, this.eventCtrl, this.game, this.canvas, this.drop, this.monDb)
        this.farmer = new Farmer(this.loader, this.player, this.playerCtrl, this.game, this.store, this.gphysics, this.canvas, this.eventCtrl, this.alarm, this.drop, this.plantDb)
        this.carp = new Carpenter(this.loader, this.player, this.playerCtrl, this.game, this.store, this.gphysics, this.canvas, this.eventCtrl, this.furnDb)
        this.monDeck = new MonDeck(this.loader, this.eventCtrl, this.game, this.player, this.playerCtrl, this.canvas, this.monDb, this.store)

        this.gameCenter = new GameCenter(this.player, this.playerCtrl, this.portal, this.monsters, this.invenFab, this.canvas, this.alarm, this.game, this.eventCtrl, this.store)

        this.camera = new Camera(this.canvas, this.player, this.npcs, this.brick, this.legos, this.nonLegos, this.portal, this.farmer, this.carp, this.eventCtrl)
        this.rayViewer = new RayViwer(this.player, this.camera, this.legos, this.nonLegos, this.brick, this.canvas, this.eventCtrl)
        this.renderer = new Renderer(this.camera, this.game, this.canvas)
        this.currentScene = this.game

      
        
    }
    async MassMushroomLoader(type: number) {
        const mushasset = (type == 1) ? this.loader.Mushroom1Asset : this.loader.Mushroom2Asset
        const meshs = await mushasset.CloneModel()

        const pos = new THREE.Vector3()
        for (let i = 0; i < 50; i++) {
            pos.set(
                (Math.random() * 2.0 - 1.0) * (this.worldSize / 1.5),
                0,
                (Math.random() * 2.0 - 1.0) * (this.worldSize / 1.5),
            )
            const scale = math.rand_int(5, 9)
            const mushroom = new Mushroom(mushasset)
            mushroom.MassLoader(meshs, scale, pos)
            this.mushrooms.push(mushroom)
        }
    }
    async MassDeadTreeLoader() {
        const meshs = await this.loader.DeadTreeAsset.CloneModel()
        const pos = new THREE.Vector3()
        const radius = this.worldSize / 2
        for (let i = 0; i < 30; i++) {
            const phi = Math.random() * Math.PI * 2
            const r = THREE.MathUtils.randFloat(radius * 0.4, radius * 1.5)
            pos.set(
                r * Math.cos(phi),
                math.rand_int(0, 1.5),
                r * Math.sin(phi),
            )
            const type = math.rand_int(0, 2)
            const scale = math.rand_int(5, 9)
            const tree = new DeadTree(this.loader.DeadTreeAsset)
            tree.MassLoader(meshs, scale, pos, type)
            this.deadtrees.push(tree)
        }
    }

    async GltfLoad() {
        const ret = await Promise.all([
            await this.player.Loader(this.loader.MaleAsset,
                new THREE.Vector3(SConf.StartPosition.x, SConf.StartPosition.y, SConf.StartPosition.z),
                "player"),
            await this.portal.Loader(SConf.DefaultPortalPosition),
            await this.MassMushroomLoader(1),
            await this.MassMushroomLoader(2),
            await this.MassDeadTreeLoader(),
            await this.materials.MassLoader(),
            await this.npcs.NpcLoader(),
            await this.farmer.FarmLoader(),
            await this.carp.FurnLoader(),
        ]).then(() => {
            this.gphysics.addPlayer(this.player)
            this.gphysics.add(this.npcs.Owner)
            this.gphysics.addLand(this.floor)
        })
        return ret
    }
    InitScene() {
        this.game.add(
            this.player.Meshs, 
            this.floor.Meshs, 
            this.portal.Meshs, 
        )
        
        this.deadtrees.forEach((tree) => {
            this.game.add(tree.Meshs)
        })
        this.mushrooms.forEach((mushroom) => {
            this.game.add(mushroom.Meshs)
        })
        this.npcs.InitScene()

        this.Helper = new Helper(
            this.game, this.player, this.playerCtrl, this.npcs, this.portal, this.floor,
            this.legos, this.camera, this.rayViewer, this.gphysics, 
            this.canvas, this.eventCtrl, this.drop
        )
    }
    Despose() {
        this.game.dispose()
    }
}