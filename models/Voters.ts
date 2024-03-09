import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Elections from "./Elections";

@Table
export default class Voters extends Model {
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  password!: string;

  @Column(DataType.BOOLEAN)
  status!: boolean;

  @ForeignKey(() => Elections)
  @Column
  electionId!: number;

  @BelongsTo(() => Elections)
  election!: Elections;

static addVoter({
    title,
    password,
    electionId,
  }: {
    title: string;
    password: string;
    electionId: number;
  }) {
    return this.create({
      name: title,
      password,
      electionId,
    });
  }

  static getVoters(electionId: number) {
    return this.findAll({
      where: {
        electionId,
      },
    });
  }

static deleteVoter({ id, electionId }: { id: number; electionId: number }) {
    return this.destroy({
      where: {
        id,
        electionId,
      },
    });
  }
}
