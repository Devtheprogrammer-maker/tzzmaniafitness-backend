#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/54981a681fc4666f68745fb0524049d37cc3cea4ae2cdfc2773aa126ff9e91e5/contract';
import endContractJson from '../../snapshots/54981a681fc4666f68745fb0524049d37cc3cea4ae2cdfc2773aa126ff9e91e5/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/940ace46f5fdfaffbe4f4e977105aaadf983abb32ba3ac8e16451900dcad570b/contract';
import startContractJson from '../../snapshots/940ace46f5fdfaffbe4f4e977105aaadf983abb32ba3ac8e16451900dcad570b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';
import postgresAdapter from '@prisma/orm-postgres/adapter/runtime';
import { sql } from '@prisma/orm-postgres/builder/runtime';
import { createExecutionContext, createSqlExecutionStack } from '@prisma/orm-postgres/family-runtime';
import postgresTarget, { PostgresContractSerializer } from '@prisma/orm-postgres/target/runtime';

const endContract = new PostgresContractSerializer().deserializeContract<End>(endContractJson);
const stack = createSqlExecutionStack({ target: postgresTarget, adapter: postgresAdapter });

const db = sql<End>({
  context: createExecutionContext({ contract: endContract, stack }),
  rawCodecInferer: stack.adapter.rawCodecInferer,
});

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContractJson;
  override readonly endContractJson = endContractJson;

  override get operations() {
    return [
      this.dropDefault({ schema: 'public', table: 'users', column: 'last_sign_in' }),
      this.dataTransform(endContract, 'typechange-member_profiles-date_of_birth', {
        check: () =>
          db.public.member_profiles
            .select('user_id')
            .where((f, fns) => fns.ne(f.date_of_birth, null))
            .limit(1),
        run: () =>
          db.public.member_profiles
            .update({ date_of_birth: null })
            .where((f, fns) => fns.ne(f.date_of_birth, null)),
      }),
      this.alterColumnType({
        schema: 'public',
        table: 'member_profiles',
        column: 'date_of_birth',
        options: {
          qualifiedTargetType: 'date',
          formatTypeExpected: 'date',
          rawTargetTypeForLabel: 'date',
        },
      }),
      this.dropNotNull({ schema: 'public', table: 'users', column: 'last_sign_in' }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);