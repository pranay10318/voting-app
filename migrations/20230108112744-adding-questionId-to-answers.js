"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Answers", "questionId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Answers", {
      fields: ["questionId"],
      type: "foreign key",
      references: {
        table: "Questions",
        field: "id",
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Answers", "questionId");
  },
};
