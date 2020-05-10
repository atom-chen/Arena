import { Global } from "../model/Global";
import { Loader } from "../utils/Loader";
import GameToolbar from "./game/GameToolbar";
import { HeroSide, Hero } from "../model/Hero";
import HeroView from "../view/HeroView";
import { utils } from "../utils/Utils";
import { SceneType } from "./SceneType";
import { Battle, BattleResult } from "../model/Battle";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameScene extends cc.Component {
    @property(cc.Prefab) heroPrefab: cc.Prefab = null
    @property([cc.Node]) leftSidePositions = new Array<cc.Node>()
    @property([cc.Node]) rightSidePositions = new Array<cc.Node>()

    @property(GameToolbar) gameToolbar: GameToolbar = null

    @property(cc.Sprite) blackLayer: cc.Sprite = null
    @property(cc.Label) readyLabel: cc.Label = null

    heroes: Array<HeroView> = []

    onChangeTimeScale(_, s) { 
        this.setGlobalTimeScale(+s) 
    }
    setGlobalTimeScale(scale) {
        cc.director.calculateDeltaTime = function(now) {
            if (!now) now = performance.now();
            this._deltaTime = (now - this._lastUpdate) / 1000;
            this._deltaTime *= scale;
            this._lastUpdate = now;
        };
    }

    onLoad() {
        var manager = cc.director.getCollisionManager()
        manager.enabled = true
        manager.enabledDebugDraw = true

        this.blackLayer.node.opacity = 255
        let battle = Global.m.createBattle()
        let left = battle.sides[HeroSide.Left].heroes
        let right = battle.sides[HeroSide.Right].heroes

        let positions = [this.leftSidePositions, this.rightSidePositions]
        let allPs = utils.flatten([left, right].map((side, sideIndex) => side.map((h, i) => {
            if (h) {
                let hero = cc.instantiate(this.heroPrefab)
                hero.position = positions[sideIndex][i].position
                positions[sideIndex][i].parent.addChild(hero)
                this.heroes.push(hero.getComponent(HeroView))
                return hero.getComponent(HeroView).setHero(h)
            } else {
                return null
            }
        })))
        allPs.push(...this.gameToolbar.setBattle(battle))
        Promise.all(allPs).then(() => this.startPreparing())
    }
    startPreparing() {
        this.heroes.forEach(h => h.setAllHeroes(this.heroes))
        const timeDelay = 0.2
        cc.tween(this.blackLayer.node).to(timeDelay, { opacity: 0 }).start()
        cc.tween(this.readyLabel.node).delay(timeDelay)
            // .call(() => this.readyLabel.string = "3").to(0.5, {scale: 1.2}).to(0.1, {scale: 1.0})
            // .call(() => this.readyLabel.string = "2").to(0.5, {scale: 1.2}).to(0.1, {scale: 1.0})
            // .call(() => this.readyLabel.string = "1").to(0.5, {scale: 1.2}).to(0.1, {scale: 1.0})
            .call(() => { this.readyLabel.string = "BATTLE!"; this.startBattle() }).to(0.75, {scale: 1.2}).to(0.25, {opacity: 0})
            // .call(() => this.readyLabel.destroy())
            .start()
    }
    startBattle() {
        Global.m.battle.onFinish.add(this, result => {
            this.setGlobalTimeScale(1)
            if (result == BattleResult.Victory) this.readyLabel.string = 'VICTORY'
            else if (result == BattleResult.Defeat) this.readyLabel.string = 'DEFEAT'
            else this.readyLabel.string = 'DRAW'
            cc.tween(this.readyLabel.node).delay(0.5).to(0.5, { opacity: 255, scale: 1.2 }).to(0.2, { scale: 1 })
                .delay(2).call(() => cc.director.loadScene(SceneType.Menu)).start()
        })
        Global.m.battle.start()
    }
    onCloseButton() {
        cc.director.loadScene(SceneType.Menu)
    }
    update(dt) {
        Global.m.update(dt)
    }
}
