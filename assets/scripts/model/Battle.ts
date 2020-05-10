import { Hero, HeroSide } from "./Hero"
import { utils } from "../utils/Utils"
import { HeroType, HeroClassType } from "./HeroType"
import { Global } from "./Global"
import { Event } from "../utils/Event"

export const enum BattleResult {
    Draw = 0,
    Defeat,
    Victory
}

export const enum BattleState {
    Prepare = 0,
    Battle,
    Finish
}

export class BattleSide { 
    firstLine: Array<Hero> = []
    secondLine: Array<Hero> = []

    get heroes() { return this.firstLine.concat(this.secondLine) }
}

export class Battle {
    sides = [new BattleSide(), new BattleSide()]

    private constructor() {}

    state = BattleState.Prepare

    onFinish = new Event<number>()

    get allHeroes() { return utils.flatten(this.sides.map(s => s.heroes)) }

    static create() {
        let ret = new Battle()

        let hs = Array.from({length: HeroType.Count}, (_, i) => Global.m.config.heroCfgs[i])
        // let hs = Array.from({length: 3}, (_, i) => Global.m.config.heroCfgs[i])
        let classed = utils.splitArray(hs, t => t.classType)
        
        Array.from({ length: HeroSide.Count }, (_, side) => {
            let m = utils.shuffleArray(classed[HeroClassType.Mellee]).slice(0, 2)
            let a = utils.shuffleArray(classed[HeroClassType.Archer]).slice(0, 3)
            // let m = utils.shuffleArray(classed[HeroClassType.Mellee]).slice(0, 1)
            // let a = utils.shuffleArray(classed[HeroClassType.Archer]).slice(0, 0)

            ret.sides[side].firstLine = m.map((cfg, pos) => Hero.create(cfg.type, side, pos))
            ret.sides[side].secondLine = a.map((cfg, pos) => Hero.create(HeroType.Archer/*cfg.type*/, side, pos))
        })

        cc.log("[BATTLE]", ret)
        return ret
    }

    start() {
        let id = 0
        this.allHeroes.forEach(h => {
            h.startBattle()
            h.id = id++
            h.onUlt.add(this, e => this.whenUlt(e))
            h.onUltEnded.add(this, e => this.whenUltEnded(e))
            h.onDeath.add(this, e => {
                this.checkFinish()
                this.allHeroes.filter(h => !h.killed).forEach(h => h.checkDeadHero(e))
            })
        })
        this.state = BattleState.Battle
    }

    update(dt) {
        this.allHeroes.forEach(h => h.update(dt))
    }

    logAllStates() {
        cc.log('[STATES] --------------')
        this.allHeroes.forEach(ah => cc.log(`[LOG] ${ah.id} : ${ah.state}`))
        cc.log('[STATES] --------------')
    }

    whenWinish(result: BattleResult) {
        this.onFinish.dispatch(result)
        this.state = BattleState.Finish
    }

    whenUlt(e) {
        this.allHeroes.filter(hs => hs != e).forEach(e => e.freeze())
    }

    whenUltEnded(e) {
        this.allHeroes.filter(hs => hs != e).forEach(e => e.unFreeze())
    }

    checkFinish() {
        let anyLose = this.sides.map(s => s.heroes.every(h => h.killed))
        if (anyLose[0] == true && anyLose[1] == true) {
            this.whenWinish(BattleResult.Draw)
        } else if (anyLose[0] == true) {
            this.whenWinish(BattleResult.Defeat)
            cc.log("[BATTLE][LOSE]")
        } else if (anyLose[1] == true) {
            cc.log("[BATTLE][WIN]")
            this.whenWinish(BattleResult.Victory)
        }
    }
}