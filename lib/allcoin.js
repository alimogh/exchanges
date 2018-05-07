/**
 * Allcoin API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:allcoin');
const config = require('../config');

const API_URL = 'https://www.allcoin.ca';
const MARKETS = config.MARKETS;

/**
 * Mappings of bitfinex tickets to standard.
 */
const STANDARD_MAPPINGS = {
  'ANS': 'NEO'
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/Api_Market/getPriceList`;
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
    for (let m in body) {

      let market = m.toUpperCase();
      if (MARKETS.indexOf(market) === -1) {
        continue;
      }

      if (!markets[market]) {
        markets[market] = [];
      }

      for (let t of body[m]) {
        let ticker = t.coin_from.toUpperCase();

        if (STANDARD_MAPPINGS[ticker]) {
          ticker = STANDARD_MAPPINGS[ticker];
        }

        counter += 1;
        markets[market].push(ticker);
      }
    }

    debug(`Found ${counter} markets`);

    resolve(markets);

  });

});

const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {
  
  for (let mp in STANDARD_MAPPINGS) {
      if (STANDARD_MAPPINGS[mp] === ticker) {
        ticker = mp;
      }
  }

  const marketTicker = ticker.toLowerCase() + '2' + market.toLowerCase();
  const url = `${API_URL}/market/depths?depth=${marketTicker}`;
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

    if (STANDARD_MAPPINGS[ticker]) {
      ticker = STANDARD_MAPPINGS[ticker];
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: body.asks ? body.asks.map(mapOrder) : [],
      bids: body.bids ? body.bids.map(mapOrder) : []
    };

    resolve(res);
  });
});

module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};
