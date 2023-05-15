//
// app.get('/bucket?startafter=bucketkey', async (req, res) => {...});
//
// Retrieves the contents of the S3 bucket and returns the
// information about each asset to the client. Note that it
// returns 12 at a time, use startafter query parameter to pass
// the last bucketkey and get the next set of 12, and so on.
//
const { ListObjectsV2Command } = require("@aws-sdk/client-s3");
const { s3, s3_bucket_name, s3_region_name } = require("./aws.js");

exports.get_bucket = async (req, res) => {
  console.log("call to /bucket...");

  try {
    // AWS:
    //   https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/javascript_s3_code_examples.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/listobjectsv2command.html
    //   https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/
    //

    // initialize input
    var input = {
      Bucket: s3_bucket_name,
      MaxKeys: 12,
    };

    // set startAfter page if I've set it
    if (req.query.startafter) {
      console.log(req.query.startafter);
      input.StartAfter = req.query.startafter;
    }

    const command = new ListObjectsV2Command(input);

    // Get all items in my page
    console.log("Fetching /buckets...");
    const { Contents, IsTruncated, NextContinuationToken } = await s3.send(
      command
    );

    // Return result
    res.json({
      message: "success",
      data: Contents || [],
    });
  } catch (err) {
    //try
    res.status(400).json({
      message: err.message,
      data: [],
    });
  } //catch
}; //get
