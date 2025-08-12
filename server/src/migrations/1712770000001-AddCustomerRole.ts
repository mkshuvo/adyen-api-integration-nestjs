import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCustomerRole1712770000001 implements MigrationInterface {
  name = 'AddCustomerRole1712770000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('admin','accountant','customer') NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users
      MODIFY COLUMN role ENUM('admin','accountant') NOT NULL;
    `);
  }
}
