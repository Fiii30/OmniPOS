#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/1f814f2b96b14584dc37c0360c10ded2af6a62d98faa0fde9c25167540758ebf/contract';
import startContract from '../../snapshots/1f814f2b96b14584dc37c0360c10ded2af6a62d98faa0fde9c25167540758ebf/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c452b8cb21655f4e0ae9d5ceae310ff82b384cdf6a94de4a8ed132f3b321b25f/contract';
import endContract from '../../snapshots/c452b8cb21655f4e0ae9d5ceae310ff82b384cdf6a94de4a8ed132f3b321b25f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'products',
        columns: [
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isActive', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('price', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('stock', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
