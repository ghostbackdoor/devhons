import { FetchResult } from "./models/param";
import { SHA256 } from "./libs/sha256";
import { SignupTxId } from "./models/tx";
import { Page } from "./page";


export class Signup extends Page {
    m_masterAddr: string;
    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    public constructor(url: string) {
        super(url)
        this.m_masterAddr = "";
    }

    warningMsg(msg: string) {
        this.alarm.style.display = "none"
        const info = document.getElementById("information");
        if (info == null) return;
        info.innerHTML = msg;
    }
    signupResult(ret: FetchResult) {
        console.log(ret);
        this.alarm.style.display = "none"
        if (ret.result == "null") {
            this.warningMsg("Signup 실패");
        } else if ("result" in ret){
            this.warningMsg(ret.result);
        } else {
            window.ClickLoadPage("signin", false);
        }
    }

    public RequestSignup() {
        const masterAddr = this.m_masterAddr;
        const inputEmail = document.getElementById("inputEmail") as HTMLInputElement
        const email = inputEmail?.value;
        if (email == "") { this.warningMsg("email is empty") }
        const inputPW = document.getElementById("inputPassword") as HTMLInputElement
        const password = SHA256(inputPW?.value);
        const inputId = document.getElementById("inputId") as HTMLInputElement
        const id = inputId?.value;
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(SignupTxId);

        this.alarm.style.display = "block"
        this.alarmText.innerText = "등록중입니다."

        const formData = new FormData()
        formData.append("key", encodeURIComponent(email))
        formData.append("email", encodeURIComponent(email))
        formData.append("password", password)
        formData.append("id", id)
        fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then((result) => this.signupResult(result))
            .catch(() => { this.warningMsg("Server에 문제가 생긴듯 합니다;;") });
    }

    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.m_masterAddr = masterAddr;
        const txLink = document.getElementById("txLink") as HTMLElement;
        txLink.innerHTML = `
            <a class="handcursor" href="http://ghostwebservice.com/?pageid=txdetail&txid=${encodeURIComponent(SignupTxId)}">
                gLambda Code 보기
            </a> `;
        const btn = document.getElementById("signupBtn") as HTMLButtonElement
        btn.onclick = () => this.RequestSignup();
        return true;
    }

    public Release(): void { 
        this.ReleaseHtml()
    }
}
