module.exports = {
  async up(db, client) {
    const session = await client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.createCollection('sessions');
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    await db.collection('sessions').drop();
  },
};
