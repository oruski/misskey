
export class RegistrationTicketToUserPending1725104341375 {
    name = 'RegistrationTicketToUserPending1725104341375'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_pending" ADD "registrationTicketId" character varying(32)`);
        await queryRunner.query(`COMMENT ON COLUMN "user_pending"."registrationTicketId" IS 'The registration ticket ID.'`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedAt"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`COMMENT ON COLUMN "registration_ticket"."usedAt" IS 'The date and time the ticket was used.'`);
        await queryRunner.query(`CREATE INDEX "IDX_80e9a0b6943dd3e821b9bdd3cf" ON "user_pending" ("registrationTicketId") `);
        await queryRunner.query(`ALTER TABLE "user_pending" ADD CONSTRAINT "FK_80e9a0b6943dd3e821b9bdd3cf3" FOREIGN KEY ("registrationTicketId") REFERENCES "registration_ticket"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_pending" DROP CONSTRAINT "FK_80e9a0b6943dd3e821b9bdd3cf3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_80e9a0b6943dd3e821b9bdd3cf"`);
        await queryRunner.query(`COMMENT ON COLUMN "registration_ticket"."usedAt" IS 'The date and time the ticket was used.'`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedAt"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedAt" TIMESTAMP`);
        await queryRunner.query(`COMMENT ON COLUMN "user_pending"."registrationTicketId" IS 'The registration ticket ID.'`);
        await queryRunner.query(`ALTER TABLE "user_pending" DROP COLUMN "registrationTicketId"`);
    }

}
