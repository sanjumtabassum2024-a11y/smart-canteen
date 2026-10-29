require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcryptjs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smart_canteen";
const SESSION_SECRET = process.env.SESSION_SECRET || "development-only-change-me";

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
  name: "smartcanteen.sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: MONGODB_URI, collectionName: "sessions" }),
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 1000 * 60 * 60 * 8 }
}));

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, default: "", maxlength: 500 },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: "" },
  emoji: { type: String, default: "🍽️" },
  available: { type: Boolean, default: true }
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true },
  customerEmail: { type: String, required: true, trim: true, lowercase: true },
  customerPhone: { type: String, required: true, trim: true },
  items: [{
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "Food" },
    name: String,
    price: Number,
    quantity: { type: Number, min: 1 }
  }],
  total: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: ["Pay at pickup", "UPI (demo)"], default: "Pay at pickup" },
  paymentStatus: { type: String, default: "Pending" },
  status: { type: String, enum: ["Placed", "Preparing", "Ready for pickup", "Completed", "Cancelled"], default: "Placed" },
  pickupCode: { type: String, default: "" }
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "admin" }
}, { timestamps: true });

const Food = mongoose.model("Food", foodSchema);
const Order = mongoose.model("Order", orderSchema);
const Admin = mongoose.model("Admin", adminSchema);

const demoFoods = [
  { name: "Masala Dosa", description: "Golden crisp dosa with spiced potato masala and chutneys.", category: "Meals", price: 60, emoji: "🥞", image: "https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85" },
  { name: "Veg Fried Rice", description: "Wok-tossed rice, seasonal vegetables and aromatic spices.", category: "Meals", price: 90, emoji: "🍚", image: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=900&q=85" },
  { name: "Paneer Wrap", description: "Soft wrap filled with grilled paneer, crunchy salad and mint sauce.", category: "Meals", price: 85, emoji: "🌯", image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=900&q=85" },
  { name: "Veg Burger", description: "Crispy vegetable patty, lettuce and house sauce in a toasted bun.", category: "Snacks", price: 70, emoji: "🍔", image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=85" },
  { name: "Garden Sandwich", description: "Fresh vegetables, cheese and herbs between toasted bread.", category: "Snacks", price: 50, emoji: "🥪", image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=85" },
  { name: "Samosa", description: "Flaky pastry filled with seasoned potato and peas.", category: "Snacks", price: 20, emoji: "🥟", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85" },
  { name: "Fresh Lime Soda", description: "A bright, refreshing lime drink served chilled.", category: "Drinks", price: 35, emoji: "🍋", image: "https://images.unsplash.com/photo-1513558161293-cdab0e9dad2a?auto=format&fit=crop&w=900&q=85" },
  { name: "Filter Coffee", description: "South Indian filter coffee with a rich, smooth finish.", category: "Drinks", price: 25, emoji: "☕", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85" },
  { name: "Chocolate Brownie", description: "A soft chocolate brownie for a little afternoon treat.", category: "Desserts", price: 45, emoji: "🍫", image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=900&q=85" },
  { name: "Fruit Yogurt Bowl", description: "Creamy yogurt topped with fresh fruit and crunchy granola.", category: "Breakfast", price: 65, emoji: "🍓", image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85" }
];

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.status(401).json({ message: "Please sign in as an administrator." });
}

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { message: "Too many login attempts. Try again in 15 minutes." } });

app.get("/api/foods", async (req, res) => {
  try {
    const foods = await Food.find().sort({ category: 1, name: 1 }).lean();
    res.json(foods);
  } catch (err) { res.status(500).json({ message: "Could not load menu." }); }
});

app.get("/api/foods/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid food ID." });
  const food = await Food.findById(req.params.id).lean();
  if (!food) return res.status(404).json({ message: "Food item not found." });
  res.json(food);
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, items, paymentMethod } = req.body;
    if (!customerName?.trim() || !customerEmail?.trim() || !customerPhone?.trim() || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ message: "Enter your details and add at least one item." });
    }
    if (!["Pay at pickup", "UPI (demo)"].includes(paymentMethod || "Pay at pickup")) {
      return res.status(400).json({ message: "Choose a valid payment method." });
    }
    const orderItems = [];
    for (const entry of items) {
      if (!mongoose.isValidObjectId(entry.foodId)) return res.status(400).json({ message: "A food item is invalid." });
      const quantity = Math.max(1, Math.min(50, parseInt(entry.quantity, 10) || 1));
      const food = await Food.findOne({ _id: entry.foodId, available: true });
      if (!food) return res.status(400).json({ message: "One of your items is no longer available." });
      orderItems.push({ foodId: food._id, name: food.name, price: food.price, quantity });
    }
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({
      customerName: customerName.trim().slice(0, 100),
      customerEmail: customerEmail.trim().toLowerCase().slice(0, 160),
      customerPhone: customerPhone.trim().slice(0, 30),
      items: orderItems, total, paymentMethod: paymentMethod || "Pay at pickup",
      paymentStatus: "Pending", pickupCode: String(Math.floor(1000 + Math.random() * 9000))
    });
    res.status(201).json({ message: "Order placed.", order });
  } catch (err) { res.status(500).json({ message: "Could not place order." }); }
});

