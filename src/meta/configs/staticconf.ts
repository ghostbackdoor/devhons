import { Vector3 } from "three"
import { Char } from "../loader/assetmodel"

export default class SConf {
    public static projectile = Symbol("projectile")
    public static PlayerStatus = Symbol("changeplayerstatus")
    public static AppMode = Symbol("appmode")
    public static BrickMode = Symbol("brickmode")
    public static EditMode = Symbol("editmode")
    public static PlayMode = Symbol("playmode")
    public static WeaponMode = Symbol("weaponmode")
    public static LocatMode = Symbol("locatmode")
    public static FunitureMode = Symbol("funimode")
    public static CloseMode = Symbol("closemode")
    public static LongMode = Symbol("longmode")
    public static PortalMode = Symbol("portalmode")
    public static LegoMode = Symbol("legomode")

    public static StartPosition = new Vector3(0, 0, 6)
    public static DefaultPortalPosition = new Vector3(21, 0, 17)

    public static LegoFieldW = 18
    public static LegoFieldH = 24

    public static ModelPath = {
        [Char.Male]: "assets/male/male.gltf",
        [Char.Female]: "assets/female/female.gltf",
    }
}