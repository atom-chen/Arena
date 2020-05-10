import { Event } from "../../utils/Event";
import { MenuToolbarNodeType } from "./MenuToolbarNodeType";

const {ccclass, property} = cc._decorator;

const UnselectedColor = cc.color(79, 105, 185)
const SelectedColor = cc.color(45, 140, 243)

@ccclass
export default class MenuToolbarNode extends cc.Component {
    @property(cc.Label) label: cc.Label = null

    onClick = new Event<MenuToolbarNodeType>()

    onButton(_, t) {
        let type = <MenuToolbarNodeType>+t
        this.onClick.dispatch(type)
        this.animateButton(type)
    }
    animateButton(t: MenuToolbarNodeType) {
        this.node.children.forEach((cb, ct) => cb.children.forEach(c => c.color = ct == t ? SelectedColor : UnselectedColor))
    }
}
