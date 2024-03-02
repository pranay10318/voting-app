import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import Elections from "./Elections";
import Answers from "./Answers";

@Table
export default class Questions extends Model {
  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.STRING)
  description!: string;

  @ForeignKey(() => Elections)
  @Column
  electionId!: number;

  @BelongsTo(() => Elections)
  election!: Elections;

  @HasMany(() => Answers)
  answers!: Answers[];

  static async addQuestion({
    title,
    description,
    electionId,
  }: {
    title: string;
    description: string;
    electionId: number;
  }) {
    return this.create({
      title,
      description,
      electionId,
    });
  }

  static async getQuestions(electionId: number) {
    return this.findAll({
      where: {
        electionId,
      },
    });
  }

  static async deleteQuestion({
    id,
    electionId,
  }: {
    id: number;
    electionId: number;
  }) {
    return this.destroy({
      where: {
        id,
        electionId,
      },
    });
  }
}
