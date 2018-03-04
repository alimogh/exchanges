/**
 * Okex API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:okex');
const config = require('../config');

const API_URL = 'https://www.okex.com/api/v1';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)_(\w+)/);
  return [groups[2].toUpperCase(), groups[1].toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `https://www.okex.com/v2/markets/tickers`;
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
    for (let d of body.data) {
      if (!d.volume) {
        continue;
      }

      let [market, ticker] = parseMarketName(d.symbol);

      if (MARKETS.indexOf(market) === -1) {
        continue;
      }

      if (!markets[market]) {
        markets[market] = [];
      }
      
      counter += 1;
      markets[market].push(ticker);
    }

    debug(`Found ${counter} markets`);

    resolve(markets);

  });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {
  
  const marketTicker = ticker.toLowerCase() + '_' + market.toLowerCase();
  const url = `${API_URL}/depth.do?symbol=${marketTicker}`;
  debug(`Getting order book for market ${marketTicker} from url ${url}...`);

  const mapOrder = (o) => {
    return {
      rate: o[0],
      quantity: o[1]
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

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: body.asks ? body.asks.map(mapOrder).reverse() : [],
      bids: body.bids ? body.bids.map(mapOrder) : []
    };

    resolve(res);
  });
});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};