"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Elections", "started", {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
    });
    await queryInterface.addColumn("Elections", "status", {
      type: Sequelize.DataTypes.BOOLEAN,
      defaultValue: false,
    });
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Elections", "status");
    await queryInterface.removeColumn("Elections", "started");

    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
