import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class FeedbackOwner1762800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('bk_nlp_feedback', 'owner');
    if (hasColumn) return;

    await queryRunner.addColumn(
      'bk_nlp_feedback',
      new TableColumn({
        name: 'owner',
        type: 'varchar',
        length: '64',
        isNullable: false,
        default: "'global'",
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasColumn = await queryRunner.hasColumn('bk_nlp_feedback', 'owner');
    if (!hasColumn) return;

    await queryRunner.dropColumn('bk_nlp_feedback', 'owner');
  }
}
