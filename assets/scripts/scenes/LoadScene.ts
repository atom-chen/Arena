import { Global } from "../model/Global";
import { SceneType } from "./SceneType";

const {ccclass, property} = cc._decorator;

@ccclass
export default class LoadScene extends cc.Component {
    start() {
        Global.m = new Global()
        Global.m.init().then(() => this.toMenuScene()).catch((e) => cc.log("[LOAD GAME CRUSHSHSH]", e))
    }
    toMenuScene() {
        cc.director.loadScene(SceneType.Menu)
    }
}
