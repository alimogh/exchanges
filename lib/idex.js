/**
 * Idex API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:idex');

const API_URL = 'https://api.idex.market';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)_(\w+)/);
  return [groups[1], groups[2]];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/returnTicker`;
  debug(`Getting markets list from url ${url}...`);

  request({
    uri: url,
    json: true,
    method: 'POST'
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      // some other error
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    const markets = {};
    let counter = 0;
    for (let mt in body) {
      let [market, ticker] = parseMarketName(mt);
      if (!market || !ticker) {
        continue;
      }

      let d = body[mt];
      if (d.baseVolume === "0") {
        continue;
      }

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
  
  const marketTicker = market + '_' + ticker;
  const url = `${API_URL}/returnOrderBook`;
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
    body: {market: marketTicker},
    method: 'POST'
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    // formatting response
    const res = {
      market: market,
      ticker: ticker,
      asks: body.asks ? body.asks.map(mapOrder) : [],
      bids: body.bids ? body.bids.map(mapOrder): []
    };

    resolve(res);
  });
});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};