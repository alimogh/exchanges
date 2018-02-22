const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.Quoine;

exchange.getMarkets()
    .then((m) => {
        exchange.getOrderBook('BTC', 'ETH').then((b) => {
            debug(b);
        });
    });
