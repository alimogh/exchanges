const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.Quoine;

async function init() {
    let markets = await exchange.getMarkets();
    debug(markets);

    let orderBook = await exchange.getOrderBook('BTC', 'ETH');
    debug(orderBook);
}

init();