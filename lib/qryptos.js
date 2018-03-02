/**
 * Qryptos API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:qryptos');
const config = require('../config');

const API_URL = 'https://api.qryptos.com';

const MARKETS = config.MARKETS;

const MARKET_IDS = {};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/products`;
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

    // filtering active markets only
    const markets = {};
    let counter = 0;
    for (let d of body) {

      let ticker = d.base_currency;
      let market = d.quoted_currency;

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
      MARKET_IDS[market][ticker] = d.id;
    }

    debug(`Found ${counter} markets`);

    resolve(markets);

  });

});

const resolveMarketId = (market, ticker) => new Promise((resolve, reject) => {

  if (MARKET_IDS[market]) {
    return resolve(MARKET_IDS[market][ticker]);
  }

  getMarkets()
    .then(() => {
      resolve(MARKET_IDS[market][ticker]);
    })
    .catch(reject);

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {
  
  resolveMarketId(market, ticker)
    .then((market_id) => {

      const url = `${API_URL}/products/${market_id}/price_levels`;
      debug(`Getting order book for market ${market_id} from url ${url}...`);

      const mapOrder = (o) => {
        return {
          rate: parseFloat(o[0]),
          quantity: parseFloat(o[1])
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

        if (!body) {
          return reject(`Invalid response from url ${url}: ${JSON.stringify(body)}`);
        }

        // formatting response
        const res = {
          market_id: market_id,
          asks: body.sell_price_levels ? body.sell_price_levels.map(mapOrder) : [],
          bids: body.buy_price_levels ? body.buy_price_levels.map(mapOrder) : []
        };

        resolve(res);
      });
      
    })
    .catch(reject);

});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};