/**
 * EtherDelta API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:etherdelta');
const config = require('../config');

const API_URL = 'https://api.etherdelta.com';
const ORDER_BOOK_DEPTH = 50;

const MARKET_IDS = {};

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)_(\w+)/);
  if (!groups) {
    debug(`Invalid market name: ${str}`);
    return null;
  }

  return [groups[1], groups[2]];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/returnTicker`;
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

    if (!body) {
      // some other error
      return reject(`Invalid data received from ${url}: ${JSON.stringify(body)}`);
    }

    // filtering active markets only
    const markets = {};
    let counter = 0;

    for (let m in body) {
      let mt = parseMarketName(m);
      if (!mt) {
        continue;
      }

      // filtering zero volume tickers
      if (body[m].baseVolume == 0) {
        continue;
      }

      let [market, ticker] = mt;

      if (ticker.indexOf('0x') === 0) {
        // skipping unknown tickers
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
      MARKET_IDS[market][ticker] = body[m].tokenAddr;
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

      const url = `${API_URL}/orders/${market_id}/0`;

      const mapOrder = (o) => {
        return {
          rate: parseFloat(o.price),
          quantity: parseFloat(o.ethAvailableVolume)
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
          return reject(`Empty response from url ${url}`);
        }

        const res = {
          tokenAddr: market_id,
          bids: body.buys ? body.buys.slice(0, ORDER_BOOK_DEPTH).map(o => mapOrder(o)) : [],
          asks: body.sells ? body.sells.slice(0, ORDER_BOOK_DEPTH).map(o => mapOrder(o)) : []
        };

        resolve(res);
      });

    });

});


module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};