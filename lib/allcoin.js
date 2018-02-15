/**
 * Allcoin API client.
 */

const request = require('request');
const debug = require('debug')('exchanges:allcoin');

const API_URL = 'https://api.allcoin.com/api/v1';
const MARKETS = ['ETH', 'BTC', 'USDT'];

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `https://www.allcoin.com/Home/MarketOverViewDetail`;
  debug(`Getting markets list from url ${url}...`);

  request({
    uri: url,
    json: true,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
    }
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      // some other error
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    if (!body.marketCoins) {
      // some other error
      return reject(`No data ${url}: ${JSON.stringify(body)}`);
    }

    const markets = {};
    let counter = 0;
    for (let m of body.marketCoins) {

      let market = m.Secondry;
      if (MARKETS.indexOf(market) === -1) {
        continue;
      }

      if (!markets[market]) {
        markets[market] = [];
      }

      for (let t of m.Markets) {
        let ticker = t.PrimaryName;

        counter += 1;
        markets[market].push(ticker);
      }
    }

    debug(`Found ${counter} markets`);

    resolve(markets);

  });

});



const getOrderBook = (market, ticker) => new Promise((resolve, reject) => {
  
  const marketTicker = ticker.toLowerCase() + '_' + market.toLowerCase();
  const url = `${API_URL}/depth?symbol=${marketTicker}`;
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
