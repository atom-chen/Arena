import { Config } from "./Config"
import { Battle } from "./Battle"


export class Global {
    static m: Global

    config = new Config()
    battle: Battle
    // player: Player

    init() { 
        return Promise.all([
            this.config.init()
        ]).then(() => {
            cc.log("[TEST]")
            // this.player = new Player()
            // this.player.load()
            // return true
        })
    }

    static get timeMS() { return new Date().getTime() }

    createBattle() {
        this.battle = Battle.create()
        return this.battle
    }
    update(dt) {
        this.battle && this.battle.update(dt)
    }
}