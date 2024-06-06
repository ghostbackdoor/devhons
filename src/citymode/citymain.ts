import App, { AppMode } from "../meta/app";
import { Ui } from "../models/ui";
import { Page } from "../page";
import { Session } from "../session";
import { BlockStore } from "../store";

export class CityMain extends Page {
    masterAddr = ""
    ui = new Ui(this.meta, AppMode.EditCity)

    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    constructor(
        private blockStore: BlockStore,
        private session: Session, 
        private meta: App, 
        url: string
    ) {
        super(url)
    }
    public CanvasRenderer() {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"
        this.meta.RegisterInitEvent(() => {
            //this.meta.ModeChange(AppMode.Long, false)
            this.ui.UiOn()
            this.meta.render()
        })
        const myModel = this.blockStore.GetModel(this.session.UserId)
        this.blockStore.FetchModels(this.masterAddr)
            .then(async (result) => {
                await this.meta.LoadVillage(result, myModel?.models)
            })

        const play = document.getElementById("playBtn") as HTMLButtonElement
        play.onclick = () => {
            //this.ui.UiOff(AppMode.Play) 
            window.ClickLoadPage("play", false)
        }

        const space = document.getElementById("avatar-space") as HTMLAnchorElement
        space.style.height = window.innerHeight - 230 + "px"
    }
    RequestCityInfo(city: string) {
        this.blockStore.FetchCity(this.masterAddr, city)
    }
   
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.masterAddr = masterAddr
        this.CanvasRenderer()
        const cityText = this.getParam("city") ?? "ghost"
        this.RequestCityInfo(cityText)
        return true
    }
    public Release(): void { 
        this.ReleaseHtml()
    }
}