import { BlockStore } from "./store";
import { Session } from "./session";
import { FetchResult, HonEntry } from "./models/param";
import { HonReplyLinkTxId, HonReplyTxId, HonTxId } from "./models/tx";
import { DrawHtmlHonItem } from "./models/honview";
import { Page } from "./page";

export class Hon extends Page{
    m_masterAddr: string;
    public constructor(private blockStore: BlockStore
        , private session: Session, url: string) {
        super(url)
        this.m_masterAddr = "";
    }
    drawHtmlUserReply() {
        this.blockStore.FetchProfile(window.MasterAddr, this.session.GetHonUser().Email)
            .then((result) => {
                if (result.file != "") {
                    fetch("data:image/jpg;base64," + result.file)
                        .then(res => res.blob())
                        .then(img => {
                            const imageUrl = URL.createObjectURL(img)
                            const imageElement = new Image()
                            imageElement.src = imageUrl
                            imageElement.className = 'profile-sm';
                            const container = document.getElementById("userId") as HTMLSpanElement
                            container.innerHTML = ''
                            container.appendChild(imageElement)
                        })
                }
            })
    }
    drawHtmlReply() {
        this.blockStore.FetchProfile(window.MasterAddr, this.session.GetHonUser().Email)
            .then((result) => {
                if ("file" in result) {
                    fetch("data:image/jpg;base64," + result.file)
                        .then(res => res.blob())
                        .then(img => {
                            const imageUrl = URL.createObjectURL(img)
                            const imageElement = new Image()
                            imageElement.src = imageUrl
                            imageElement.className = 'profile-sm';
                            const container = document.getElementById("userId") as HTMLSpanElement
                            container.innerHTML = ''
                            container.appendChild(imageElement)
                        })
                }
            })
    }

    async drawHtmlHon(ret: HonEntry, key: string, targetDiv: string) {
        const feeds = document.getElementById(targetDiv);
        if (feeds == null) return;
        const html = await DrawHtmlHonItem(this.blockStore, ret, key)
        feeds.insertAdjacentHTML("afterend", html)
    }
    warningMsg(msg: string) {
        const info = document.getElementById("information");
        if (info == null) return;
        info.innerHTML = msg;
    }
    newHonResult(ret: FetchResult) {
        if (ret.result == "null") {
            this.warningMsg("등록 실패");
        } else {
            const key = this.getParam("key");
            window.ClickLoadPage("hon", false, `&key=${key}`);
        }
    }
    /* reply 신규 등록 */
    public RequestNewReplyHon(key: string) {
        const masterAddr = this.m_masterAddr;
        const user = this.session.GetHonUser();
        const inputContent = document.getElementById("inputContent") as HTMLTextAreaElement;
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(HonReplyTxId);
        const formData = new FormData()
        formData.append("key", user.Email)
        formData.append("email", user.Email)
        formData.append("password", user.Password)
        formData.append("id", user.Nickname)
        formData.append("targetkey", decodeURIComponent(key))
        formData.append("time", (new Date()).getTime().toString())
        formData.append("table", "feeds")
        formData.append("content", inputContent?.value)
        fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then((result) => this.newHonResult(result))
            .catch(() => { this.warningMsg("Server에 문제가 생긴듯 합니다;;") });
    }
    /* 메인 feed */
    public RequestHon(key: string) {
        const keystring = atob(decodeURIComponent(key))
        return this.blockStore.FetchHon(this.m_masterAddr, keystring)
            .then((result) => this.drawHtmlHon(result, key, "feed"))
    }
    /* reply feed */
    public RequestHonReply(key: string) {
        const addr = this.m_masterAddr + "/glambda?txid=" + 
            encodeURIComponent(HonTxId) + "&table=replyfeeds&key=";
        return fetch(addr + key)
            .then((response) => response.json())
            .then(async (result) => await this.drawHtmlHon(result, key, "reply"))
            .then(() => this.warningMsg(""))
    }
    /* reply feedlink */
    public RequestHonsReplys(key: string) {
        this.m_masterAddr = window.MasterAddr;
        const masterAddr = this.m_masterAddr;
        const addr = `
        ${masterAddr}/glambda?txid=${encodeURIComponent(HonReplyLinkTxId)}&table=replylink&key=${key}`;
        fetch(addr)
            .then((response) => response.json())
            .then((result) => {
                if (result.result.constructor == Array) {
                    result.result.forEach(async (key: any) => {
                        await this.RequestHonReply(key)
                    });
                } else {
                    this.warningMsg("")
                }
            })
    }
    public CheckReplyForm ( ): boolean {
        if(!this.session.CheckLogin()) {
            const div = document.getElementById("replyform") as HTMLDivElement
            div.innerHTML = "<b>login</b>을 해야 답글을 남길 수 있습니다."
            return false
        }
        return true
    }
    canvasVisible(onoff: boolean) {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = (onoff) ? "block" : "none"
    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.m_masterAddr = masterAddr;
        const key = this.getParam("key");
        if (key == null) return false
        //this.canvasVisible(false)
        this.RequestHon(key).then(() => {
            this.drawHtmlUserReply()
            this.RequestHonsReplys(key)
            if (!this.CheckReplyForm()) return false
        })


        const btn = document.getElementById("replyBtn") as HTMLButtonElement
        btn.onclick = () => {
            btn.disabled = true
            this.RequestNewReplyHon(key);
        }
        return true;
    }

    public Release(): void { 
        this.canvasVisible(true)
        this.ReleaseHtml()
    }
}