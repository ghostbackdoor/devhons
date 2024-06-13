
export interface IScene {
    play(): void
}

export interface IViewer {
    resize?(width: number, height: number): void
    update(delta: number): void
}