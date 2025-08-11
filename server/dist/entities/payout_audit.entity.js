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
exports.PayoutAudit = void 0;
const typeorm_1 = require("typeorm");
const pay_accounting_payment_entity_1 = require("./pay_accounting_payment.entity");
let PayoutAudit = class PayoutAudit {
    id;
    paymentId;
    payment;
    status;
    message;
    adyenPspReference;
    createdAt;
};
exports.PayoutAudit = PayoutAudit;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', name: 'id' }),
    __metadata("design:type", String)
], PayoutAudit.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'payment_id' }),
    __metadata("design:type", String)
], PayoutAudit.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pay_accounting_payment_entity_1.PayAccountingPayment, (p) => p.audits, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'payment_id' }),
    __metadata("design:type", pay_accounting_payment_entity_1.PayAccountingPayment)
], PayoutAudit.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'status' }),
    __metadata("design:type", String)
], PayoutAudit.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'message', nullable: true }),
    __metadata("design:type", Object)
], PayoutAudit.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 64, name: 'adyen_psp_reference', nullable: true }),
    __metadata("design:type", Object)
], PayoutAudit.prototype, "adyenPspReference", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'datetime',
        name: 'created_at',
        precision: 6,
        default: () => 'CURRENT_TIMESTAMP(6)',
    }),
    __metadata("design:type", Date)
], PayoutAudit.prototype, "createdAt", void 0);
exports.PayoutAudit = PayoutAudit = __decorate([
    (0, typeorm_1.Entity)({ name: 'payout_audit' })
], PayoutAudit);
//# sourceMappingURL=payout_audit.entity.js.map