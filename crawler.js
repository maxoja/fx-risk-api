const pup = require('./puppet')

let browser = null

async function getBrowser() {
    if (browser === null) {
        browser = await pup.prepBrowser(false, true)
    }
    return browser
}

async function crawlAndProduce(URL, onFetch) {
    const browser = await getBrowser()
    const page = await pup.prepPage(browser, false)
    await page.goto(URL, {waitUntil:'load'})
    const result = await onFetch(page, pup)
    await page.close()
    return result
}

module.exports = {
    crawlAndProduce
}