export class AddIndexToNote1714037049920 {
    name = 'AddIndexToNote1714037049920'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_afaf37a1b37cfba1d4ffc50697" ON "note" ("replyUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_22baf588de8cc54f56924a7f26" ON "note" ("renoteUserId") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_22baf588de8cc54f56924a7f26"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_afaf37a1b37cfba1d4ffc50697"`);
    }

}
