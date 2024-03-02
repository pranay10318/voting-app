import { Table, Column, Model, HasMany, DataType } from "sequelize-typescript";

@Table
export class Admins extends Model {
  @Column(DataType.STRING)
  firstName!: string;

  @Column(DataType.STRING)
  lastName!: string;

  @Column(DataType.STRING)
  email!: string;

  @Column(DataType.STRING)
  password!: string;
}
