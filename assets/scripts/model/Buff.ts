import { Event } from "../utils/Event"
import { Hero } from "./Hero"

export const enum BuffType {
    Heal,
    Shield,
    AttackSpeed,
}

export class Buff {
    type: BuffType
    value: number
    duration: number
    tickTime: number    // mb configurable

    onFinish = new Event()

    private _target: Hero
    private _tickDt = 0
    
    private _tickFunc = () => {}

    constructor(t: BuffType, v: number, d: number = 0, tt?) {
        this.type = t
        this.duration = d
        this.value = v
        this.tickTime = tt
        if (t == BuffType.Heal) this._tickFunc = () => this._target.getHeal(this.value) //add another tick funcs depends on buff
    }

    update(dt) {
        this._tick(dt)
        this.duration -= dt
        if (this.duration <= 0) {
            this.onFinish.dispatch()
        }
    }

    private _tick(dt) {
        if (this.tickTime) {
            this._tickDt += dt
            if (this._tickDt >= this.tickTime) {
                this._tickDt = 0
                this._tickFunc()
            }
        }
    }

    setTarget(h: Hero) {
        this._target = h
        this._tickFunc()
    }

    tryMerge(another: Buff) {
        if (this.type != another.type || another.value < this.value) return false

        this.duration = another.duration
        this.value = another.value
        return true
    }
}