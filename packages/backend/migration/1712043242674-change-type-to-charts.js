export class ChangeTypeToCharts1712043242674 {

    async up(queryRunner) {
      // __chart_day__instance テーブルの ___requests_failed カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_failed" TYPE integer USING "___requests_failed"::integer`);
      // __chart_day__instance テーブルの ___requests_succeeded カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_succeeded" TYPE integer USING "___requests_succeeded"::integer`);
      // __chart_day__instance テーブルの ___requests_received カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___requests_received" TYPE integer USING "___requests_received"::integer`);
      // __chart_day__instance テーブルの ___users_inc カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___users_inc" TYPE integer USING "___users_inc"::integer`);
      // __chart_day__instance テーブルの ___users_dec カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___users_dec" TYPE integer USING "___users_dec"::integer`);
      // __chart_day__instance テーブルの ___following_inc カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___following_inc" TYPE integer USING "___following_inc"::integer`);
      // __chart_day__instance テーブルの ___following_dec カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___following_dec" TYPE integer USING "___following_dec"::integer`);
      // __chart_day__instance テーブルの ___followers_inc カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___followers_inc" TYPE integer USING "___followers_inc"::integer`);
      // __chart_day__instance テーブルの ___followers_dec カラムの型を integer に変更
      await queryRunner.query(`ALTER TABLE "__chart_day__instance" ALTER COLUMN "___followers_dec" TYPE integer USING "___followers_dec"::integer`);
    }

    async down(queryRunner) {
    }

}
