export class RemoveUniqueIndexToAntennaNote1712320943929 {
    name = 'RemoveUniqueIndexToAntennaNote1712320943929'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_335a0bf3f904406f9ef3dd51c2"`);
        await queryRunner.query(`CREATE INDEX "IDX_335a0bf3f904406f9ef3dd51c2" ON "antenna_note" ("noteId", "antennaId") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_335a0bf3f904406f9ef3dd51c2"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_335a0bf3f904406f9ef3dd51c2" ON "antenna_note" ("noteId", "antennaId") `);
    }

}
