const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const coinutExchange = exchanges.Coinut;

coinutExchange.getMarkets()
    .then((m) => {
        coinutExchange.getOrderBook('BTC', 'ETH').then((b) => {
            // debug(b);
        });
    });