app.get("/api/orders/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Enter a valid order ID." });
  const order = await Order.findById(req.params.id).select("-customerEmail -customerPhone").lean();
  if (!order) return res.status(404).json({ message: "Order not found." });
  res.json({ order });
});

app.post("/api/admin/login", loginLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const admin = await Admin.findOne({ email });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return res.status(401).json({ message: "Email or password is incorrect." });
  }
  req.session.adminId = String(admin._id);
  req.session.adminName = admin.name;
  req.session.adminEmail = admin.email;
  req.session.save(err => {
    if (err) return res.status(500).json({ message: "Could not start admin session." });
    res.json({ message: "Signed in.", admin: { name: admin.name, email: admin.email } });
  });
});

app.get("/api/admin/me", requireAdmin, (req, res) => res.json({ name: req.session.adminName, email: req.session.adminEmail }));
app.post("/api/admin/logout", requireAdmin, (req, res) => req.session.destroy(() => res.json({ message: "Signed out." })));

app.get("/api/admin/stats", requireAdmin, async (req, res) => {
  const [foods, orders, placed, revenue] = await Promise.all([
    Food.countDocuments(), Order.countDocuments(), Order.countDocuments({ status: "Placed" }),
    Order.aggregate([{ $match: { status: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$total" } } }])
  ]);
  res.json({ foods, orders, placed, revenue: revenue[0]?.total || 0 });
});

app.get("/api/admin/foods", requireAdmin, async (req, res) => res.json(await Food.find().sort({ createdAt: -1 }).lean()));
app.post("/api/admin/foods", requireAdmin, async (req, res) => {
  try {
    const { name, description, category, price, image, emoji, available } = req.body;
    if (!String(name || "").trim() || !String(category || "").trim() || !Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: "Name, category and a valid price are required." });
    }
    const food = await Food.create({ name: String(name).trim(), description: String(description || "").trim(), category: String(category).trim(), price: Number(price), image: String(image || "").trim(), emoji: emoji || "🍽️", available: available !== false });
    res.status(201).json({ food });
  } catch (err) { res.status(400).json({ message: "Could not create food item." }); }
});
app.patch("/api/admin/foods/:id", requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid food ID." });
  const allowed = ["name", "description", "category", "price", "image", "emoji", "available"];
  const update = {};
  for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
  if (update.price !== undefined) update.price = Number(update.price);
  const food = await Food.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!food) return res.status(404).json({ message: "Food item not found." });
  res.json({ food });
});
app.delete("/api/admin/foods/:id", requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid food ID." });
  const food = await Food.findByIdAndDelete(req.params.id);
  if (!food) return res.status(404).json({ message: "Food item not found." });
  res.json({ message: "Food deleted." });
});
app.get("/api/admin/orders", requireAdmin, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(300).lean();
  res.json(orders);
});
app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
  const statuses = ["Placed", "Preparing", "Ready for pickup", "Completed", "Cancelled"];
  if (!mongoose.isValidObjectId(req.params.id) || !statuses.includes(req.body.status)) return res.status(400).json({ message: "Invalid order or status." });
  const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true }).lean();
  if (!order) return res.status(404).json({ message: "Order not found." });
  res.json({ order });
});

app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

async function seed() {
  if (await Food.countDocuments() === 0) {
    await Food.insertMany(demoFoods);
    console.log("Sample menu created.");
  } else {
    const count = await Food.countDocuments();
    console.log(`Found ${count} existing food items; keeping them.`);
  }
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const email = process.env.ADMIN_EMAIL.toLowerCase();
    const exists = await Admin.findOne({ email });
    if (!exists) {
      const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
      await Admin.create({ name: process.env.ADMIN_NAME || "Administrator", email, passwordHash });
      console.log(`Initial admin created for ${email}. Change the password in .env before deployment.`);
    }
  }
}

mongoose.connect(MONGODB_URI).then(async () => {
  console.log("MongoDB connected.");
  await seed();
  app.listen(PORT, () => console.log(`Smart Canteen running at http://localhost:${PORT}`));
}).catch(err => {
  console.error("MongoDB connection failed:", err.message);
  process.exit(1);
});
