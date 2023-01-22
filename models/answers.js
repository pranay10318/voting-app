"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Answers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Answers.belongsTo(models.Questions, {
        foreignKey: "questionId",
      });
    }

    static async getAnswers(questionId) {
      return this.findAll({
        where: {
          questionId,
        },
      });
    }
    static async addAnswer({ title, questionId }) {
      return this.create({
        title,
        questionId,
      });
    }
    static async deleteAnswer({ id, questionId }) {
      return this.destroy({
        where: {
          id,
          questionId,
        },
      });
    }
  }
  Answers.init(
    {
      title: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Answers",
    }
  );
  return Answers;
};
