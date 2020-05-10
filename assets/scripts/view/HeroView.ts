import { Hero, HeroSide } from "../model/Hero";
import { Loader } from "../utils/Loader";
import { HeroClassType, HeroType } from "../model/HeroType";
import { Global } from "../model/Global";
import Archer from "../heroes/Archer";

const {ccclass, property} = cc._decorator;

const enum AnimType {
    Stand = "Stand",
    MainAttack = "MainAttack"
}

@ccclass
export default class HeroView extends cc.Component { 
    @property(cc.Sprite) icon: cc.Sprite = null
    @property(cc.Label) health: cc.Label = null
    @property(cc.ProgressBar) healthBar: cc.ProgressBar = null

    private _hero: Hero
    private _allHeroViews: Array<HeroView>
    private _anim: cc.Animation

    private _basePosition: cc.Vec2
    private _particle: cc.Node

    action: cc.Tween

    prefabNode: cc.Node

    setHero(h: Hero) {
        if (h.side == HeroSide.Right) this.health.node.scaleX = -this.health.node.scaleX
        this._hero = h
        this._basePosition = this.node.getPosition()
        this.health.string = '' + h.health
        this.healthBar.progress = h.health / h.fullHealth
        h.onTakeDamage.add(this, info => {
            this.health.string = '' + h.health
            this.healthBar.progress = h.health / h.fullHealth
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

        h.onFreeze.add(this, () => this._freeze())
        h.onUnFreeze.add(this, () => this._unFreeze())
        h.onUlt.add(this, () => {
            this._particle && this._particle.destroy()
            this.node.stopAllActions()

            //CANT FREEZE BECAUSE ACTIONS CANNOT BE SCHEDULED WITHOUT RESUME ALL ACTIONS

            cc.tween(this.node).delay(this._hero.ultTime).call(() => cc.log('[LOG] ULT FINISHED')).start()
        })
        h.onAttack.add(this, info => {
            this.node.stopAllActions()
            if (this._anim) { // ONLY FOR ANIMATION SUPPORT
                this.prefabNode.getComponent(Archer).onFinish.add(this.node, () => {    //TODO: make anim comp
                    this._runAttackAnimation(info.o)
                    this.prefabNode.getComponent(Archer).onFinish.removeAll()           //TODO: make anim comp
                })
                this._anim.play(AnimType.MainAttack)
            } else this._runAttackAnimation(info.o)
        })
        Global.m.battle.onFinish.add(this, () => this._anim && this._anim.play(AnimType.Stand))
        return this.loadHeroView(h)
        // return Loader.loadTexture(`monster${h.type+1}`).then(sf => this.icon.spriteFrame = sf)
    }
    private _runAttackAnimation(enemy: Hero) {
        let otherView = this._allHeroViews.find(h => h._hero == enemy)
        if (otherView) {
            let op = otherView.node.parent.convertToWorldSpaceAR(otherView.node.position)
            op.y -= 50

            let n = this._createBullet()
            otherView.node.addChild(n)
            n.setPosition(this._getParticlePosition(otherView.node))
            this._particle = n
            let anim = this._getParticleAnim(otherView.node)
            anim.target(n).call(() => n.destroy()).start()
        } else {
            cc.log("[HEROVIEW]", `error can;t find view for: ${enemy}`)
        }
    }
    private _getParticlePosition(enemy: cc.Node) {
        if (this._hero.type == HeroType.Archer) {
            let bolt = this.prefabNode.getComponent(Archer).bolt
            return cc.v2(enemy.convertToNodeSpaceAR(bolt.parent.convertToWorldSpaceAR(bolt.position)))
        }
        return cc.v2(enemy.convertToNodeSpaceAR(this.node.parent.convertToWorldSpaceAR(this.node.position)))
    }
    private _getParticleAnim(enemy: cc.Node) {
        if (this._hero.type == HeroType.Archer) {
            let sp = this._particle.getPosition()
            let fp = enemy.getPosition()
            let mp = cc.v2((sp.x - fp.x) / 2, sp.y + 1000)
            let steps = 20
            let moveTweens = Array.from({length: steps}, (_, i) => this._step(i / steps, sp, mp, fp)).map((v, i, a) => {
                let sub = a[i - 1] ? v.sub(a[i - 1]) : null
                return new cc.Tween().to(0.5 / steps, { position: v, angle: sub ? - (Math.atan2(sub.x, sub.y) / Math.PI * 180) + 90 : 90 })
            })
            return cc.tween()
                    .to(0, { opacity: 255, angle: 90 })
                    .sequence(...moveTweens)
        } else {
            return cc.tween()
                .to(0, { opacity: 255 })
                .to(0.5, { position: enemy.getPosition() })
        }
    }
    private _createBullet() {
        let n = new cc.Node()
        let sname = ['hit1/hit_anim5', 'archerHit'][this._hero.classType]
        Loader.loadTexture(sname).then(sf => n.addComponent(cc.Sprite).spriteFrame = sf)
        if (this._hero.type == HeroType.Archer) {
            let l = new cc.Node()
            Loader.loadTexture('heroes/archer/Bullet').then(sf => l.addComponent(cc.Sprite).spriteFrame = sf)
            n.addChild(l)
            l.angle = -45
            l.setPosition(-16.1, 11.5)
        }
        n.opacity = 0
        return n
    }
    private _step(t, p1: cc.Vec2, p2: cc.Vec2, p3: cc.Vec2) {
        let x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * p2.x + Math.pow(t, 2) * p3.x
        let y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * p2.y + Math.pow(t, 2) * p3.y
        return cc.v2(x, y)
    }
    loadHeroView(h: Hero) {
        if (h.type == HeroType.Archer) {
            return Loader.loadNode('heroes/ArcherNode').then((a: cc.Node) => {
                this._anim = a.getComponent(cc.Animation)
                this._anim.play(AnimType.Stand)
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
        this._anim && this._anim.pause()
    }
    _unFreeze() {
        this._particle && this._particle.resumeAllActions()
        this.node.resumeAllActions()
        this._anim && this._anim.resume()
    }
}