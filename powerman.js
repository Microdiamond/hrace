const axios = require('axios');
const xml2js = require('xml2js');

// ดึงข้อมูล XML จาก URL
axios.get('http://172.16.1.31/RealUPSData.xml')
  .then((response) => {
    const xmlData = response.data; // ข้อมูล XML ที่ดึงมา

    // แปลง XML เป็น JSON
    const parser = new xml2js.Parser();
    parser.parseString(xmlData, (err, result) => {
      if (err) {
        console.error('Error parsing XML:', err);
        return;
      }

      // สร้างโครงสร้าง JSON ใหม่
      const formattedData = {};

      // วนลูปผ่านแต่ละคีย์ใน RealUPSData
      for (const key in result.RealUPSData) {
        // ตรวจสอบว่ามีคีย์ใน result.RealUPSData หรือไม่
        if (result.RealUPSData.hasOwnProperty(key)) {
          const valueArray = result.RealUPSData[key];
          // สร้างโครงสร้างใหม่ในรูปแบบที่ต้องการ
          formattedData[key] = {
            data: valueArray[0]._, // เข้าถึงค่าผ่าน '_'
            id: valueArray[0].$?.id // เข้าถึง id ผ่าน '$' ถ้ามี
          };
        }
      }

      // แสดงผล JSON ที่จัดรูปแบบใหม่
      console.log('Formatted Data:', JSON.stringify(formattedData, null, 2));
    });
  })
  .catch((error) => {
    console.error('Error fetching XML from URL:', error);
  });
