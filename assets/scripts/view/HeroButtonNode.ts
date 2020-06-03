import { Event } from "../utils/Event";
import { Hero } from "../model/Hero";
import { Loader } from "../utils/Loader";
import { Global } from "../model/Global";
import { BattleState } from "../model/Battle";
import { UltType } from "../model/Config";

const {ccclass, property} = cc._decorator;

const PBarColors = new Map<UltType, { m: cc.Color, bg: cc.Color }>([
    [UltType.AttackAll, { m: cc.color(241, 177, 61), bg: cc.color(134, 74, 6) }],
    [UltType.Healing, { m: cc.color(228, 84, 84), bg: cc.color(129, 67, 67) }],
    [UltType.GodBless, { m: cc.color(84, 153, 228), bg: cc.color(72, 69, 141) }],
    [UltType.BoostAttack, { m: cc.color(101, 255, 95), bg: cc.color(82, 136, 104) }]
])
const UltNotReadyColor = cc.color(79, 105, 185)
const UltReadyColor = cc.color(45, 140, 243)

@ccclass
export default class HeroButtonNode extends cc.Component { 
    @property(cc.Node) bgNode: cc.Node = null
    
    @property(cc.Label) heroName: cc.Label = null
    @property(cc.Sprite) heroIcon: cc.Sprite = null
    
    @property(cc.Label) health: cc.Label = null
    @property(cc.ProgressBar) healthPg: cc.ProgressBar = null
    @property(cc.Label) ult: cc.Label = null
    @property(cc.ProgressBar) ultPg: cc.ProgressBar = null
    @property(cc.Node) ultPgSlider: cc.Node = null

    onClick = new Event<Hero>()
    private _hero: Hero
    
    setHero(hero: Hero) { 
        this._hero = hero 
        this.heroName.string = hero.name
        this.updateHealthPg()
        this.updateUltPg()

        const pBarColors = PBarColors.has(this._hero.ultType) ? PBarColors.get(this._hero.ultType) : PBarColors.get(UltType.AttackAll)
        this.ultPg.node.color = pBarColors.bg
        this.ultPgSlider.color = pBarColors.m
        this._hero.onHealthChanged.add(this, () => this.updateHealthPg())
        this._hero.onDeath.add(this, () => this.whenDeath())
        return Loader.loadTexture(`monster${hero.type+1}_ic`).then(sf => this.heroIcon.spriteFrame = sf)
    }
    updateHealthPg() {
        this.health.string = '' + this._hero.health
        this.healthPg.progress = this._hero.health / this._hero.fullHealth
    }
    updateUltPg() {
        let battle = Global.m.battle.state == BattleState.Battle
        this.ultPg.progress = this._hero.ultProgress
        let ultReady = this.ultPg.progress >= 1
        this.bgNode.color = (ultReady && battle) ? UltReadyColor : UltNotReadyColor
        this.getComponent(cc.Button).enabled = battle && ultReady
        this.getComponent(cc.Button).interactable = battle && ultReady
    }
    whenDeath() {
        this.bgNode.color = cc.color(36, 38, 42)
        this.getComponent(cc.Button).enabled = false
        this.getComponent(cc.Button).interactable = false
        this.update = (dt) => {}
    }
    onButton() { 
        this.onClick.dispatch(this._hero)
        this._hero.ult()
    }
    update(dt) {
        this.updateUltPg()
    }
}