//
// app.get('/assets', async (req, res) => {...});
//
// Return all the assets from the database:
//
const dbConnection = require("./database.js");

exports.get_assets = async (req, res) => {
  console.log("call to /assets...");

  try {
    //
    // TODO: remember we did an example similar to this in class with
    // movielens database (lecture 05 on Thursday 04-13)
    //
    // MySQL in JS:
    //   https://expressjs.com/en/guide/database-integration.html#mysql
    //   https://github.com/mysqljs/mysql
    //

    console.log("/users: calling RDS...");

    var sql = `
    SELECT * 
    FROM assets
    ORDER BY
    assetid`;

    dbConnection.query(sql, (err, results, _) => {
      if (err) {
        res.status(400).json({
          message: err.message,
          data: [],
        });
        return;
      }

      console.log("/assets query done");

      //handle results and display
      res.json({
        message: "success",
        data: results,
      });
    });
  } catch (err) {
    //try
    res.status(400).json({
      message: err.message,
      data: [],
    });
  } //catch
}; //get
