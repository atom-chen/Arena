import { Event } from "../utils/Event";

const {ccclass, property} = cc._decorator;

@ccclass
export default class MainAttack extends cc.Component {
    onFinish = new Event()
    @property
    get finished() { return this._finished }
    set finished(value) { 
        this._finished = value
        this._finished && this.onFinish.dispatch()
    } 
    private _finished = false
}
