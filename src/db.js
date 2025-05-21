const mysql = require('mysql2');

let connection;

function createConnection() {
  if (!connection) {
    connection = mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: '',
      database: 'vhcms',
    });
  }
  return connection;
}

module.exports = {
  getConnection: createConnection
};
