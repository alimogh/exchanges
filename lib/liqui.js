/**
 * Liqui API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:liqui');

const API_URL = 'https://api.liqui.io/api/3';
const DEFAULT_ORDEBOOK_DEPTH = 50;

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)_(\w+)/);
  return [groups[2].toUpperCase(), groups[1].toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/info`;
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
    for (let m in body.pairs) {
      let [market, ticker] = parseMarketName(m);

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

  const marketTicker = (ticker + '_' + market).toLowerCase();

  const url = `${API_URL}/depth/${marketTicker}?limit=${DEFAULT_ORDEBOOK_DEPTH}`;
  debug(`Getting order books from url ${url}...`);

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
      // some other error
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    const data = body[marketTicker];
    if (!data) {
      return reject(`Invalid response from url ${url}: ${body}`);
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: data.asks.map(mapOrder),
      bids: data.bids.map(mapOrder)
    };

    resolve(res);

  });

});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};
