import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { Admins } from "./Admins";
import Questions from "./Questions";
import Voters from "./Voters";

@Table
export default class Elections extends Model {
  @Column(DataType.STRING)
  name!: string;

  @Column({type:DataType.BOOLEAN, defaultValue: false})
  started!: boolean;

  @Column({type:DataType.BOOLEAN, defaultValue: false})
  status!: boolean;

  @ForeignKey(() => Admins)
  @Column
  adminId!: number;

  @BelongsTo(() => Admins)
  admin!: Admins;

  @HasMany(() => Questions)
  questions!: Questions[];

  @HasMany(() => Voters)
  voters!: Voters[];

  static addElection({ title, adminId }: { title: string; adminId: number }) {
    return this.create({
      name: title,
      adminId,
    });
  }

  static getElections(adminId: number) {
    return this.findAll({
      where: {
        adminId,
      },
    });
  }

  static deleteElection(id: number, adminId: number) {
    return this.destroy({
      where: {
        id: id,
        adminId,
      },
    });
  }

  static editElectionName(id: number, adminId: number, name: string) {
    return this.update(
      { name: name },
      {
        where: {
          id,
          adminId,
        },
      },
    );
  }

  static startElection(id: number) {
    return this.update(
      { started: true },
      {
        where: {
          id,
        },
      },
    );
  }
}
