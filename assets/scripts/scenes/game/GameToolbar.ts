import { Loader } from "../../utils/Loader";
import { Battle } from "../../model/Battle";
import { HeroSide } from "../../model/Hero";
import HeroButtonNode from "../../view/HeroButtonNode";

const {ccclass, property} = cc._decorator;

@ccclass
export default class GameToolbar extends cc.Component {
    @property(cc.Node) buttonsNode: cc.Node = null
    @property(cc.Prefab) buttonPrefab: cc.Prefab = null

    setBattle(battle: Battle) {
        let all = battle.sides[HeroSide.Left].firstLine.concat(battle.sides[HeroSide.Left].secondLine)

        return all.map((h, i) => {
            let b = cc.instantiate(this.buttonPrefab)
            this.buttonsNode.addChild(b)
            return b.getComponent(HeroButtonNode).setHero(h)
        })
    }

    onButton(_, b) {
        let t = +b
        cc.log("[ON HERO]", t)
    }
}
