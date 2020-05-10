import { Event } from "../utils/Event";

const {ccclass, property} = cc._decorator;

@ccclass
export default class Archer extends cc.Component {
    @property(cc.Node) bolt: cc.Node = null

    onFinish = new Event()
    @property
    get finished() { return this._finished }
    set finished(value) { 
        this._finished = value
        this._finished && this.onFinish.dispatch()
    } 
    private _finished = false

    start() {
        
    }
}
