"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Elections extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Elections.belongsTo(models.Admin, {
        foreignKey: "adminId",
      });
      Elections.hasMany(models.Questions, {
        foreignKey: "electionId",
      });
      Elections.hasMany(models.Voters, {
        foreignKey: "electionId",
      });
    }
    static addElection({ title, adminId }) {
      //refactoring for business logic and we can add a todo at any endpoint
      return this.create({
        name: title,
        adminId,
      }); //userId shorthand property  for attribut and value same in javascript
    }
    static getElections(adminId) {
      return this.findAll({
        where: {
          adminId,
        },
      }); //from sequelize package  donot confuse bro
    }
    static deleteElection(id, adminId) {
      return this.destroy({
        where: {
          id: id,
          adminId,
        },
      });
    }

    static editElectionName(id, adminId, name) {
      return this.update(
        { name: name },
        {
          where: {
            id,
            adminId,
          },
        }
      );
    }
    static startElection(id) {
      return this.update(
        { started: true },
        {
          where: {
            id,
          },
        }
      );
    }
  }
  Elections.init(
    {
      name: DataTypes.STRING,
      started: DataTypes.BOOLEAN,
      status: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Elections",
    }
  );
  return Elections;
};
