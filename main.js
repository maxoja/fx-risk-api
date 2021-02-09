const cors = require('cors')
const express = require('express');

const {TradePos} = require('./model')
const correlation = require('./correlation')
const risk = require('./risk')
const {BASE_PATH, PORT} = require('./settings')

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
    const splitted = req.params['positionStr'].split(',')
    const positions = splitted.map(TradePos.parse)
    const suggestions = await correlation.suggestDiversification(positions)
    res.send(suggestions.map(o => JSON.stringify(o)).join('<br/>'))
})

app.get(BASE_PATH + '/correlation/:positionStr', async (req, res) => {
    const splitted = req.params['positionStr'].split(',')
    const positions = splitted.map(TradePos.parse)
    const avgCorrelations = await correlation.calculateAverageCorrelation(positions)
    res.header("Content-Type",'application/json');
    res.send(JSON.stringify(avgCorrelations, null, 4));
    // res.send(avgCorrelations)
    // res.send(suggestions.map(o => JSON.stringify(o)).join('<br/>'))
})

correlation.fetchLoop();
risk.fetchPipValueLoop();

app.listen(PORT, () => console.log(`Started server at http://localhost:${PORT}`));
