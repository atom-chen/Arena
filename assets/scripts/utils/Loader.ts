export class Loader {
    static loadNode(url: string, withInstantiate = true): Promise<cc.Node | cc.Prefab> {
        return this.loadRes<cc.Prefab>(`prefabs/${url}`).then(p => withInstantiate ? cc.instantiate(p) : p)
    }
    // static loadDialog(dt: DialogType): Promise<cc.Node> {
    //     return this.loadRes<cc.Prefab>(`prefabs/dialogs/${dt}`).then(p => cc.instantiate(p))
    // }
    static loadRes<T>(url: string) { 
        return new Promise<T>((resolve, reject) => { 
            cc.loader.loadRes(`${url}`, (error, res) => {
                if (error) { cc.log(`no res for: ${url}`); reject(error) }
                else resolve(res)
            })
        })
    }
    static loadConfig(url: string) { 
        return this.loadRes<cc.JsonAsset>(`cfg/${url}`).then(data => data.json)
    }
    static loadTexture(url: string) { 
        return new Promise<cc.SpriteFrame>((resolve, reject) => {
            cc.loader.loadRes(`textures/${url}`, cc.SpriteFrame, (err, sprite) => {
                if (err) { cc.log("no texture", url); reject(err) }
                else resolve(sprite)
            })
        })
    }
    static loadTextureFromAtlas(atlas: string, url: string) { 
        return new Promise<cc.SpriteFrame>((resolve, reject) => {
            this.loadAtlas(atlas).then(a => {
                resolve(a.getSpriteFrame(url))
            })
            // cc.loader.loadRes(`textures/${url}`, cc.SpriteFrame, (err, sprite) => {
            //     if (err) { cc.log("no texture", url); reject(err) }
            //     else resolve(sprite)
            // })
        })
    }
    static loadAtlas(atlasName: string) {
        return new Promise<cc.SpriteAtlas>((resolve, reject) => 
            cc.loader.loadRes(`textures/${atlasName}`, cc.SpriteAtlas, (err, atlas: cc.SpriteAtlas) => {
                if (err) {
                    cc.log("[LOADER] error load atlass", atlasName)
                    reject(err)
                } else {
                    cc.log("[ATLAS LOAD]", atlasName, err)
                    resolve(atlas)
                }
            })
        )
    }
}

