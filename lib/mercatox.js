/**
 * Mercatox API client.
 */

const request = require('request');
const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');
const debug = require('debug')('cointrage:exchanges:mercatox');

const API_URL = 'https://mercatox.com';

const parseMarketName = (str) => {
  const groups = str.match(/(\w+)_(\w+)/);
  if (!groups) {
    return [null, null];
  }

  return [groups[2].toUpperCase(), groups[1].toUpperCase()];
};

const getMarkets = () => new Promise((resolve, reject) => {

  const url = `${API_URL}/public/json24`;
  debug(`Getting markets list from url ${url}...`);

  request({
    uri: url,
    json: true,
    method: 'GET'
  }, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      // some other error
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}. ${JSON.stringify(body)}`);
    }

    // filtering active markets only
    const markets = {};
    let counter = 0;
    for (let m in body.pairs) {
      let d = body.pairs[m];
      if (d.isFrozen !== '0' || !parseFloat(d.quoteVolume)) {
        continue;
      }

      let [market, ticker] = parseMarketName(m);
      if (!market || !ticker) {
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
  
  const url = `${API_URL}/exchange/${ticker}/${market}`;
  debug(`Getting order book from url ${url}...`);

  cloudscraper.get(url, (err, response, body) => {
    if (err) return reject(err);

    if (response.statusCode !== 200) {
      // some other error
      return reject(`Invalid status code received from url ${url}: ${response.statusCode}`);
    }

    // parsing html to get order book
    let $;
    try {
      $ = cheerio.load(body);  
    } catch (e) {
      return reject(`Could not parse HTML page from url ${url}: ${e}`);
    }

    // parsing asks and bids
    const asks = [];
    $('div[data="orders"][data-stack-action="sell"]')
      .find('.row')
      .each((i, e) => {
        asks.push({ 
          rate: parseFloat(e.attribs['price']), 
          quantity: parseFloat(e.attribs['amount'])
        });
      });

    const bids = [];
    $('div[data="orders"][data-stack-action="buy"]')
      .find('.row')
      .each((i, e) => {
        bids.push({ 
          rate: parseFloat(e.attribs['price']), 
          quantity: parseFloat(e.attribs['amount'])
        });
      });

    const res = {
      market: market,
      ticker: ticker,
      asks: asks,
      bids: bids
    };

    resolve(res);

  });

});


module.exports = {

    getMarkets: getMarkets,

    getOrderBook: getOrderBook

};