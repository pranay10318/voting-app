import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Questions from "./Questions";

@Table
export default class Answers extends Model {
  @Column(DataType.STRING)
  title!: string;

  @ForeignKey(() => Questions)
  @Column
  questionId!: number;

  @BelongsTo(() => Questions)
  question!: Questions;

  static async getAnswers(questionId: number) {
    return this.findAll({
      where: {
        questionId,
      },
    });
  }

  static async addAnswer({
    title,
    questionId,
  }: {
    title: string;
    questionId: number;
  }) {
    return this.create({
      title,
      questionId,
    });
  }

  static async deleteAnswer({
    id,
    questionId,
  }: {
    id: number;
    questionId: number;
  }) {
    return this.destroy({
      where: {
        id,
        questionId,
      },
    });
  }
}
