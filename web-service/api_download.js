//
// app.get('/download/:assetid', async (req, res) => {...});
//
// downloads an asset from S3 bucket and sends it back to the
// client as a base64-encoded string.
//
const dbConnection = require("./database.js");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3, s3_bucket_name, s3_region_name } = require("./aws.js");

exports.get_download = async (req, res) => {
  // MySQL in JS:
  //   https://expressjs.com/en/guide/database-integration.html#mysql
  //   https://github.com/mysqljs/mysql
  // AWS:
  //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
  //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/getobjectcommand.html
  //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/

  console.log("call to /download...");

  try {
    // extract assetid
    asset_id = req.params.assetid;

    // find key
    var sql = `
    SELECT *
    FROM assets
    WHERE
    assetid = ${asset_id}`;

    var rds_response = new Promise((resolve, reject) => {
      console.log("/download: calling RDS to find asset...");

      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("/download: found keyname for asset...");
        resolve(results);
      });
    });

    rds_response
      .then((results) => {
        const entry = results[0];
        const key = entry.bucketkey;
        const assetname = entry.assetname;
        const userid = entry.userid;

        // initialize command
        const command = new GetObjectCommand({
          Bucket: s3_bucket_name,
          Key: key,
        });
        return s3.send(command).then((response) => {
          return { response, assetname, key, userid };
        });
      })
      .then(({ response, assetname, key, userid }) => {
        return response.Body.transformToString("base64").then((datastr) => {
          return { datastr, assetname, key, userid };
        });
      })
      .then(({ datastr, assetname, key, userid }) => {
        res.json({
          message: "success",
          user_id: userid,
          asset_name: assetname,
          bucket_key: key,
          data: datastr,
        });
      })
      .catch((err) => {
        res.status(200).json({
          message: "No such asset...",
          user_id: -1,
          asset_name: "?",
          bucket_key: "?",
          data: [],
        });
      });
  } catch (err) {
    //try
    //
    // generally we end up here if we made a
    // programming error, like undefined variable
    // or function:
    //
    res.status(400).json({
      message: err.message,
      user_id: -1,
      asset_name: "?",
      bucket_key: "?",
      data: [],
    });
  } //catch
}; //get
