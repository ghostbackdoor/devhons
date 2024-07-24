
export type MenuParam = {
    id: string
    title: string
    child?: MenuParam[]
}
export type ItemParam = {
    tabId: string
    itemList: string[]
}

export class TabList {
    itemHtml = ""
    menuHtml = ""

    MakeTabMenu(menuList: MenuParam[]) {
        let firstHtml = ``
        menuList.forEach((menu, i) => {
            let secondHtml = ""
            menu.child?.forEach((item, j) => {
                secondHtml += `
        <li><a class="dropdown-item ${(i == 0 && j == 0) ? "active" : ""}" id="pills-${item.id}-tab" data-bs-toggle="pill" data-bs-target="#${item.id}"
        aria-controls="${item.id}" aria-selected="${(i == 0 && j == 0) ? "true" : "false"}">${item.title}</a>
        </li> `
            })

            firstHtml += `
<li class="nav-item dropdown" role="presentation">
    <button class="nav-link ${(i == 0) ? "active" : ""} dropdown-toggle" type="button" data-bs-toggle="dropdown"
        data-bs-target="#${menu.id}" aria-controls="${menu.id}" aria-expanded="false" role="tab"
        aria-selected="${(i == 0) ? "true" : "false"}">${menu.title}</button>
    <ul class="dropdown-menu">
            ${secondHtml}
    </ul>
</li>
            `
        })
        this.menuHtml = `
        <ul class="nav nav-pills nav-fill mb-3" id="pills-tab" role="tablist">
        ${firstHtml}
        </ul> `
        return this.menuHtml
    }
    MakeTabItem(param: ItemParam, pageViewCnt: number = 5) {
        const tabId = param.tabId
        const itemList = param.itemList
        const pageCnt = Math.ceil(itemList.length / pageViewCnt)
        let btnHtml = ""
        let sideBtn = `` 

        if (pageCnt > 1) {
            for (let i = 0; i < pageCnt; i++) {
                btnHtml += `<button type="button" data-bs-target="#carousel-${tabId}" 
            data-bs-slide-to="${i}" ${(i == 0) ? 'class="active"' : ''}
            aria-current="true" aria-label="Slide ${i + 1}"></button> `
            }
            sideBtn = `
    <button class="carousel-control-prev" type="button" data-bs-target="#carousel-${tabId}"
        data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#carousel-${tabId}"
        data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
    </button>
            `
        }

        let viewHtml = ""
        for (let i = 0; i < pageCnt; i++) {
            viewHtml += `
        <div class="carousel-item ${(i == 0) ? 'active' : ''}">`
            for (let j = 0; j < pageViewCnt; j++) {
                const cnt = j + i * pageViewCnt
                if (itemList[cnt]) viewHtml += itemList[cnt]
                else break
            }
            viewHtml += `
        </div>
            `
        }
        this.itemHtml = `
<div class="tab-pane fade show p-0 ${(!this.itemHtml.length) ? "active" : ""}" id="${tabId}" role="tabpanel" aria-labelledby="pills-${tabId}-tab" tabindex="0">
<div id="carousel-${tabId}" class="carousel carousel-white slide">
    <div class="carousel-indicators">
        ${btnHtml}
    </div>
    <div class="carousel-inner ps-3 pe-3 pb-4">
        ${viewHtml}
    </div>
    ${sideBtn}
</div>
</div>
        `
        return this.itemHtml
    }
}