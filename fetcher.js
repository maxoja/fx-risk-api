const { delay } = require('bluebird')
const pup = require('./puppet')

const TEXT_INPUT_LOT = '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(1) > div:nth-child(2) > div:nth-child(1) > input'
const TEXT_OUTPUT_PIP_VALUE = '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(4) > div:nth-child(1) > div > input'
const DROP_PAIR = '#dp_currency_pair'
const DROP_BASE_CURRENCY = '#forex-calculator > div > div.col-sm-8 > form > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > select'
const DROP_ACCOUNT_TYPE = '#account_type_select'
const BUTTON_COOKIE = '#cookieModal > div > div > div.cookie-modal__defaultBlock > div.modal-body > div.row.text-center > div > button'
const BUTTON_CALCULATE = '#submit-btn'

const BASE_CURRENCY='USD'
const URL = 'https://www.xm.com/forex-calculators/pip-value'
const ACCOUNT_TYPE = 'Standard'
const CACHE_EXPIRE = 1000*60*60

const caches = {}

// recommended risk is at 1.5%
async function suggestLot(pair, distancePoints, risk=220.0) {    
    const pipValue = await fetchPipValue(pair)
    const result = calculateLot(pipValue, distancePoints, risk)
    console.log('suggested lot for', pair, '=', result)
    return result
}

async function fetchPipValue(pair, LOT=1) {
    if(pair in caches) {
        cachedObj = caches[pair]
        if(Date.now() - cachedObj.time <= CACHE_EXPIRE) {
            return cachedObj.value
        }
    }

    const browser = await pup.prepBrowser(false, true)
    const page = await pup.prepPage(browser, false)
    await page.goto(URL, {waitUntil:'load'})

    await pup.waitVisibleAndClick(page, BUTTON_COOKIE)
    await delay(1000)

    await page.select(DROP_PAIR, pair)
    await pup.waitVisibleAndType(page, TEXT_INPUT_LOT, LOT.toString())
    await page.select(DROP_BASE_CURRENCY, BASE_CURRENCY)
    await page.select(DROP_ACCOUNT_TYPE, ACCOUNT_TYPE)

    await pup.waitVisibleAndClick(page, BUTTON_CALCULATE)

    await pup.waitVisibleAndClick(page, TEXT_OUTPUT_PIP_VALUE)
    const pipValue = parseFloat(await page.evaluate(s=>document.querySelector(s).value,TEXT_OUTPUT_PIP_VALUE))
    await browser.close()
    
    caches[pair] = {
        time: Date.now(),
        value: pipValue
    }
    return pipValue
}

function calculateLot(pipValue, distancePoint, maxRisk) {
    const pointValue = pipValue/10.0
    const oneLotRisk = pointValue*distancePoint
    const goodLot = maxRisk/oneLotRisk
    return Math.floor(goodLot*100)/100
}

module.exports = {
    suggestLot
}