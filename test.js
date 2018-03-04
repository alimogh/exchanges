const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.YoBit;

async function init() {
    // let markets = await exchange.getMarkets();
    // console.log(markets);

    let orderBook = await exchange.getOrderBook('BTC', 'DASH');
    console.log(orderBook);
}

init();