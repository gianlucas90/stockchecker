'use strict';
const mongoose = require('mongoose');
const { Schema } = mongoose;
require('dotenv').config();

const fetch = require('node-fetch');

module.exports = function (app) {
  mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;
  db.on('error', console.error.bind(console, 'connection error:'));

  db.once('open', function () {
    console.log('we are conncected to the db!');
  });

  // To delete all documents in the database everytime restart the server!
  // db.dropDatabase();

  /////////////////// Schemas
  const stockSchema = new Schema({
    symbol: { type: String, required: true },
    likes: {
      type: Number,
      default: 0,
    },
  });

  /////////////////// Models
  const Stock = mongoose.model('Stock', stockSchema);

  app.route('/api/stock-prices').get(async function (req, res) {
    const { stock, like } = req.query;

    let search = { symbol: stock };

    // Case if multiple stocks
    if (Array.isArray(stock)) {
      search = { $or: [{ symbol: stock[0] }, { symbol: stock[1] }] };
    }

    // Check if stock/s exist in database
    let results = await Stock.find(search, (err, arrayOfResults) => {
      if (!err && arrayOfResults) {
        return arrayOfResults;
      }
    }).lean();

    // If there is/are not we need to create it/them
    if (results.length === 0) {
      // Only one submited
      let newStock = await new Stock({ symbol: stock[0] });
      newStock.save();
      results[0] = newStock;

      // if 2 submitted
      if (Array.isArray(stock)) {
        let newStock2 = await new Stock({ symbol: stock[1] });
        newStock2.save();
        results[1] = newStock2;
      }
    }

    // 2 submitted but one exist (not done)

    // If we have likes we need to update the db
    if (like) {
      results.forEach(async function (item) {
        await Stock.findByIdAndUpdate(item._id, { $inc: { likes: 1 } });
      });
    }

    // Send back results
    if (results.length == 1) {
      const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${results[0].symbol}/quote`;
      // Call fetch to get stock value
      let response = await fetch(url);
      let json = await response.json();
      results[0].price = json.latestPrice;
      return res.json({
        stockData: {
          stock: results[0].symbol,
          price: results[0].price,
          likes: !like ? results[0].likes : results[0].likes + 1,
        },
      });
    }

    if (results.length == 2) {
      for (var i = 0; i < results.length; i++) {
        const url = `https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/${results[i].symbol}/quote`;
        // Call fetch to get stock value
        let response = await fetch(url);
        let json = await response.json();
        results[i]['price'] = json.latestPrice;
      }

      return res.json({
        stockData: [
          {
            stock: results[0].symbol,
            price: results[0].price,
            rel_likes: !like
              ? results[0].likes - results[1].likes
              : results[0].likes - results[1].likes + 1,
          },
          {
            stock: results[1].symbol,
            price: results[1].price,
            rel_likes: !like
              ? results[1].likes - results[0].likes
              : results[1].likes - results[0].likes + 1,
          },
        ],
      });
    }
  });
};
