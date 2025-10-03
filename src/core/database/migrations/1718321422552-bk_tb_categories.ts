import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class BkTbCategories1718321422552 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'bk_tb_categories',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'category',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'owner',
            type: 'varchar',
          },
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
      true,
    );
    await queryRunner.createForeignKey(
      'bk_tb_categories',
      new TableForeignKey({
        columnNames: ['owner'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bk_tb_user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'FK_category_owner',
      }),
    );
    await queryRunner.createForeignKey(
      'bk_tb_categories',
      new TableForeignKey({
        columnNames: ['category'],
        referencedColumnNames: ['id'],
        referencedTableName: 'bk_tb_categories',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        name: 'FK_category_group',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('bk_tb_categories', 'FK_category_owner');
    await queryRunner.dropForeignKey('bk_tb_categories', 'FK_category_group');
    await queryRunner.dropTable('bk_tb_categories');
  }
}
