const mongoose = require('mongoose');

module.exports = [
  {
    _id: mongoose.Types.ObjectId('6002c8d85c3dde0047945a2d'),
    email: 'admin@zoomed.com',
    password: '$2a$10$2Am5CvdYmX97.pW6rT8/BOIBRTKmQ4evcn8lLDVe5ul/BFjhmHJjq',
    type: 'ADMIN',
    createdAt: new Date(),
    updatedAt: new Date(),
    nickname: 'cch01',
    isActivated: true,
  },
  {
    _id: mongoose.Types.ObjectId('6002c8d85c3dde0047945a2e'),
    firstName: 'chi ho',
    lastName: 'chan',
    type: 'CLIENT',
    email: 'cch01@gmail.com',
    password: '$2a$10$oCQvFoX5LmxxKLmJF0MjLuNCu9oXCZ0c157K7uRxd8W4qSz/3B0BC',
    createdAt: new Date(),
    updatedAt: new Date(),
    nickname: 'ADMIN',
    isActivated: true,
  },
];
