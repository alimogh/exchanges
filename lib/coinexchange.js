/**
 * Coinexchange API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:coinexchange');

const API_URL = 'https://www.coinexchange.io/api/v1';

const MARKETS = ['BTC', 'ETH', 'USDT', 'USD'];

const MARKET_IDS = {};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/getmarkets`;
  debug(`Getting markets list from url ${url}...`);

  request({
    uri: url,
    json: true,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      // some other error
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    if (!body.result) {
      // some other error
      return reject(`Invalid data received from ${url}: ${JSON.stringify(body)}`);
    }

    // filtering active markets only
    const markets = {};
    let counter = 0;
    for (let d of body.result) {
      if (d.Active !== true) {
        continue;
      }

      let market = d.BaseCurrencyCode;
      let ticker = d.MarketAssetCode;

      if (MARKETS.indexOf(market) === -1) {
        // skipping market
        continue;
      }

      if (!markets[market]) {
        markets[market] = [];
      }

      if (!MARKET_IDS[market]) {
        MARKET_IDS[market] = {};
      }
      
      counter += 1;
      markets[market].push(ticker);
      MARKET_IDS[market][ticker] = d.MarketID;
    }

    debug(`Found ${counter} markets`);

    resolve(markets);

  });

});



const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {
  
  const market_id = MARKET_IDS[market][ticker];

  const url = `${API_URL}/getorderbook?market_id=${market_id}`;
  debug(`Getting order book for market ${market_id} from url ${url}...`);

  const mapOrder = (o) => {
    return {
      rate: parseFloat(o.Price),
      quantity: parseFloat(o.Quantity)
    };
  };

  request({
    uri: url,
    json: true,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    if (!body || !body.result) {
      return reject(`Invalid response from url ${url}: ${JSON.stringify(body)}`);
    }

    // formatting response
    const res = {
      market_id: market_id,
      asks: body.result.SellOrders ? body.result.SellOrders.map(mapOrder) : [],
      bids: body.result.BuyOrders ? body.result.BuyOrders.map(mapOrder) : []
    };

    resolve(res);
  });
});


module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};