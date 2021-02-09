const { delay } = require('bluebird')
const fetcher = require('./crawler')

const utils = require('./utils')
const {TradePos} = require('./model')
const {POLL_INTERVAL, CORRELATION_THRESH, PAIR_ID} = require('./settings')
const correlationTable = {}

function init() {
    for(let pair in PAIR_ID) {
        correlationTable[pair] = {}
    }
}

async function calculateAverageCorrelation(currentPositions) {
    const scores = {}

    for(let pair in PAIR_ID) {
        
        let correlationSum = 0
        let isHolding = false
        const correlations = correlationTable[pair]

        if(utils.emptyObject(correlations))
            await fetchCorrelationList(pair)

        for(let pos of currentPositions) {
            if(pos.pair === pair) {
                isHolding = true;
                break
            }
            const correlation = correlations[pos.pair]
            correlationSum += correlation
        }

        if(isHolding)
            continue

        const averageCorrelation = correlationSum/currentPositions.length
        scores[pair] = Math.round(averageCorrelation)
    }

    return scores
}

async function suggestDiversification(currentPositions) {
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
                if(pos.buy && correlation > CORRELATION_THRESH )
                    couldBuy = false
                if(!pos.buy && correlation < -CORRELATION_THRESH)
                    couldBuy = false
            }
            if(couldSell) {
                if(pos.buy && correlation < -CORRELATION_THRESH)
                    couldSell = false
                if(!pos.buy && correlation > CORRELATION_THRESH)
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
        }

        return null
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

init()

module.exports = {
    fetchLoop,
    suggestDiversification,
    calculateAverageCorrelation
}