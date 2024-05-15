import App, { AppMode } from "./meta/app";
import { InvenData } from "./meta/inventory/inventory";
import { ItemId } from "./meta/inventory/items/itemdb";
import { PlayerStatus } from "./meta/scenes/player/playerctrl";
import { Ui } from "./models/ui";
import { Page } from "./page";
import { UiInven } from "./play_inven";
import { Session } from "./session";
import { BlockStore } from "./store";
import { GlobalSaveTxId } from "./models/tx";
import { IBuffItem } from "./meta/buff/buff";


export class Play extends Page {
    m_masterAddr: string = ""
    ui = new Ui(this.meta, AppMode.Play)

    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    defaultLv = 1

    constructor(
        private blockStore: BlockStore,
        private session: Session, 
        private meta: App, 
        private inven: UiInven,
        url: string
    ) {
        super(url)
    }

    startPlay() {
        const lvView = document.getElementById("levelview") as HTMLDivElement
        lvView.replaceChildren()

        let htmlString = `
        <div class="row pb-2">
            <div class="col xxx-large text-white text-center h2">Game Tips</div>
        </div>
        <div class="row p-2">
            <div class="col-auto text-white text-weight-bold">게임 유형</div>
            <div class="col text-white text-start">Random</div>
        </div>
        <div class="row p-2">
            <div class="col text-white text-start">인벤토리의 아이템은 비워진채 시작합니다. 수집한 아이템을 저장하기 위해서는 포탈에서 종료 해야합니다. 
            포탈을 통해 탈출 해야합니다.</div>
        </div>
        <div class="row p-2">
            <div class="col text-white">
                <div class="border rounded bg-secondary p-2 d-inline-block">space</div> or
                <span class="material-symbols-outlined align-middle">
                close
                </span> = 점프
            </div>
            <div class="col text-white">
                <div class="border rounded bg-secondary p-2 d-inline-block ps-3 pe-3">1</div> or
                <span class="material-symbols-outlined align-middle">
                circle
                </span> = 액션 1
            </div>
            <div class="col text-white">
                <div class="border rounded bg-secondary p-2 d-inline-block ps-3 pe-3">2</div> or
                <span class="material-symbols-outlined align-middle">
                square
                </span> = 액션 2
            </div>
        </div>
        <div class="row p-2">
            <div class="col text-white text-center">
            <button type="button" class="btn btn-primary" id="startBtn">시작하기</button>
            </div>
        </div>

        `
        lvView.innerHTML = htmlString

        const lvTag = document.getElementById("levelup") as HTMLDivElement
        lvTag.style.display = "block"
        const startBtn = document.getElementById("startBtn") as HTMLButtonElement
        startBtn.onclick = () => {
            this.meta.Setup({
                OnEnd: () => { },
                OnSaveInven: (data: InvenData) => {
                    if (!this.session.CheckLogin() || data.inventroySlot.length < 1) return

                    const json = this.meta.store.StoreInventory()
                    this.SaveInventory(data, json)
                }
            })
            lvTag.style.display = "none"
            this.ui.UiOff(AppMode.Play)
            this.LevelUp()
        }
    }

