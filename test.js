const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.GateIO;

const STANDARD_MAPPINGS = {
    'DAT': 'DATA'
};

async function init() {
    // let markets = await exchange.getMarkets();
    // debug(markets);

    let orderBook = await exchange.getOrderBook('ETH', 'STORJ');
    console.log(orderBook);

    // let accountInfo = await exchange.getAccountInfo({});
    // debug(accountInfo);

    // const data = {
    //     symbol: 'ETHBTC',
    //     side: 'BUY',
    //     type: 'MARKET',
    //     quantity: 100
    // };
    // let orderInfo = await exchange.createOrder(data);
    // debug(orderInfo);

    // const data = {
    //     symbol: 'SUBBTC'
    // };
    // let ordersData = await exchange.getAllOrders(data);
    // debug(ordersData);


}

init();