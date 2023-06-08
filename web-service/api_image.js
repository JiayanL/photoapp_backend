//
// app.post('/image/:userid', async (req, res) => {...});
//
// Uploads an image to the bucket and updates the database,
// returning the asset id assigned to this image.
//
const dbConnection = require("./database.js");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3, s3_bucket_name, s3_region_name } = require("./aws.js");

const uuid = require("uuid");
const fs = require("fs");
const exifParser = require("exif-parser");

exports.post_image = async (req, res) => {
  console.log("call to /image...");

  try {
    var data = req.body; // data => JS object

    // retrieve userid, assetname, and data
    const userid = req.params.userid;
    const assetname = data.assetname;
    const string_image = data.data;
    console.log(string_image);
    const bytes_image = Buffer.from(string_image, "base64");

    // check that user exists in db
    let sql = `
    SELECT *
    FROM users
    WHERE userid = '${userid}'`;

    check_user = await new Promise((resolve, reject) => {
      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });

    if (check_user.length == 0) {
      res.status(200).json({
        message: "no such user...",
        assetid: -1,
      });
    } else {
      // userid exists

      // // Prefix key with user's bucket folder and / with .jpg extension
      const bucketfolder = check_user[0].bucketfolder;
      const name = uuid.v4();
      const key = bucketfolder + "/" + name + ".jpg";

      // upload image to S3
      const command = new PutObjectCommand({
        Bucket: s3_bucket_name,
        Key: key,
        Body: bytes_image,
      });

      const response = await s3.send(command);

      // insert a new row into assets table of the database
      sql = `
    INSERT INTO assets (userid, assetname, bucketkey)
    VALUES ('${userid}', '${assetname}', '${key}')`;

      insert_response = await new Promise((resolve, reject) => {
        dbConnection.query(sql, (err, results, _) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(results);
        });
      });

      if (insert_response) {
        res.json({
          message: "so far so good",
          assetid: insert_response.insertId,
        });
      } else {
        res.status(400).json({
          message: "error inserting asset",
          assetid: -1,
        });
      }
    }

    // // userid exists

    // // // Prefix key with user's bucket folder and / with .jpg extension
    // const bucketfolder = check_user[0].bucketfolder;
    // const name = uuid.v4();
    // const key = bucketfolder + "/" + name + ".jpg";

    // // upload image to S3
    // const command = new PutObjectCommand({
    //   Bucket: s3_bucket_name,
    //   Key: key,
    //   Body: bytes_image,
    // });

    // const response = await s3.send(command);

    // // insert a new row into assets table of the database
    // sql = `
    // INSERT INTO assets (userid, assetname, bucketkey)
    // VALUES ('${userid}', '${assetname}', '${key}')`;

    // insert_response = await new Promise((resolve, reject) => {
    //   dbConnection.query(sql, (err, results, _) => {
    //     if (err) {
    //       reject(err);
    //       return;
    //     }
    //     resolve(results);
    //   });
    // });

    // if (insert_response) {
    //   res.json({
    //     message: "so far so good",
    //     assetid: insert_response.insertId,
    //   });
    // } else {
    //   res.status(400).json({
    //     message: "error inserting asset",
    //     assetid: -1,
    //   });
    // }
  } catch (err) {
    //try
    res.status(400).json({
      message: err.message,
      assetid: -1,
    });
  } //catch
}; //post
