import { Loader } from "../utils/Loader";
import MainAttack from "./MainAttack";
import UltAnim from "./UltAnim";
import HeroView from "../view/HeroView"
import { AnimType } from "../view/AnimType";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Archer extends cc.Component {
    @property(cc.Node) bolt: cc.Node = null

    private _anim: cc.Animation
    private _particle: cc.Node

    onLoad() {
        this._anim = this.getComponent(cc.Animation)
        this._anim.play(AnimType.Stand)
    }

    setAllFuncs(heroComp: HeroView) {
        heroComp.attackFunc = (enemyView: cc.Node) => {
            let attackComp = this.getComponent(MainAttack)
            attackComp.onFinish.add(this.node, () => {
                attackComp.onFinish.removeAll()
                this._runAttackAnimation(enemyView)
            })
            this._anim.play(AnimType.MainAttack)
        }
        heroComp.ultFunc = (enemyViews: Array<HeroView>) => {
            this.getComponent(UltAnim).onFinishUlt.add(this.node, () => {
                this._runUltAnimation(enemyViews)
                this.getComponent(UltAnim).onFinishUlt.removeAll()
            })
            this._anim.play(AnimType.Ult)
        }
        heroComp.runAnim = (t: AnimType) => {}
        heroComp.stopAnim = () => { 
            this._particle && this._particle.destroy()
            this._anim.stop() 
        }
        heroComp.pauseAnim = () => { 
            this._particle && this._particle.pauseAllActions()
            this._anim.pause() 
        }
        heroComp.resumeAnim = () => { 
            this._particle && this._particle.resumeAllActions()
            this._anim.resume() 
        }
    }

    private _runAttackAnimation(enemyView: cc.Node) {
        let n = this._createBullet()
        enemyView.addChild(n)
        this._particle = n
        let pos = this._getParticlePosition(enemyView)
        n.setPosition(pos)
        let anim = this._getParticleAnim(pos, enemyView)
        anim.target(n).call(() => n.destroy()).start()
    }
    private _getParticlePosition(enemy: cc.Node) {
        return cc.v2(enemy.convertToNodeSpaceAR(this.bolt.parent.convertToWorldSpaceAR(this.bolt.position)))
    }
    private _getParticleAnim(startPos: cc.Vec2, enemy: cc.Node) {
        let sp = startPos
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
    }
    private _createBullet() {
        let n = new cc.Node()
        Loader.loadTexture('archerHit').then(sf => n.addComponent(cc.Sprite).spriteFrame = sf)
        let l = new cc.Node()
        Loader.loadTexture('heroes/archer/Bullet').then(sf => l.addComponent(cc.Sprite).spriteFrame = sf)
        n.addChild(l)
        l.angle = -45
        l.setPosition(-16.1, 11.5)
        n.opacity = 0
        return n
    }
    private _step(t, p1: cc.Vec2, p2: cc.Vec2, p3: cc.Vec2) {
        let x = Math.pow(1 - t, 2) * p1.x + 2 * (1 - t) * t * p2.x + Math.pow(t, 2) * p3.x
        let y = Math.pow(1 - t, 2) * p1.y + 2 * (1 - t) * t * p2.y + Math.pow(t, 2) * p3.y
        return cc.v2(x, y)
    }

    private _runUltAnimation(enemies: Array<HeroView>) {
        Loader.loadNode('bullets/ArcherUltBullet').then((bp: cc.Prefab) => {
            enemies.forEach((e, i) => {
                let n = cc.instantiate(bp)
                e.node.addChild(n)
                n.setPosition(this._getParticlePosition(e.node))
                let anim = this._getUltParticleAnim(n.getPosition(), e.node, i)
                anim.target(n).call(() => n.destroy()).start()
            })
        })
    }

    private _getUltParticleAnim(startPos: cc.Vec2, enemy: cc.Node, i) {
        let sp = startPos
        let fp = enemy.getPosition()
        let mp = cc.v2((sp.x - fp.x) / 2, sp.y + 2000)
        let steps = 20
        let defAngle = 90
        let moveTweens = Array.from({length: steps}, (_, i) => this._step(i / steps, sp, mp, fp)).map((v, i, a) => {
            let sub = a[i - 1] ? v.sub(a[i - 1]) : null
            return new cc.Tween().to(0.5 / steps, { position: v, angle: sub ? - (Math.atan2(sub.x, sub.y) / Math.PI * 180) + defAngle : defAngle })
        })
        return cc.tween()
                .to(0, { opacity: 255, angle: defAngle })
                .sequence(...moveTweens)
    }
}
