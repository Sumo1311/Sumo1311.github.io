const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
const port = 3000;

// 配置数据库连接
const pool = mysql.createPool({
    host: '192.168.3.217',
    user: 'root',
    password: 'Sumo1311yyds',
    database: 'web_demo'
});

// 简单的静态文件服务器（用于提供HTML文件）
app.use(express.static('public'));

// 接口：获取当前点击次数
app.get('/get-click-count', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT click_count FROM click_counter LIMIT 1');
        if (rows.length === 0) {
            res.status(404).json({ error: 'Click count not found' });
        } else {
            res.json({ count: rows[0].click_count });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch click count' });
    }
});

// 接口：增加点击次数
app.post('/increment-click-count', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT click_count FROM click_counter LIMIT 1');
        if (rows.length === 0) {
            res.status(404).json({ error: 'Click count not found' });
        } else {
            const currentCount = rows[0].click_count;
            const newCount = currentCount + 1;
            const [result] = await pool.query('UPDATE click_counter SET click_count = ? WHERE id = 1', [newCount]);
            if (result.changedRows === 1) {
                res.json({ count: newCount });
            } else {
                res.status(500).json({ error: 'Failed to update click count' });
            }
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to increment click count' });
    }
});

// 创建表格并插入初始值
async function initializeDatabase() {
    try {
        const [result] = await pool.execute(`
            CREATE TABLE IF NOT EXISTS click_counter (
                id INT PRIMARY KEY AUTO_INCREMENT,
                click_count INT NOT NULL DEFAULT 0
            )
        `);
        const [rows] = await pool.query('SELECT * FROM click_counter WHERE id = 1');
        if (rows.length === 0) {
            await pool.query('INSERT INTO click_counter (click_count) VALUES (0)');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// 初始化数据库
initializeDatabase();

// 启动服务器
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
