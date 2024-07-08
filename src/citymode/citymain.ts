import App, { AppMode } from "../meta/app";
import { gsap } from "gsap"
import { ProfileEntry } from "../models/param";
import { GlobalSaveTxId } from "../models/tx";
import { Ui } from "../models/ui";
import { Page } from "../page";
import { Session } from "../session";
import { BlockStore } from "../store";

export class CityMain extends Page {
    masterAddr = ""
    cityTitle?: string
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
                window.location.reload()
            })
    }
    public async CanvasRenderer(cityKey: string) {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"
        this.alarmOn("마을 정보를<br>불러오고 있습니다.")

        this.meta.RegisterInitEvent(() => {
            this.meta.render()
            const space = document.getElementById("avatar-space") as HTMLAnchorElement
            space.style.height = window.innerHeight - 230 + "px"
            this.ui.UiOn()
        })
        const myModel = this.blockStore.GetModel(this.session.UserId)

        /* load city & citizen */
        const [city, citizen] = await Promise.all([
            this.blockStore.FetchCity(this.masterAddr, cityKey),
            this.blockStore.FetchCitizenList(this.masterAddr, cityKey),
        ])
        const data = new Map<string, string>()
        await Promise.all(citizen.map(async (e) => {
            const modelEntry = await this.blockStore.FetchModel(this.masterAddr, e)
            data.set(modelEntry.id, modelEntry.models)
            this.makeMemberHtml(e)
        }))

        this.meta.ModelClear()
        console.log(city.models)
        await this.meta.LoadCity(data, city.models, myModel?.models)
        this.alarmOff()
        this.DrawCityTitle()

        const play = document.getElementById("playBtn") as HTMLButtonElement
        play.onclick = () => {
            //this.ui.UiOff(AppMode.Play) 
            window.ClickLoadPage("play", false)
        }
    }
    DrawCityTitle() {
        if(!this.cityTitle) return
        const dom = document.getElementById("citybigtitle")
        if (dom) dom.innerText = this.cityTitle
        const s1 = gsap.to(dom, {
            duration: 2, opacity: 1, delay: 1
        })
        const s2 = gsap.to(dom, {
            duration: 2, opacity: 0, delay: 1
        })
        const timeline = gsap.timeline()
        timeline.add(s1)
        timeline.add(s2)
    }

    async RequestCityInfo(city: string) {
        const data = await this.blockStore.FetchCity(this.masterAddr, city)
        console.log(data)
        const title = document.getElementById("citytitle")
        if (title) title.innerText = data.citytitle
        const explain = document.getElementById("explain")
        if (explain) explain.innerText = data.cityexplain
        this.cityTitle = data.citytitle
    }

    popupVisible = false
    public BindingMenu(cityKey: string) {
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
            window.ClickLoadPage("editcity", false, "&city=" + cityKey)
        }
        const setup = document.getElementById("setupcity") as HTMLAnchorElement
        setup.onclick = () => {
            window.ClickLoadPage("setupcity", false, "&city=" + cityKey)
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
        const newfeed = document.getElementById("newfeed") as HTMLAnchorElement
        newfeed.onclick = () => {
            window.ClickLoadPage("newhon", false, "&from=city&city=" + cityKey)
        }
    }
    public makeMemberHtml(email: string) {
        if (!this.active) return
        this.blockStore.FetchProfile(window.MasterAddr, email)
            .then((ret: ProfileEntry) => {
                const uniqId = ret.id + ret.time.toString()
                const memberrTag = document.getElementById("memberlist") as HTMLDivElement;
                memberrTag.insertAdjacentHTML("beforeend", `
                <div class="row p-1 border-top handcursor" onclick="ClickLoadPage('hondetail', false, '&email=${ret.email}')">
                    <div class="col-auto">
                            <span id="${uniqId}" class="m-1"></span>
                    </div>
                    <div class="col">
                        <b>${ret.id}</b> @${ret.email}
                    </div>
                </div>
                `)

                if (ret.file != "") {
                    fetch("data:image/jpg;base64," + ret.file)
                        .then(res => res.blob())
                        .then(img => {
                            const imageUrl = URL.createObjectURL(img)
                            const imageElement = new Image()
                            imageElement.src = imageUrl
                            imageElement.className = 'profile-sm';
                            const container = document.getElementById(uniqId) as HTMLSpanElement
                            container.innerHTML = ''
                            container.appendChild(imageElement)
                        })
                }
            })
    }

    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.masterAddr = masterAddr
        const cityKey = this.getParam("city") ?? "ghost"
        this.CanvasRenderer(cityKey)
        this.RequestCityInfo(cityKey)
        this.BindingMenu(cityKey)
        return true
    }
    public Release(): void {
        this.ReleaseHtml()
    }
}