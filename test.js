const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.Quoine;

async function init() {
    // let markets = await exchange.getMarkets();
    // console.log(markets);

    let orderBook = await exchange.getOrderBook('USD', 'DASH');
    console.log(orderBook);
}

init();