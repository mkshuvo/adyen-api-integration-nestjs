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
exports.PayAccountingPayment = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const payout_audit_entity_1 = require("./payout_audit.entity");
let PayAccountingPayment = class PayAccountingPayment {
    paymentId;
    userId;
    user;
    amount;
    paid;
    paidMethod;
    paidTrackingId;
    paidSentTo;
    paidNotes;
    technicianW9Id;
    updatedAt;
    createdAt;
    audits;
};
exports.PayAccountingPayment = PayAccountingPayment;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'bigint', name: 'payment_id' }),
    __metadata("design:type", String)
], PayAccountingPayment.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', name: 'user_id', nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (u) => u.payments, { nullable: true, onDelete: 'SET NULL' }),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', name: 'amount', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', name: 'paid', precision: 6, nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'paid_method', length: 50, nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "paidMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', name: 'paid_tracking_id', length: 128, nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "paidTrackingId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'paid_sent_to', nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "paidSentTo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'paid_notes', nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "paidNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', name: 'technician_w9_id', nullable: true }),
    __metadata("design:type", Object)
], PayAccountingPayment.prototype, "technicianW9Id", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({
        type: 'datetime',
        name: 'updated_at',
        precision: 6,
        default: () => 'CURRENT_TIMESTAMP(6)',
        onUpdate: 'CURRENT_TIMESTAMP(6)',
    }),
    __metadata("design:type", Date)
], PayAccountingPayment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({
        type: 'datetime',
        name: 'created_at',
        precision: 6,
        default: () => 'CURRENT_TIMESTAMP(6)',
    }),
    __metadata("design:type", Date)
], PayAccountingPayment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payout_audit_entity_1.PayoutAudit, (a) => a.payment),
    __metadata("design:type", Array)
], PayAccountingPayment.prototype, "audits", void 0);
exports.PayAccountingPayment = PayAccountingPayment = __decorate([
    (0, typeorm_1.Entity)({ name: 'pay_accounting_payment' })
], PayAccountingPayment);
//# sourceMappingURL=pay_accounting_payment.entity.js.map