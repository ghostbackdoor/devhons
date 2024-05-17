import { Channel } from "../models/com";
import Cropper from "cropperjs"

const AiMode = {
    Filter: 'Filter',
    Gen: 'Gen'
} as const
type AiMode = typeof AiMode[keyof typeof AiMode]

export class StableDiffusionAi {
    m_model = "toonyou_beta6-f16.gguf"
    m_img = new Blob()
    m_srcImg = new Blob()
    mode: AiMode = AiMode.Filter
    readyprocess = false
    print?: Function

    alarm = document.getElementById("alarm-msg") as HTMLDivElement
    alarmText = document.getElementById("alarm-msg-text") as HTMLDivElement

    get Image() { return this.m_img }
    set Print(print: Function) { this.print = print }

    public constructor(
        private ipc: Channel,
    ) { }
    MsgHandler(msg: string, param: any): void {
        switch (msg) {
            case 'close':
                if (this.print) this.print("server와 연결이 끊겼습니다. 새로고침하세요.")
                break;
            case 'generateLog':
                if (this.mode == AiMode.Filter) {
                    const result = JSON.parse(param.replaceAll('\'', '"'))
                    const step = parseInt(result.step, 10)
                    const steps = parseInt(result.steps, 10)
                    const time = parseFloat(result.time)
                    if (step == 0) {
                        if (this.print) this.print(`시간을 계산중입니다.`)
                    } else if (step == steps) {
                        if (this.print) this.print(`사진을 생성 중입니다.`)
                    } else {
                        if (this.print) this.print(`남은 예상시간: 
                        ${((steps - step) * time).toFixed(2)}s
                        , 진행율: ${(step / steps * 100).toFixed(2)}%`)
                    }
                } else {
                    if (this.print) this.print(param)
                }
                break;
            case 'reply_generateImage':
                const filename: string = param
                fetch(`${window.MasterAddr}/image?filename=${filename}`)
                    .then(response => response.blob())
                    .then(data => {
                        const img = new Blob([data], { type: 'image/bmp' })
                        const imageUrl = URL.createObjectURL(img)
                        const imageElement = new Image()
                        imageElement.src = imageUrl
                        imageElement.className = "img-fluid rounded"
                        const container = document.getElementById("printImg") as HTMLDivElement;
                        container.innerHTML = ""
                        container.appendChild(imageElement)
                        this.m_img = img
                        if (this.print) this.print(`완료`)
                    })
        }
    }
    generateImage() {
        this.mode = AiMode.Gen
        const promptTag = document.getElementById("prompt") as HTMLInputElement;
        const prompt = promptTag.value.toLowerCase();
        const npromptTag = document.getElementById("nprompt") as HTMLInputElement;
        const nprompt = npromptTag.value.toLowerCase();
        const stepTag = document.getElementById("step") as HTMLInputElement;
        const step = (stepTag.value == "") ? "20" : stepTag.value;
        const height = "512"
        const width = "512"
        const seed = "-1"
        const printTag = document.getElementById("printImg") as HTMLDivElement;
        printTag.innerHTML = `
            <div class="spinner-grow text-primary" role="status">
                <span class="visually-hidden"></span>
            </div>
        `;

        const prevent19 = (nprompt == "") ? "nude, naked, nsfw":", nude, naked, nsfw"
        console.log(prompt,"|", nprompt + prevent19, "|",height, "|",width, "|",step, "|",seed)
        this.ipc.SendMsg("generateImage", prompt, nprompt + prevent19, height, width, step, seed);
        if (this.print) this.print(`전송중입니다.`)
    }
    processImage() {
        this.mode = AiMode.Filter
        const promptTag = document.getElementById("fprompt") as HTMLInputElement;
        const prompt = promptTag.value.toLowerCase();
        const npromptTag = document.getElementById("fnprompt") as HTMLInputElement;
        const nprompt = npromptTag.value.toLowerCase();
        const streTag = document.getElementById("strength") as HTMLInputElement;
        const stre = (streTag.value == "") ? "0.5" : streTag.value;
        const height = "512"
        const width = "512"
        const seed = "-1"
        const printTag = document.getElementById("printImg") as HTMLDivElement;
        printTag.innerHTML = `
            <div class="spinner-grow text-primary" role="status">
                <span class="visually-hidden"></span>
            </div>
        `;

        const prevent19 = (nprompt == "") ? "nude, naked, nsfw":", nude, naked, nsfw"
        console.log(prompt,"|", nprompt + prevent19, "|",height, "|",width, "|",stre, "|",seed)
        const samplingMethod = "euler"
        const step = "20"
        const cfgScale = "7"
        const batchCnt = ""
        const schedule = ""
        const clipSkip = "2"
        const vea = ""
        const lora = ""
        const reader = new FileReader()
        reader.readAsDataURL(this.m_srcImg)
        reader.onloadend = () => {
            this.ipc.SendMsg("processImage", prompt, nprompt + prevent19, height, width,
                step, seed, this.m_model, samplingMethod, cfgScale, stre, batchCnt, schedule,
                clipSkip, vea, lora, reader.result);
        }
        if (this.print) this.print(`작업 대기중 입니다.`)
    }
    canvasVisible(onoff: boolean) {
        const canvas = document.getElementById("avatar-bg") as HTMLCanvasElement
        canvas.style.display = (onoff) ? "block" : "none"
    }
    dropmenuVisible = false
    toggleMenu() {
        const dropmenuTag = document.getElementById("modellist") as HTMLButtonElement;
        if (this.dropmenuVisible == false) {
            dropmenuTag.style.display = "block"
            dropmenuTag.style.transform = "translate(0px, 40px)"
        } else {
            dropmenuTag.style.display = "none"
            dropmenuTag.style.transform = "translate(0px, 40px)"
        }
        this.dropmenuVisible = (this.dropmenuVisible) ? false : true
    }
    initFilterUi() {
        const dropTag = document.getElementById("dropdownMenuButton") as HTMLButtonElement;
        dropTag.onclick = () => {
            this.toggleMenu()
        }
        const streTag = document.getElementById("strength") as HTMLProgressElement;
        const streTxtTag = document.getElementById("strength-text") as HTMLInputElement;
        streTag.onchange = () => {
            streTxtTag.value = streTag.value.toString()
        }
        streTxtTag.value = streTag.value.toString()

        const cropTag = document.getElementById("cropimg") as HTMLImageElement;
        let cropper = new Cropper(cropTag)

        const tag = document.getElementById("origin-file") as HTMLInputElement;
        tag.onchange = (e: any) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Blob([new Uint8Array(e.target?.result as ArrayBuffer)], { type: 'image/bmp' })
                const imageUrl = URL.createObjectURL(img)
                cropTag.src = imageUrl
                const scale = cropTag.width / window.innerWidth
                cropTag.height *= scale
                cropper.destroy()
                cropper = new Cropper(cropTag, { 
                    aspectRatio: 1,
                    viewMode: 2,
                })
                console.log(cropper.getCropBoxData())

            }
            reader.readAsArrayBuffer(e.target.files[0])
        }
        const cropBtn = document.getElementById("cropBtn") as HTMLButtonElement;
        cropBtn.onclick = () => {
            this.alarm.style.display = "block"
            this.alarmText.innerText = "이미지 처리중"
            cropper.getCroppedCanvas().toBlob((data) => {
                if (data == null) return
                const imageUrl = URL.createObjectURL(data)
                const imageElement = new Image()
                imageElement.src = imageUrl
                imageElement.onload = () => {
                    const canvas = document.createElement("canvas");
                    canvas.width = canvas.height = 512
                    // var canvas = document.getElementById("canvas");
                    const ctx = canvas.getContext("2d", { alpha: false });
                    // Actual resizing
                    if (ctx == null) return

                    ctx.drawImage(imageElement, 0, 0, 512, 512);
                    // Show resized image in preview element
                    canvas.toBlob((b) => {
                        if (b == null) return
                        this.m_srcImg = b
                        const imageUrl = URL.createObjectURL(b)
                        const cropImageElement = new Image()
                        cropImageElement.src = imageUrl
                        cropImageElement.className = "img-fluid"
                        const container = document.getElementById("result") as HTMLDivElement;
                        container.innerHTML = ""
                        container.appendChild(cropImageElement)
                        this.readyprocess = true
                        this.alarm.style.display = "none"
                    })
                }
            })
        }
        const gbtn = document.getElementById("processBtn") as HTMLButtonElement
        gbtn.onclick = () => {
            if (this.readyprocess) this.processImage()
        }

        this.bindClickEvent("toonyou", 1)
        this.bindClickEvent("disney", 2)
        this.bindClickEvent("child", 4)
    }
    selectModel(n: number) {
        this.toggleMenu()
   
        const btn = document.getElementById("dropdownMenuButton") as HTMLButtonElement
        const resultTag = document.getElementById("result") as HTMLDivElement
        switch (n) {
            case 1:
                btn.innerText = "Animation Style"
                this.m_model = "toonyou_beta6-f16.gguf"
                if (!this.readyprocess) resultTag.innerHTML = `<img src="static/img/comp1.jpg" class="img-fluid rounded">`
                break
            case 2:
                btn.innerText = "Disney Style"
                this.m_model = "disneyPixarCartoon_v10-f16.gguf"
                if (!this.readyprocess) resultTag.innerHTML = `<img src="static/img/comp2.jpg" class="img-fluid rounded">`
                break
            case 3:
                btn.innerText = "Default Style"
                this.m_model = "sd-v1-4-f16.gguf"
                break
            case 4:
                btn.innerText = "Real-Picture Style"
                this.m_model = "chilled_reversemix_v2-f16.gguf"
                if (!this.readyprocess) resultTag.innerHTML = `<img src="static/img/comp3.jpg" class="img-fluid rounded">`
                break
        }
    }
    bindClickEvent(name: string, id: number) {
        const tag = document.getElementById(name) as HTMLAnchorElement
        tag.onclick = () => { this.selectModel(id) }
    }
    drawhtml() {
        fetch("views/sd1.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("sd1") as HTMLDivElement;
                tag.innerHTML = res
            })
            .then(() => {
                const gbtn = document.getElementById("generateBtn") as HTMLButtonElement
                gbtn.onclick = () => {
                    this.generateImage();
                }

            })
        fetch("views/editimg.html")
            .then(response => { return response.text(); })
            .then((res) => {
                const tag = document.getElementById("modalwindow") as HTMLDivElement;
                tag.innerHTML = res
            })
            .then(() => {
                fetch("views/filter.html")
                    .then(response => { return response.text(); })
                    .then((res) => {
                        const tag = document.getElementById("filter") as HTMLDivElement;
                        tag.innerHTML = res
                    })
                    .then(() => {
                        this.initFilterUi()
                    })
            })

    }
    release() {
        this.readyprocess = false
    }
}