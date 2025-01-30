const express = require("express");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const authMiddleware = require("./middleware/auth");



const app = express();
const PORT = process.env.PORT || 5000;
app.use('/uploads', express.static('uploads'));


app.use(express.json());
app.use(cors());



// MongoDB connection
mongoose
  .connect("mongodb+srv://sathanard2023cse:sathu2828@cluster0.7wxev.mongodb.net/dressShop")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));

// Schemas and Models
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true, default: uuidv4 },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  category: { type: String, required: true },
});

const Product = mongoose.model("Product", productSchema);

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  uname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const User = mongoose.model("User", userSchema);

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Route for handling product upload
app.post("/api/products/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  console.log("File uploaded:", req.file); // Check if file is coming in the request

  const { name, description, price, category } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

  const newProduct = new Product({
    id:uuidv4(),
    name,
    description,
    price,
    category,
    imageUrl,
  });

  try {
    await newProduct.save();
    res.status(201).json({ message: "Product added successfully!", product: newProduct });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Other Product Routes
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/api/products/casual", async (req, res) => {
  try {
    const products = await Product.find({ category: "casual" });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});


// Register & Login Routes
app.post("/register", async (req, res) => {
  const { email, uname, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ id: uuidv4(), email, uname, password: hashedPassword });
    await newUser.save();

    res.status(200).json({ message: "User created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Email" });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(400).json({ message: "Invalid Password" });

    const token = jwt.sign({ id: user.id }, "my_secret", { expiresIn: "1h" });
    res.status(200).json({ token });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
