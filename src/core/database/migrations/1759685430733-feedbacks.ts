import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class Feedbacks1759685430733 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bk_nlp_feedback',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          { name: 'originalText', type: 'text' },
          { name: 'predictedJson', type: 'json' },
          { name: 'userCorrectedJson', type: 'json', isNullable: true },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'validated', 'corrected'],
            default: "'pending'",
          },
          { name: 'usedForTraining', type: 'boolean', default: false },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('bk_nlp_feedback');
  }
}
