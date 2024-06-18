import { BlockStore } from "./store";
import { Socket } from "./libs/socket";
import { HonDetail } from "./hondetail";
import { Hons } from "./hons";
import { Hon } from "./hon";
import { NewHon } from "./newhon";
import { Signup } from "./signup";
import { Signin } from "./signin";
import { Session } from "./session";
import { GhostWebUser } from "./models/param";
import { UploadHon } from "./uploadhon";
import { Profile } from "./profile";
import { Router } from "./libs/router";
import { Main } from "./main";
import App from "./meta/app";
import { EditHome } from "./editmode/edithome";
import { Play } from "./playmode/play";
import { UiInven } from "./playmode/play_inven";
import { StableDiffusionAi } from "./module/sdai";
import { NewCity } from "./citymode/newcity";
import { CityMain } from "./citymode/citymain";
import { EditCity } from "./citymode/editcity";
import { UiBrick } from "./module/uibrick";
import { CitySetup } from "./citymode/citysetup";


interface IPage {
    Run(str: string): Promise<boolean>;
    Release(): void;
}

type FuncMap = { [key: string]: IPage };
type UrlMap = { [key: string]: string; };
declare global {
    interface Window {
        ClickLoadPage: (key: string, from: boolean, ...arg: string[]) => void;
        MasterAddr: string;
        MasterWsAddr: string;
        MasterNode: GhostWebUser;
        NodeCount: number;
    }
}

class Index {
    blockStore = new BlockStore();
    session = new Session(this.blockStore);
    meta = new App()
    inven = new UiInven(this.meta, this.session, this.blockStore)
    brick = new UiBrick(this.meta)
    ipc = new Socket
    router = new Router(this.ipc)
    sdai = new StableDiffusionAi(this.ipc)
    newHon = new NewHon(this.sdai, this.session, this.ipc, "views/newhon.html")
    profile = new Profile(this.sdai, this.session, this.ipc, "views/profile.html")

    CurrentPage?: IPage

    urlhtml: UrlMap = {
        "signin": "views/signin.html",
        "signup": "views/signup.html",
        "main": "views/main.html",
        "hons": "views/hons.html",
        "hon": "views/hon.html",
        "hondetail": "views/hondetail.html",
        "newhon": "views/newhon.html",
        "uploadhon": "views/uploadhon.html",
        "profile": "views/profile.html",
        "edithome": "views/editmode/edithome.html",
        "play": "views/play.html",
        "newcity": "views/citymode/newcity.html",
        "citymain": "views/citymode/citymain.html",
        "editcity": "views/citymode/editcity.html",
        "setupcity": "views/citymode/citysetup.html",
    };
    funcMap: FuncMap = {
        "signin": new Signin(this.session, this.urlhtml["signin"]),
        "signup":  new Signup(this.urlhtml["signup"]),
        "hon": new Hon(this.blockStore, this.session, this.urlhtml["hon"]),
        "hons": new Hons(this.blockStore, this.session, this.meta, this.urlhtml["hons"]),
        "hondetail": new HonDetail(this.blockStore, this.session, this.meta, this.urlhtml["hondetail"]),
        "newhon": this.newHon,
        "uploadhon": new UploadHon(this.urlhtml["uploadhon"]),
        "profile": this.profile,
        "main": new Main(this.blockStore, this.urlhtml["main"]),
        "edithome": new EditHome(this.blockStore, this.session, this.meta, this.inven, this.brick, this.urlhtml["edithome"]),
        "play": new Play(this.blockStore, this.session, this.meta, this.inven, this.urlhtml["play"]),
        "newcity": new NewCity(this.session, this.urlhtml["newcity"]),
        "citymain": new CityMain(this.blockStore, this.session, this.meta, this.urlhtml["citymain"]),
        "editcity": new EditCity(this.blockStore, this.session, this.meta, this.inven, this.brick, this.urlhtml["editcity"]),
        "setupcity": new CitySetup(this.blockStore, this.urlhtml["setupcity"]),
    };

    
    beforPage: string = ""
    constructor() {
        this.router.RegisterClient("newhon", this.newHon)
        this.router.RegisterClient("profile", this.profile)

        window.ClickLoadPage = async (key: string, fromEvent: boolean, ...args: string[]) => {
            //if (getPageIdParam() == key) return;
            await this.session.DrawHtmlSessionInfo();

            const state = {
                'url': window.location.href,
                'key': key,
                'fromEvent': fromEvent,
                'args': args
            };
            console.log(`page change : ${this.beforPage} ==> ${key}`)
            this.beforPage = key;

            this.router.Activate(key)
            history.pushState(state, "login", "./?pageid=" + key + args)

            const beforePageObj = this.CurrentPage
            if (beforePageObj != undefined) {
                beforePageObj.Release();
            }

            this.CurrentPage = this.funcMap[key]
            if (this.CurrentPage != undefined) {
                await this.CurrentPage.Run(window.MasterAddr);
            }
        };

        window.onpopstate = () => {
            this.includeContentHTML();
        };
    }

