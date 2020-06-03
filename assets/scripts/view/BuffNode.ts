import { BuffType } from "../model/Buff";
import { Loader } from "../utils/Loader";

const {ccclass, property} = cc._decorator;

const buffTypeToTexture = new Map<BuffType, string>([
    [BuffType.Heal, "cross"],
    [BuffType.Shield, "shield"],
    [BuffType.AttackSpeed, "buffArrow"],
])

@ccclass
export default class BuffNode extends cc.Component {
    @property(cc.Vec2) bottom: cc.Vec2 = null
    @property(cc.Vec2) top: cc.Vec2 = null

    init(t: BuffType) {
        let textureName = buffTypeToTexture.get(t)
        textureName && Loader.loadTexture(textureName).then(sf => {
            this.node.children.forEach(c => {
                c.getComponent(cc.Sprite).spriteFrame = sf
                let time = 2
                let speed = (this.top.y - this.bottom.y) / time
                let mainTween = cc.tween().to(0, { position: cc.v2(c.x, this.bottom.y) }, { easing: 'easeInOut' }).to(time, { position: cc.v2(c.x, this.top.y) })
                cc.tween(c).to((this.top.y - c.y) / speed, { position: cc.v2(c.x, this.top.y) }, { easing: 'easeInOut' }).repeatForever(mainTween).start()
            })
        })
    }
}
