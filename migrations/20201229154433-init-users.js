const users = require('./data/user-seeds');
const userTypes = ['CLIENT', 'ADMIN', 'ANONYMOUS_CLIENT'];
module.exports = {
  async up(db, client) {
    const session = client.startSession();
    try {
      await session.withTransaction(async () => {
        await db.createCollection('users', {
          validator: {
            $jsonSchema: {
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
                isActivated: {
                  bsonType: 'bool',
                },
                nickname: {
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
