const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.RightBTC;

async function init() {
    let markets = await exchange.getMarkets();
    console.log(markets);

    let orderBook = await exchange.getOrderBook('BTC', 'ETH');
    console.log(orderBook);
}

init();