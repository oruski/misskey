export class AddUserIdRecipientIdIndexToMessage1711678365913 {
  name = 'AddUserIdRecipientIdIndexToMessage1711678365913';

  async up(queryRunner) {
    await queryRunner.query(`CREATE INDEX "IDX_782e55a2584ccd2c161935c5a1" ON "messaging_message" ("userId", "recipientId") `);
  }

  async down(queryRunner) {
    await queryRunner.query(`DROP INDEX "public"."IDX_782e55a2584ccd2c161935c5a1"`);
  }

}
