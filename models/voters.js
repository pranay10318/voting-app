"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Voters extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Voters.belongsTo(models.Elections, {
        foreignKey: "electionId",
      });
    }
    static addVoter({ title, password, electionId }) {
      //refactoring for business logic and we can add a todo at any endpoint
      return this.create({
        name: title,
        password,
        electionId,
      }); //userId shorthand property  for attribut and value same in javascript
    }
    static getVoters(electionId) {
      return this.findAll({
        where: {
          electionId,
        },
      }); //from sequelize package  donot confuse bro
    }
    static deleteVoter({ id, electionId }) {
      return this.destroy({
        where: {
          id,
          electionId,
        },
      }); //from sequelize package  donot confuse bro
    }
  }
  Voters.init(
    {
      name: DataTypes.STRING,
      password: DataTypes.STRING,
      status: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Voters",
    }
  );
  return Voters;
};
