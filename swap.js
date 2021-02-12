// const { delay } = require('bluebird')
// const crawler = require('./crawler')

// const {POLL_INTERVAL, PAIR_ID} = require('./settings')
// const rates = {}

// const elems = {
//     brokerCell: '#forexBrokerSwapTable > tbody > tr:nth-child(92) > td.bold',
//     shortCell: (i) => `#forexBrokerSwapTable > tbody > tr:nth-child(92) > td:nth-child(${2+i*3})`,
//     longCell: (i) => `#forexBrokerSwapTable > tbody > tr:nth-child(92) > td:nth-child(${3+i*3})`,
// }

// async function fetchSwapRates(pairs) {
//     console.log('crawling swap for pairs', pairs)
//     const leftOver = []
//     while(pairs.length > 4) {
//         leftOver.push(pairs.pop())
//     }

//     const pairIds = pairs.map(p => PAIR_ID[p])
//     const URL = `https://widgets.myfxbook.com/widgets/forex-brokers-swaps.html?symbols=${pairIds.join()}`

//     const onFetch = async (page, pup) => {
//         await page.waitForSelector(elems.brokerCell)
//         const brokerName = await pup.getText(page, elems.brokerCell)

//         if(!brokerName.toUpperCase().includes('XM')) {
//             console.log('Encounter unexpected broker name', brokerName)
//             return null
//         }

//         for(let i = 0; i < pairs.length; i++) {
//             const shortSwapStr = await pup.getText(page, elems.shortCell(i))
//             const longSwapStr = await pup.getText(page, elems.longCell(i))

//             rates[pairs[i]] = {
//                 short: parseFloat(shortSwapStr),
//                 long: parseFloat(longSwapStr)
//             }
//         }

//         return null
//     }

//     await crawler.crawlAndProduce(URL, onFetch)
    
//     if (leftOver.length > 0) {
//         await fetchSwapRates(leftOver)
//     }
// }

// async function fetchLoop() {
//     while(true) {
//         await fetchSwapRates([
//             'AUDCAD', 'AUDCHF', 'AUDJPY', 'AUDNZD',
//             'AUDUSD', 'CADCHF', 'CADJPY', 'CHFJPY',
//             'EURAUD', 'EURCAD', 'EURCHF', 'EURGBP',
//             'EURJPY', 'EURNZD', 'EURUSD', 'GBPAUD',
//             'GBPCAD', 'GBPCHF', 'GBPJPY', 'GBPNZD',
//             'GBPUSD', 'NZDCAD', 'NZDCHF', 'NZDJPY',
//             'NZDUSD', 'USDCAD', 'USDCHF', 'USDJPY'
//         ])
        
//         console.log(rates)
//         await delay(POLL_INTERVAL)
//     }
// }

// if (require.main == module) {
//     fetchLoop()
// }

const rates = {
    AUDCAD: {
        short: -2.77,
        long: -3.61
    },
    AUDCHF: {
        long: -1.48,
        short: -4.84
    },
    AUDJPY: {
        long: -2.73,
        short: -3.58
    },
    AUDNZD: {
        long: -3.37,
        short: -3.01
    },
    AUDUSD: {
        long: -2.56,
        short: -1.67
    },
    CADCHF: {
        long: -1.33,
        short: -5.09
    },
    CADJPY: {
        long: -2.61,
        short: -3.85
    },
    CHFJPY: {
        long: -6.48,
        short: -2.73
    },
    EURAUD: {
        long: -6.93,
        short: -3.13
    },
    EURCAD: {
        long: -7.22,
        short: -2.73
    },
    EURCHF: {
        long: -4.15,
        short: -5.83
    },
    EURGBP: {
        long: -5.40,
        short: -1.25
    },
    EURJPY: {
        long: -4.75,
        short: -1.89
    },
    EURNZD: {
        long: -7.31,
        short: -2.69
    },
    EURUSD: {
        long: -5.69,
        short: -0.89
    },
    GBPAUD: {
        long: -5.42,
        short: -5.88
    },
    GBPCAD: {
        long: -6.09,
        short: -5.30
    },
    GBPCHF: {
        long: -2.66,
        short: -8.71
    },
    GBPJPY: {
        long: -3.12,
        short: -4.26
    },
    GBPNZD: {
        long: -6.06,
        short: -5.34
    },
    GBPUSD: {
        long: -4.10,
        short: -3.40
    },
    NZDCAD: {
        long: -2.96,
        short: -2.96
    },
    NZDCHF: {
        long: -1.22,
        short: -4.70
    },
    NZDJPY: {
        long: -2.43,
        short: -3.48
    },
    NZDUSD: {
        long: -2.02,
        short: -1.92
    },
    USDCAD: {
        long: -2.81,
        short: -2.73
    },
    USDCHF: {
        long: -0.26,
        short: -5.22
    },
    USDJPY: {
        long: -2.00,
        short: -3.53
    },
}
module.exports = {
    // fetchLoop,
    rates,
}
