import { FlameSphere } from "../object/flameSphere";
import { Controller } from "../controller";
import { Utils } from "../flame";

class FlameAnimation {

  private static STATE_BEFORE_START: number = 0;
  private static STATE_SPAWN: number = 1;
  private static STATE_SPAWN_DOWN: number = 2;
  private static STATE_FLOATING: number = 3;
  private static STATE_IDLE: number = 4;

  private static BEFORE_INTERVAL: number = 300;
  private static SPAWN_INTERVAL: number = 400;
  private static SPAWN_DOWN_INTERVAL: number = 2000;
  private static FLOATING_INTERVAL: number = 8000;
  private static IDLE_INTERVAL: number = 20000;

  public distX: number;
  public distZ: number;
  public yRatio: number;
  public animationTimeRatio: number;

  private currentTime = 0;
  private timeCount = 0;
  //private spawnTime = 0;
  private isObjDie = false;
  private isInPooling = false;
  private colorTransitionRandom = 0;

  private currentState = FlameAnimation.STATE_IDLE;
  private posX = 0;
  private posY = 0;
  //private posZ = 0;

  private randFlyX = 0;
  private randFlyZ = 0;

  constructor(
    private ctrl: Controller,
    public instance: FlameSphere, distX?: number, distZ?: number, yRatio?: number, animationTimeRatio?: number
  ) {

    distX = distX || 0;
    distZ = distZ || 0;
    yRatio = yRatio || 1;
    animationTimeRatio = animationTimeRatio || 1;

    this.instance = instance;
    this.distX = distX;
    this.distZ = distZ;
    this.yRatio = yRatio;
    this.animationTimeRatio = animationTimeRatio;

    this.reset();
  }

  public reset() {

    this.randFlyX = Math.random() * 0.1 - 0.05;
    this.randFlyZ = Math.random() * 0.1 - 0.05;

    this.posX = -1;
    this.currentTime = 0;
    this.timeCount = 0;
    //this.spawnTime = 0;
    this.isObjDie = false;
    this.isInPooling = false;
    this.currentState = FlameAnimation.STATE_BEFORE_START;

    this.colorTransitionRandom = Math.random() * 2000 - 1000;

    this.instance.getMesh().position.set(0, 0, 0);
    this.instance.getMesh().scale.set(0, 0, 0);
    this.instance.setFlowRatio(1);
    this.instance.setOpacity(1);
  }

  private setColor() {
    let params = this.ctrl.getParams();

    let tc = this.timeCount + this.colorTransitionRandom;

    if (tc < 2500 + this.colorTransitionRandom) {
      //let t = tc / 2500 + this.colorTransitionRandom;
      this.instance.setColor({
        colDark: params.NormalColor,
        colNormal: params.LightColor,
        colLight: params.LightColor2
      });
    } else if (tc < 4000) {
      let t = (tc - 2500) / 1500;
      this.instance.setColor({
        colDark: Utils.vec3Blend(params.NormalColor, params.DarkColor2, t),
        colNormal: Utils.vec3Blend(params.LightColor, params.NormalColor, t),
        colLight: Utils.vec3Blend(params.LightColor2, params.LightColor, t)
      });
    } else if (tc < 7000) {
      let t = (tc - 4000) / 3000;
      this.instance.setColor({
        colDark: Utils.vec3Blend(params.DarkColor2, params.DarkColor2, t),
        colNormal: Utils.vec3Blend(params.NormalColor, params.NormalColor, t),
        colLight: Utils.vec3Blend(params.LightColor, params.LightColor, t)
      });

    } else if (tc < 12000) {
      let t = Math.min(1, (tc - 7000) / 5000);
      this.instance.setColor({
        colDark: Utils.vec3Blend(params.DarkColor2, params.DarkColor, t),
        colNormal: Utils.vec3Blend(params.NormalColor, params.DarkColor2, t),
        colLight: Utils.vec3Blend(params.LightColor, params.NormalColor, t)
      });
    } else if (tc < 17000) {
      let t = Math.min(1, (tc - 12000) / 5000);
      this.instance.setColor({
        colDark: Utils.vec3Blend(params.DarkColor, params.DarkColor, t),
        colNormal: Utils.vec3Blend(params.DarkColor2, params.DarkColor, t),
        colLight: Utils.vec3Blend(params.NormalColor, params.DarkColor2, t)
      });
    } else {
      let t = Math.min(1, (tc - 17000) / 6000);
      this.instance.setColor({
        colDark: Utils.vec3Blend(params.DarkColor, params.GreyColor, t),
        colNormal: Utils.vec3Blend(params.DarkColor, params.GreyColor, t),
        colLight: Utils.vec3Blend(params.DarkColor2, params.DarkColor, t)
      });
    }
  }

