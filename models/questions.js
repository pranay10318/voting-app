"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Questions extends Model {
    static associate(models) {
      Questions.belongsTo(models.Elections, {
        foreignKey: "electionId",
      });
      Questions.hasMany(models.Answers, {
        foreignKey: "questionId",
      });
    }
    static async addQuestion({ title, description, electionId }) {
      //refactoring for business logic and we can add a todo at any endpoint
      return this.create({
        title,
        description,
        electionId,
      }); //userId shorthand property  for attribut and value same in javascript
    }
    static async getQuestions(electionId) {
      return this.findAll({
        where: {
          electionId,
        },
      });
    }
    static async deleteQuestion({ id, electionId }) {
      return this.destroy({
        where: {
          id,
          electionId,
        },
      });
    }
  }
  Questions.init(
    {
      title: DataTypes.STRING,
      description: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Questions",
    }
  );
  return Questions;
};
