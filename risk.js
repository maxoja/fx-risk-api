const { delay } = require('bluebird')
const pup = require('./puppet')
const crawler = require('./crawler')
const utils = require('./utils')

const {BASE_CURRENCY, CACHE_EXPIRE, POLL_INTERVAL} = require('./settings')

const TEXT_INPUT_LOT = '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input'
const TEXT_OUTPUT_PIP_VALUE = '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(4) > div:nth-child(1) > div > input'
const DROP_PAIR = '#dp_currency_pair'
const DROP_BASE_CURRENCY = '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > select'
const DROP_ACCOUNT_TYPE = '#account_type_select'
const BUTTON_COOKIE = '#cookieModal > div > div > div.cookie-modal__defaultBlock > div.modal-body > div.row.text-center > div > button'
const BUTTON_CALCULATE = '#submit-btn'

const URL = 'https://www.xm.com/forex-calculators/pip-value'
const ACCOUNT_TYPE = 'Standard'
const AUTO_FETCH_PAIRS = ['EURUSD', 'AUDCAD', 'AUDNZD', 'EURCHF', 'EURGBP', 'USDJPY', 'EURCHF', 'EURSGD', 'EURAUD']

const caches = {}

// recommended risk is at 1.5%
async function suggestLot(pair, distancePoints, risk=220.0) {    
    const pipValue = await fetchPipValueOneLot(pair)
    const result = calculateLot(pipValue, distancePoints, risk)
    return result
}

let cookiesConfirmed = false;
async function fetchPipValueOneLot(pair, useCache=true) {
    pairBase = pair.substring(pair.length-3)
    if(useCache & pairBase in caches) {
        cachedObj = caches[pairBase]
        if(Date.now() - cachedObj.time <= CACHE_EXPIRE) {
            if(cachedObj.value !== null)
                return cachedObj.value
        }
    }

    console.log('fetching pip value of', pair)

    const onFetch = async (page) => {
        if(!cookiesConfirmed) {
            await pup.waitVisibleAndClick(page, BUTTON_COOKIE)
            cookiesConfirmed = true
        }
    
        await delay(1000)
        await page.select(DROP_PAIR, pair)
        await pup.waitVisibleAndType(page, TEXT_INPUT_LOT, '1')
        await page.select(DROP_BASE_CURRENCY, BASE_CURRENCY)
        await page.select(DROP_ACCOUNT_TYPE, ACCOUNT_TYPE)
    
        await pup.waitVisibleAndClick(page, BUTTON_CALCULATE)
    
        await pup.waitVisibleAndClick(page, TEXT_OUTPUT_PIP_VALUE)
        const pipValue = parseFloat(await page.evaluate(s=>document.querySelector(s).value,TEXT_OUTPUT_PIP_VALUE))
        
        caches[pairBase] = {
            time: Date.now(),
            value: pipValue
        }
    
        console.log('fetching pip value of', pair, 'finished', pipValue)
        return pipValue
    }

    await crawler.crawlAndProduce(URL, onFetch)
    return await fetchPipValueOneLot(pair)
}

function calculateLot(pipValue, distancePoint, maxRisk) {
    const pointValue = pipValue/10.0
    const oneLotRisk = pointValue*distancePoint
    const goodLot = maxRisk/oneLotRisk
    return utils.roundPrecision(goodLot, 2)
}

async function fetchPipValueLoop() {
    console.log('fetch loop starting on', AUTO_FETCH_PAIRS)
    while(true) {
        for(let pair of AUTO_FETCH_PAIRS) {
            await fetchPipValueOneLot(pair, false)
            await delay(POLL_INTERVAL)
        }
    }
}

module.exports = {
    suggestLot,
    fetchPipValueLoop
}