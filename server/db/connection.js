const { MongoClient } = require("mongodb");
var sqlsv = require("mssql");

const {
  DATABASE,
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASS,
  DB_RS_Name,
} = process.env;

let initDB = async (
  host = DB_HOST,
  port = DB_PORT,
  user = DB_USER,
  pass = DB_PASS,
  database = DATABASE,
  RS_Name = DB_RS_Name
) => {
  try {
    let path = pathDB(host, port, database, user, pass, RS_Name);
    console.log("connect", path);
    // console.log("global DATABASE: ", process.env.DATABASE);
    return await MongoClient.connect(path, {useUnifiedTopology: true});
  } catch (error) {
    throw error;
  }
};

function pathDB(host, port, database, user, pass, RS_Name) {
  let path = `mongodb://${host}:${port}/${database}`;
  if (user !== "#" && pass !== "#") {
    path = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(
      pass
    )}@${host}:${port}/${database}`;
    if (RS_Name && RS_Name != "#") {
      path = `mongodb://${encodeURIComponent(user)}:${encodeURIComponent(
        pass
      )}@${host.split(',').map(i => `${i}:${port}`)}/${database}?replicaSet=${RS_Name}`;
    }
  }

  return path;
}

let initMssqlDB = async () => {
  try {
    var { user, password, server, database } = _config.cisco;
    // connect to your database
    return await sqlsv.connect({
      user,
      password,
      server,
      database,
      options: {
        enableArithAbort: false, // ko hiểu, chỉ là thêm vào config mssql cho ko báo warning khi running
      },
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  initDB,
  pathDB,
  initMssqlDB,
};
