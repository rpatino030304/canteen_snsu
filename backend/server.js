import cors from 'cors';
import express from 'express';
import fs from 'fs';
import multer from 'multer';
import { nanoid } from 'nanoid';
import path from 'path';
import { getPool } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// MySQL pool
const pool = await getPool();
// Images directory (served at /images)
const imagesDir = path.join(process.cwd(), 'images');
if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir);
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random()*1e9)}${ext}`);
  },
});
const upload = multer({ storage });
app.use('/images', express.static(imagesDir));

// Health
app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'snsu-canteen-backend' });
});

// Items endpoints
app.get('/items', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, category, price, image, created_at FROM items ORDER BY created_at DESC');
    res.json({ items: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/items', async (req, res) => {
  try {
    const { name, category, price, image } = req.body || {};
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'name, category, price are required' });
    }
    const id = nanoid(16);
    await pool.query(
      'INSERT INTO items (id, name, category, price, image) VALUES (?, ?, ?, ?, ?)',
      [id, name, category, Number(price), image || null]
    );
    const [rows] = await pool.query('SELECT id, name, category, price, image FROM items WHERE id = ?', [id]);
    res.status(201).json({ item: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update item
app.patch('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, price, image } = req.body || {};
    const fields = [];
    const values = [];
    if (name) { fields.push('name = ?'); values.push(name); }
    if (category) { fields.push('category = ?'); values.push(category); }
    if (price !== undefined) { fields.push('price = ?'); values.push(Number(price)); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields' });
    values.push(id);
    await pool.query(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, name, category, price, image FROM items WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ item: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete item
app.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM items WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// File upload for item image
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const urlPath = `/images/${req.file.filename}`;
    res.status(201).json({ url: urlPath });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Combos endpoints
app.get('/combos', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, price, item_ids, image, created_at FROM combos ORDER BY created_at DESC');
    res.json({ combos: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/combos', async (req, res) => {
  try {
    const { name, price, itemIds, image } = req.body || {};
    if (!name || !price || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: 'name, price, itemIds[] required' });
    }
    const id = nanoid(16);
    await pool.query(
      'INSERT INTO combos (id, name, price, item_ids, image) VALUES (?, ?, ?, ?, ?)',
      [id, name, Number(price), JSON.stringify(itemIds), image || null]
    );
    const [rows] = await pool.query('SELECT id, name, price, item_ids AS itemIds, image FROM combos WHERE id = ?', [id]);
    res.status(201).json({ combo: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update combo
app.patch('/combos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, itemIds, image } = req.body || {};
    const fields = [];
    const values = [];
    if (name) { fields.push('name = ?'); values.push(name); }
    if (price !== undefined) { fields.push('price = ?'); values.push(Number(price)); }
    if (Array.isArray(itemIds)) { fields.push('item_ids = ?'); values.push(JSON.stringify(itemIds)); }
    if (image !== undefined) { fields.push('image = ?'); values.push(image); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields' });
    values.push(id);
    await pool.query(`UPDATE combos SET ${fields.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, name, price, item_ids, image FROM combos WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ combo: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete combo
app.delete('/combos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM combos WHERE id = ?', [id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create student
app.post('/students', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const [rows] = await pool.query('SELECT id FROM students WHERE email = ?', [email]);
    if (rows.length > 0) {
      return res.status(409).json({ error: 'Student already exists' });
    }
    const id = nanoid(16);
    const name = String(email).split('@')[0] || 'Student';
    await pool.query(
      'INSERT INTO students (id, email, password, name, balance) VALUES (?, ?, ?, ?, 0)',
      [id, email, password, name]
    );
    res.status(201).json({ student: { id, email, name, balance: 0 } });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const [rows] = await pool.query(
      'SELECT id, email, name, balance FROM students WHERE email = ? AND password = ? LIMIT 1',
      [email, password]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const student = rows[0];
    res.json({ student });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List students (optional for admin UI)
app.get('/students', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, email, name, COALESCE(balance, 0) AS balance, created_at FROM students ORDER BY created_at DESC');
    res.json({ students: rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single student by id
app.get('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT id, email, name, COALESCE(balance, 0) AS balance, created_at FROM students WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ student: rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Credit student balance
app.post('/students/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body || {};
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    console.log('[CREDIT] request', { id, value });
    const [updateResult] = await pool.query('UPDATE students SET balance = COALESCE(balance, 0) + ? WHERE id = ?', [value, id]);
    console.log('[CREDIT] updateResult', updateResult);
    const [rows] = await pool.query('SELECT id, email, name, COALESCE(balance, 0) AS balance FROM students WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ student: rows[0] });
  } catch (err) {
    console.error('[CREDIT] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Fallback credit via GET query for clients that cannot send JSON bodies
app.get('/students/:id/credit', async (req, res) => {
  try {
    const { id } = req.params;
    const value = parseFloat(req.query.amount);
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }
    console.log('[CREDIT][GET] request', { id, value });
    const [updateResult] = await pool.query('UPDATE students SET balance = COALESCE(balance, 0) + ? WHERE id = ?', [value, id]);
    console.log('[CREDIT][GET] updateResult', updateResult);
    const [rows] = await pool.query('SELECT id, email, name, COALESCE(balance, 0) AS balance FROM students WHERE id = ? LIMIT 1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ student: rows[0] });
  } catch (err) {
    console.error('[CREDIT][GET] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Orders endpoints
app.post('/orders', async (req, res) => {
  try {
    const { studentId, studentName, totalAmount, items } = req.body || {};
    if (!studentId || !studentName || !totalAmount || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'studentId, studentName, totalAmount, and items array are required' });
    }

    // Check if student has sufficient balance
    const [studentRows] = await pool.query('SELECT balance FROM students WHERE id = ?', [studentId]);
    if (studentRows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    const currentBalance = parseFloat(studentRows[0].balance || 0);
    if (currentBalance < totalAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create order (ID will be auto-generated)
    const [result] = await pool.query(
      'INSERT INTO orders (student_id, student_name, total_amount, items) VALUES (?, ?, ?, ?)',
      [studentId, studentName, totalAmount, JSON.stringify(items)]
    );
    
    const orderId = result.insertId;

    // Deduct balance immediately
    await pool.query(
      'UPDATE students SET balance = balance - ? WHERE id = ?',
      [totalAmount, studentId]
    );

    // Get updated student info
    const [updatedStudent] = await pool.query('SELECT id, email, name, COALESCE(balance, 0) AS balance FROM students WHERE id = ?', [studentId]);
    
    res.status(201).json({ 
      order: { id: orderId, studentId, studentName, totalAmount, items, status: 'PENDING' },
      updatedBalance: updatedStudent[0].balance
    });
  } catch (err) {
    console.error('[CREATE ORDER] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders (for admin)
app.get('/orders', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT o.id, o.student_id, o.student_name, o.total_amount, o.status, o.items, o.created_at, o.updated_at
      FROM orders o
      ORDER BY o.created_at DESC
    `);
    
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    
    res.json({ orders });
  } catch (err) {
    console.error('[GET ORDERS] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders by student ID
app.get('/orders/student/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const [rows] = await pool.query(`
      SELECT o.id, o.student_id, o.student_name, o.total_amount, o.status, o.items, o.created_at, o.updated_at
      FROM orders o
      WHERE o.student_id = ?
      ORDER BY o.created_at DESC
    `, [studentId]);
    
    const orders = rows.map(row => ({
      ...row,
      items: JSON.parse(row.items)
    }));
    
    res.json({ orders });
  } catch (err) {
    console.error('[GET STUDENT ORDERS] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status (confirm/refund)
app.patch('/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, studentId } = req.body || {};
    
    if (!status || !['CONFIRMED', 'REFUNDED'].includes(status)) {
      return res.status(400).json({ error: 'Valid status (CONFIRMED or REFUNDED) is required' });
    }

    // Get current order
    const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orderRows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderRows[0];
    const currentStatus = order.status;
    
    // If order is already processed, don't allow changes
    if (currentStatus !== 'PENDING') {
      return res.status(400).json({ error: `Order is already ${currentStatus.toLowerCase()}` });
    }

    // Update order status
    await pool.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);

    // If refunding, restore the balance
    if (status === 'REFUNDED') {
      await pool.query(
        'UPDATE students SET balance = balance + ? WHERE id = ?',
        [order.total_amount, order.student_id]
      );
    }

    // Get updated order
    const [updatedOrder] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
    const result = {
      ...updatedOrder[0],
      items: JSON.parse(updatedOrder[0].items)
    };

    res.json({ order: result });
  } catch (err) {
    console.error('[UPDATE ORDER STATUS] error', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});


