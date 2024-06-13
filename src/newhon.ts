import { FetchResult } from "./models/param";
import { Session } from "./session";
import { NewHonTxId } from "./models/tx";
import { Channel } from "./models/com";
import { Page } from "./page";
import { StableDiffusionAi } from "./module/sdai";

export class NewHon extends Page{
    m_masterAddr: string;

    public constructor(
        private sdai: StableDiffusionAi,
        private session: Session, 
        private ipc: Channel, 
        url: string
    ) {
        super(url)
        this.sdai.Print = this.printLog
        this.m_masterAddr = "";
    }
    MsgHandler(msg: string, param: any): void {
        this.sdai.MsgHandler(msg, param)
    }

    printLog(msg: string) {
        const printTag = document.getElementById("log") as HTMLDivElement;
        printTag.innerHTML = `
                ${msg}
            `;
    }
    warningMsg(msg: string) {
        this.alarmOff()
        const info = document.getElementById("information");
        if (info == null) return;
        info.innerHTML = msg;
    }
    newHonResult(ret: FetchResult) {
        console.log(ret);
        this.alarmOff()
        if (ret.result == "null") {
            this.warningMsg("등록 실패");
        } else {
            window.ClickLoadPage("hons", false);
        }
    }
    public RequestNewHon() {
        const masterAddr = this.m_masterAddr;
        const user = this.session.GetHonUser();
        const inputContent = document.getElementById("inputContent") as HTMLTextAreaElement;
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(NewHonTxId);

        this.alarmOn("등록중입니다.")
        const threadTag = document.getElementById("thread") as HTMLInputElement
        const tag = "#" + ((threadTag.value == "") ? "daliy log" : threadTag.value.replace("#", ""))
        const formData = new FormData()
        formData.append("file", this.sdai.Image)
        formData.append("key", encodeURIComponent(user.Email))
        formData.append("email", encodeURIComponent(user.Email))
        formData.append("password", user.Password)
        formData.append("id", user.Nickname)
        formData.append("time", (new Date()).getTime().toString())
        formData.append("table", "feeds")
        formData.append("tag", btoa(encodeURIComponent(tag)))
        console.log("register tag", tag)
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
    
    getParam(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        const tag = decodeURIComponent(atob(urlParams.get("tag") ?? "")).replace("#", "")
        if (tag == "") return null;
        return tag;
    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        window.scrollTo(0, 0)

        const btn = document.getElementById("feedBtn") as HTMLButtonElement
        if (!this.session.CheckLogin()) {
            btn.innerText = "체험만 가능 (Login 후 등록할 수 있습니다.)"
            btn.disabled = true
        } else {
            btn.onclick = () => {
                btn.disabled = true
                this.RequestNewHon();
            }
        }
        const cont = document.getElementById("inputContent") as HTMLTextAreaElement;
        cont.onfocus = () => { if (cont.value == "Enter text") cont.value = ''; };

        if (!this.ipc.IsOpen()) this.ipc.OpenChannel(window.MasterWsAddr + "/ws")
        this.m_masterAddr = masterAddr;
        //this.canvasVisible(false)
        const threadTag = document.getElementById("thread") as HTMLInputElement
        threadTag.value = this.getParam() ?? ""

        this.sdai.drawhtml()
       
        return true;
    }

    public Release(): void {
        this.ReleaseHtml()
        //this.canvasVisible(true)
        this.sdai.release()
    }
}
