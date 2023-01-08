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
        //todo belongs to a Admin
        foreignKey: "adminId",
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
  }
  Elections.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Elections",
    }
  );
  return Elections;
};
