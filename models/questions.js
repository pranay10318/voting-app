"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Questions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Questions.belongsTo(models.Elections, {
        foreignKey: "electionId",
      });
      Questions.hasMany(models.Answers, {
        foreignKey: "questionId",
      });
    }
  }
  Questions.init(
    {
      title: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Questions",
    }
  );
  return Questions;
};
