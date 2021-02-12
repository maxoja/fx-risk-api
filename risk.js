const { delay } = require('bluebird')
const pup = require('./puppet')
const crawler = require('./crawler')
const utils = require('./utils')
const {BASE_CURRENCY, CACHE_EXPIRE_SEC, POLL_INTERVAL, AUTO_FETCH_PAIRS, ACCOUNT_TYPE} = require('./settings')

const URL = 'https://www.xm.com/forex-calculators/pip-value'
const elems = {
    textInputLot: '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input',
    textOutputPipValue: '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(4) > div:nth-child(1) > div > input',
    dropPair: '#dp_currency_pair',
    dropBaseCurrency: '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > select',
    dropAccountType: '#account_type_select',
    buttonCookie: '#cookieModal > div > div > div.cookie-modal__defaultBlock > div.modal-body > div.row.text-center > div > button',
    buttonCalculate: '#submit-btn'
}
let cookiesConfirmed = false;
const caches = new utils.CachingObject(CACHE_EXPIRE_SEC)

// recommended risk is at 1.5%
async function suggestLot(pair, distancePoints, risk=220.0) {    
    const pipValue = await crawlPipValueOneLot(pair)
    const result = calculateLot(pipValue, distancePoints, risk)
    return result
}

async function crawlPipValueOneLot(pair, useCache=true) {
    pairBase = pair.substring(pair.length-3)
    const cachedValue = caches.getValidCache(pairBase)
    if(useCache && cachedValue != null && !isNaN(cachedValue)) {
        console.log('found pip value cache for', pairBase, '=', cachedValue)
        return cachedValue
    }
    
    console.log('crawl pip value for', pairBase)
    await delay(3000)
    const onFetch = async (page) => {
        if(!cookiesConfirmed) {
            await pup.waitVisibleAndClick(page, elems.buttonCookie)
            cookiesConfirmed = true
        }
    
        await delay(1000)
        await page.select(elems.dropPair, pair)
        await pup.waitVisibleAndType(page, elems.textInputLot, '1')
        await page.select(elems.dropBaseCurrency, BASE_CURRENCY)
        await page.select(elems.dropAccountType, ACCOUNT_TYPE)
        await pup.waitVisibleAndClick(page, elems.buttonCalculate)
    
        await pup.waitVisibleAndClick(page, elems.textOutputPipValue)
        await delay(500)
        const pipValueText = await page.evaluate(s=>document.querySelector(s).value, elems.textOutputPipValue)
        const pipValue = parseFloat(pipValueText)
        caches.setCache(pairBase, pipValue)
        return pipValue
    }

    await crawler.crawlAndProduce(URL, onFetch)
    return await crawlPipValueOneLot(pair, true)
}

function calculateLot(pipValue, distancePoint, maxRisk) {
    const pointValue = pipValue/10.0
    const oneLotRisk = pointValue*distancePoint
    const goodLot = maxRisk/oneLotRisk
    return utils.roundPrecision(goodLot, 2)
}

async function fetchPipValueLoop() {
    while(true) {
        for(let pair of AUTO_FETCH_PAIRS) {
            await crawlPipValueOneLot(pair, false)
            await delay(POLL_INTERVAL)
        }
    }
}

module.exports = {
    suggestLot,
    fetchPipValueLoop
}