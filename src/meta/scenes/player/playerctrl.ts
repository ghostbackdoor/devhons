import * as THREE from "three";
import { EventController, EventFlag } from "../../event/eventctrl";
import { IKeyCommand, KeyNone, KeyType } from "../../event/keycommand";
import { GPhysics, IGPhysic } from "../../common/physics/gphysics";
import { Player } from "./player";
import { DeadState, IPlayerAction, IdleState, JumpState, MagicH1State, MagicH2State, RunState } from "./playerstate";
import { AttackIdleState, AttackState } from "./attackstate";
import { Inventory } from "../../inventory/inventory";
import { AppMode } from "../../app";
import { PlayerSpec } from "./playerspec";
import { IBuffItem } from "../../buff/buff";
import { EffectType } from "../../effects/effector";
import { InvenFactory } from "../../inventory/invenfactory";
import { BuildingState, DeleteState, PickFruitState, PickFruitTreeState, PlantAPlantState, WarteringState } from "./farmstate";
import { DeckState } from "./deckstate";

export enum AttackType {
    NormalSwing,
    Magic0,
    Exp,
    Heal,
    AOE, // Area of effect
    Buff,

    PlantAPlant,
    Wartering,

    Building,

    Delete,
}

export type AttackOption = {
    type: AttackType,
    effect?: EffectType,
    damage: number
    distance?: number
    obj?: THREE.Object3D
}

export type PlayerStatus = {
    level: number
    maxHealth: number
    health: number
    maxMana: number
    mana: number
    maxExp: number
    exp: number
}


export class PlayerCtrl implements IGPhysic {
    mode: AppMode = AppMode.Play
    keyDownQueue: IKeyCommand[] = []
    keyUpQueue: IKeyCommand[] = []
    inputVQueue: THREE.Vector3[] = []
    targets: THREE.Object3D[] = []

    contollerEnable = true
    inputMode = false
    moveDirection = new THREE.Vector3()

    spec: PlayerSpec = new PlayerSpec(this.inventory)
    keyType: KeyType = KeyType.None

    AttackSt = new AttackState(this, this.player, this.gphysic, this.eventCtrl, this.spec)
    MagicH1St = new MagicH1State(this, this.player, this.gphysic)
    MagicH2St = new MagicH2State(this, this.player, this.gphysic)
    AttackIdleSt = new AttackIdleState(this, this.player, this.gphysic)
    RunSt = new RunState(this, this.player, this.gphysic)
    JumpSt = new JumpState(this, this.player, this.gphysic)
    IdleSt = new IdleState(this, this.player, this.gphysic)
    DyingSt = new DeadState(this, this.player, this.gphysic)
    PickFruitSt = new PickFruitState(this, this.player, this.gphysic)
    PickFruitTreeSt = new PickFruitTreeState(this, this.player, this.gphysic)
    PlantASt = new PlantAPlantState(this, this.player, this.gphysic, this.eventCtrl)
    DeckSt = new DeckState(this, this.player, this.gphysic, this.eventCtrl)
    WarteringSt = new WarteringState(this, this.player, this.gphysic, this.invenFab, this.eventCtrl)
    BuildingSt = new BuildingState(this, this.player, this.gphysic, this.invenFab, this.eventCtrl)
    DeleteSt = new DeleteState(this, this.player, this.gphysic, this.eventCtrl)
    currentState: IPlayerAction = this.IdleSt


