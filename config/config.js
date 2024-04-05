module.exports = {
    "development": {
      "username": process.env.DEV_DB_USERNAME,
      "password": process.env.DEV_DB_PASSWORD,
      "database": process.env.DEV_DB_NAME,
      "host": process.env.DEV_DB_HOST,
      "port": process.env.DEV_DB_PORT,
      "dialect": "postgres"
    },
    "test": {
      "username": process.env.TEST_DB_USERNAME,
      "password": process.env.TEST_DB_PASSWORD,
      "database": process.env.TEST_DB_NAME,
      "host": process.env.TEST_DB_HOST,
      "port": process.env.TEST_DB_PORT,
      "dialect": "postgres"
    },
    "production": {
      "username": process.env.PROD_DB_USERNAME,
      "password": process.env.PROD_DB_PASSWORD,
      "database": process.env.PROD_DB_NAME,
      "host": process.env.PROD_DB_HOST,
      "port": process.env.PROD_DB_PORT,
      "dialect": "postgres"
    }
}