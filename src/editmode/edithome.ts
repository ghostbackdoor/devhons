import * as THREE from "three";
import App, { AppMode } from "../meta/app";
import { Char } from "../meta/loader/assetmodel";
import { MetaTxId } from "../models/tx";
import { Session } from "../session";
import { BlockStore } from "../store";
import ColorPicker from "@thednp/color-picker";
import { Page } from "../page";
import { Ui } from "../models/ui";
import { UiInven } from "../playmode/play_inven";
import { InvenData } from "../meta/inventory/inventory";
import { EditPlant } from "./editplant";
import { EditFurniture } from "./editfurniture";
import { EditGame } from "./editgame";

export class EditHome extends Page {
    m_masterAddr = ""
    mode = AppMode.EditPlay
    profileVisible = true
    brickSize = new THREE.Vector3(3, 3, 1)
    brickRotate = new THREE.Vector3()
    ui = new Ui(this.meta, AppMode.EditPlay)
    plant = new EditPlant(this.meta, this)
    furn = new EditFurniture(this.meta, this)
    game = new EditGame(this.meta)

    myPicker?: ColorPicker
    color: string = "#fff"

    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    constructor(
        private blockStore: BlockStore,
        private session: Session, 
        private meta: App, 
        private inven: UiInven,
        url: string
    ) {
        super(url)
    }

    GetElement() {
        //const rect = document.getElementById("rect") as HTMLDivElement
        //const roun = document.getElementById("rounded_corner") as HTMLDivElement
        const x_up = document.getElementById("x_up") as HTMLDivElement
        const x_down = document.getElementById("x_down") as HTMLDivElement
        const y_up = document.getElementById("y_up") as HTMLDivElement
        const y_down = document.getElementById("y_down") as HTMLDivElement
        const z_up = document.getElementById("z_up") as HTMLDivElement
        const z_down = document.getElementById("z_down") as HTMLDivElement
        const y_rotation = document.getElementById("y_rotation") as HTMLSpanElement
        const x_rotation = document.getElementById("x_rotation") as HTMLSpanElement
        const brickmodeExit = document.getElementById("brickmodeexit") as HTMLSpanElement

        x_up.onclick = () => this.ChangeBrickSize("x", 1)
        x_down.onclick = () => this.ChangeBrickSize("x", -1)
        y_up.onclick = () => this.ChangeBrickSize("y", 1)
        y_down.onclick = () => this.ChangeBrickSize("y", -1)
        z_up.onclick = () => this.ChangeBrickSize("z", 1)
        z_down.onclick = () => this.ChangeBrickSize("z", -1)
        y_rotation.onclick = () => this.ChangeRotation(0, 90, 0)
        x_rotation.onclick = () => this.ChangeRotation(90, 0, 0)
        brickmodeExit.onclick = () => {
            this.mode = AppMode.EditPlay
            this.meta.ModeChange(AppMode.EditPlay)
            this.UpdateMenu()
        }
        this.myPicker = new ColorPicker("#myPicker")
        this.myPicker.pointerMove = () => {
            const colorPick = document.getElementById("myPicker") as HTMLInputElement
            if (colorPick.value == this.color) return
            this.color = colorPick.value
            this.meta.ChangeBrickInfo({ color: colorPick.value })
        }
    }
    ChangeBrickSize(xyz: string, value: number) {
        if (xyz == "x" && this.brickSize.x + value < 1) { return }
        else if (xyz == "y" && this.brickSize.y + value < 1) { return }
        else if (xyz == "z" && this.brickSize.z + value < 1) { return }

        switch(xyz) {
            case "x": this.brickSize.x += value; break;
            case "y": this.brickSize.y += value; break;
            case "z": this.brickSize.z += value; break;
        }
        this.UpdateBrickUI()
        this.meta.ChangeBrickInfo({ v: this.brickSize })
    }
    ChangeRotation(x: number, y: number, z: number) {
        this.brickRotate.set(x, y, z)
        this.meta.ChangeBrickInfo({ r: this.brickRotate })
    }
    UpdateBrickUI() {
        const x_value = document.getElementById("x_value") as HTMLDivElement
        x_value.innerText = this.brickSize.x.toString()
        const y_value = document.getElementById("y_value") as HTMLDivElement
        y_value.innerText = this.brickSize.y.toString()
        const z_value = document.getElementById("z_value") as HTMLDivElement
        z_value.innerText = this.brickSize.z.toString()
    }
    public UpdateMenu() {
        console.log("current Mode", this.mode)
        const play = document.getElementById("editplaymode") as HTMLDivElement
        if(play) play.style.backgroundColor = (this.mode == AppMode.EditPlay) ? "silver" : "transparent"
        const avr = document.getElementById("avatarmode") as HTMLDivElement
        avr.style.backgroundColor = (this.mode == AppMode.Face) ? "silver" : "transparent"
        const avr2 = document.getElementById("avatar-second") as HTMLDivElement
        avr2.style.display = (this.mode == AppMode.Face) ? "block" : "none"
        const div = document.getElementById("brickmode") as HTMLDivElement
        div.style.backgroundColor = (this.mode == AppMode.NonLego) ? "silver" : "transparent"
        const fun = document.getElementById("funituremode") as HTMLDivElement
        fun.style.backgroundColor = (this.mode == AppMode.Furniture) ? "silver" : "transparent"
        const fun2 = document.getElementById("funiture-second") as HTMLDivElement
        fun2.style.display = (this.mode == AppMode.Furniture) ? "block" : "none"
        const wea = document.getElementById("weaponmode") as HTMLDivElement
        wea.style.backgroundColor = (this.mode == AppMode.Weapon) ? "silver" : "transparent"
        const brickctrl = document.getElementById("brickctrl") as HTMLDivElement
        brickctrl.style.display = (this.mode == AppMode.Lego || this.mode == AppMode.NonLego) ? "block" : "none"

        this.game.OnOff(this.mode == AppMode.Weapon, this.inven.inven)
    }
    public RequestNewMeta(models: string) {
        const masterAddr = this.m_masterAddr;
        const user = this.session.GetHonUser();
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(MetaTxId);

        const formData = new FormData()
        formData.append("key", encodeURIComponent(user.Email))
        formData.append("email", encodeURIComponent(user.Email))
        formData.append("id", user.Nickname)
        formData.append("password", user.Password)
        formData.append("models", models)
        const time = (new Date()).getTime()
        formData.append("time", time.toString())
        formData.append("table", "meta")
        return fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then(() => {
                this.blockStore.UpdateModels({
                    email: user.Email,
                    key: user.Email,
                    id: user.Nickname,
                    password: user.Password,
                    models: models,
                    time: time,
                }, user.Email)
            })
    }

