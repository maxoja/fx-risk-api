function emptyObject(o) {
    return Object.keys(o).length == 0
}

function roundPrecision(f, n=2) {
    return Math.floor(f*(10**n))/parseInt(10**n)
}

class CachingObject {
    constructor(expirationSec) {
        this.expirationMs = expirationSec*1000
        this.caches = {}
    }

    hasValidKey(key) {
        if(!Object.keys(this.caches).includes(key))
            return false

        if(Date.now() - this.caches[key].time >= this.expirationMs)
            return false

        return true
    }

    getValidCache(key) {
        if(!this.hasValidKey(key))
            return null
            
        return this.caches[key].value
    }

    setCache(key, value) {
        this.caches[key] = {
            time: Date.now(),
            value: value
        }
    }
}

module.exports = {
    emptyObject,
    roundPrecision,
    CachingObject
}