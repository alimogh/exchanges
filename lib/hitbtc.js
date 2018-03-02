/**
 * HitBTC API client.
 */

const request = require('request');
const debug = require('debug')('cointrage:exchanges:hitbtc');

const API_URL = 'https://api.hitbtc.com/api/1';

const MARKETS = ['ETH', 'BTC', 'USDT', 'USD'];

const parseMarketName = (str) => {
    const market = MARKETS.filter((o) => {
        return (str.substr(str.length - o.length).toUpperCase() === o);
    }).toString();

    return [market , str.slice(0, -market.length).toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/public/ticker`;
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
    for (let mt in body) {
      let [market, ticker] = parseMarketName(mt);
      
      if (MARKETS.indexOf(market) === -1) {
        continue;
      }

      let d = body[mt];

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
  const url = `${API_URL}/public/${marketTicker}/orderbook?format_price=1&format_amount=1`;
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

    if (!body) {
      return reject(`Invalid response: ${JSON.stringify(body)}`);
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