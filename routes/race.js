const express = require('express');
const router = express.Router();

const levels = [
  { level: 'Normal', winChance: 10, rate: 5 },
  { level: 'Common', winChance: 20, rate: 3 },
  { level: 'Rare', winChance: 30, rate: 1.5 },
  { level: 'Super Rare', winChance: 40, rate: 1 },
  { level: 'Legend', winChance: 50, rate: 0.5 }
];

// ฟังก์ชันสุ่มระดับม้า
function assignHorseLevels() {
  const horses = [];
  for (let i = 1; i <= 5; i++) {
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    horses.push({ name: `ม้า ${i}`, ...randomLevel });
  }
  return horses;
}

// Route สำหรับเข้าห้อง
router.post('/joinRoom', (req, res) => {
  const { roomId, playerName } = req.body;
  
  if (!rooms[roomId]) {
    rooms[roomId] = {
      players: [],
      horses: assignHorseLevels(),
      bets: []
    };
  }

  rooms[roomId].players.push({ id: req.socket.id, name: playerName, points: 10000 });
  
  res.status(200).json(rooms[roomId]);
});

// Export router
module.exports = router;
