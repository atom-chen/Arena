import { Event } from "../utils/Event";

const {ccclass, property} = cc._decorator;

@ccclass
export default class UltAnim extends cc.Component {
    onFinishUlt = new Event()
    @property
    get finished() { return this._finished }
    set finished(value) { 
        this._finished = value
        this._finished && this.onFinishUlt.dispatch()
    } 
    private _finished = false
}
