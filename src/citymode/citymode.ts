import { FetchResult } from "../models/param";
import { GlobalSaveTxId } from "../models/tx";
import { Page } from "../page";
import { Session } from "../session";

export class CityMode extends Page {
    masterAddr = ""

    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    constructor(
        private session: Session, 
        url: string
    ) {
        super(url)
    }
    warningMsg(msg: string) {
        this.alarm.style.display = "none"
        const info = document.getElementById("information");
        if (info == null) return;
        info.innerHTML = msg;
    }
    newHonResult(ret: FetchResult) {
        console.log(ret);
        this.alarm.style.display = "none"
        if (ret.result == "null") {
            this.warningMsg("등록 실패");
        } else {
            window.ClickLoadPage("hons", false);
        }
    }
    RegisterCity() {
        const user = this.session.GetHonUser();
        const cityTitle = document.getElementById("name") as HTMLInputElement;
        const cityExplain = document.getElementById("explain") as HTMLTextAreaElement;
        const openflag = (document.querySelector('input[name="openFlag"]:checked') as HTMLInputElement).value;
        const addr = this.masterAddr + "/glambda?txid=" + encodeURIComponent(GlobalSaveTxId);

        this.alarm.style.display = "block"
        this.alarmText.innerText = "등록중입니다."
        const formData = new FormData()
        formData.append("key", encodeURIComponent(user.Email))
        formData.append("email", encodeURIComponent(user.Email))
        formData.append("password", user.Password)
        formData.append("id", user.Nickname)
        formData.append("time", (new Date()).getTime().toString())
        formData.append("table", "city")
        formData.append("citytitle", cityTitle.value)
        formData.append("cityexplain", cityExplain.value)
        formData.append("openflag", openflag)
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
    bind() {
        const cityBtn = document.getElementById("cityBtn") as HTMLButtonElement
        cityBtn.onclick = () => {
            if (this.session.CheckLogin()) {
                this.RegisterCity()
            } else {
                this.warningMsg("로그인이 필요합니다.")
            }
        }
    }
    
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        const email = this.getParam("email");
        if(email == null) return false;
        this.masterAddr = masterAddr
        this.bind()
        return true
    }
    public Release(): void { 
        this.ReleaseHtml()
    }
}