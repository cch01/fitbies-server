db.createUser(
  {
    user: "admin",
    pwd: "zOOmed",
    roles: [
      { role: "readWrite", db: "zoomed" }, 
      { role: "dbAdmin", db: "zoomed" },
      { role: "userAdmin", db: "zoomed" },
    ]
  }
);