    public CanvasRenderer(email: string | null) {
        const myModel = this.blockStore.GetModel(this.session.UserId)
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = "block"
        this.meta.RegisterInitEvent((inited: Boolean) => {
                this.blockStore.FetchInventory(this.m_masterAddr, this.session.UserId)
                    .then((inven: InvenData | undefined) => {
                        console.log(inven)
                        this.meta.store.LoadInventory(inven)
                        this.inven.LoadInven(this.meta.store.GetEmptyInventory())
                        this.inven.loadSlot()
                    })
                if (email == null) {
                    this.blockStore.FetchModels(this.m_masterAddr)
                        .then(async (result) => {
                            await this.meta.LoadVillage(result, myModel?.models)
                            this.startPlay()
                        })
                } else {
                    if(!inited) {
                        this.startPlay()
                        return
                    }
                    this.alarm.style.display = "block"
                    this.alarmText.innerHTML = "이동중입니다."

                    this.blockStore.FetchModel(this.m_masterAddr, email)
                        .then(async (result) => {
                            await this.meta.LoadModel(result.models, result.id, myModel?.models)
                            this.alarm.style.display = "none"
                            this.startPlay()
                        })
                        .catch(async () => {
                            this.alarm.style.display = "none"
                            await this.meta.LoadModelEmpty(email, myModel?.models)
                            this.startPlay()
                        })
                }
                this.meta.render()
            })

        this.meta.RegisterChangePlayerStatusEvent((status: PlayerStatus) => {
            const hpBar = document.getElementById("hp-bar") as HTMLProgressElement
            const spBar = document.getElementById("special-bar") as HTMLProgressElement
            const expBar = document.getElementById("exp-bar") as HTMLProgressElement
            const lv = document.getElementById("level") as HTMLDivElement
            if (!hpBar) return
            hpBar.value = status.health / status.maxHealth * 100
            spBar.value = status.mana / status.maxMana * 100
            expBar.value = status.exp / status.maxExp * 100
            lv.innerText = "Lv." + status.level
            if (status.level > this.defaultLv) {
                this.defaultLv = status.level
                this.LevelUp()
            }
        })
    }
    FirstLevelUp() {
        const lvView = document.getElementById("levelview") as HTMLDivElement
        lvView.replaceChildren()
        let htmlString = `
        <div class="row pb-2">
            <div class="col xxx-large text-white text-center h2">무기를 선택하세요!</div>
        </div>
        `
        const i = 0
        const items = [this.inven.inven?.GetItemInfo(ItemId.Hanhwasbat)]

        items.forEach((item) => {
            htmlString += `
        <div class="row p-2 handcursor" id="buff_${i}">
            <div class="col-auto"><img src="assets/icons/${item?.icon}" style="width: 45px;"></div>
            <div class="col text-white">${item?.name}</div>
        </div>
            `
        })
        lvView.innerHTML = htmlString

        const lvTag = document.getElementById("levelup") as HTMLDivElement
        lvTag.style.display = "block"

        items.forEach((_b, i) => {
            const buff = document.getElementById("buff_" + i) as HTMLDivElement
            buff.onclick = async () => {
                if(this.inven.inven == undefined) return
                const item = await this.inven.inven?.NewItem(ItemId.Hanhwasbat)
                if(item == undefined) throw new Error("inventory is full");
                
                this.inven.equipmentItem(item)
                const lvTag = document.getElementById("levelup") as HTMLDivElement
                lvTag.style.display = "none"
            }
        })
    }
    buffQ: IBuffItem[][] = []
    LevelUp() {
        if(this.defaultLv == 1) {
            this.FirstLevelUp()
            return
        }
        const buffs = this.meta.GetRandomBuff()
        this.buffQ.push(buffs)
        if(this.buffQ.length > 1) return

        this.SelectBuff(buffs)
    }
    SelectBuff(buffs: IBuffItem[]) {
        const lvView = document.getElementById("levelview") as HTMLDivElement
        lvView.replaceChildren()
        let htmlString = `
        <div class="row pb-2">
            <div class="col xxx-large text-white text-center h2">Level Up!!</div>
        </div>
        `
        buffs.forEach((b, i) => {
            htmlString += `
        <div class="row p-2 handcursor" id="buff_${i}">
            <div class="col-auto"><img src="assets/icons/${b.icon}" style="width: 45px;"></div>
            <div class="col text-white">${b.name}<br>${(b.lv == 0) ? "신규" : "Lv." + (b.lv + 1)}: ${b.explain}</div>
        </div>
            `
        })
        lvView.innerHTML = htmlString

        const lvTag = document.getElementById("levelup") as HTMLDivElement
        lvTag.style.display = "block"

        buffs.forEach((b, i) => {
            const buff = document.getElementById("buff_" + i) as HTMLDivElement
            buff.onclick = () => {
                this.meta.SelectRandomBuff(b)
                const lvTag = document.getElementById("levelup") as HTMLDivElement
                lvTag.style.display = "none"
                this.buffQ.shift()
                if (this.buffQ.length) {
                    const buffs = this.buffQ[0]
                    if (buffs == undefined) return
                    this.SelectBuff(buffs)
                }
            }
        })
    }
    public SaveInventory(data: InvenData, json: string) {
        const masterAddr = this.m_masterAddr;
        const user = this.session.GetHonUser();
        const addr = masterAddr + "/glambda?txid=" + encodeURIComponent(GlobalSaveTxId);

        const formData = new FormData()
        formData.append("key", encodeURIComponent(user.Email))
        formData.append("email", encodeURIComponent(user.Email))
        formData.append("id", user.Nickname)
        formData.append("password", user.Password)
        formData.append("data", json)
        const time = (new Date()).getTime()
        formData.append("date", time.toString())
        formData.append("table", "inventory")
        fetch(addr, {
            method: "POST",
            cache: "no-cache",
            headers: {},
            body: formData
        })
            .then((response) => response.json())
            .then((ret) => {
                console.log(ret)
                this.blockStore.UpdateInventory(data, user.Email)
                this.alarm.style.display = "none"
            })
    }
    
    getParam(): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        const email = encodeURIComponent(urlParams.get("email") ?? "");
        if (email == "") return null;
        return email;
    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.m_masterAddr = masterAddr;
        const email = this.getParam();
        this.CanvasRenderer(email)
        this.inven.binding()

        return true;
    }

    public Release(): void {
        this.defaultLv = 1
        this.ReleaseHtml()
    }
}