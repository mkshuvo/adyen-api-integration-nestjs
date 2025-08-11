"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const user_entity_1 = require("./entities/user.entity");
const user_bank_account_entity_1 = require("./entities/user_bank_account.entity");
const pay_accounting_payment_entity_1 = require("./entities/pay_accounting_payment.entity");
const payout_audit_entity_1 = require("./entities/payout_audit.entity");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: () => ({
                    type: 'mysql',
                    host: process.env.DB_HOST || 'localhost',
                    port: Number(process.env.DB_PORT || 3306),
                    username: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: process.env.DB_NAME || 'test',
                    synchronize: false,
                    entities: [user_entity_1.User, user_bank_account_entity_1.UserBankAccount, pay_accounting_payment_entity_1.PayAccountingPayment, payout_audit_entity_1.PayoutAudit],
                    timezone: 'Z',
                }),
            }),
            typeorm_1.TypeOrmModule.forFeature([user_entity_1.User, user_bank_account_entity_1.UserBankAccount, pay_accounting_payment_entity_1.PayAccountingPayment, payout_audit_entity_1.PayoutAudit]),
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map