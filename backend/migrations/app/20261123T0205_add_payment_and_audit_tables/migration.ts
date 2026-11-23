#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/625713dea2e8ff57f18ddfe85a9f632e8de76462f10f35de38c200bb3771d098/contract';
import startContract from '../../snapshots/625713dea2e8ff57f18ddfe85a9f632e8de76462f10f35de38c200bb3771d098/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/eb25f59a294debbfaae214fe8a06b273bc6f37692795d3601ab768534f945ab5/contract';
import endContract from '../../snapshots/eb25f59a294debbfaae214fe8a06b273bc6f37692795d3601ab768534f945ab5/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'orders',
        constraint: 'orders_paymentStatus_check_f9cb99b0',
      }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'amountPaid' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'changeAmount' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'paidAt' }),
      this.dropColumn({ schema: 'public', table: 'orders', column: 'paymentStatus' }),
      this.createTable({
        schema: 'public',
        table: 'OrderStatusHistory',
        columns: [
          col('changedById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('newStatus', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paymentId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('previousStatus', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'OrderStatusHistory_newStatus_check_8d711279',
            sql`"newStatus" IN ('PENDING', 'PAID', 'CANCEL_REQUESTED', 'CANCELLED')`,
          ),
          checkExpression(
            'OrderStatusHistory_previousStatus_check_4d5c8719',
            sql`"previousStatus" IN ('PENDING', 'PAID', 'CANCEL_REQUESTED', 'CANCELLED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Payment',
        columns: [
          col('amount', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('changeAmount', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('method', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('paidAt', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('referenceCode', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('PENDING'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Payment_method_check_e7e01cde',
            sql`"method" IN ('QRIS', 'TRANSFER_BANK', 'CASH')`,
          ),
          checkExpression(
            'Payment_status_check_218a9bc3',
            sql`"status" IN ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'StockFlow',
        columns: [
          col('changedById', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('note', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orderId', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('productId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('quantity', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('stockAfter', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('stockBefore', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'StockFlow_type_check_e543f6e3',
            sql`"type" IN ('IN', 'OUT', 'ADJUSTMENT', 'RETURN')`,
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('status', 'text', {
          notNull: true,
          default: lit('PENDING'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'orders',
        constraint: 'orders_status_check_a1959012',
        expression: sql`"status" IN ('PENDING', 'PAID', 'CANCEL_REQUESTED', 'CANCELLED')`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrderStatusHistory',
        index: 'OrderStatusHistory_changedById_idx_d6e6aadb',
        columns: ['changedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrderStatusHistory',
        index: 'OrderStatusHistory_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'OrderStatusHistory',
        index: 'OrderStatusHistory_paymentId_idx_b2fe9a10',
        columns: ['paymentId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Payment',
        index: 'Payment_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StockFlow',
        index: 'StockFlow_changedById_idx_d6e6aadb',
        columns: ['changedById'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StockFlow',
        index: 'StockFlow_orderId_idx_d284871b',
        columns: ['orderId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'StockFlow',
        index: 'StockFlow_productId_idx_5858600a',
        columns: ['productId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrderStatusHistory',
        foreignKey: {
          name: 'OrderStatusHistory_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrderStatusHistory',
        foreignKey: {
          name: 'OrderStatusHistory_paymentId_fkey',
          columns: ['paymentId'],
          references: { schema: 'public', table: 'Payment', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'OrderStatusHistory',
        foreignKey: {
          name: 'OrderStatusHistory_changedById_fkey',
          columns: ['changedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Payment',
        foreignKey: {
          name: 'Payment_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StockFlow',
        foreignKey: {
          name: 'StockFlow_productId_fkey',
          columns: ['productId'],
          references: { schema: 'public', table: 'products', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StockFlow',
        foreignKey: {
          name: 'StockFlow_orderId_fkey',
          columns: ['orderId'],
          references: { schema: 'public', table: 'orders', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'StockFlow',
        foreignKey: {
          name: 'StockFlow_changedById_fkey',
          columns: ['changedById'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
