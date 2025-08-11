"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserBankAccount = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
let UserBankAccount = class UserBankAccount {
    id;
    userId;
    user;
    country;
    currency;
    accountHolderName;
    iban;
    accountNumber;
    routingCode;
    adyenRecurringDetailReference;
    status;
    createdAt;
    updatedAt;
};
exports.UserBankAccount = UserBankAccount;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', name: 'id' }),
    __metadata("design:type", String)
], UserBankAccount.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'user_id' }),
    (0, typeorm_1.Index)('idx_user_bank_account_user_id'),
    __metadata("design:type", Number)
], UserBankAccount.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.bankAccounts, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.User)
], UserBankAccount.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 2, name: 'country' }),
    __metadata("design:type", String)
], UserBankAccount.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 3, name: 'currency' }),
    __metadata("design:type", String)
], UserBankAccount.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'account_holder_name' }),
    __metadata("design:type", String)
], UserBankAccount.prototype, "accountHolderName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 34, name: 'iban', nullable: true }),
    __metadata("design:type", Object)
], UserBankAccount.prototype, "iban", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'account_number', nullable: true }),
    __metadata("design:type", Object)
], UserBankAccount.prototype, "accountNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'routing_code', nullable: true }),
    __metadata("design:type", Object)
], UserBankAccount.prototype, "routingCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, name: 'adyen_recurring_detail_reference', nullable: true }),
    __metadata("design:type", Object)
], UserBankAccount.prototype, "adyenRecurringDetailReference", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['unvalidated', 'valid', 'invalid'], name: 'status', default: 'unvalidated' }),
    __metadata("design:type", String)
], UserBankAccount.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'datetime',
        name: 'created_at',
        precision: 6,
        default: () => 'CURRENT_TIMESTAMP(6)',
    }),
    __metadata("design:type", Date)
], UserBankAccount.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'datetime',
        name: 'updated_at',
        precision: 6,
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
    }),
    __metadata("design:type", Date)
], UserBankAccount.prototype, "updatedAt", void 0);
exports.UserBankAccount = UserBankAccount = __decorate([
    (0, typeorm_1.Entity)({ name: 'user_bank_account' })
], UserBankAccount);
//# sourceMappingURL=user_bank_account.entity.js.map