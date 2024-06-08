import * as THREE from "three";
import App, { AppMode } from "../meta/app";
import { InvenData } from "../meta/inventory/inventory";
import { Ui } from "../models/ui";
import { Page } from "../page";
import { UiInven } from "../playmode/play_inven";
import { Session } from "../session";
import { BlockStore } from "../store";
import { UiBrick } from "../module/uibrick";

export class EditCity extends Page {
    masterAddr = ""
    ui = new Ui(this.meta, AppMode.EditCity)
    mode = AppMode.EditCity

    brickSize = new THREE.Vector3(3, 3, 1)
    brickRotate = new THREE.Vector3()

    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    constructor(
        private blockStore: BlockStore,
        private session: Session, 
        private meta: App, 
        private inven: UiInven,
        private brick: UiBrick, 
        url: string
    ) {
        super(url)
    }
    UpdateMenu() {
        console.log("current Mode", this.mode)
        const play = document.getElementById("editcity") as HTMLDivElement
        if(play) play.style.backgroundColor = (this.mode == AppMode.EditCity) ? "silver" : "transparent"
        const div = document.getElementById("brickmode") as HTMLDivElement
        div.style.backgroundColor = (this.mode == AppMode.NonLego) ? "silver" : "transparent"
        const brickctrl = document.getElementById("brickctrl") as HTMLDivElement
        brickctrl.style.display = (this.mode == AppMode.Lego || this.mode == AppMode.NonLego) ? "block" : "none"
    }
    loadHelper() {
        fetch("views/citymode/edithelp.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("modalwindow") as HTMLDivElement;
                tag.innerHTML = res
            })
            .then(() => {
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

            //const models = this.meta.ModelStore()
            //const invenData = this.meta.store.StoreInventory()
            //await this.inven.SaveInventory(invenData, this.m_masterAddr)
            //await this.RequestNewMeta(models)
            this.alarm.style.display = "none"
            const tag = document.getElementById("confirmsave") as HTMLDivElement
            tag.style.display = "none"
        }
        const saveCancelBtn = document.getElementById("saveCancelBtn") as HTMLButtonElement
        saveCancelBtn.onclick = () => {
            const tag = document.getElementById("confirmsave") as HTMLDivElement
            tag.style.display = "none"
        }
        const city = document.getElementById("editcity") as HTMLDivElement
        city.onclick = () => {
            this.meta.ModeChange(AppMode.EditCity)
            this.UpdateMenu()
        }
        const gate = document.getElementById("gate") as HTMLDivElement
        gate.onclick = () => {
            this.mode = (this.mode != AppMode.Portal) ? AppMode.Portal : AppMode.EditCity
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
        }
        const div = document.getElementById("brickmode") as HTMLDivElement
        div.onclick = () => {
            this.mode = (this.mode != AppMode.NonLego) ? AppMode.NonLego : AppMode.EditCity
            this.meta.ModeChange(this.mode)
            this.UpdateMenu()
            const colorPick = document.getElementById("myPicker") as HTMLInputElement
            this.meta.ChangeBrickInfo({
                v: this.brickSize, r: this.brickRotate, color: colorPick.value
            })
        }
        const exitBtn = document.getElementById("exitBtn") as HTMLButtonElement
        exitBtn.onclick = () => {
            if (document.fullscreenElement) {
                document.exitFullscreen()
            }
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
            this.blockStore.FetchInventory(this.masterAddr, this.session.UserId)
                .then((inven: InvenData | undefined) => {
                    console.log(inven)
                    this.inven.LoadInven(this.meta.store.LoadInventory(inven))
                    this.inven.loadSlot()
                    if(this.inven.inven) this.meta.store.ChangeInventory(this.inven.inven.data)
                })
            this.meta.ModeChange(AppMode.EditCity)
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

                this.blockStore.FetchCity(this.masterAddr, email)
                    .then(async (result) => {
                        await this.meta.LoadModel(result.models ?? "", result.id, myModel?.models)
                        this.alarm.style.display = "none"
                    })
                    .then(() => {
                        this.meta.ModeChange(AppMode.EditCity)
                    })
                    .catch(async () => {
                        this.alarm.style.display = "none"
                        await this.meta.LoadModelEmpty(email, myModel?.models)
                        this.meta.ModeChange(AppMode.EditCity)
                    })
            }
            this.ui.UiOff(AppMode.EditCity)
            this.meta.render()
        })
    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml(this.inven.Html, this.brick.Html)
        const email = this.getParam("email");
        if(email == null) return false;
        this.masterAddr = masterAddr
        this.loadHelper()
        this.brick.Initialize(AppMode.EditCity, () => { this.mode = AppMode.EditCity; this.UpdateMenu() })
        this.brick.GetElement()
        this.brick.UpdateBrickUI()

        this.CanvasRenderer(email)

        this.MenuEvent()
        this.inven.binding()
        this.UpdateMenu()
        return true
    }
    public Release(): void { 
        this.ReleaseHtml()
    }
}