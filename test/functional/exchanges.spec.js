/**
 * Exchanges tests.
 */

const debug = require('debug')('cointrage:exchanges:testing:functional');
const chai = require('chai');
const jsonfile = require('jsonfile');
const file = 'test/exchanges.json';
const MARKETS = require('../../config').MARKETS;
const exchanges = require('../../index');

// configure chai
const expect = chai.expect;
chai.should();

describe('Exchanges tests', function () {
    this.timeout(0);

    let marketList = {};

    it('tests getMarkets for all exchanges', async () => {
        for (let ex of Object.keys(exchanges)) {
            const exchange = exchanges[ex];
            const markets = await exchange.getMarkets();
            marketList[ex] = markets;
            expect(Object.keys(markets).length).to.be.above(0);
            // debug(marketList);
        }

        // save it into a file for later usage
        await jsonfile.writeFile(file, marketList);
    });

    it('tests getOrderBook for all exchanges', () => {
        jsonfile.readFile(file, async (err, obj) => {
            if (err) debug(err);

            let marketList = obj;
            for (let ex of Object.keys(marketList)) {
                const exchange = exchanges[ex];
                const exchangeObj = marketList[ex];
                for (let mt of MARKETS) {
                    const markets = exchangeObj[mt];
                    if (!markets) {
                        continue;
                    }

                    let orderBook = {};
                    for (let tk of markets) {
                        orderBook = await exchange.getOrderBook(mt, tk);
                        if (orderBook.asks.length && orderBook.bids.length) {
                            break;
                        }
                    }

                    if (orderBook.asks.length && orderBook.bids.length) {
                        let isAskValid = true,
                            isBidValid = true;
                        // validate if asks are in increasing order and numbers
                        for (let [index, ask] of orderBook.asks.entries()) {
                            if (index < orderBook.asks.length-1) {
                                if (ask.rate > orderBook.asks[index+1].rate || isNaN(ask.rate)) {
                                    isAskValid = false;
                                }
                            }
                        }

                        // validate if bids are in decreasing order and numbers
                        for (let [index, bid] of orderBook.bids.entries()) {
                            if (index < orderBook.bids.length-1) {
                                if (bid.rate < orderBook.bids[index+1].rate || isNaN(bid.rate)) {
                                    isBidValid = false;
                                }
                            }
                        }

                        debug(ex, orderBook.market, orderBook.ticker, isAskValid, isBidValid);
                        if (!isAskValid || !isBidValid) {
                            debug(orderBook);
                        }

                        expect(isAskValid).to.be.true;
                        expect(isBidValid).to.be.true;

                        break;
                    }

                }
            }
        });

    });


});