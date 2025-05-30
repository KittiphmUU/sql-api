const express = require('express');
const sql = require('mssql');
const cors = require('cors');

const app = express();
const port = 3000;

// ✅ เปิดใช้งาน CORS (ให้คนอื่นเรียก API ได้)
app.use(cors());

// ✅ ตรวจสอบ Header ว่าต้องมี X-Auth-Key = my-secret-key
app.use((req, res, next) => {
    const apiKey = req.headers['x-auth-key'];
    if (!apiKey || apiKey !== 'my-secret-key') {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
});

// ✅ ตั้งค่าการเชื่อมต่อ SQL Server
const config = {
    user: 'sa',
    password: 'P@ssw0rd2025',
    server: 'localhost', // หรือชื่อ Instance จาก Services
    database: 'oroo_uu',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// ✅ API: ดึงข้อมูลล่าสุดจาก PLC_DATA.HWS
app.get('/data/latest', async (req, res) => {
    try {
        await sql.connect(config);

        const result = await sql.query(`
            SELECT TOP 1 HR_Z11_PT_01 AS value, Timestamp
            FROM oroo_uu.PLC_DATA.HWS
            ORDER BY Timestamp DESC
        `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'No data found' });
        }

        const row = result.recordset[0];
        const formatted = {
            value: parseFloat(row.value),
            timestamp: new Date(row.Timestamp).getTime()  // แปลงเป็น Unix time (ms)
        };

        res.json({ data: [formatted] });

    } catch (err) {
        console.error('❌ Database error:', err);
        res.status(500).json({ error: 'Database connection or query error' });
    }
});

// ✅ เริ่มต้น API Server
app.listen(port, '0.0.0.0', () => {
    console.log(`✅ API server running at http://0.0.0.0:${port}`);
});