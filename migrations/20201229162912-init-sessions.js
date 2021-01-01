module.exports = {
  async up(db, client) {
    const session = await client.startSession();

    try {
      await session.withTransaction(async () => {
        await db.createCollection('sessions',
        {
          validator: {
            $jsonSchema: {
              required: ["user", "sid", "lastLogin"],
              properties: {
                sid: {
                  bsonType: "string",
                },
                user: {
                  bsonType: "objectId",
                },
                lastLogin: {
                  bsonType: "date"
                },
              }
            }
          }
        });
      })
    } finally {
      await session.endSession();
    }
  },

  async down(db, client) {
    await db.collection('sessions').drop();
  }
};
