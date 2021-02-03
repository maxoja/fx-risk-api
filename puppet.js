const puppeteer = require('puppeteer');
const fs = require('fs-promise')

PROXY_ARG = '--proxy-server=zproxy.lum-superproxy.io:22225'
PROXY_USERNAME = ''
PROXY_PASSWORD = ''

async function waitVisibleAndClick(page, selector) {
    await page.waitForFunction('document.querySelector("' + selector + '") !== null')
    await page.waitForSelector(selector, {visible:true})
    await page.click(selector)
}

async function waitVisibleAndType(page, selector, text) {
    await waitVisibleAndClick(page, selector)
    await pressBackspaces(page)
    await page.type(selector, text)
}

async function pressBackspaces(page, backspaces=20) {
    for (let i = 0; i < backspaces; i++) {
        await page.keyboard.press('Backspace');
    }
}

async function prepBrowser(proxy = true, headless = false) {
    const args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process']

    if(proxy) {
        args.push(PROXY_ARG)
    }

    return await puppeteer.launch({ headless, args })
}

async function prepPage(browser, useProxy, width=2000, height=1000) {
    let page = await browser.newPage();
    await page.setViewport({ width, height });
    if(useProxy) {
        await page.authenticate({
            username: 'PROXY_USERNAME',
            password: 'PROXY_PASSWORD'
        });
    }
    return page
}

async function useThrottlingInPage(page) {
    // Connect to Chrome DevTools
    const client = await page.target().createCDPSession()
    //   Set throttling property
    await client.send('Network.emulateNetworkConditions', {
        'offline': false,
        'downloadThroughput': 70000,
        'uploadThroughput': 100000,
        'latency': 0
    })
}

async function loadSessionIntoPage(page, cookiesFilePath=null, localStorageFilePath=null) {
    if(!cookiesFilePath && !localStorageFilePath) {
        console.log('xx Given null cookies and local storage dump file location')
        return
    }

    if (cookiesFilePath) {
        console.log('.. Load cookies', cookiesFilePath)
        cookies = JSON.parse(await fs.readFile(cookiesFilePath));
        await page.setCookie(...cookies);
        console.log('.. Cookies loaded')
    }
    
    if(localStorageFilePath) {
        console.log('.. Load local storage', localStorageFilePath)
        localStorageObj = JSON.parse(await fs.readFile(localStorageFilePath));
        await page.evaluate((locObj) => {
            for(let key in locObj)
            localStorage.setItem(key, locObj[key]);
        }, localStorageObj);
        console.log('.. Local storage loaded')
    }
}

async function testProxy() {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--proxy-server=zproxy.lum-superproxy.io:22225']
      });
    let page = await browser.newPage();
    await page.authenticate({
        username: 'lum-customer-hl_f35b523f-zone-static',
        password: 'n5wtofxif0el'
    });
    await page.goto('http://lumtest.com/myip.json');
    await page.screenshot({path: 'example.png'});

    page = await browser.newPage();
    await page.authenticate({
        username: 'lum-customer-hl_f35b523f-zone-static',
        password: 'n5wtofxif0el'
    });
    await page.goto('http://lumtest.com/myip.json');
    await page.screenshot({path: 'example.png'});
    await browser.close();
}

if (require.main == module) {
    testProxy()
}

module.exports = {
    prepBrowser,
    prepPage,
    loadSessionIntoPage,
    useThrottlingInPage,
    waitVisibleAndClick,
    waitVisibleAndType
}
