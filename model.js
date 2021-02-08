class TradePos {
    constructor(pair, buy) {
        this.pair = pair
        this.buy = buy
    }

    static parse(stringPos) {
        const initial = stringPos.substr(0,1)

        if(initial === '-')
            return new TradePos(stringPos.substring(1), false)
        else
            return new TradePos(stringPos, true)
    }
}

module.exports = {
    TradePos
}