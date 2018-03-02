/**
 * Cryptopia API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:cryptopia');
const config = require('../config');

const API_URL = 'https://www.cryptopia.co.nz/api';

const MARKETS = config.MARKETS;

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)\/(\w+)/);
  if (!groups) {
    return [];
  }

  return [groups[2].toUpperCase(), groups[1].toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/GetMarkets`;
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

    if (!body || !body.Data) {
      // some other error
      return reject(`Invalid data received from ${url}: ${JSON.stringify(body)}`);
    }

    const markets = {};
    let counter = 0;
    for (let d of body.Data) {
      let [market, ticker] = parseMarketName(d.Label);
      if (!market || !ticker) {
        continue;
      }

      if (MARKETS.indexOf(market) === -1) {
        continue;
      }

      if (!/^[a-zA-Z]/.test(ticker)) {
        // invalid ticker
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
  
  const marketTicker = ticker + '_' + market;
  const url = `${API_URL}/GetMarketOrders/${marketTicker}/50`;
  debug(`Getting order book for market ${marketTicker} from url ${url}...`);

  const mapOrder = (o) => {
    return {
      rate: o.Price,
      quantity: o.Volume
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

    if (!body || !body.Data) {
      return reject(`Invalid data got from url ${url}: ${JSON.stringify(body)}`);
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: body.Data.Sell ? body.Data.Sell.map(mapOrder) : [],
      bids: body.Data.Buy ? body.Data.Buy.map(mapOrder) : []
    };

    resolve(res);
  });
});


module.exports = {

  getMarkets: getMarkets,

  getOrderBook: getOrderBook

};