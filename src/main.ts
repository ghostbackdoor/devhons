import { ProfileEntry } from "./models/param";
import { GlobalLoadListTx } from "./models/tx";
import { Page } from "./page";
import { BlockStore } from "./store";


export class Main extends Page {
    targetloadCnt = 0
    currenloadCnt = 0
    userlist: string[] = []

    public constructor(private blockStore: BlockStore, url: string) {
            super(url)
    }

    tagResult(ret: any): string[] {
        if ("json" in ret) {
            const tags = JSON.parse(ret.json);
            return tags;
        }
        return []
    }
    drawHtmlTaglist(tags: string[]) {
        const taglist = document.getElementById('taglist') as HTMLDivElement
        let htmlString = `
        <span class='badge bg-primary handcursor select-disable' onclick="ClickLoadPage('hons', false)">#최신글</span>
        <span class='badge bg-info handcursor select-disable' onclick="ClickLoadPage('newhon', false)">#AI 체험하기</span>
        `
        tags.forEach((tag: string) => {
            htmlString += `
            <span class='badge bg-primary handcursor select-disable' onclick="ClickLoadPage('hons', false, '&tag=${atob(tag)}')">
            ${decodeURIComponent(atob(atob(tag)))}
            </span>
            `
        })
        taglist.innerHTML = htmlString
    }
    async makeHtmlUserInfo(hon: ProfileEntry) {
        this.currenloadCnt++
        if ("file" in hon) {
            let imgUrl: string = ""
            if (hon.file != "" && "file" in hon) {
                await fetch("data:image/jpg;base64," + hon.file)
                    .then(res => res.blob())
                    .then(img => {
                        imgUrl = URL.createObjectURL(img)
                    })
            } else {
                imgUrl = "static/img/ghost_background_black.png"
            }
            const htmlString = `
                <div class="container p-2">
                <div class="row p-1 border rounded handcursor" onclick="ClickLoadPage('hondetail', false, '&email=${hon.email}')">
                    <div class="col-auto">
                            <span class="m-1"><img class="profile-sm" src="${imgUrl}"></span>
                    </div>
                    <div class="col">
                        <b>${hon.id}</b> @${hon.email} <img src="static/img/confirm.png">
                    </div>
                </div>
                </div>
                `

            this.userlist.push(htmlString)
        }
        if (this.targetloadCnt == this.currenloadCnt) {
            const tag = document.getElementById("loadspinner") as HTMLSpanElement
            if (tag) tag.style.display = "none"
        }
    }
    drawHtmlUserInfo() {
        let htmlString: string = `<span style="font-size: 20px;"><b>추천 Hon 메타버스</b></span>`
        this.userlist.forEach((html) => {
            htmlString += html
        })
        const userTag = document.getElementById("userlist") as HTMLDivElement;
        userTag.innerHTML = htmlString
    }
    public RequestTaglist(n: number) {
        const masterAddr = window.MasterAddr;
        const table = "taglist"
        const addr = `
        ${masterAddr}/glambda?txid=${encodeURIComponent(GlobalLoadListTx)}&table=${table}&start=0&count=${n}`;
        fetch(addr)
            .then((response) => response.json())
            .then((result) => this.tagResult(result))
            .then((result) => this.drawHtmlTaglist(result))
    }

    public RequestUserInfo(emails: string[]) {
        const masterAddr = window.MasterAddr;
        this.targetloadCnt = emails.length
        this.currenloadCnt = 0
            const promise = emails.map(async (email) => {
                const key = email//atob(email)
                await this.blockStore.FetchProfile(masterAddr, key)
                    .then((result) => this.makeHtmlUserInfo(result))
            })

        Promise.all(promise).then(() => this.drawHtmlUserInfo())
    }

    public RequestUserlist() {
        //const masterAddr = window.MasterAddr;
        //const table = "member"
        //const addr = `
        //${masterAddr}/glambda?txid=${encodeURIComponent(GlobalLoadListTx)}&table=${table}&start=0&count=${n}`;

        const userTag = document.getElementById("userlist") as HTMLDivElement;
        userTag.innerHTML = `<span style="font-size: 20px;"><b>추천 Hon 메타버스</b></span>`
        this.RequestUserInfo(["ghost"])
    }
    disableMeta() {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "none"
        const progress = document.getElementById("progress-bar-container") as HTMLDivElement
        progress.style.display = "none"
        const joypad_buttons = document.getElementById("joypad_buttons") as HTMLDivElement
        joypad_buttons.style.display = "none"
    }
    async loadTutorial() {
        await fetch("views/tutorial/sns.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("tutorial") as HTMLDivElement;
                tag.insertAdjacentHTML("beforeend", res)
            })
        await fetch("views/tutorial/ai.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("tutorial") as HTMLDivElement;
                tag.insertAdjacentHTML("beforeend", res)
            })
        await fetch("views/tutorial/play.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("tutorial") as HTMLDivElement;
                tag.insertAdjacentHTML("beforeend", res)
            })

    }
    public CanvasRenderer() {
    }
    
    public async Run(): Promise<boolean> {
        await this.LoadHtml()
        this.disableMeta()
        this.RequestTaglist(20)
        this.RequestUserlist()
        this.CanvasRenderer()
        this.loadTutorial()

        return true
    }

    public Release(): void {
        this.ReleaseHtml()
        this.userlist.length = 0
    }
}