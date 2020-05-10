
export class EventHandler {
    owner = null
    constructor(owner, onEvent, public once = false) {
        this.owner = owner
        this.cbOnEvent = onEvent
    }
    onEvent(args?) { this.cbOnEvent(args) }
    private cbOnEvent = null
}
const useEventTag = '__useEvent'

export class EventPool {
    private static _pool = new EventPool()
    private _events = new Array<Event>()
    static removeAll(owner: cc.Node) { 
        let subscribed = []
        this._getChildsWithSubscribe(owner, subscribed)
        EventPool._pool._events.forEach(e => {
            if (e.handlers.length > 0) e.handlers = e.handlers.filter(h => subscribed.find(c => c == h.owner) == null)
        }) 
    }
    private static _getChildsWithSubscribe(owner: cc.Node, array: Array<cc.Node>) {
        if (owner[useEventTag]) array.push(owner)
        owner.children.forEach(c => this._getChildsWithSubscribe(c, array))
    }
    static push(event: Event) { EventPool._pool._events.push(event) }
}

export class Event<T = any> {
    result: T = null
    constructor(result?: T) { EventPool.push(this); this.result = result }

    handlers: EventHandler[] = new Array()
    add(handler: EventHandler): T
    add(owner: cc.Component, cb: (t: T) => void, msg?): T
    add(owner: any, cb: (t: T) => void, msg?): T
    add(owner, cb?, msg?) {
        let handler = owner instanceof EventHandler ? owner: new EventHandler(owner, cb) 
        if (owner instanceof cc.Component) {
            owner[useEventTag] = true
            let old = owner['onDestroy']
            owner['onDestroy'] = () => { // TODO test
                this.handlers = this.handlers.filter(h => h != handler) 
                old && old.call(owner)
            }
        } 
        this.handlers.push(handler); return this.result 
    }
    replace(owner, cb): T { // TODO: could it be formulated better?
        var h = this.handlers.find(h => h.owner === owner)
        h ? h.onEvent = cb: this.handlers.push(new EventHandler(owner, cb))
        return this.result
    }
    dispatch(args?: T) { 
        this.handlers.forEach(h => h.onEvent(args)) 
        this.handlers = this.handlers.filter(h => h.once == false)
    }
    remove(handler: EventHandler) { this.handlers = this.handlers.filter(h => h != handler) }
    removeAll(owner?) { 
        if (owner) this.handlers = this.handlers.filter(h => h.owner != owner) 
        else this.handlers = []
    }
    static subscribeEventOnce(e: Event, cb: (a) => void) {
        let h = new EventHandler(this, a => { e.remove(h); cb(a) })
        e.add(h)
    }
}

