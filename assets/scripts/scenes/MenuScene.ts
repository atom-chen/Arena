import MenuToolbarNode from "../view/menu/MenuToolbarNode";
import { SceneType } from "./SceneType";
import { MenuToolbarNodeType } from "../view/menu/MenuToolbarNodeType";

const {ccclass, property} = cc._decorator;


@ccclass
export default class MenuScene extends cc.Component {
    @property(cc.PageView) pageView: cc.PageView = null
    @property(cc.Node) pageViewContentNode: cc.Node = null
    @property(MenuToolbarNode) toolbar: MenuToolbarNode = null
    pageState = MenuToolbarNodeType.Play

    onLoad() {
        this.toolbar.onClick.add(this, t => this.pageView.setCurrentPageIndex(t))
        this.updateNonWidgetSize()
        this.node.on(cc.Node.EventType.SIZE_CHANGED, () => this.updateNonWidgetSize())
    }
    start() {
        this.pageView.setCurrentPageIndex(this.pageState)
    }
    onPlayButton() {
        cc.director.loadScene(SceneType.Game)
    }
    updateNonWidgetSize() {
        Promise.resolve().then(() => {
            let w = cc.winSize.width
            this.toolbar.node.children.forEach(c => c.width = (w / this.toolbar.node.childrenCount - 6))
            this.pageViewContentNode.children.forEach(c => c.width = w)
            this.pageViewContentNode.stopAllActions()
            this.pageViewContentNode.x = -w / 2 - w * this.pageState
        })
    }
    onPageViewIndexCahnged(a, b) {
        this.pageState = this.pageView.getCurrentPageIndex()
        this.toolbar.animateButton(this.pageState)
        // MenuPageState
    }
}