import { BlockStore } from "./store";
import { HonUser, Session } from "./session";
import { FollowTxId, GetFollowerTxId, HonDetailTxId, MyHonsTxId } from "./models/tx";
import { HonEntry, ProfileEntry } from "./models/param";
import { DrawHtmlHonItem } from "./models/honview";
import App, { AppMode } from "./meta/app";
import { Page } from "./page";
import { Ui } from "./models/ui";

type HonsData = { 
    id: string,
    email: string,
    html: string 
}
export class HonDetail extends Page {
    m_masterAddr: string = ""
    targetHonEmail: string = ""
    profileVisible = true
    fullscreen = false
    honsData: HonsData[] = []
    ui = new Ui(this.meta, AppMode.Close)

    public constructor(private blockStore: BlockStore
        , private session: Session, private meta: App, url: string) {
        super(url)
    }
    drawHtml(ret: any) {
        const honUser :HonUser = {
            Email: decodeURIComponent(ret.email),
            Nickname: ret.id,
            Password: ""
        }
        const nicknameTag = document.getElementById('nickname');
        if (nicknameTag == null) return;
        nicknameTag.innerHTML = honUser.Nickname;
        const emailTag = document.getElementById('email');
        if (emailTag == null) return;
        emailTag.innerHTML = honUser.Email;
        this.blockStore.FetchProfile(window.MasterAddr, ret.email)
            .then((result) => {
                if (result.file != "" && "file" in result) {
                    fetch("data:image/jpg;base64," + result.file)
                        .then(res => res.blob())
                        .then(img => {
                            const imageUrl = URL.createObjectURL(img)
                            const imageElement = new Image()
                            imageElement.src = imageUrl
                            imageElement.className = 'twPc-avatarImg';
                            const container = document.getElementById("bg-profile")
                            if (container == null) return
                            container.innerHTML = ""
                            container.appendChild(imageElement)
                        })
                }
            })
    }
    requestUserInfo(email: string) {
        const masterAddr = this.m_masterAddr;
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(HonDetailTxId);

        fetch(addr + "&table=member&key=" + encodeURIComponent(email))
            .then((response) => response.json())
            .then((result) => this.drawHtml(result))
            .catch(() => { console.log("Server에 문제가 생긴듯 합니다;;") });
    }
    async drawHtmlHon(ret: HonEntry, id: string) {
        if (!this.active) return
        let html = this.blockStore.LoadHonView(id)
        if (html == undefined) {
            html = await DrawHtmlHonItem(this.blockStore, ret, id) 
            this.blockStore.SaveHonView(id, html)
        }
        this.honsData.push({ id: id, email: ret.email, html: html })
    }
    honsResult(ret: any): string[] {
        const keys: string[] = ret.result
        if (keys.length == 0) return []
        return keys
    }
    public async RequestHon(keys: string[]) {
        if (keys.length == 0) return 

        await Promise.all(keys.map(async (key) => {
            await this.blockStore.FetchHon(this.m_masterAddr, key)
                .then((result) => this.drawHtmlHon(result, btoa(key)))
                .catch((err) => console.log(err))
        }))
        let htmlString = ""
        this.honsData.forEach(data => {
            htmlString += data.html
        });
        const feedstag = document.getElementById("feeds") as HTMLDivElement
        if(feedstag) feedstag.innerHTML = htmlString
        this.ViewLoadingSpinner(false)
    }
    public RequestHons(email: string) {
        this.ViewLoadingSpinner(true)
        this.m_masterAddr = window.MasterAddr;
        const masterAddr = this.m_masterAddr;
        const addr = `
        ${masterAddr}/glambda?txid=${encodeURIComponent(MyHonsTxId)}&table=feedlink&key=${email}`;
        fetch(addr)
            .then((response) => response.json())
            .then((result) => this.honsResult(result))
            .then((feedlist) => this.RequestHon(feedlist))
    }

