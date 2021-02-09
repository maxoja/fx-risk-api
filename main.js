const cors = require('cors')
const express = require('express');

const {TradePos} = require('./model')
const correlation = require('./correlation')
const risk = require('./risk')
const {BASE_PATH, PORT, AVG_CORRELATION_THRESH} = require('./settings')

const app = express();
app.use(express.json());
app.use(cors())

// middle ware for logging path of every request before passing to an endpoint handler
app.use((req, res, next) => {
    console.log('Request with path', req.path);
    console.log('Params', req.params)
    console.log('Body', req.body)
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
    res.send(suggestions.map(o => JSON.stringify(o)).join('<br/>'))
})

app.get(BASE_PATH + '/correlation/:positionStr', async (req, res) => {
    const positions = TradePos.parseList(req.params['positionStr'])
    const avgCorrelations = await correlation.calculateAverageCorrelation(positions)
    const selectedIdeal = {}
    const theRest = {}
    for(let pair in avgCorrelations) {
        if(Math.abs(avgCorrelations[pair]) <= AVG_CORRELATION_THRESH)
            selectedIdeal[pair] = avgCorrelations[pair]
        else
            theRest[pair] = avgCorrelations[pair]
    }

    res.header("Content-Type",'application/json');
    res.send(JSON.stringify([selectedIdeal, theRest], null, 4));
})

correlation.fetchLoop();
risk.fetchPipValueLoop();

app.listen(PORT, () => console.log(`Started server at http://localhost:${PORT}`));
