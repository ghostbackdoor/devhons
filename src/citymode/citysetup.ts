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
    async DrawCitizenList(table: string, citizen: string[]) {
        let html = `<ul class="list-group-flush">`
        if (!citizen.length) {
            html += `
                <li class="list-group-item">시민이 없습니다...</li>
            `
        } else {
            const list = await Promise.all(citizen.map((e) => {
                return this.blockStore.FetchCitizen(this.masterAddr, table, e)
                    .then((e) => {
                        return `
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
            }));
            html += list.join();
        }
        html += "</ul>"
        document.getElementById("setup")?.insertAdjacentHTML("afterend", html)
    }
    async RequestCityInfo(key: string) {
        const citizens = await this.blockStore.FetchCitizenList(this.masterAddr, key)
        const explain = document.getElementById("explain")
        if (explain) explain.innerText = ""
        this.DrawCitizenList(key, citizens)

    }
    public async Run(masterAddr: string): Promise<boolean> {
        await this.LoadHtml()
        this.masterAddr = masterAddr
        const cityKey = this.getParam("city") ?? "ghost"
        this.RequestCityInfo(cityKey)
        return true
    }
    public Release(): void {
        this.ReleaseHtml()
    }
}