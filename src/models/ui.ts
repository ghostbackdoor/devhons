import App, { AppMode } from "../meta/app"
import { gsap } from "gsap"

export class Ui {
    profileVisible = true

    constructor(private meta: App, private from: AppMode) {
    }
    Init() {
    }
    UiOff(to: AppMode) {
        const wrapper = document.getElementById("wrapper-profile") as HTMLDivElement
        const header = document.getElementById("navibar") as HTMLDivElement
        const footer = document.getElementById("footer") as HTMLDivElement
        const health = document.getElementById("health") as HTMLDivElement
        const inven = document.getElementById("invenBtn") as HTMLDivElement
        if (inven) inven.style.display = "block"
        if (health) health.style.display = "block"

        if (wrapper) wrapper.style.display = "none"
        footer.style.display = "none"
        header.style.display = "none"
        this.meta.ModeChange(to)
        this.profileVisible = false

        const fullscreen = document.getElementById("fullscreen") as HTMLSpanElement
        const isMobile = /iPone|iPad|iPod|Android/i.test(window.navigator.userAgent)
        if (isMobile && fullscreen) {
            fullscreen.innerText = "fullscreen_exit"
            document.documentElement.requestFullscreen().catch(err => {
                console.log(err)
                fullscreen.innerText = "fullscreen"
            })
        }
    }
    UiOn() {
        const wrapper = document.getElementById("wrapper-profile") as HTMLDivElement
        const header = document.getElementById("navibar") as HTMLDivElement
        const footer = document.getElementById("footer") as HTMLDivElement
        const health = document.getElementById("health") as HTMLDivElement
        const inven = document.getElementById("invenBtn") as HTMLDivElement
        if (inven) inven.style.display = "none"
        if (health) health.style.display = "none"

        if (wrapper) {
            wrapper.style.display = "block"
            wrapper.style.opacity = "0"
            gsap.to(wrapper, {
                duration: 2, autoAlpha: 1, delay: 1
            })
            footer.style.display = "block"
            footer.style.opacity = "0"
            gsap.to(footer, {
                duration: 2, autoAlpha: 1, delay: 1
            })
        }
        header.style.display = "block"
        this.meta.ModeChange(this.from, false)
        this.profileVisible = true
    }

    VisibleUi(from: AppMode, to: AppMode) {
        const wrapper = document.getElementById("wrapper-profile") as HTMLDivElement
        const header = document.getElementById("navibar") as HTMLDivElement
        const footer = document.getElementById("footer") as HTMLDivElement
        const health = document.getElementById("health") as HTMLDivElement
        const inven = document.getElementById("invenBtn") as HTMLDivElement
        if (this.profileVisible) {
            wrapper.style.display = "none"
            footer.style.display = "none"
            header.style.display = "none"
            this.meta.ModeChange(to)
            if (health) health.style.display = "block"
            if (inven) inven.style.display = "block"
            this.profileVisible = false
        } else {
            wrapper.style.display = "block"
            footer.style.display = "block"
            header.style.display = "block"
            this.meta.ModeChange(from, false)
            if (health) health.style.display = "none"
            if (inven) inven.style.display = "none"
            this.profileVisible = true
        }
    }
}
