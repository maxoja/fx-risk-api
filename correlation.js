const { delay } = require('bluebird')
const fetcher = require('./crawler')

const {POLL_INTERVAL} = require('./settings')

class TradePos {
    constructor(pair, buy) {
        this.pair = pair
        this.buy = buy
    }
}

const PAIR_ID = {
    AUDCAD: 8,
    AUDCHF: 47,
    AUDJPY: 9,
    AUDNZD: 10,
    AUDUSD: 11,
    CADCHF: 103,
    CADJPY: 12,
    CHFJPY: 46,
    EURAUD: 6,
    EURCAD: 13,
    EURCHF: 14,
    EURGBP: 17,
    EURJPY: 7,
    EURNZD: 20,
    EURUSD: 1,
    GBPAUD: 107,
    GBPCAD: 24,
    GBPCHF: 25,
    GBPJPY: 4,
    GBPNZD: 48,
    GBPUSD: 27,
    NZDCAD: 49,
    NZDCHF: 26,
    NZDJPY: 2,
    NZDUSD: 28,
    USDCAD: 5,
    USDCHF: 29,
    USDJPY: 3,
}

const correlationTable = {}
for(let pair in PAIR_ID) {
    correlationTable[pair] = {}
}

async function suggestTradePos(currentPositions) {
    const suggestions = []
    
    for(let pair in PAIR_ID) {
        let couldBuy = true;
        let couldSell = true;

        for(let pos of currentPositions) {
            if(pos.pair === pair) {
                couldBuy = false;
                couldSell = false;
                break;
            }

            const table = correlationTable[pair]
            if(Object.keys(table).length === 0) {
                await fetchCorrelationList(pair)
            }
            const correlation = table[pos.pair]
            if(couldBuy) {
                if(pos.buy && correlation > 50 )
                    couldBuy = false
                if(!pos.buy && correlation < -50)
                    couldBuy = false
            }
            if(couldSell) {
                if(pos.buy && correlation < -50)
                    couldSell = false
                if(!pos.buy && correlation > 50)
                    couldSell = false
            }
        }

        if(couldBuy)
            suggestions.push(new TradePos(pair, true))
        if(couldSell)
            suggestions.push(new TradePos(pair, false))
    }

    return suggestions
}

function rowPairSelector(id) {
    const oneBasedId = id+1
    return `#symbolMarketCorrelation > tbody > tr:nth-child(${oneBasedId}) > td:nth-child(1)`
}

function rowCorrelationSelector(id) {
    const oneBasedId = id+1
    return `#symbolMarketCorrelation > tbody > tr:nth-child(${oneBasedId}) > td:nth-child(2)`
}

async function fetchCorrelationList(pair) {
    console.log('fetching correlation of', pair)
    const pairId = PAIR_ID[pair]
    const allPairIds = Object.keys(PAIR_ID).map(function(key){
        return PAIR_ID[key];
    });

    const URL = `https://widgets.myfxbook.com/widgets/market-correlation.html?rowSymbols=${allPairIds.join()}&colSymbols=${pairId}&timeScale=1440`
    const onFetch = async (page) => {
        await page.waitForSelector('tr');

        for(let i = 0; i < Object.keys(PAIR_ID).length; i++) {
            const pairStr = await page.evaluate((s) => document.querySelector(s).innerText, rowPairSelector(i))
            const corStr = await page.evaluate((s) => document.querySelector(s).innerText, rowCorrelationSelector(i))
            const corPercent = parseFloat(corStr.substring(0, corStr.length-1))
            correlationTable[pair][pairStr] = corPercent
            console.log(pair, pairStr, corPercent)
        }
    }
    
    await fetcher.crawlAndProduce(URL, onFetch)
}

async function fetchLoop() {
    while(true) {
        for(let pair in PAIR_ID) {
            await fetchCorrelationList(pair)
            await delay(POLL_INTERVAL)
        }
    }
}

module.exports = {
    TradePos,
    fetchLoop,
    suggestTradePos
}