
export class AddSuspendedReasonToUserProfile1727192303429 {
    name = 'AddSuspendedReasonToUserProfile1727192303429'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "suspendedReason" character varying(8192) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "suspendedReason"`);
    }

}
