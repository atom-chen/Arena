import { HeroType, HeroClassType } from "./HeroType"
import { HeroCfg } from "./Config"
import { Global } from "./Global"
import { Event } from "../utils/Event"
import { BattleState } from "./Battle"

export const enum HeroSide {
    Left = 0,
    Right = 1,
    Count
}

export const enum HeroState {
    Freeze = 0,
    Waiting,
    MovingTo,
    Shooting,
    MovingBack,
    Ulting,
    Count
}

export class Hero {
    type: HeroType
    health: number
    config: HeroCfg
    side: HeroSide
    position: number
    id: number

    savedState: HeroState
    state = HeroState.Freeze
    
    // ultDt = Number.MAX_VALUE
    // attackDt = Number.MAX_VALUE

    onDeath = new Event<Hero>()
    onAttack = new Event<{o: Hero, u: boolean}>()
    onTakeDamage = new Event<{was: number}>()
    
    onStartMoving = new Event<Hero>()
    onMovingBack = new Event()
    
    onUlt = new Event<Hero>()
    onUltEnded = new Event<Hero>()
    onFreeze = new Event()
    onUnFreeze = new Event()

    currentEnemy: Hero
    enemiesInRange = new Array<Hero>()

    private _time = 0
    private _lastUltTime = -Number.MAX_VALUE
    private _lastAttackTime = -Number.MAX_VALUE
    private _lastMoveBackTime = 0
    private _lastShootTime = 0

    get hitTime() { return this.type == HeroType.Archer ? 1 : 0.5 }   //TODO: config or depends on attackDelay
    ultTime = 0.5   //TODO: config or depends on attackDelay
    moveTime = 0.5   //TODO: config or depends on attackDelay
    
    get killed() { return this.health <= 0 }
    get fullHealth() { return this.config.health }
    get classType() { return this.config.classType }
    get damage() { return this.config.damage }
    get name() { return this.config.name }
    get ultProgress() { return Math.min(1, ((this._time - this._lastUltTime) * 1000) / this.config.ultDelayMs) }
    get attackDelayMs() { return this.config.attackDelayMs * 2.5 }

    getConfig() { this.config = Global.m.config.heroCfgs[this.type] }

    static create(type: HeroType, side: HeroSide, position: number) {
        let ret = new Hero()
        ret.type = type
        ret.getConfig()
        ret.health = ret.config.health
        ret.side = side
        ret.position = position
        return ret
    }

    startBattle() {
        this.state = HeroState.Waiting
        this.update(0)
    }

    update(dt) {
        if (this.state == HeroState.Freeze || this.killed) return
        this._time += dt

        if (this.state == HeroState.MovingTo && this.enemiesInRange.find(e => e == this.currentEnemy)) { this.shoot() }
        if (this.state == HeroState.Shooting && this._time - this._lastShootTime >= this.hitTime) { this.afterShoot() }
        if (this.state == HeroState.Waiting && this._time - this._lastAttackTime >= this.attackDelayMs / 1000) { this.attackNewTarget() }
        if (this.state == HeroState.MovingBack && this._time - this._lastMoveBackTime >= this.moveTime) { this.state = HeroState.Waiting }
        if (this.state == HeroState.Ulting && this._time - this._lastUltTime >= this.ultTime) { this.afterUlt() }
    }

    attackNewTarget() {
        let newEnemy = this._selectEnemy()
        if (newEnemy) {
            this.currentEnemy = newEnemy
            this._lastAttackTime = this._time
            if (this.type != HeroType.Archer) { //TODO: melee or range
                this.state = HeroState.MovingTo
                this.onStartMoving.dispatch(newEnemy) 
            } else this.shoot()
        }
    }

    ult() {
        if (this.killed || Global.m.battle.state != BattleState.Battle) return
        if ((this._time - this._lastUltTime) * 1000 < this.config.ultDelayMs) return

        this.state = HeroState.Ulting
        this._lastUltTime = this._time
        this.onUlt.dispatch(this)
        Global.m.battle.logAllStates()
    }
    afterUlt() {
        let b = Global.m.battle
        let opponentSide = b.sides[HeroSide.Right - this.side]
        opponentSide.firstLine.forEach(e => {
            e.getDamage(this, true)
        })
        this.state = HeroState.Waiting
        this.onUltEnded.dispatch(this)
    }
    shoot() {
        if (this.currentEnemy) {
            this.state = HeroState.Shooting
            this._lastShootTime = this._time
            this.onAttack.dispatch({ o: this.currentEnemy, u: false })
        }
    }
    afterShoot() {
        this.currentEnemy.getDamage(this, false)

        if (this.type != HeroType.Archer) { //TODO: melee or range
            this.state = HeroState.MovingBack
            this._lastMoveBackTime = this._time
            this.onMovingBack.dispatch()
        } else this.state = HeroState.Waiting
    }

    getDamage(hero: Hero, ult: boolean) {
        let was = this.health
        this.health = Math.max(0, this.health - (ult ? hero.config.ultDamage : hero.damage))
        if (this.health <= 0) {
            this.onDeath.dispatch()
        }
        this.onTakeDamage.dispatch({ was: was })
    }

    onEnemyAttached(h: Hero) {
        if (this.state == HeroState.MovingTo && h == this.currentEnemy) this.shoot()
    }

    checkDeadHero(h: Hero) {
        if (this.state == HeroState.MovingTo && h == this.currentEnemy) {
            // TODO: change target!
        }
    }

    private _selectEnemy() {
        let b = Global.m.battle
        let opponentSide = b.sides[HeroSide.Right - this.side]

        let m1 = opponentSide.firstLine[this.position % 2] // TODO: some trick? not really correct
        let m2 = opponentSide.firstLine[(1 - this.position) % 2]

        let a1 = opponentSide.secondLine[this.position]
        let a2 = opponentSide.secondLine[(this.position + 1) % 3]
        let a3 = opponentSide.secondLine[(this.position + 2) % 3]; // TODO: think about random or other ordering?
        return [m1, m2, a1, a2, a3].find(e => e && !e.killed)
    }

    freeze() {
        this.savedState = this.state
        this.state = HeroState.Freeze
        this.onFreeze.dispatch()
    }

    unFreeze() {
        this.state = this.savedState
        this.onUnFreeze.dispatch()
    }
}