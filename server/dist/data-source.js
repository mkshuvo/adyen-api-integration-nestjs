"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const dotenv_1 = require("dotenv");
const user_entity_1 = require("./entities/user.entity");
const user_bank_account_entity_1 = require("./entities/user_bank_account.entity");
const pay_accounting_payment_entity_1 = require("./entities/pay_accounting_payment.entity");
const payout_audit_entity_1 = require("./entities/payout_audit.entity");
(0, dotenv_1.config)();
const migrationsPath = process.env.NODE_ENV === 'production'
    ? 'dist/src/migrations/*.js'
    : 'src/migrations/*.{ts,js}';
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'test',
    entities: [user_entity_1.User, user_bank_account_entity_1.UserBankAccount, pay_accounting_payment_entity_1.PayAccountingPayment, payout_audit_entity_1.PayoutAudit],
    migrations: [migrationsPath],
    synchronize: false,
    timezone: 'Z',
});
exports.default = exports.AppDataSource;
//# sourceMappingURL=data-source.js.map