    public MenuEvent() {
        const sav = document.getElementById("save") as HTMLDivElement
        sav.onclick = async () => {
            const tag = document.getElementById("confirmsave") as HTMLDivElement
            tag.style.display = "block"
        }
        const saveConfirmBtn = document.getElementById("saveConfirmBtn") as HTMLButtonElement
        saveConfirmBtn.onclick = async () => {
            this.alarm.style.display = "block"
            this.alarmText.innerHTML = "저장 중입니다."

            const models = this.meta.ModelStore()
            const invenData = this.meta.store.StoreInventory()
            await this.inven.SaveInventory(invenData, this.m_masterAddr)
            await this.RequestNewMeta(models)
            this.alarm.style.display = "none"
            const tag = document.getElementById("confirmsave") as HTMLDivElement
            tag.style.display = "none"
        }
        const saveCancelBtn = document.getElementById("saveCancelBtn") as HTMLButtonElement
        saveCancelBtn.onclick = () => {
            const tag = document.getElementById("confirmsave") as HTMLDivElement
            tag.style.display = "none"
        }
        const play = document.getElementById("editplaymode") as HTMLDivElement
        if(play) play.onclick = () => {
            this.meta.ModeChange(AppMode.EditPlay)
            this.UpdateMenu()
        }
        const avr = document.getElementById("avatarmode") as HTMLDivElement
        avr.onclick = () => {
            this.mode = (this.mode != AppMode.Face) ? AppMode.Face : AppMode.EditPlay
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
        }
        const fun = document.getElementById("funituremode") as HTMLDivElement
        fun.onclick = () => {
            this.mode = (this.mode != AppMode.Furniture) ? AppMode.Furniture : AppMode.EditPlay
            if (this.mode == AppMode.EditPlay) this.meta.ModeChange(this.mode)
            this.UpdateMenu()
        }
        const wea = document.getElementById("weaponmode") as HTMLDivElement
        wea.onclick = () => {
            this.mode = (this.mode != AppMode.Weapon) ? AppMode.Weapon : AppMode.EditPlay
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
        }
        const male = document.getElementById("change-male") as HTMLDivElement
        male.onclick = () => {
            this.meta.ChangeCharactor(Char.Male)
        }
        const female = document.getElementById("change-female") as HTMLDivElement
        female.onclick = () => {
            this.meta.ChangeCharactor(Char.Female)
        }

        const gate = document.getElementById("gate") as HTMLDivElement
        gate.onclick = () => {
            this.mode = (this.mode != AppMode.Portal) ? AppMode.Portal : AppMode.EditPlay
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
        }
        const div = document.getElementById("brickmode") as HTMLDivElement
        div.onclick = () => {
            this.mode = (this.mode != AppMode.NonLego) ? AppMode.NonLego : AppMode.EditPlay
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
            const colorPick = document.getElementById("myPicker") as HTMLInputElement
            this.meta.ChangeBrickInfo({
                v: this.brickSize, r: this.brickRotate, color: colorPick.value
            })
        }
        const lego = document.getElementById("apart") as HTMLDivElement
        lego.onclick = () => {
            this.mode = (this.mode != AppMode.Lego) ? AppMode.Lego : AppMode.EditPlay
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
            const colorPick = document.getElementById("myPicker") as HTMLInputElement
            this.meta.ChangeBrickInfo({
                v: this.brickSize, r: this.brickRotate, color: colorPick.value
            })
        }
        const eraser = document.getElementById("eraser") as HTMLDivElement
        eraser.onclick = () => {
            this.mode = (this.mode != AppMode.LegoDelete) ? AppMode.LegoDelete : AppMode.EditPlay
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
        }
        const plant = document.getElementById("tree") as HTMLDivElement
        plant.onclick = () => {
            this.plant.toggle()
            this.UpdateMenu()
        }
        const furn = document.getElementById("chair") as HTMLDivElement
        furn.onclick = () => {
            this.furn.toggle()
            this.UpdateMenu()
        }
        const brickReset = document.getElementById("reset-brick") as HTMLDivElement
        brickReset.onclick = () => this.meta.ChangeBrickInfo({ clear: true })

        const exit = document.getElementById("exit") as HTMLDivElement
        exit.onclick = () => {
            const tag = document.getElementById("confirmexit") as HTMLDivElement
            tag.style.display = "block"
        }
        const exitBtn = document.getElementById("exitBtn") as HTMLButtonElement
        exitBtn.onclick = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            }
            this.mode = AppMode.EditPlay
            this.UpdateMenu()
            window.history.back()
        }
        const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement
        cancelBtn.onclick = () => {
            const tag = document.getElementById("confirmexit") as HTMLDivElement
            tag.style.display = "none"
        }
    }

    public CanvasRenderer(email: string | null) {
        const myModel = this.blockStore.GetModel(this.session.UserId)
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"
        this.meta.RegisterInitEvent((inited: Boolean) => {
            this.blockStore.FetchInventory(this.m_masterAddr, this.session.UserId)
                .then((inven: InvenData | undefined) => {
                    console.log(inven)
                    this.inven.LoadInven(this.meta.store.LoadInventory(inven))
                    this.inven.loadSlot()
                    if(this.inven.inven) this.meta.store.ChangeInventory(this.inven.inven.data)
                })
            this.meta.ModeChange(AppMode.EditPlay)
            if (email == null) {
                this.alarm.style.display = "block"
                this.alarmText.innerText = "Login이 필요합니다."
                setTimeout(() => {
                    this.alarm.style.display = "none"
                }, 2000)
            } else {
                if (!inited) return

                this.alarm.style.display = "block"
                this.alarmText.innerText = "이동중입니다."

                this.blockStore.FetchModel(this.m_masterAddr, email)
                    .then(async (result) => {
                        await this.meta.LoadModel(result.models, result.id, myModel?.models)
                        this.alarm.style.display = "none"
                    })
                    .then(() => {
                        this.meta.ModeChange(AppMode.EditPlay)
                    })
                    .catch(async () => {
                        this.alarm.style.display = "none"
                        await this.meta.LoadModelEmpty(email, myModel?.models)
                        this.meta.ModeChange(AppMode.EditPlay)
                    })
            }
            this.ui.UiOff(AppMode.EditPlay)
            this.meta.render()
        })
    }
    loadHelper() {
        fetch("views/editmode/edithelp.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("modalwindow") as HTMLDivElement;
                tag.innerHTML = res
            })
            .then(() => {
            })
    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        await this.game.LoadHtml()

        this.GetElement()
        this.UpdateBrickUI()
        
        this.m_masterAddr = masterAddr;
        const email = this.getParam("email");
        if(email == null) return false;
        this.loadHelper()
        this.CanvasRenderer(email)
        this.MenuEvent()
        this.inven.binding()
        this.UpdateMenu()

        return true;
    }

    public Release(): void { 
        this.ui.UiOn()
        this.ReleaseHtml()
        this.furn.htmlRelease()
        this.plant.htmlRelease()
    }
}