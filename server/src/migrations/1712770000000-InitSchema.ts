import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitSchema1712770000000 implements MigrationInterface {
  name = 'InitSchema1712770000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // users
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT NOT NULL AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','accountant') NOT NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE INDEX IDX_users_email (email),
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    // user_bank_account
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS user_bank_account (
        id BIGINT NOT NULL AUTO_INCREMENT,
        user_id INT NOT NULL,
        country VARCHAR(2) NOT NULL,
        currency VARCHAR(3) NOT NULL,
        account_holder_name VARCHAR(255) NOT NULL,
        iban VARCHAR(34) NULL,
        account_number VARCHAR(64) NULL,
        routing_code VARCHAR(64) NULL,
        adyen_recurring_detail_reference VARCHAR(255) NULL,
        status ENUM('unvalidated','valid','invalid') NOT NULL DEFAULT 'unvalidated',
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_user_bank_account_user_id (user_id),
        PRIMARY KEY (id),
        CONSTRAINT FK_user_bank_account_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // pay_accounting_payment
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS pay_accounting_payment (
        payment_id BIGINT NOT NULL,
        user_id INT NULL,
        amount DECIMAL(12,2) NULL,
        paid DATETIME(6) NULL,
        paid_method VARCHAR(50) NULL,
        paid_tracking_id VARCHAR(128) NULL,
        paid_sent_to TEXT NULL,
        paid_notes TEXT NULL,
        technician_w9_id BIGINT NULL,
        updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX IDX_pay_accounting_payment_user_id (user_id),
        PRIMARY KEY (payment_id),
        CONSTRAINT FK_pay_accounting_payment_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB;
    `);

    // payout_audit
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS payout_audit (
        id BIGINT NOT NULL AUTO_INCREMENT,
        payment_id BIGINT NOT NULL,
        status VARCHAR(64) NOT NULL,
        message TEXT NULL,
        adyen_psp_reference VARCHAR(64) NULL,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        INDEX IDX_payout_audit_payment_id (payment_id),
        PRIMARY KEY (id),
        CONSTRAINT FK_payout_audit_payment_id FOREIGN KEY (payment_id) REFERENCES pay_accounting_payment(payment_id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS payout_audit');
    await queryRunner.query('DROP TABLE IF EXISTS pay_accounting_payment');
    await queryRunner.query('DROP TABLE IF EXISTS user_bank_account');
    await queryRunner.query('DROP TABLE IF EXISTS users');
  }
}