    async includeContentHTML() {
        await this.session.DrawHtmlSessionInfo();
        const key = this.getPageIdParam();
        this.beforPage = key;
        this.router.Activate(key)

        const beforePageObj = this.CurrentPage
        beforePageObj?.Release();

        this.CurrentPage = this.funcMap[key];
        await this.CurrentPage?.Run(window.MasterAddr);
    }

    getPageIdParam() {
        const urlParams = new URLSearchParams(window.location.search);
        const pageid = urlParams.get("pageid");
        const key = (pageid == null) ? "main" : pageid;
        this.beforPage ??= key
        return key;
    }

    parseResponse(nodes: GhostWebUser[]) {
        nodes = nodes.filter(e=> e.User.Nickname !== "Adam" && e.User.Nickname !== "Eve")
        const randIdx = Math.floor(Math.random() * nodes.length);
        window.NodeCount = nodes.length;
        console.log(nodes);
        return nodes[randIdx];
    };

    loadNodesHtml(node: GhostWebUser) {
        window.MasterNode = node;
        window.MasterAddr = `http://${node.User.ip.Ip}:${node.User.ip.Port}`;
        window.MasterWsAddr = `ws://${node.User.ip.Ip}:${node.User.ip.Port}`;
        console.log(node.User.Nickname, window.MasterNode);
        return window.MasterAddr;
    };
    includeHTML(id: string, filename: string) {
        window.addEventListener('load', () => fetch(filename)
            .then(response => { return response.text(); })
            .then(data => { (document.querySelector(id) as HTMLDivElement).innerHTML = data; }));
    }


    errmsg(title: string, content: string): string {
        return `
<div class="container my-3">
    <div class="row division-line">
        <div class="col">
            <h4>Notics</h4>
        </div>
    </div>
    <div class="row">
        <div class="col text-center"> <br>
            <div class="card">
                <div class="card-header"> ${title} </div>
                <div class="card-body"> ${content} </div>
            </div>
</div>
    </div>
</div>
        `;
    }
    Start() {
        const tag = document.getElementById("contents");
        if (tag != null) {
            if (location.protocol != 'http:') {
                tag.innerHTML = this.errmsg(` https 를 지원하지 않습니다.`,
                    `링크를 클릭해주세요. <a href="http://hons.ghostwebservice.com"> <strong class="me-auto">hons.ghostwebservice.com</strong> </a><br>
                    만약 이 메시지가 계속 보인다면 브라우저에서 http 이동을 강제로 차단하고 있을 수 있습니다.`);
            } else {
                addEventListener("load", () =>
                    fetch("http://lb.ghostnetroot.com:58083/nodes")
                        .then((response) => response.json())
                        .then(this.parseResponse)
                        .then(this.loadNodesHtml)
                        .then(() => { this.meta.init() })
                        .then(() => this.includeContentHTML())
                        .catch((err) => {
                            console.log(err)
                            tag.innerHTML = this.errmsg(` Network Down`, ` 사용가능한 Node가 존재하지 않습니다.`);
                        }));
            }
        }
    }
}


const index = new Index()

index.includeHTML("header", "navbar.html");
index.includeHTML("footer", "foot.html");
index.Start()

