// connectDB.js

const Sequelize = require("sequelize");

const database = "vote-db";
const username = "postgres";
const password = "postgres";
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
  logging: false, //to remove everytime logging
});

sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((error) => {
    console.error("Unable to connect to the database:", error);
  });
