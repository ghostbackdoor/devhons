import { CitizenEntry } from "../models/param";
import { Page } from "../page";
import { BlockStore } from "../store";

export class CitySetup extends Page {
    masterAddr = ""

    constructor(
        private blockStore: BlockStore,
        url: string
    ) {
        super(url)
    }
    DrawCitizenList(citizen: CitizenEntry[]) {
        let html = `<ul class="list-group-flush">`
        if (!citizen.length) {
            html += `
                <li class="list-group-item">시민이 없습니다...</li>
            `
        } else {
            citizen.forEach(e => {
                html += `
                <li class="list-group-item">
                    <div class="container-fluid m-0 p-0>
                        <div class="row">
                            <div class="col">${e.nickname}</div>
                            <div class="col-auto">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" role="switch" ${(e.activate) ? "checked" : ""}>
                                    <label class="form-check-label" for="flexSwitchCheckDefault">활성화</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </li> `
            })
        }
        html += "</ul>"
        document.getElementById("setup")?.insertAdjacentHTML("afterbegin", html)
    }
    async RequestCityInfo(key: string) {
        const citizens = await this.blockStore.FetchCitizen(this.masterAddr, key)
        const explain = document.getElementById("explain")
        if(explain) explain.innerText = ""
        this.DrawCitizenList(citizens)
    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.masterAddr = masterAddr
        return true
    }
    public Release(): void {
    }
}