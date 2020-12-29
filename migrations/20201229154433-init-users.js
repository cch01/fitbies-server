const users = require('./data/user-seeds');

module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.createCollection('users');
        await db.collection('users').insertMany(users);
      })
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    await db.collection('users').drop();
  }

};
