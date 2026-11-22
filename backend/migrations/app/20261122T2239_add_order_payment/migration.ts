#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/625713dea2e8ff57f18ddfe85a9f632e8de76462f10f35de38c200bb3771d098/contract';
import endContract from '../../snapshots/625713dea2e8ff57f18ddfe85a9f632e8de76462f10f35de38c200bb3771d098/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a602b13f97d1f15ead4f8a35758589b2104ce0ed806898efb738487509a64e5a/contract';
import startContract from '../../snapshots/a602b13f97d1f15ead4f8a35758589b2104ce0ed806898efb738487509a64e5a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('amountPaid', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('changeAmount', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('paidAt', 'timestamptz(3)', {
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'orders',
        column: col('paymentStatus', 'text', {
          notNull: true,
          default: lit('UNPAID'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'orders',
        constraint: 'orders_paymentStatus_check_f9cb99b0',
        expression: sql`"paymentStatus" IN ('UNPAID', 'PAID')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
