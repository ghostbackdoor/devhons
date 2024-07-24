import App from "../meta/app";
import { Inventory } from "../meta/inventory/inventory";
import { DeckId, DeckType } from "../meta/inventory/items/deck";
import { IItem, ItemType } from "../meta/inventory/items/item";
import { DeckMsg } from "../meta/scenes/mondeck";

export type DeckSetup = {
    deck: DeckType
    randomLoc: boolean
    location: THREE.Vector3[]
}

export class EditGame {
    inven?: Inventory
    onoff = false
    deckItem: IItem[] = []
    viewDeck?: DeckId

    constructor(private meta: App) { 
    }

    async LoadHtml() {
        const response = await fetch("views/editmode/editgame.html");
        const res = await response.text();
        const ex = document.getElementById("extension") as HTMLDivElement;
        ex.insertAdjacentHTML("beforeend", res);
        const dom = document.getElementById("cardlocation") as HTMLDivElement;
        dom.style.display = "none";
    }
    OnOff(on: boolean, inven: Inventory | undefined) {
        if(!inven) return

        const dom = document.getElementById("gamectrl") as HTMLDivElement
        if (dom) dom.style.display = (on) ? "block" : "none"

        this.inven = inven
        if(on) {
            this.loadDeck()
        }
    }
    loadDeck() {
        if(!this.inven) return
        this.deckItem.length = 0

        this.inven.data.inventroySlot.forEach((slot) => {
            if (slot.item.ItemType == ItemType.Deck) {
                this.deckItem.push(slot.item)
            }
        })
        let html = ''
        this.deckItem.forEach((deck, idx) => {
            html += `
    <div class="row handcursor" id="deck-${idx}">
        <div class="col-auto ms-1 me-0 pb-1">
            <div class="rounded inven_slot p-1">
                <img src="assets/icons/${deck.IconPath}">
            </div>
        </div>
        <div class="col p-1 me-3 text-start"> ${deck.Name}</div>
        </div>
    </div>
            `
        })
        if (html == '') html = `
    <div class="row">
        <div class="col ms-1 me-0 pb-1 text-center">
        Deck이 없습니다.
        </div>
    </div>
        `
        const dom = document.getElementById("decklist") as HTMLDivElement
        dom.innerHTML = html

        this.deckItem.forEach((deck, idx) => {
            const dom = document.getElementById("deck-" + idx) as HTMLDivElement
            dom.onclick = () => {
                if (!this.viewDeck || this.viewDeck != deck.Deck?.id) {
                    this.viewDeck = deck.Deck?.id
                    this.loadDeckProfile(deck.Deck)
                } else {
                    this.viewDeck = undefined
                    const dom = document.getElementById("deckprofile") as HTMLDivElement
                    dom.replaceChildren()
                } 
            }
        })
    }
    loadDeckProfile(deck: DeckType | undefined) {
        if (deck == undefined) { throw new Error("unexpected undeined value"); }
        const html = `
        <div class="container rounded border" style="background-image: url('static/img/card_pattern.png');">
        <div class="row">
            <div class="col p-2"><b>${deck.title}</b></div>
        </div>
        <div class="row">
            <div class="col text-start rounded border bg-white p-1 m-2 w-100" style="all:initial">
                <p class="text-start">${deck.contents}</p>
                <p class="text-start m-0">
                    Level: ${deck.maxLv} <br>
                    소환 가능 시간: ${deck.minTime} ~ ${deck.maxTime} 분 <br>
                    소환 가능 유닛: ${deck.maxSpawn}
                </p>
            </div>
        </div>
        </div>
        `
        const dom = document.getElementById("deckprofile") as HTMLDivElement
        dom.innerHTML = html
        this.location(dom, deck)
    }
    location(dom: HTMLElement, deck: DeckType) {
        const deckinfo = this.meta.GetDeckInfo()
        const deckEndty = deckinfo.find((e) => e.id == deck.id)
        const html = `
        <div class="input-group mt-1 mb-1">
        <button class="btn btn-light" type="button" id="locationbtn">소환위치</button>
        <select id="decklocation" class="form-select" aria-label="Default select example">
            <option value="0" ${(deckEndty?.rand) ? "selected" : ""}>Random</option>
            <option value="1" ${(deckEndty?.rand) ? "" : "selected"}>위치지정</option>
        </select>
        </div>
        <div class="input-group mb-1">
            <button class="btn btn-light" id="basic-addon1">소환시기</button>
            <input type="text" class="form-control" id="decktime" placeholder="0" 
            aria-label="decktime" aria-describedby="basic-addon1" value="${deckEndty?.time}">
        </div>
        <div class="form-check form-switch text-start">
            <input class="form-check-input" type="checkbox" role="switch" id="deckenable" ${(deckEndty?.enable) ? "checked" : ""}>
            <label class="form-check-label">카드 사용</label>
        </div>
        <div class="input-group mb-1 text-end">
            <button class="btn btn-light" type="button" id="decksubmit">적용</button>
        </div>
        `
        dom.insertAdjacentHTML("beforeend", html)

        const submit = document.getElementById("decksubmit")
        if(submit) submit.onclick = () => {
            this.changeSetup(deck)
        }

        const decklocation = document.getElementById("decklocation") as HTMLSelectElement
        if (decklocation) {
            decklocation.onchange = () => {
                this.deckLocationChangeEvent(decklocation, deck)
            }
            const locationbtn = document.getElementById("locationbtn")
            if(locationbtn) locationbtn.onclick = () => {
                this.deckLocationChangeEvent(decklocation, deck)
            }
        }
    }
    deckLocationChangeEvent(dom: HTMLSelectElement, deck: DeckType) {
        switch (dom.value) {
                case "1":
                    this.locator(deck)
                    break;
                default:
                    this.changeSetup(deck)
                    break
            }
    }
    changeSetup(deck: DeckType) {
        const decklocation = document.getElementById("decklocation") as HTMLSelectElement
        const timeDom = document.getElementById("decktime") as HTMLInputElement
        const checkDom = document.getElementById("deckenable") as HTMLInputElement

        const rand = decklocation.value != "1"
        const time = timeDom.value

        const deckMsg: DeckMsg = {
            id: deck.id,
            time: Number(time),
            locatOnOff: false,
            rand: rand,
            enable: checkDom.checked
        }
        this.meta.SendModeMessage(deckMsg)

    }
    locator(deck: DeckType) {

        const gamedom = document.getElementById("gamectrl") as HTMLDivElement
        if(gamedom) gamedom.style.display = "none"
        const dom = document.getElementById("cardlocation") as HTMLDivElement
        if (dom) dom.style.display = "block"
        const timeDom = document.getElementById("decktime") as HTMLInputElement
        const time = timeDom.value
        const checkDom = document.getElementById("deckenable") as HTMLInputElement

        const deckMsg: DeckMsg = {
            id: deck.id,
            time: Number(time),
            locatOnOff: true,
            rand: false,
            enable: checkDom.checked
        }
        this.meta.SendModeMessage(deckMsg)

        const cardLocationExit = document.getElementById("cardlocationexit") as HTMLDivElement
        if (cardLocationExit) cardLocationExit.onclick = () => {
            gamedom.style.display = "block"
            dom.style.display = "none"
            const deckMsg: DeckMsg = {
                id: deck.id,
                time: Number(time),
                locatOnOff: false,
                rand: false,
                enable: checkDom.checked
            }
            this.meta.SendModeMessage(deckMsg)
        }
    }
}