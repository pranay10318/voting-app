/* eslint-disable no-unused-vars */
"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Todo.belongsTo(models.User, {
        //todo belongs to a user
        foreignKey: "userId",
      });
    }

    static getTodos() {
      return this.findAll(); //from sequelize package  donot confuse bro
    }

    static async dueToday(userId) {
      return this.findAll({
        where: {
          dueDate: new Date(),
          userId, //shorthand prop no need to mention name for same name and var name in js
          completed: false,
        },
        order: [["id", "ASC"]],
      });
    }

    static async dueLater(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: new Date(),
          },
          userId,
          completed: false,
        }, //greater than the duedate
        order: [["id", "ASC"]],
      });
    }
    static async overdue(userId) {
      return this.findAll({
        where: {
          dueDate: { [Op.lt]: new Date() },
          userId,
          completed: false,
        }, //greater than the duedate
        order: [["id", "ASC"]],
      });
    }
    static async completedItems(userId) {
      return await Todo.findAll({
        where: {
          userId,
          completed: true,
        },

        order: [["id", "ASC"]],
      });
    }

    static async remove({ id, userId }) {
      return this.destroy({
        where: {
          id,
          userId,
        },
      });
    }

    static addTodo({ title, dueDate, userId }) {
      //refactoring for business logic and we can add a todo at any endpoint
      return this.create({
        title: title,
        dueDate: dueDate,
        completed: false,
        userId,
      }); //userId shorthand property  for attribut and value same in javascript
    }

    static markAsCompleted() {
      return this.update({ completed: true });
    }
    setCompletionStatus(completed, userId) {
      return this.update({
        completed: completed, //we are changing  as per input given in form
        where: {
          userId,
        },
      });
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
