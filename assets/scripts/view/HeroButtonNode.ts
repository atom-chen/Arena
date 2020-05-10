import { Event } from "../utils/Event";
import { Hero } from "../model/Hero";
import { Loader } from "../utils/Loader";
import { Global } from "../model/Global";
import { BattleState } from "../model/Battle";

const {ccclass, property} = cc._decorator;

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

    onClick = new Event<Hero>()
    private _hero: Hero
    
    setHero(hero: Hero) { 
        this._hero = hero 
        this.heroName.string = hero.name
        this.updateHealthPg()
        this.updateUltPg()

        this._hero.onTakeDamage.add(this, () => this.updateHealthPg())
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