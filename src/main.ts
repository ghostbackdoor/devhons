import { HonEntry } from "./models/param";
import { GlobalLoadListTx, GlobalLoadTx, HonsTxId } from "./models/tx";
import { Session } from "./session";
import { BlockStore } from "./store";


export class Main {

    public constructor(private blockStore: BlockStore, 
        private session: Session) {
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
        tags.forEach((tag: string) => {
            taglist.innerHTML += `
            <span class='badge bg-primary handcursor' onclick="ClickLoadPage('hons', false, '&tag=${atob(tag)}')">
            ${decodeURIComponent(atob(atob(tag)))}
            </span>
            `
        })
    }
    drawHtmlUserInfo(hon: any) {
        const uniqId = hon.id + hon.time.toString()
        const userTag = document.getElementById("userlist") as HTMLDivElement;
        userTag.innerHTML += `
                <div class="container">
                <div class="row p-1 border-top handcursor" onclick="ClickLoadPage('hondetail', false, '&email=${hon.email}')">
                    <div class="col-auto">
                            <span id="${uniqId}" class="m-1"></span>
                    </div>
                    <div class="col">
                        <b>${hon.id}</b> @${hon.email}
                    </div>
                </div>
                </div>
                `

        if ("file" in hon) {
            fetch("data:image/jpg;base64," + hon.file)
                .then(res => res.blob())
                .then(img => {
                    const imageUrl = URL.createObjectURL(img)
                    const imageElement = new Image()
                    imageElement.src = imageUrl
                    imageElement.className = 'profile-sm';
                    const container = document.getElementById(uniqId) as HTMLSpanElement
                    container.appendChild(imageElement)
                })
        }
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
        const table = "profile"
        emails.forEach((email) => {
            const key = atob(email)
            const addr = `
                ${masterAddr}/glambda?txid=${encodeURIComponent(GlobalLoadTx)}&table=${table}&key=${key}`;
            fetch(addr)
                .then((response) => response.json())
                .then((result) => this.drawHtmlUserInfo(result))
        })
    }

    public RequestUserlist(n: number) {
        const masterAddr = window.MasterAddr;
        const table = "member"
        const addr = `
        ${masterAddr}/glambda?txid=${encodeURIComponent(GlobalLoadListTx)}&table=${table}&start=0&count=${n}`;
        fetch(addr)
            .then((response) => response.json())
            .then((result) => this.tagResult(result))
            .then((result) => this.RequestUserInfo(result))
    }
    disableMeta() {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "none"
        const progress = document.getElementById("progress-bar-container") as HTMLDivElement
        progress.style.display = "none"
        const joypad = document.getElementById("joypad") as HTMLDivElement
        joypad.style.display = "none"
        const joypad_buttons = document.getElementById("joypad_buttons") as HTMLDivElement
        joypad_buttons.style.display = "none"
    }

    public Run(masterAddr: string): boolean {
        this.disableMeta()
        this.RequestTaglist(20)
        this.RequestUserlist(20)

        return true
    }

    public Release(): void { 
    }
}