    ////////////Follow//////////////
    public Follow() {
        const followBtn = document.getElementById("followBtn") as HTMLButtonElement
        followBtn.onclick = () => {
            const targetKey = this.targetHonEmail
            const user = this.session.GetHonUser();
            if (!this.session.CheckLogin() || 
                user.Email == targetKey) return
            
            const formData = new FormData()
            formData.append("key", user.Email)
            formData.append("email", user.Email)
            formData.append("password", user.Password)
            formData.append("targetkey", targetKey)
            const addr = `
                ${this.m_masterAddr}/glambda?txid=${encodeURIComponent(FollowTxId)}`;
            fetch(addr, {
                method: "POST",
                cache: "no-cache",
                headers: {},
                body: formData
            })
                .then((response) => response.json())
                .then((ret) => console.log(ret))
        }
    }

    public GetFollowerList() {
        const targetKey = this.targetHonEmail
        const addr = `
                ${this.m_masterAddr}/glambda?txid=${encodeURIComponent(GetFollowerTxId)}&table=follower&key=${targetKey}`;
        fetch(addr)
            .then((response) => response.json())
            .then((followers) => {
                if (followers["result"].constructor == Array) {
                    followers["result"].forEach((follower: string) => {
                        this.makeFollowerHtml(follower)
                    })
                }
            })
    }
    public makeFollowerHtml(email: string) {
        if (!this.active) return
        console.log(email)
        this.blockStore.FetchProfile(window.MasterAddr, email)
            .then((ret: ProfileEntry) => {
                console.log(ret)
                const uniqId = ret.id + ret.time.toString()
                const followerTag = document.getElementById("followerlist") as HTMLDivElement;
                followerTag.insertAdjacentHTML("afterend", `
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
    public CanvasRenderer(email: string) {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"

        const play = document.getElementById("playBtn") as HTMLButtonElement
        play.onclick = () => { 
            //this.ui.UiOff(AppMode.Play)
            window.ClickLoadPage("play", false, `&email=${email}`)
        }

        this.meta.RegisterInitEvent(() => {
            this.alarmOn("이동중입니다.")
            this.ui.UiOn()

            const myModel = this.blockStore.GetModel(this.session.UserId)
            this.blockStore.FetchModel(this.m_masterAddr, email)
                .then(async (result) => {
                    await this.meta.LoadModel(result.models, result.id, myModel?.models)
                    this.alarmOff()
                })
                .then(() => {
                    this.meta.ModeChange(AppMode.Close)
                })
                .then(() => {
                    this.meta.render()
                })
                .catch(async () => {
                    this.alarmOff()
                    await this.meta.LoadModelEmpty(email, myModel?.models)
                    this.meta.ModeChange(AppMode.Close)
                })
        })

        const space = document.getElementById("avatar-space") as HTMLAnchorElement
        space.style.height = window.innerHeight - 230 + "px"
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
        const logout = document.getElementById("pop_logout") as HTMLAnchorElement
        logout.onclick = () => {
            this.session.SignOut()
        }
        const link = document.getElementById("edithome") as HTMLAnchorElement
        link.onclick = () => {
            window.ClickLoadPage("edithome", false, "&email=" + email)
        }
        const city = document.getElementById("editcity") as HTMLAnchorElement
        city.onclick = () => {
            window.ClickLoadPage("newcity", false, "&email=" + email)
        }
    }
    public ViewLoadingSpinner(onoff: boolean){
        const printTag = document.getElementById("loading") as HTMLDivElement;
        if(printTag) printTag.innerHTML = (onoff) ? `
            <div class="spinner-grow text-primary" role="status">
                <span class="visually-hidden"></span>
            </div>
        `:"";
    }

    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.ui.Init()
        this.m_masterAddr = masterAddr;
        const email = this.getParam("email");
        if(email == null) return false;
        this.targetHonEmail = email
        window.scrollTo({ top: 0, left: 0, behavior: 'auto'})
        this.requestUserInfo(email)
        this.RequestHons(email);
        this.Follow()
        this.GetFollowerList()
        this.CanvasRenderer(email)
        this.PopupMenu(email)

        return true;
    }

    public Release(): void {
        this.honsData.length = 0
        const footer = document.getElementById("footer") as HTMLDivElement
        footer.style.display = "block"
        this.ReleaseHtml()
    }
}
