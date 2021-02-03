const { delay } = require('bluebird')
const pup = require('./puppet')

const CACHE_EXPIRE = 1000*60*60 // 60 min
const AUTO_FETCH_INTERFAL = 1000*60*1 // 1 min

const URL_CORRELATION = 'https://twnz.dev/webApi/fxLot/correlation'
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

let browser = null

function setBrowser(newBrowser) {
    browser = newBrowser
}

function getBrowser() {
    return browser
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
    const browser = getBrowser()
    const page = await pup.prepPage(browser, false)
    await page.goto(`${URL_CORRELATION}/${pair}`, {waitUntil:'load'})

    await page.waitForSelector('iframe[name="coframe"]');

    for(let i = 0; i < Object.keys(PAIR_ID).length; i++) {
        const frame = await page.frames().find(frame => frame.name() === 'coframe'); // Find the right frame.
        const pairStr = await frame.evaluate((s) => document.querySelector(s).innerText, rowPairSelector(i))
        const corStr = await frame.evaluate((s) => document.querySelector(s).innerText, rowCorrelationSelector(i))
        const corPercent = parseFloat(corStr.substring(0, corStr.length-1))
        correlationTable[pair][pairStr] = corPercent
    }
    console.log('fetching correlation of', pair, 'finished')

    await page.close()
}

// function calculateLot(pipValue, distancePoint, maxRisk) {
//     const pointValue = pipValue/10.0
//     const oneLotRisk = pointValue*distancePoint
//     const goodLot = maxRisk/oneLotRisk
//     return Math.floor(goodLot*100)/100
// }

async function fetchLoop() {
    console.log('fetch loop for correlation start')
    while(true) {
        for(let pair in PAIR_ID) {
            await fetchCorrelationList(pair, false)
            await delay(AUTO_FETCH_INTERFAL)
        }
    }
}

module.exports = {
    PAIR_ID,
    fetchLoop,
    setBrowser
}