    constructor(
        private player: Player,
        public inventory: Inventory,
        public invenFab: InvenFactory,
        private gphysic: GPhysics,
        private eventCtrl: EventController
    ) {
        gphysic.Register(this)

        eventCtrl.RegisterAppModeEvent((mode: AppMode, e: EventFlag) => {
            this.mode = mode
            if (mode == AppMode.EditPlay || mode == AppMode.Weapon) {
                switch (e) {
                    case EventFlag.Start:
                        while (this.gphysic.Check(player)) {
                            player.CannonPos.y += 0.2
                        }
                        this.currentState = this.IdleSt
                        this.currentState.Init()
                        break
                    case EventFlag.End:
                        this.currentState.Uninit()
                        break
                }
            }
            if (mode == AppMode.Play) {
                switch (e) {
                    case EventFlag.Start:
                        this.spec.ResetStatus()
                        eventCtrl.OnChangePlayerStatusEvent(this.spec.Status)
                        this.currentState = this.IdleSt
                        this.currentState.Init()
                        break
                    case EventFlag.End:
                        this.currentState.Uninit()
                        break
                }
            }
        })
        eventCtrl.RegisterKeyDownEvent((keyCommand: IKeyCommand) => {
            if (!this.contollerEnable) return
            this.keyDownQueue.push(keyCommand)
        })
        eventCtrl.RegisterKeyUpEvent((keyCommand: IKeyCommand) => {
            if (!this.contollerEnable) return
            this.keyUpQueue.push(keyCommand)
        })

        eventCtrl.RegisterInputEvent((e: any, real: THREE.Vector3) => { 
            if (!this.contollerEnable) return
            if (e.type == "move") {
                this.inputVQueue.push(new THREE.Vector3().copy(real))
                this.inputMode = true
            } else {
                this.inputMode = false
                this.reset()
            }
        })
        eventCtrl.RegisterChangeEquipmentEvent(() => {
            this.spec.ItemUpdate()
            if (this.currentState == this.AttackSt) {
                this.currentState.Init()
            }
        })
        eventCtrl.RegisterAttackEvent("player", (opts: AttackOption[]) => {
            opts.forEach((opt) => {
                switch(opt.type) {
                    case AttackType.NormalSwing:
                    case AttackType.Magic0:
                        if(this.currentState == this.DyingSt) break;
                        this.spec.ReceiveCalcDamage(opt.damage)
                        this.player.DamageEffect(opt.damage)
                        if(this.spec.CheckDie()) {
                            this.currentState = this.DyingSt
                            this.currentState.Init()
                        }
                        break;
                    case AttackType.Exp:
                        this.spec.ReceiveExp(opt.damage)
                        break;
                    case AttackType.Heal:
                        this.player.HealEffect(opt.damage)
                        this.spec.ReceiveCalcHeal(opt.damage)
                        break;
                }
            })
            eventCtrl.OnChangePlayerStatusEvent(this.spec.Status)
        })

    }
    add(...obj: THREE.Object3D[]) {
        this.targets.push(...obj)
    }
    remove(obj: THREE.Object3D) {
        const idx = this.targets.indexOf(obj)
        if(idx < 0) return
        this.targets.splice(idx, 1)
    }
    updateInputVector() {
        const cmd = this.inputVQueue.shift()
        if (cmd == undefined) {
            return
        }
        this.moveDirection.x = cmd.x
        this.moveDirection.z = cmd.z
    }
    reset() {
        this.moveDirection.x = 0
        this.moveDirection.z = 0
        this.inputVQueue.length = 0
    }

    update(delta: number) {
        this.updateInputVector()
        this.updateDownKey()
        this.updateUpKey()

        if (!this.player.Visible) return

        this.currentState = this.currentState.Update(delta, this.moveDirection)
        this.player.Update()
        this.spec.Update(delta)
        this.actionReset()
    }
    actionReset() {
        for(let i = KeyType.Action0; i < KeyType.Count; i++) {
            this.KeyState[i] = false
        }
    }

    KeyState = new Array<boolean>(KeyType.Count)
    keytimeout?:NodeJS.Timeout
    none = new KeyNone

    updateDownKey() {
        let cmd = this.keyDownQueue.shift()
        if (cmd == undefined) {
            this.keyType = KeyType.None
            cmd = this.none
            return
        }
        this.KeyState[cmd.Type] = true

        this.keyType = cmd.Type
        const position = cmd.ExecuteKeyDown()
        if (position.x != 0) { this.moveDirection.x = position.x }
        if (position.y != 0) { this.moveDirection.y = position.y }
        if (position.z != 0) { this.moveDirection.z = position.z }
    }

    updateUpKey() {
        let cmd = this.keyUpQueue.shift()
        if (cmd == undefined) {
            this.keyType = KeyType.None
            cmd = this.none
            return
        }

        this.KeyState[cmd.Type] = false
        this.keyType = cmd.Type
        const position = cmd.ExecuteKeyUp()
        if (position.x == this.moveDirection.x) { this.moveDirection.x = 0 }
        if (position.y == this.moveDirection.y) { this.moveDirection.y = 0 }
        if (position.z == this.moveDirection.z) { this.moveDirection.z = 0 }
    }
    UpdateBuff(buff: IBuffItem[]) {
        this.spec.SetBuff(buff)
        console.log(buff)
    }
}
