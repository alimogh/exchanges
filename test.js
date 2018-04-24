const debug = require('debug')('cointrage:exchanges:test');
const exchanges = require('./index');
const exchange = exchanges.Bittrex;

const STANDARD_MAPPINGS = {
    'DAT': 'DATA'
};

async function init() {
    let markets = await exchange.getMarkets();
    console.log(markets);

    let orderBook = await exchange.getOrderBook('BTC', 'BCH');
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

    // const data = {
    //     asset: 'ETH'
    // };
    // let depositsData = await exchange.getDepositAddress(data);
    // debug(depositsData);

}

init();