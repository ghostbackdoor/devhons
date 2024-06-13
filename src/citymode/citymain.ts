import App, { AppMode } from "../meta/app";
import { GlobalSaveTxId } from "../models/tx";
import { Ui } from "../models/ui";
import { Page } from "../page";
import { Session } from "../session";
import { BlockStore } from "../store";

export class CityMain extends Page {
    masterAddr = ""
    ui = new Ui(this.meta, AppMode.CityView)

    constructor(
        private blockStore: BlockStore,
        private session: Session,
        private meta: App,
        url: string
    ) {
        super(url)
    }
    Join(cityKey: string) {
        this.alarmOn("등록중입니다.")
        const user = this.session.GetHonUser();
        const addr = this.masterAddr + "/glambda?txid=" + encodeURIComponent(GlobalSaveTxId);
        const formData = new FormData()
        formData.append("key", encodeURIComponent(user.Email))
        formData.append("email", encodeURIComponent(user.Email))
        formData.append("password", user.Password)
        formData.append("nickname", user.Nickname)
        formData.append("id", user.Nickname)
        formData.append("time", (new Date()).getTime().toString())
        formData.append("table", "citizen_" + cityKey)
        fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then(() => {
                this.alarmOff()
            })
    }
    public async CanvasRenderer(cityKey: string) {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"
        this.meta.RegisterInitEvent(() => {
            this.ui.UiOn()
            this.meta.render()
        })
        this.alarmOn("마을 정보를<br>불러오고 있습니다.")
        const myModel = this.blockStore.GetModel(this.session.UserId)

        const [city, citizen] = await Promise.all([
            this.blockStore.FetchCity(this.masterAddr, cityKey),
            this.blockStore.FetchCitizen(this.masterAddr, cityKey),
        ])
        const data = new Map<string, string>()
        data.set(city.id, city.models ?? "")
        await citizen.map(async (e) => {
            const modelEntry = await this.blockStore.FetchModel(this.masterAddr, e.id)
            data.set(modelEntry.id, modelEntry.models)
        })

        await this.meta.LoadCity(data, myModel?.models)
        this.alarmOff()

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
    public PopupMenu(cityKey: string) {
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
            window.ClickLoadPage("editcity", false, "&email=" + cityKey)
        }
        const setup = document.getElementById("setupcity") as HTMLAnchorElement
        setup.onclick = () => {
            window.ClickLoadPage("setupcity", false, "&email=" + cityKey)
        }
        const join = document.getElementById("join") as HTMLAnchorElement
        join.onclick = () => {
            if (!this.session.CheckLogin()) {
                this.confirmOn("로그인이 필요합니다.", "로그인", () => {
                    window.ClickLoadPage("signin", false)
                })
                return
            }
            this.confirmOn("가입하시겠습니까?", "가입", () => {
                this.Join(cityKey)
            })
        }
        const exit = document.getElementById("exit") as HTMLAnchorElement
        exit.onclick = () => {
        }
    }

    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.masterAddr = masterAddr
        const cityKey = this.getParam("city") ?? "ghost"
        this.CanvasRenderer(cityKey)
        this.RequestCityInfo(cityKey)
        this.PopupMenu(cityKey)
        return true
    }
    public Release(): void {
        this.ReleaseHtml()
    }
}