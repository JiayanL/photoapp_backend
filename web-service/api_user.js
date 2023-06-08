//
// app.put('/user', async (req, res) => {...});
//
// Inserts a new user into the database, or if the
// user already exists (based on email) then the
// user's data is updated (name and bucket folder).
// Returns the user's userid in the database.
//
const dbConnection = require("./database.js");

exports.put_user = async (req, res) => {
  console.log("call to /user...");

  try {
    var data = req.body; // data => JS object
    const email = data.email;
    const lastname = data.lastname;
    const firstname = data.firstname;
    const bucket_folder = data.bucketfolder;

    // check that email is in users table
    var sql = `
    SELECT *
    FROM users
    WHERE email = '${email}'`;

    check_email = new Promise((resolve, reject) => {
      dbConnection.query(sql, (err, results, _) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(results);
      });
    });

    check_email.then((results) => {
      // if email is not in users table --> insert the user and return
      if (results.length == 0) {
        sql = `
        INSERT INTO users (email, lastname, firstname, bucketfolder)
        VALUES ('${email}', '${lastname}', '${firstname}', '${bucket_folder}')`;

        dbConnection.query(sql, (err, results, _) => {
          if (err) {
            res.status(400).json({
              message: err.message,
              userid: -1,
            });
            return;
          } else {
            res.json({
              message: "inserted",
              userid: results.insertId,
            });
          }
        });
      }

      // if email is in users table --> update the user and return
      else {
        sql = `
        UPDATE users
        SET lastname = '${lastname}', firstname = '${firstname}', bucketfolder = '${bucket_folder}'
        WHERE email = '${email}'
        `;

        dbConnection.query(sql, (err, results, _) => {
          if (err) {
            res.status(400).json({
              message: err.message,
              userid: -1,
            });
            return;
          } else {
            sql = `
            SELECT userid
            FROM users
            WHERE email = '${email}'`;

            dbConnection.query(sql, (err, results, _) => {
              if (err) {
                res.status(400).json({
                  message: err.message,
                  userid: -1,
                });
                return;
              } else {
                res.json({
                  message: "updated",
                  userid: results[0].userid,
                });
              }
            });
          }
        });
      }
      console.log("/user done, sending response...");
    });
  } catch (err) {
    //try
    res.status(400).json({
      message: err.message,
      userid: -1,
    });
  } //catch
}; //put
