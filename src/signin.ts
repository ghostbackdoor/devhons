import { Session, HonUser } from "./session";
import { SHA256 } from "./libs/sha256";
import { SigninTxId } from "./models/tx";
import { Page } from "./page";


export class Signin extends Page {
    m_masterAddr: string;
    m_user: HonUser;

    public constructor(private session: Session, url: string) {
        super(url)
        this.m_user = {Email: "", Nickname:"", Password:""};
        this.m_masterAddr = "";
    }

    warningMsg(msg: string) {
        this.alarmOff()
        const info = document.getElementById("information");
        if (info == null) return;
        info.innerHTML = msg;
    }
    loginResult(ret: any) {
        this.alarmOff()
        if ("email" in ret) {
            this.session.SignIn({ 
                Email: ret.email, Nickname: ret.id, 
                Password: this.m_user.Password });
            window.ClickLoadPage("hondetail", false, `&email=${ret.email}`);
        } else {
            this.warningMsg("ID와 Password가 맞지 않습니다.")
        }
    }
    public RequestSignin() {
        const masterAddr = this.m_masterAddr;
        const inputEmail = document.getElementById("inputEmail") as HTMLInputElement
        const email = inputEmail?.value;
        if (email == "") { this.warningMsg("email is empty") }
        const inputPW = document.getElementById("inputPassword") as HTMLInputElement
        const password = SHA256(inputPW?.value);
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(SigninTxId);
        this.m_user.Email = email;
        this.m_user.Password = password;

        this.alarmOn("로그인중입니다.")
        const formData = new FormData()
        formData.append("key", encodeURIComponent(email))
        formData.append("email", encodeURIComponent(email))
        formData.append("password", password)
        fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then((result) => this.loginResult(result))
            .catch(() => { this.warningMsg("Server에 문제가 생긴듯 합니다;;") });
    }


    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.m_masterAddr = masterAddr;
        const btn = document.getElementById("signinBtn") as HTMLButtonElement
        btn.onclick = () => this.RequestSignin();

        return true;
    }

    public Release(): void {
        this.ReleaseHtml()
    }
}
