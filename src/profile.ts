import { Channel } from "./models/com";
import { Session } from "./session";
import { NewProfileTxId } from "./models/tx";
import { Rout } from "./libs/router";
import { Page } from "./page";
import { StableDiffusionAi } from "./module/sdai";


export class Profile extends Page implements Rout {
    m_masterAddr: string
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
    requestResult(ret: any) {
        if ("result" in ret) {
            console.log(ret)
            window.ClickLoadPage("hondetail", false, `&email=${this.session.UserId}`);
        } else {
            this.printLog(ret)
        }
    }
    uploadImage() {
        if (!this.session.CheckLogin()) {
            this.printLog("need to sign in")
            return
        }
        const user = this.session.GetHonUser();
        const formData = new FormData()
        formData.append("file", this.sdai.Image)
        formData.append("key", user.Email)
        formData.append("email", user.Email)
        formData.append("password", user.Password)
        formData.append("id", user.Nickname)
        formData.append("time", (new Date()).getTime().toString())
        formData.forEach(entry => console.log(entry))
        const addr = window.MasterAddr + "/glambda?txid=" + encodeURIComponent(NewProfileTxId);
        fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then((result) => this.requestResult(result))
    }

    public async Run(): Promise<boolean> {
        await this.LoadHtml()

        if (!this.ipc.IsOpen()) this.ipc.OpenChannel(window.MasterWsAddr + "/ws")
        /*
        const txLink = document.getElementById("txLink") as HTMLElement;
        txLink.innerHTML = `
            <a target="_blank" class="handcursor" href="http://ghostwebservice.com/?pageid=txdetail&txid=${encodeURIComponent(NewProfileTxId)}">
                ${NewProfileTxId}
            </a> `;
            */
        const uploadBtn = document.getElementById("uploadBtn") as HTMLButtonElement
        uploadBtn.onclick = () => this.uploadImage();
        if (!this.session.CheckLogin()) {
            this.printLog("sign in을 해야 변경이 가능합니다.")
        }
        this.sdai.drawhtml()
        return true;
    }

    public Release(): void {
        this.ReleaseHtml()
        this.sdai.release()
    }
}