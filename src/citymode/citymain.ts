import App, { AppMode } from "../meta/app";
import { Ui } from "../models/ui";
import { Page } from "../page";
import { Session } from "../session";
import { BlockStore } from "../store";

export class CityMain extends Page {
    masterAddr = ""
    ui = new Ui(this.meta, AppMode.CityView)

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
    public CanvasRenderer(cityKey: string) {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"
        this.meta.RegisterInitEvent(() => {
            //this.meta.ModeChange(AppMode.Long, false)
            this.ui.UiOn()
            this.meta.render()
        })
        const myModel = this.blockStore.GetModel(this.session.UserId)
        this.blockStore.FetchCity(this.masterAddr, cityKey)
            .then(async (result) => {
                const data = new Map<string, string>()
                data.set(result.id, result.models ?? "")
                await this.meta.LoadVillage(data, myModel?.models)
            })

        const play = document.getElementById("playBtn") as HTMLButtonElement
        play.onclick = () => {
            //this.ui.UiOff(AppMode.Play) 
            window.ClickLoadPage("play", false)
        }

        const space = document.getElementById("avatar-space") as HTMLAnchorElement
        space.style.height = window.innerHeight - 230 + "px"
    }
    async RequestCityInfo(city: string) {
        const data = await this.blockStore.FetchCity(this.masterAddr, city)
        console.log(data)
        const title = document.getElementById("citytitle")
        if (title) title.innerText = data.citytitle
        const explain = document.getElementById("explain")
        if (explain) explain.innerText = data.cityexplain
    }
    popupVisible = false
    public PopupMenu(email: string) {
        const btn = document.getElementById("menuBtn") as HTMLSpanElement
        const pop = document.getElementById("popmenu") as HTMLDivElement
        btn.onclick = () => {
            if (this.popupVisible) {
                pop.style.display = "none"
                this.popupVisible = false
            } else {
                pop.style.display = "block"
                this.popupVisible = true
            }
        }
        
        const city = document.getElementById("editcity") as HTMLAnchorElement
        city.onclick = () => {
            window.ClickLoadPage("editcity", false, "&email=" + email)
        }
    }
   
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.masterAddr = masterAddr
        const cityText = this.getParam("city") ?? "ghost"
        this.CanvasRenderer(cityText)
        this.RequestCityInfo(cityText)
        this.PopupMenu(cityText)
        return true
    }
    public Release(): void { 
        this.ReleaseHtml()
    }
}