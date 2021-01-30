const cors = require('cors')
const express = require('express');

const fetcher = require('./fetcher')
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

fetcher.fetchLoop();
app.listen(PORT, () => console.log(`Started server at http://localhost:${PORT}`));