  private updateState(deltaTime: number) {

    let cTime = this.currentTime + deltaTime;

    if (this.currentState == FlameAnimation.STATE_BEFORE_START) {
      if (cTime > FlameAnimation.BEFORE_INTERVAL) {
        cTime -= FlameAnimation.BEFORE_INTERVAL;
        this.currentState = FlameAnimation.STATE_SPAWN;
      }
    } else if (this.currentState == FlameAnimation.STATE_SPAWN) {
      if (cTime > FlameAnimation.SPAWN_INTERVAL) {
        cTime -= FlameAnimation.SPAWN_INTERVAL;
        this.posX = -1;
        this.currentState = FlameAnimation.STATE_SPAWN_DOWN;
      }
    } else if (this.currentState == FlameAnimation.STATE_SPAWN_DOWN) {
      if (cTime > FlameAnimation.SPAWN_DOWN_INTERVAL) {
        cTime -= FlameAnimation.SPAWN_DOWN_INTERVAL;
        this.currentState = FlameAnimation.STATE_FLOATING;
      }
    } else if (this.currentState == FlameAnimation.STATE_FLOATING) {
      if (cTime > FlameAnimation.FLOATING_INTERVAL) {
        this.randFlyX += Math.random() * 0.2;
        this.randFlyZ += Math.random() * 0.2;
        cTime -= FlameAnimation.FLOATING_INTERVAL;
        this.posX = -1;
        this.currentState = FlameAnimation.STATE_IDLE
      }
    } else if (this.currentState == FlameAnimation.STATE_IDLE) {
      if (cTime > FlameAnimation.IDLE_INTERVAL) {
        this.isObjDie = true;
      }
    }

    this.currentTime = cTime;
  }

  public update(deltaTime: number) {

    if (this.isObjDie) return;

    let mesh = this.instance.getMesh();
    let timeScale = this.ctrl.getParams().TimeScale;

    this.updateState(deltaTime * timeScale);
    this.timeCount += deltaTime * timeScale;

    if (this.currentState == FlameAnimation.STATE_SPAWN) {

      let t = this.currentTime / FlameAnimation.SPAWN_INTERVAL;

      let t2 = this.currentTime / (FlameAnimation.SPAWN_INTERVAL + FlameAnimation.SPAWN_DOWN_INTERVAL);

      mesh.position.set(
        this.distX * t2,
        mesh.position.y + t * 0.4 * this.yRatio * timeScale,
        this.distZ * t2
      );

      let scale = t;
      mesh.scale.set(scale, scale, scale);
    }
    else if (this.currentState == FlameAnimation.STATE_SPAWN_DOWN) {

      let t2 = (this.currentTime + FlameAnimation.SPAWN_INTERVAL) /
        (FlameAnimation.SPAWN_INTERVAL + FlameAnimation.SPAWN_DOWN_INTERVAL);

      mesh.position.set(
        this.distX * t2,
        mesh.position.y +
        (0.6 * timeScale *
          (1 - this.currentTime / FlameAnimation.SPAWN_DOWN_INTERVAL) +
          0.2 * timeScale) * this.yRatio,
        this.distZ * t2
      );
    }
    else if (this.currentState == FlameAnimation.STATE_FLOATING) {
      if (this.posX == -1) {
        this.posX = mesh.position.x;
        this.posY = mesh.position.y;
        //this.posZ = mesh.position.z;
        this.instance.setFlowRatio(0.5);
      }
      mesh.position.set(
        mesh.position.x + this.randFlyX * timeScale,
        mesh.position.y + 0.2 * timeScale,
        mesh.position.z + this.randFlyZ * timeScale
      );

      let scale = mesh.scale.x + 0.003 * timeScale;
      mesh.scale.set(scale, scale, scale);
    }
    else if (this.currentState == FlameAnimation.STATE_IDLE) {
      if (this.posX == -1) {
        this.posX = mesh.position.x;
        this.posY = mesh.position.y;
        //this.posZ = mesh.position.z;
        this.instance.setFlowRatio(0.2);
      }
      mesh.position.setY(this.posY + this.currentTime / 100);

      if (this.currentTime > FlameAnimation.IDLE_INTERVAL - 5000) {
        this.instance.setOpacity(1 - (this.currentTime - (FlameAnimation.IDLE_INTERVAL - 5000)) / 5000);
      }

      let scale = mesh.scale.x + 0.002 * timeScale;
      mesh.scale.set(scale, scale, scale);
    }

    this.setColor();
    this.instance.update(deltaTime * timeScale * this.animationTimeRatio);
  }

  public isDie(): boolean {
    return this.isObjDie;
  }

  public inPolling(): boolean {
    return this.isInPooling;
  }
  public setInPolling(val: boolean): void {
    this.isInPooling = val;
  }
}

export { FlameAnimation }