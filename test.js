const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.TDAX;

async function init() {
    let markets = await exchange.getMarkets();
    console.log(markets);

    let orderBook = await exchange.getOrderBook('ETH', 'KNC');
    console.log(orderBook);
}

init();