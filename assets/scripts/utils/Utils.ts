export module utils {
    export function randInt(fromIn: number, toIn?: number) {
        if (toIn === undefined) {
            toIn = fromIn
            fromIn = 0
        } 
        let dist = Math.abs(toIn - fromIn)
        let r = Math.floor(Math.random() * 100000 % (dist + 1))
        return toIn > fromIn ? fromIn + r : fromIn - r
    }
    export function randFromArray<T>(array: Array<T>) {
        return array[randInt(array.length - 1)]
    }
    export function buttonHandler(target: cc.Node, component: string, event: string) {
        let handler = new cc.Component.EventHandler()
        handler.target = target
        handler.component = component
        handler.handler = event
        return handler
    }
    export function shuffleArray<T>(a: Array<T>): Array<T> {
        let dopArray = Array.from({length: a.length}, (_, i) => i)
        let newArray = []
        while (dopArray.length > 0) {
            let ri = randInt(dopArray.length - 1)
            let r = dopArray[ri]
            newArray.push(a[r])
            dopArray = [...dopArray.slice(0, ri), ...dopArray.slice(ri + 1)]
        }
        return newArray
    }
    export function getSubArrays<T>(a: Array<T>, count: number): Array<Array<T>> {
        return Array.from({ length: Math.ceil(a.length / count) }, (_, i) => a.slice(i * count, i * count + count))
    }
    export function flatten<T>(a: Array<Array<T>>): Array<T> { return a.reduce((p, n) => p.concat(n), []) }
    export function copyInstance<T>(a: T) {
        return Object.assign(Object.create(Object.getPrototypeOf(a)), a)
    }
    export function runFunction(f: (i: number) => void, count: number) {
        for (let i = 0; i < count; i++) f(i)
    }
    export function applyOnAllChildren(node: cc.Node, cb: (node: cc.Node) => void) {
        node.children.forEach(c => { cb(c); applyOnAllChildren(c, cb) })
    }
    export function getColor(w: string) {
        if (w.startsWith("der")) return cc.Color.BLUE 
        else if (w.startsWith("die")) return cc.Color.RED 
        else if (w.startsWith("das")) return cc.Color.GREEN
        else return cc.Color.BLACK
    }
    export function splitArray<T>(a: Array<T>, cb: (t: T) => number): Array<Array<T>> {
        let withAttr = a.map(t => { return {t: t, s: cb(t)} }).sort((a, b) => a.s - b.s)
        return withAttr.reduce((p, n) => {
            if (p.length > 0) {
                if (last(p)[0].s == n.s) {
                    last(p).push(n)
                } else p.push([n])
            } else {
                p.push([n])
            }
            return p
        }, new Array<Array<{t: T, s: number}>>()).map(t => t.map(tt => tt.t))
    }
    export function last<T>(a: Array<T>): T { return a[a.length - 1] }
    export function zip<T, P>(a: Array<T>, b: Array<P>): Array<{left: T, right: P}> {
        if (a.length >= b.length) return a.map((itemA, i) => { return { left: itemA, right: b[i] } })
        else return b.map((itemB, i) => { return { left: a[i], right: itemB } })
    }
    export function onlyUniq<T>(a: Array<T>, testFunction: (a: T, b: T) => boolean = (a, b) => a == b): Array<T> {
        let ret: Array<T> = []
        a.forEach(element => {
            if (ret.find(e => testFunction(e, element)) == undefined) {
                ret.push(element)
            }
        })
        return ret
    }
    export function FileSave(sourceText, fileIdentity) {
        var workElement = document.createElement("a");
        if ('download' in workElement) {
            workElement.href = "data:" + 'text/plain' + "charset=utf-8," + escape(sourceText);
            workElement.setAttribute("download", fileIdentity);
            document.body.appendChild(workElement);
            var eventMouse = document.createEvent("MouseEvents");
            eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            workElement.dispatchEvent(eventMouse);
            document.body.removeChild(workElement);
        } else throw 'File saving not supported for this browser';
    }
    export function vecToDegree(vec: cc.Vec2) {
        let n = vec.normalize()
        return Math.atan2(n.x, n.y) * 180 / Math.PI - 90
    }
}