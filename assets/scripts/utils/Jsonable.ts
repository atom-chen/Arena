
export class Json {
    static get<T>(v, dv: T) : T { return v != null ? v : dv } 
}

export function jp(jkey?: string, defaultValue?: any, type?) {
    return function(target: Jsonable, key: string) {
        target['addJsonableElement'](jkey ? jkey : key, key, defaultValue, type)
    }
}

export function jarray(jkey: string, type, defaultValue = []) {
    return function(target: Jsonable, key: string) {
        target['addJsonableArray'](jkey, key, defaultValue, type)
    }
}

class JValue {
    constructor(k, dv, t) { this.key = k; this._default = dv; this.type = t }
    private _default: any
    default(data) { return this._default !== undefined ? typeof this._default === 'function' ? this._default(data) : this._default : undefined }
    key: string
    type: any
}

class JArray {
    constructor(k, dv, t) { this.key = k; this.default = dv; this.type = t }

    key: string
    default: any
    type: any
}

export class Jsonable {
    protected _jValues: Map<string, JValue>
    protected _jArrays: Map<string, JArray>
    
    private addJsonableElement(j, k, dv, type?) { 
        this.addJsonable(j, k, dv, '_jValues', type)
    }

    private addJsonableArray(j, k, dv, t) { 
        this.addJsonable(j, k, dv, '_jArrays', t)
    }

    private addJsonable(j, k, dv, name, t) {
        let arrays = name == '_jArrays'
        if (Object.getOwnPropertyDescriptor(this, name) == null) {
            if (arrays) this[name] = new Map<string, JArray>()
            else this[name] = new Map<string, JValue>()
        }
        if (arrays) this[name].set(j, new JArray(k, dv, t))
        else this[name].set(j, new JValue(k, dv, t))
        // Since target is now specific to, append properties defined in parent.
        let parentTarget = Object.getPrototypeOf(this)
        let parentMap = parentTarget[name]
        if (parentMap) {
            parentMap.forEach((e, jkey) => {
                if (!this[name].has(jkey)) this[name].set(jkey, e)
            })
        }
    }

    private _createIfTypeExist(e: JValue) {
        if (!this[e.key] && e.type != undefined) this[e.key] = new e.type()
    }
    private _tryFromJson(e: JValue, jobj) {
        if (this[e.key] && this[e.key]['fromJson']) { this[e.key]['fromJson'](jobj); return true }
        return false
    }
    private _computeArrays(json, withDefault) {
        if (this._jArrays) {
            this._jArrays.forEach((e, jkey) => { 
                if (json[jkey] !== undefined) {
                    this[e.key] = []
                    json[jkey].forEach(jdata => {
                        let a = new e.type(jdata)
                        if (typeof a === 'function') a && (a = new a())
                        if (a === undefined) cc.log('[FROM JSON] undefined class to create for:', jdata)
                        this[e.key].push(a)
                        let element = this[e.key][this[e.key].length - 1]
                        element.fromJson(jdata)
                    })
                } else if (withDefault) this[e.key] = e.default
            })
        } return this
    }
    private _computeValues(json, withDefault) {
        if (this._jValues) {
            this._jValues.forEach((e, jkey) => { let jobj = json[jkey]
                if (jobj !== undefined) {
                    this._createIfTypeExist(e)
                    if (!this._tryFromJson(e, jobj)) this[e.key] = jobj
                } else if (withDefault) this[e.key] = e.default(this)
            })
        } return this
    }
    fromJson(json) { json && this._computeValues(json, true)._computeArrays(json, true); return this }
    updateByJson(json) { json && this._computeValues(json, false)._computeArrays(json, false); return this }
    toJson(): any { var jobject: {[name: string]: any} = {}
        if (this._jValues) {
            this._jValues.forEach((e, jkey) => {
                if (this[e.key] && this[e.key]['toJson']) {
                    if (this[e.key]['dontSave'] != true) jobject[jkey] = this[e.key]['toJson']()
                } else if (this[e.key] != undefined) jobject[jkey] = this[e.key]
            })
        }
        if (this._jArrays) this._jArrays.forEach((e, jkey) => this[e.key] && (jobject[jkey] = this[e.key].map(el => el.toJson())))
        return jobject
    }
    toJsonString() { return JSON.stringify(this.toJson()) }
}

export module JP {
    export class Vec2 extends Jsonable {
        constructor(x = 0, y = 0) { super()
            this.x = x; this.y = y 
        }
        @jp() x: number
        @jp() y: number

        update(x: number, y: number) {
            this.x = x
            this.y = y
        }
        checkEq(other: Vec2) { return this.x == other.x && this.y == other.y }
        get fastDist() { return this.x * this.x + this.y * this.y }
        get dist() { return Math.sqrt(this.fastDist) }
        get v2() { return cc.v2(this.x, this.y) }
        get zero() { return this.x == 0 && this.y == 0 }
    }
}