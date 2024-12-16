const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // สร้าง io ที่เชื่อมต่อกับ server

const port = 3000;

// ข้อมูลของห้องแข่ง
let rooms = {};

// ระดับและเปอร์เซ็นต์ชนะของม้าแต่ละตัว
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

// ฟังก์ชันสุ่มผลการแข่งขัน
function race(horses) {
  const random = Math.random() * 100;
  let winner = null;
  let cumulativeChance = 0;
  for (let horse of horses) {
    cumulativeChance += horse.winChance;
    if (random <= cumulativeChance) {
      winner = horse;
      break;
    }
  }
  return winner;
}

// ส่งหน้าเว็บ
app.use(express.static(path.join(__dirname, 'public')));

// การจัดการเมื่อมีผู้เล่นเชื่อมต่อ
io.on('connection', (socket) => {
  console.log('ผู้เล่นเชื่อมต่อ: ', socket.id);

  // ผู้เล่นเข้าร่วมห้อง
  socket.on('joinRoom', ({ roomId, playerName }) => {
    // สร้างห้องใหม่ถ้ายังไม่มี
    if (!rooms[roomId]) {
      rooms[roomId] = {
        players: [],
        horses: assignHorseLevels(),
        bets: []
      };
    }

    // ตรวจสอบว่าผู้เล่นได้เข้าห้องนี้ไปแล้วหรือไม่
    const playerAlreadyInRoom = rooms[roomId].players.some(player => player.id === socket.id);

    if (playerAlreadyInRoom) {
      socket.emit('error', { message: 'คุณได้เข้าห้องนี้ไปแล้ว' });
      return;
    }

    // เพิ่มผู้เล่นเข้าห้อง
    rooms[roomId].players.push({ id: socket.id, name: playerName, points: 10000 });
    socket.join(roomId);
    io.to(roomId).emit('roomData', rooms[roomId]);
  });

  // รับการลงเดิมพัน
  socket.on('placeBet', ({ roomId, horseIndex, betAmount }) => {
    const room = rooms[roomId];
    const player = room.players.find(player => player.id === socket.id);
    if (player.points >= betAmount) {
      player.points -= betAmount;
      room.bets.push({ playerId: socket.id, horseIndex, betAmount });
      io.to(roomId).emit('roomData', room);
    }
  });

  // เริ่มการแข่งขัน
  socket.on('startRace', (roomId) => {
    const room = rooms[roomId];
    const winner = race(room.horses);
    const winnerIndex = room.horses.indexOf(winner);

    // จ่ายเงินให้ผู้ชนะ
    room.bets.forEach(bet => {
      if (bet.horseIndex === winnerIndex) {
        const player = room.players.find(p => p.id === bet.playerId);
        const pointsWon = bet.betAmount * room.horses[winnerIndex].rate;
        player.points += pointsWon;
      }
    });

    // ส่งผลการแข่งขัน
    io.to(roomId).emit('raceResult', { winner, room });
  });

  // จัดการเมื่อผู้เล่นตัดการเชื่อมต่อ
  socket.on('disconnect', () => {
    console.log('ผู้เล่นตัดการเชื่อมต่อ:', socket.id);
    for (const roomId in rooms) {
      const room = rooms[roomId];
      room.players = room.players.filter(player => player.id !== socket.id);
      io.to(roomId).emit('roomData', room);
    }
  });
});

// เริ่มเซิร์ฟเวอร์
server.listen(port,'172.16.10.109', () => {
  console.log(`Server is running on http://localhost:${port}`);
});
