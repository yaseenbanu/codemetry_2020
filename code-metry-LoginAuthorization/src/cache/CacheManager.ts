import NodeCache = require("node-cache");

export class CacheManager {
    private static instance: CacheManager;
    private myCache: { get: (arg0: string) => any; set: (arg0: string, arg1: any, arg2: number | undefined) => void; };

    private constructor() {
        // default cache of 2 minutes
        this.myCache = new NodeCache({ stdTTL: 120 });
    }

    static getInstance(): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager();
        }

        return CacheManager.instance;
    }

    get(key: string) {
        return this.myCache.get(key);
    }

    set(key: string, value: any, ttl: number = -1) {
        if (ttl > 0) {
            this.myCache.set(key, value, ttl);
        } else {
            // use the standard cache ttl
            this.myCache.set(key, value, -1);
        }
    }
}