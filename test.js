const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.Qryptos;

async function init() {
    let markets = await exchange.getMarkets();
    console.log(markets);

    let orderBook = await exchange.getOrderBook('ETH', 'AMLT');
    console.log(orderBook);
}

init();