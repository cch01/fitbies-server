module.exports = {
  async up(db, client) {
    const session = await client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.createCollection('meetings');
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    const session = await client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.collection('meetings').drop();
      });
    } finally {
      await session.endSession();
    }
  },
};
