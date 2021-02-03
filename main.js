const cors = require('cors')
const express = require('express');

const pup = require('./puppet')
const fetcher = require('./fetcher')
const fetcherCor = require('./fetcherCorrelation')
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
    const lot = await fetcher.suggestLot(pair, points)
    console.log('suggested lot for', pair, '=>', lot)
    res.json({
        pair,
        points,
        lot
    })
})

app.get(BASE_PATH + '/diversify/:positionStr', async (req, res) => {
    const splitted = req.params['positionStr'].split(',')
    const positions = splitted.map(s => s.substr(0,1) === '-' ? new fetcherCor.TradePos(s.substring(1), false) : new fetcherCor.TradePos(s, true))
    const suggestions = await fetcherCor.suggestTradePos(positions)
    res.send(suggestions.map(o => JSON.stringify(o)).join('<br/>'))
})

async function initFetchers() {
    console.log('initiating browser for fetchers')
    const browser = await pup.prepBrowser(false, true)
    fetcher.setBrowser(browser)
    fetcherCor.setBrowser(browser)
    fetcherCor.fetchLoop();
    fetcher.fetchPipValueLoop();
}

initFetchers()

app.listen(PORT, () => console.log(`Started server at http://localhost:${PORT}`));
