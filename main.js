const cors = require('cors')
const express = require('express');

const {TradePos} = require('./model')
const correlation = require('./correlation')
const risk = require('./risk')
const swap = require('./swap')
const {BASE_PATH, PORT, NEUTRAL_CORRELATION_THRESH, UNBALANCED_CORRELATION_THRESH} = require('./settings')

const app = express();
app.use(express.json());
app.use(cors())

// middle ware for logging path of every request before passing to an endpoint handler
app.use((req, res, next) => {
    console.log('Request with path', req.path);
    // console.log('Params', req.params)
    // console.log('Body', req.body)
    next();
})

app.get(BASE_PATH + '/:pair-:points', async (req, res) => {
    const pair = req.params['pair']
    const points = parseInt(req.params['points'])
    const lot = await risk.suggestLot(pair, points)
    console.log('suggested lot for', pair, '=>', lot)
    res.json({
        pair,
        points,
        lot
    })
})

app.get(BASE_PATH + '/diversify/:positionStr', async (req, res) => {
    const positions = TradePos.parseList(req.params['positionStr'])
    const suggestions = await correlation.suggestDiversification(positions)
    const result = suggestions.map(o => JSON.stringify(o)).join('<br/>')
    console.log('suggest diversify =>', result)
    res.send(result)
})

app.get(BASE_PATH + '/correlation/:positionStr', async (req, res) => {
    const positions = TradePos.parseList(req.params['positionStr'])
    const avgCorrelations = await correlation.calculateAverageCorrelation(positions)
    const result = {
        neutral: {},
        allowShort: {},
        allowLong: {},
        others: {}
    }
    for(let pair in avgCorrelations) {
        const correlation = avgCorrelations[pair]
        if(Math.abs(correlation) <= NEUTRAL_CORRELATION_THRESH){
            result.neutral[pair] = correlation
        } else if(correlation > UNBALANCED_CORRELATION_THRESH) {
            result.allowShort[pair] = correlation
        } else if (correlation < -UNBALANCED_CORRELATION_THRESH) {
            result.allowLong[pair] = correlation
        } else {
            result.others[pair] = correlation
        }
    }
    console.log('return correlation', result)
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(result, null, 4));
})

app.get(BASE_PATH + '/swaps', async (req, res) => {
    const swapRates = swap.rates;

    const result = {
        badLongRate: [],
        badShortRate: []
    }

    for(let pair in swapRates) {
        const swapObj = swapRates[pair]
        
        result.badLongRate.push({
            pair,
            swap: swapObj.long
        })

        result.badShortRate.push({
            pair,
            swap: swapObj.short
        })
    }

    result.badLongRate.sort((a,b) => a.swap - b.swap)
    result.badShortRate.sort((a,b) => a.swap - b.swap)
    result.badLongRate = result.badLongRate.map(o => o.pair + ' ' + o.swap).slice(0, 10)
    result.badShortRate = result.badShortRate.map(o => o.pair + ' ' + o.swap).slice(0, 10)
    console.log('return sorted swap rates', result)
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(result, null, 4));
})

correlation.fetchLoop();
risk.fetchPipValueLoop();

app.listen(PORT, () => console.log(`Started server at http://localhost:${PORT}`));
