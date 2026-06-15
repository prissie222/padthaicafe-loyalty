// ============================================================
//  Pad Thai Cafe — Loyalty Stamp Card Server
//  Stack: Node.js + Express + JSON file database
//  No native modules needed — runs on any cheap VPS/Railway
// ============================================================

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');
const QRCode   = require('qrcode');
const fs       = require('fs');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'padthai-loyalty-secret-change-in-production';
const TOTAL_STAMPS = 10;
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

// ── Middleware ────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── JSON "Database" helpers ───────────────────────────────
function readDB() {
  if (!fs.existsSync(DB_PATH)) return { customers: [], rewardsGiven: 0, stampsToday: { date: '', count: 0 } };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function thaiDate() {
  return new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Auth Middleware ───────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(header.replace('Bearer ', ''), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    next();
  });
}

// ═══════════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// POST /api/register
app.post('/api/register', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password)
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบ' });
  if (password.length < 4)
    return res.status(400).json({ error: 'รหัสผ่านต้องมีอย่างน้อย 4 ตัว' });

  const db = readDB();
  if (db.customers.find(c => c.phone === phone))
    return res.status(409).json({ error: 'เบอร์โทรนี้มีในระบบแล้ว' });

  const hash = await bcrypt.hash(password, 10);
  const id = 'PTF-' + String(db.customers.length + 1).padStart(4, '0');
  const customer = {
    id, name, phone,
    password: hash,
    stamps: 0,
    totalEarned: 0,
    rewardsRedeemed: 0,
    createdAt: new Date().toISOString(),
    history: []
  };

  db.customers.push(customer);
  writeDB(db);

  const token = jwt.sign({ id, name, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, customer: safeCustomer(customer) });
});

// POST /api/login
app.post('/api/login', async (req, res) => {
  const { phone, password } = req.body;
  const db = readDB();
  const customer = db.customers.find(c => c.phone === phone);
  if (!customer) return res.status(401).json({ error: 'ไม่พบเบอร์โทรนี้ในระบบ' });

  const ok = await bcrypt.compare(password, customer.password);
  if (!ok) return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });

  const token = jwt.sign({ id: customer.id, name: customer.name, role: 'customer' }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, customer: safeCustomer(customer) });
});

// POST /api/admin/login  (simple password, no separate table)
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'padthai2026';
  if (password !== ADMIN_PASS) return res.status(401).json({ error: 'รหัสผ่าน Admin ไม่ถูกต้อง' });
  const token = jwt.sign({ id: 'admin', name: 'Prissie', role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

// ═══════════════════════════════════════════════════════════
//  CUSTOMER ROUTES
// ═══════════════════════════════════════════════════════════

// GET /api/me — get current customer data
app.get('/api/me', requireAuth, (req, res) => {
  const db = readDB();
  const customer = db.customers.find(c => c.id === req.user.id);
  if (!customer) return res.status(404).json({ error: 'ไม่พบสมาชิก' });
  res.json({ customer: safeCustomer(customer) });
});

// GET /api/qr — generate QR code as data URL
app.get('/api/qr', requireAuth, async (req, res) => {
  const payload = JSON.stringify({ id: req.user.id, t: Date.now() });
  const qr = await QRCode.toDataURL(payload, {
    width: 300,
    color: { dark: '#1A1209', light: '#FFFFFF' }
  });
  res.json({ qr, customerId: req.user.id });
});

// ═══════════════════════════════════════════════════════════
//  ADMIN ROUTES
// ═══════════════════════════════════════════════════════════

// GET /api/admin/stats
app.get('/api/admin/stats', requireAdmin, (req, res) => {
  const db = readDB();
  const today = todayStr();
  const stampsToday = db.stampsToday?.date === today ? db.stampsToday.count : 0;
  res.json({
    totalCustomers: db.customers.length,
    activeCustomers: db.customers.filter(c => c.totalEarned > 0).length,
    rewardsGiven: db.rewardsGiven || 0,
    stampsToday
  });
});

// GET /api/admin/customers
app.get('/api/admin/customers', requireAdmin, (req, res) => {
  const db = readDB();
  res.json({ customers: db.customers.map(safeCustomer) });
});

// POST /api/admin/stamp — give a stamp by customer ID
app.post('/api/admin/stamp', requireAdmin, (req, res) => {
  const { customerId } = req.body;
  const db = readDB();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'ไม่พบสมาชิก: ' + customerId });
  if (customer.stamps >= TOTAL_STAMPS)
    return res.status(400).json({ error: customer.name + ' มี stamp ครบแล้ว' });

  customer.stamps++;
  customer.totalEarned++;
  customer.history.push({ type: 'stamp', label: '+1 Stamp', date: thaiDate() });

  // Track daily stamps
  const today = todayStr();
  if (!db.stampsToday || db.stampsToday.date !== today) db.stampsToday = { date: today, count: 0 };
  db.stampsToday.count++;

  let rewardEarned = false;
  if (customer.stamps >= TOTAL_STAMPS) {
    rewardEarned = true;
  }

  writeDB(db);
  res.json({ success: true, customer: safeCustomer(customer), rewardEarned });
});

// POST /api/admin/redeem — redeem reward (reset stamps)
app.post('/api/admin/redeem', requireAdmin, (req, res) => {
  const { customerId } = req.body;
  const db = readDB();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'ไม่พบสมาชิก' });
  if (customer.stamps < TOTAL_STAMPS)
    return res.status(400).json({ error: 'stamps ยังไม่ครบ' });

  customer.stamps = 0;
  customer.rewardsRedeemed++;
  customer.history.push({ type: 'reward', label: '🎁 แลก Thai Tea ฟรี', date: thaiDate() });
  db.rewardsGiven = (db.rewardsGiven || 0) + 1;

  writeDB(db);
  res.json({ success: true, customer: safeCustomer(customer) });
});

// POST /api/admin/scan — scan QR payload, give stamp
app.post('/api/admin/scan', requireAdmin, (req, res) => {
  const { qrPayload } = req.body;
  let customerId;
  try {
    const parsed = JSON.parse(qrPayload);
    customerId = parsed.id;
    // Reject QR codes older than 5 minutes
    if (Date.now() - parsed.t > 5 * 60 * 1000)
      return res.status(400).json({ error: 'QR Code หมดอายุ กรุณาให้ลูกค้า refresh' });
  } catch {
    return res.status(400).json({ error: 'QR Code ไม่ถูกต้อง' });
  }

  req.body.customerId = customerId;
  // Reuse stamp logic
  const db = readDB();
  const customer = db.customers.find(c => c.id === customerId);
  if (!customer) return res.status(404).json({ error: 'ไม่พบสมาชิก' });
  if (customer.stamps >= TOTAL_STAMPS)
    return res.status(400).json({ error: customer.name + ' มี stamp ครบแล้ว' });

  customer.stamps++;
  customer.totalEarned++;
  customer.history.push({ type: 'stamp', label: '+1 Stamp', date: thaiDate() });

  const today = todayStr();
  if (!db.stampsToday || db.stampsToday.date !== today) db.stampsToday = { date: today, count: 0 };
  db.stampsToday.count++;

  writeDB(db);
  res.json({ success: true, customer: safeCustomer(customer), rewardEarned: customer.stamps >= TOTAL_STAMPS });
});

// ── Helper: strip password before sending ─────────────────
function safeCustomer(c) {
  const { password, ...safe } = c;
  return safe;
}

// ── Catch-all: serve the frontend app ─────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Pad Thai Cafe Loyalty running on port ${PORT}`);
  console.log(`   Open: http://localhost:${PORT}`);
});
