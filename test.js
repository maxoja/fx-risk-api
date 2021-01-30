const fetcher = require('./fetcher')

async function f(){
    await fetcher.suggestLot('AUDNZD', 400)
    await fetcher.suggestLot('AUDCAD', 400)
    await fetcher.suggestLot('AUDNZD', 400)
}

f()