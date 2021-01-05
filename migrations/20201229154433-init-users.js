const users = require('./data/user-seeds');
const userTypes = ['CLIENT', 'ADMIN'];
module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.createCollection('users', {
          validator: {
            $jsonSchema: {
              required: ['email', 'password', 'type'],
              properties: {
                type: {
                  enum: userTypes,
                },
                email: {
                  bsonType: 'string',
                },
                firstName: {
                  bsonType: 'string',
                },
                lastName: {
                  bsonType: 'string',
                },
                password: {
                  bsonType: 'string',
                },
              },
            },
          },
        });
        await db.collection('users').insertMany(users);
      });
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    await db.collection('users').drop();
  },
};
