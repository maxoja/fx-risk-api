const cors = require('cors')
const express = require('express');

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

app.get(BASE_PATH + '/correlation/:pair', (req, res) => {
    const pairId = fetcherCor.PAIR_ID[req.params['pair']]
    const allPairIds = Object.keys(fetcherCor.PAIR_ID).map(function(key){
        return fetcherCor.PAIR_ID[key];
    });

    res.send(`
<!-- myfxbook.com forexCorrelationWidget - Start -->
    <div>
        <iframe src="https://widgets.myfxbook.com/widgets/market-correlation.html?rowSymbols=${allPairIds.join()}&colSymbols=${pairId}&timeScale=1440" name="coframe" width="100%" height="100%" frameborder="0"></iframe>
    </div>
    <div style="font-size: 10px">
        &copy; Powered By
        <a href="https://www.myfxbook.com" class="myfxbookLink" target="_self" rel="noopener noreferrer">
            <strong>
                Myfxbook.com
            </strong>
        </a>
    </div>
    <!-- myfxbook.com forexCorrelationWidget - End -->
`)
})

fetcher.fetchPipValueLoop();
fetcherCor.fetchLoop();
app.listen(PORT, () => console.log(`Started server at http://localhost:${PORT}`));
