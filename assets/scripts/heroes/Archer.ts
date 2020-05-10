const {ccclass, property} = cc._decorator;

@ccclass
export default class Archer extends cc.Component {
    @property(cc.Node) bolt: cc.Node = null

    start() {
        
    }
}
