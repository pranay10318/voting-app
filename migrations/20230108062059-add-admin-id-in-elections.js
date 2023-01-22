"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Elections", "adminId", {
      type: Sequelize.DataTypes.INTEGER,
    });
    await queryInterface.addConstraint("Elections", {
      fields: ["adminId"],
      type: "foreign key",
      references: {
        table: "Admins",
        field: "id",
      },
      onDelete: "CASCADE",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Elections", "adminId");
  },
};
