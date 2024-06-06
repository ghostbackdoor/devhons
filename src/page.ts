
export class Page {
    page?: string
    active: boolean = false
    constructor(protected url: string) {}

    async LoadHtml() {
        this.active = true
        const content = document.querySelector("contents") as HTMLDivElement
        if (this.page != undefined) {
            content.innerHTML = this.page
            return
        }

        return await fetch(this.url)
            .then(response => { return response.text(); })
            .then(data => {
                this.page = data;
                content.innerHTML = this.page
            })
    }
    getParam(k: string): string | null {
        const urlParams = new URLSearchParams(window.location.search);
        const email = encodeURIComponent(urlParams.get(k) ?? "");
        if (email == null || email == "") return null;
        return email;
    }
    ReleaseHtml() {
        this.active = false
        const content = document.querySelector("contents") as HTMLDivElement
        if (content.hasChildNodes()) {
            content.replaceChildren()
        }
    }
}