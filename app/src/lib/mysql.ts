import mysql from "mysql2/promise";

declare global {
  // กัน pool ถูกสร้างซ้ำตอน dev hot-reload
  // eslint-disable-next-line no-var
  var __mysqlPool: mysql.Pool | undefined;
}

export const pool =
  global.__mysqlPool ??
  mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

if (process.env.NODE_ENV !== "production") global.__mysqlPool = pool;
