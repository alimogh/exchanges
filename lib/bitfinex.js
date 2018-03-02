/**
 * Bitfinex API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:bitfinex');
const config = require('../config');

const API_URL = 'https://api.bitfinex.com/v1';

const MARKETS = config.MARKETS;

/**
 * Mappings of bitfinex tickets to standard.
 */
const STANDARD_MAPPINGS = {
  'DAT': 'DATA'
};

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)(\w{3,3})/);
  return [groups[2].toUpperCase(), groups[1].toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/symbols`;
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

    const markets = {};
    let counter = 0;
    for (let p of body) {

      let [market, ticker] = parseMarketName(p);

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
  
  const marketTicker = ticker + market;
  const url = `${API_URL}/book/${marketTicker}`;
  debug(`Getting order book for market ${marketTicker} from url ${url}...`);

  const mapOrder = (o) => {
    return {
      rate: parseFloat(o.price),
      quantity: parseFloat(o.amount)
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
      asks: body.asks.map(mapOrder),
      bids: body.bids.map(mapOrder)
    };

    resolve(res);
  });
});

module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};
