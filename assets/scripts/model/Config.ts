import { Jsonable, jp } from "../utils/Jsonable";
import { HeroType, HeroClassType } from "./HeroType";
import { Loader } from "../utils/Loader";


export class HeroCfg extends Jsonable {
    type: HeroType
    @jp("c") classType: HeroClassType
    @jp("h") health: number
    @jp("n") name: string
    @jp("d") damage: number
    @jp("dl") attackDelayMs: number
    @jp("ud") ultDamage: number
    @jp("udl") ultDelayMs: number
    
    static fromJson(json) {
        let ret = new HeroCfg()
        ret.fromJson(json)
        return ret
    }
    static create(json, t) {
        let ret = this.fromJson(json)
        ret.type = t
        return ret
    }
}

export class Config {
    heroCfgs: Array<HeroCfg>
    init() {
        return Promise.all([
            this.loadWithCb('Heroes', (data) => {
                this.heroCfgs = data.map((j, i) => HeroCfg.create(j, i))
                cc.log("[TEST] heroes", this.heroCfgs)
            }),
        ])
    }
    loadWithCb(name: string, callback: (data) => void) {
        return new Promise((resolve, reject) => {
            Loader.loadConfig(name).then(data => {
                callback(data)
                resolve()
            }).catch(e => reject(e))
        })
    }
}