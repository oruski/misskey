export class AddIsPinnedToMessagingMessage1710663333676 {
    name = 'AddIsPinnedToMessagingMessage1710663333676'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messaging_message" ADD "isPinned" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_dab3a11f7d7b8354452f1c9825" ON "messaging_message" ("isPinned") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_dab3a11f7d7b8354452f1c9825"`);
        await queryRunner.query(`ALTER TABLE "messaging_message" DROP COLUMN "isPinned"`);
    }

}
