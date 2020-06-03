import { Hero, HeroSide } from "../model/Hero";
import { Loader } from "../utils/Loader";
import { HeroClassType, HeroType } from "../model/HeroType";
import { Global } from "../model/Global";
import Archer from "../heroes/Archer";
import MainAttack from "../heroes/MainAttack";
import UltAnim from "../heroes/UltAnim";
import { AnimType } from "./AnimType";
import { Buff } from "../model/Buff";
import BuffNode from "./BuffNode";

const {ccclass, property} = cc._decorator;

@ccclass
export default class HeroView extends cc.Component { 
    @property(cc.Sprite) icon: cc.Sprite = null
    @property(cc.Label) health: cc.Label = null
    @property(cc.ProgressBar) healthBar: cc.ProgressBar = null
    @property(cc.Node) buffContainer: cc.Node = null

    private _hero: Hero
    private _allHeroViews: Array<HeroView>

    private _basePosition: cc.Vec2
    
    action: cc.Tween
    
    prefabNode: cc.Node
    _particle: cc.Node

    setHero(h: Hero) {
        if (h.side == HeroSide.Right) this.health.node.scaleX = -this.health.node.scaleX
        this._hero = h
        this._basePosition = this.node.getPosition()
        this.health.string = '' + h.health
        this.healthBar.progress = h.health / h.fullHealth
        h.onHealthChanged.add(this, info => {
            this.health.string = '' + h.health
            this.healthBar.progress = h.health / h.fullHealth
            const t = 0.09
            let tween = cc.tween().to(t, { color: cc.Color.RED }).to(t, { color: cc.Color.WHITE })
            if (this.prefabNode) {
                this.prefabNode.getComponentsInChildren(cc.Sprite).forEach(sp => tween.clone().target(sp.node).start())
            } else {
                tween.target(this.node).start()
            }

        })
        h.onDeath.add(this, () => 
            cc.tween(this.icon.node).to(0.3, { angle: 360, scale: 0.01, opacity: 0 }).call(() => this.node.destroy()).start()  
        )
        h.onStartMoving.add(this, e => {
            let otherView = this._allHeroViews.find(h => h._hero == e)
            this.node.stopAllActions()
            let pos = this.node.parent.convertToNodeSpaceAR(otherView.node.convertToWorldSpaceAR(otherView.node.position))
            cc.tween(this.icon.node).to(0.5, { position: pos }).start()
        })
        h.onMovingBack.add(this, () => {
            this.action = cc.tween(this.icon.node).to(this._hero.moveTime, { position: this._basePosition }).start()
        })
        h.onBuffAdded.add(this, (b: Buff) => {
            if (b.duration == 0) return
            Loader.loadNode('BuffNode').then((n: cc.Node) => {
                n.getComponent(BuffNode).init(b.type)
                this.buffContainer.addChild(n)
                b.onFinish.add(n, () => n.destroy())
            })
        })
        h.onFreeze.add(this, () => this._freeze())
        h.onUnFreeze.add(this, () => this._unFreeze())
        h.onUlt.add(this, info => {
            let targets = info.t
            let heroWithoutView = targets.find(e => this._allHeroViews.find(h => h._hero == e) == undefined)
            if (heroWithoutView != undefined) {
                cc.log("[HEROVIEW]", `error can't find view for: ${heroWithoutView}`)
            }

            this._particle && this._particle.destroy()
            this.node.stopAllActions()
            this.stopAnim()
            //CANT FREEZE BECAUSE ACTIONS CANNOT BE SCHEDULED WITHOUT RESUME ALL ACTIONS

            this.ultFunc(targets.map(e => this._allHeroViews.find(h => h._hero == e)))
        })
        h.onAttack.add(this, info => {
            let otherView = this._allHeroViews.find(h => h._hero == info.o)
            if (!otherView) {
                cc.log("[HEROVIEW]", `error can't find view for: ${info.o}`)
                return
            }

            this.node.stopAllActions()
            this.attackFunc(otherView.node)
        })
        Global.m.battle.onFinish.add(this, () => this.runAnim(AnimType.Stand))
        return this.loadHeroView(h)
    }

    runAnim = (t: AnimType) => {}
    stopAnim = () => {}
    pauseAnim = () => {}
    resumeAnim = () => {}

    attackFunc = (enemyView: cc.Node) => {
        let n = this._createBullet()
        enemyView.addChild(n)
        n.setPosition(this._getParticlePosition(enemyView))
        this._particle = n
        let anim = this._getParticleAnim(enemyView)
        
        anim.target(n).call(() => n.destroy()).start()
    }

    ultFunc = (enemyViews: Array<HeroView>) => {

    }

    // --------- DEFAULT MAIN ATTACK ---------

    private _getParticlePosition(enemy: cc.Node) {
        return cc.v2(enemy.convertToNodeSpaceAR(this.node.parent.convertToWorldSpaceAR(this.node.position)))
    }
    private _getParticleAnim(enemy: cc.Node) {
        return cc.tween()
        .to(0, { opacity: 255 })
        .to(0.5, { position: enemy.getPosition() })
    }
    private _createBullet() {
        let n = new cc.Node()
        Loader.loadTexture('hit1/hit_anim5').then(sf => n.addComponent(cc.Sprite).spriteFrame = sf)
        n.opacity = 0
        return n
    }
    
    // --------- DEFAULT MAIN ATTACK ---------
    
    // --------- DEFAULT ULT ---------

    private _runUltAnimation(enemies: Array<Hero>) {
        this._loadUltBullet().then((bp: cc.Prefab) => {
            
        })
    }

    private _loadUltBullet() {
        return Loader.loadNode('bullets/ArcherUltBullet')
    }

    private _getUltParticleAnim(startPos: cc.Vec2, enemy: cc.Node, i) {
        
    }

    // --------- ULT ---------

    loadHeroView(h: Hero) {
        if (h.type == HeroType.Archer) {
            return Loader.loadNode('heroes/ArcherNode').then((a: cc.Node) => {
                a.getComponent(Archer).setAllFuncs(this)
                this.prefabNode = a
                this.icon.node.addChild(a)
            })
        } else return Loader.loadTexture(`monster${h.type+1}`).then(sf => this.icon.spriteFrame = sf)
    }
    setAllHeroes(heroes: Array<HeroView>) {
        this._allHeroViews = heroes
    }
    onCollisionEnter(other, _) {
        let enemy: Hero = other.node.getComponent(HeroView)._hero
        this._hero.enemiesInRange.push(enemy)
    }
    onCollisionExit(other, _) {
        let enemy: Hero = other.node.getComponent(HeroView)._hero
        this._hero.enemiesInRange = this._hero.enemiesInRange.filter(e => e != enemy)
    }
    _freeze() {
        this._particle && this._particle.pauseAllActions()
        this.node.pauseAllActions()
        this.pauseAnim()
    }
    _unFreeze() {
        this._particle && this._particle.resumeAllActions()
        this.node.resumeAllActions()
        this.resumeAnim()
    }
}