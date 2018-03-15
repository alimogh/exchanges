const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.Bitfinex;

const STANDARD_MAPPINGS = {
    'DAT': 'DATA'
};

async function init() {
    // let markets = await exchange.getMarkets();
    // debug(markets);

    let orderBook = await exchange.getOrderBook('BTC', 'DATA');
    debug(orderBook);
}

init();