import { InvenData } from "./meta/inventory/inventory";
import { CitizenEntry, CityEntry, HonEntry, ModelsEntry, ProfileEntry } from "./models/param";
import { GlobalLoadListTx, GlobalLoadTx, HonTxId } from "./models/tx";


export class BlockStore {
    hons = new Map<string, HonEntry>()
    citizeninfo = new Map<string, CitizenEntry>()
    cityinfo = new Map<string, CityEntry>()
    profiles = new Map<string, ProfileEntry>()
    models = new Map<string, ModelsEntry>()
    honviews = new Map<string, string>()
    invens = new Map<string, InvenData>()

    public constructor() { }

    SaveHonView(key: string, html: string) {
        this.honviews.set(key, html)
    }

    LoadHonView(key: string): string | undefined {
        return this.honviews.get(key)
    }
    FetchInventory(masterAddr: string, id: string) {
        const inven = this.invens.get(id)
        if (inven != undefined) {
            return Promise.resolve(inven)
        }
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(GlobalLoadTx) + "&table=inventory&key=" + id;
        return fetch(addr)
            .then((response) => response.json())
            .then((ret) => {
                if ("data" in ret) {
                    const data = JSON.parse(ret.data as string);
                    return data;
                }
                return undefined
            })
    }
    UpdateInventory(data: InvenData, key: string) {
        this.invens.set(key, data)
    }
    GetInventory(key: string) {
        return this.invens.get(key)
    }
    UpdateModels(model: ModelsEntry, key: string) {
        this.models.set(key, model)
    }
    GetModel(key: string): ModelsEntry | undefined{
        return this.models.get(key)
    }
    FetchModels(masterAddr: string): Promise<Map<string, string>>{
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(GlobalLoadListTx) + "&table=meta&start=0&count=20";
        const data = new Map<string, string>()

        return fetch(addr)
            .then((response) => response.json())
            .then((ret) => {
                if ("json" in ret) {
                    const keys = JSON.parse(ret.json as string);
                    return keys;
                }
                throw ""
            })
            .then(async (keys: string[]) => {
                const promise = keys.map(async (key) => {
                    await this.FetchModel(masterAddr, atob(key))
                        .then((model: ModelsEntry) => {
                            data.set(model.id, model.models)
                        })
                })
                return Promise.all(promise)
            })
            .then(() => data)
            .catch(() => data)
    }

    FetchModel(masterAddr: string, key: string): Promise<ModelsEntry>{
        const model = this.models.get(key)
        if (model != undefined) {
            return Promise.resolve(model)
        }
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(GlobalLoadTx) + "&table=meta&key=" + key;

        return fetch(addr)
            .then((response) => response.json())
            .then((model: ModelsEntry) => {
                this.models.set(key, model)
                return model
            })
    }
    FetchCitizenList(masterAddr: string, table: string): Promise<string[]> {
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(GlobalLoadListTx) + "&table=citizen_" + table + "&start=0&count=20";
        const data: string[] = []

        return fetch(addr)
            .then((response) => response.json())
            .then((ret) => {
                if ("json" in ret) {
                    const keys = JSON.parse(ret.json as string);
                    return keys;
                }
                throw ""
            })
            .then(async (keys: string[]) => {
                const promise = keys.map((key) => {
                    const email = atob(key)
                    this.FetchModel(masterAddr, email)
                    data.push(email)
                })
                return Promise.all(promise)
            })
            .then(() => data)
            .catch(() => data)
    }
    FetchCitizen(masterAddr: string, table: string, key: string): Promise<CitizenEntry> {
        const hon = this.citizeninfo.get(key)
        if (hon != undefined) {
            return Promise.resolve(hon)
        }
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(GlobalLoadTx) + "&table=citizen_"+table+"&key=" + key;

        return fetch(addr)
            .then((response) => response.json())
            .then((e: CitizenEntry) => {
                this.citizeninfo.set(key, e)
                return e
            })
    }
    FetchCity(masterAddr: string, key: string): Promise<CityEntry>{
        const hon = this.cityinfo.get(key)
        if (hon != undefined) {
            return Promise.resolve(hon)
        }
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(GlobalLoadTx) + "&table=city&key=" + key;

        return fetch(addr)
            .then((response) => response.json())
            .then((e: CityEntry) => {
                this.cityinfo.set(key, e)
                return e
            })
    }
    FetchHon(masterAddr: string, key: string): Promise<HonEntry>{
        const hon = this.hons.get(key)
        if (hon != undefined) {
            return Promise.resolve(hon)
        }
        const addr = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(HonTxId) + "&table=feeds&key=" + key;

        return fetch(addr)
            .then((response) => response.json())
            .then((hon: HonEntry) => {
                this.hons.set(key, hon)
                return hon
            })
    }
    FetchProfile(masterAddr: string, email: string): Promise<ProfileEntry> {
        const profile = this.profiles.get(email)
        if (profile != undefined) {
            return Promise.resolve(profile)
        }
        const addrProfile = masterAddr + "/glambda?txid=" + 
            encodeURIComponent(HonTxId) + "&table=profile&key=" + email;

        return fetch(addrProfile)
            .then((response) => response.json())
            .then((profile: ProfileEntry) => {
                this.profiles.set(email, profile)
                return profile
            })
    }
}