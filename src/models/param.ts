
export type BlockInfoParam = {
    IssuedCoin: number
}

export type AccountParam = {
    Nickname: string,
    PubKey: string,
    Coin: number
}

export type TxInfoParam = {
    BlockId: number,
}

export type GhostIp = {
    Ip: string,
    Port: string
}

export type GhostNetUser = {
    MasterPubKey: string,
    PubKey: string,
    Nickname: string,
    ip: GhostIp,
}

export type GhostWebUser = {
    User: GhostNetUser,
    WebPort: string,
}
export type FetchResult = {
    result: string
}
export type JsonFetchResult = {
    json: string
}
export type CityEntry = {
    email: string,
    id: string,
    citytitle: string,
    openflag: string,
    cityexplain: string,
    time: number,
}
export type HonEntry = {
    email: string,
    id: string,
    content: string,
    time: number,
    file: string,
    tag: string
}
export type ProfileEntry = {
    email: string,
    id: string,
    password: string,
    time: number,
    file: string,
}

export type ModelsEntry = {
    email: string,
    key: string,
    id: string,
    password: string,
    time: number,
    models: string,
}