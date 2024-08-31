export class UserIdToRegistrationTicket1725101670794 {
    name = 'UserIdToRegistrationTicket1725101670794'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "requestUserId" character varying(32)`);
        await queryRunner.query(`COMMENT ON COLUMN "registration_ticket"."requestUserId" IS 'The request user ID.'`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "invitedUserId" character varying(32)`);
        await queryRunner.query(`COMMENT ON COLUMN "registration_ticket"."invitedUserId" IS 'The invited user ID.'`);
        await queryRunner.query(`CREATE INDEX "IDX_0b96e37dbfcc3c151b9a84b1a9" ON "registration_ticket" ("requestUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfcbf86bed74362ef7e0d43a0c" ON "registration_ticket" ("invitedUserId") `);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD CONSTRAINT "FK_0b96e37dbfcc3c151b9a84b1a95" FOREIGN KEY ("requestUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD CONSTRAINT "FK_cfcbf86bed74362ef7e0d43a0c3" FOREIGN KEY ("invitedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP CONSTRAINT "FK_cfcbf86bed74362ef7e0d43a0c3"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP CONSTRAINT "FK_0b96e37dbfcc3c151b9a84b1a95"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfcbf86bed74362ef7e0d43a0c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0b96e37dbfcc3c151b9a84b1a9"`);
        await queryRunner.query(`COMMENT ON COLUMN "registration_ticket"."invitedUserId" IS 'The invited user ID.'`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "invitedUserId"`);
        await queryRunner.query(`COMMENT ON COLUMN "registration_ticket"."requestUserId" IS 'The request user ID.'`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "requestUserId"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedAt"`);

    }

}
