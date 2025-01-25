const express = require('express');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors'); 

const app = express();
app.use(express.json());
app.use(cors()); 

const bcrypt=require("bcrypt")
const jwt = require("jsonwebtoken");

const authMiddleware=require("./middleware/auth");


app.use(express.json());



mongoose.connect("mongodb+srv://sathanard2023cse:sathu2828@cluster0.7wxev.mongodb.net/dressShop").then(()=>
  console.log("Connect to MongoDb"))
  .catch((err) => console.error("Failed to connect to MongoDB:", err));


const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String }, // URL of product image
  stock: { type: Number, required: true, default: 0 },
  available: { type: Boolean, default: true },
});


const Product = mongoose.model('Product', productSchema);

const userSchema=new mongoose.Schema({                               // creating the schema using this we can create the model
  id:{type:String,required:true,unique:true},
  uname:{type:String,required:true},
  email:{type:String,required:true,unique:true},
  password:{type:String,required:true}
})

const User=mongoose.model("User",userSchema);


app.get('/api/products', authMiddleware,async (req, res) => {
  console.log(req.user)

  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.post('/api/products', async (req, res) => {
  const { name, category, price, description, image, stock } = req.body;

  if (!name || !category || !price || stock == null) {
    return res.status(400).json({ message: 'Name, category, price, and stock are required' });
  }

  try {
    const newProduct = new Product({
      id: uuidv4(),
      name,
      category,
      price,
      description,
      image,
      stock,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, description, image, stock, available } = req.body;

  try {
    const updatedProduct = await Product.findOneAndUpdate(
      { id },
      { name, category, price, description, image, stock, available },
      { new: true } // Return updated product
    );

    if (!updatedProduct) return res.status(404).json({ message: 'Product not found' });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.delete('/api/products/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findOneAndDelete({ id: req.params.id });
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post("/register",async(req,res)=>{
  const{email,uname,password}=req.body;
  try{
  const user=await User.findOne({email});
  if(user){
      return res.status(400).json({message:"Email alreday exists"});
  }
const hashedPassword=await bcrypt.hash(password,10);
const newUser=new User({
  id:uuidv4(),
  email,
  uname,
  password :hashedPassword,
});
await newUser.save();
res.status(200).json({message:"User created successfully"});
  }
  catch(error){
    console.error(error);
      res.status(500).json({message:"Internal server error"});
  }
});
//Login

app.post("/login",async (req,res)=>{
  const{email,password}=req.body;
  try{
      const user=await User.findOne({email});
      if(!user){
          return res.status(400).json({message:"Invaild Email"});
      }

      const isValidPassword=await bcrypt.compare(password,user.password);

      if(!isValidPassword){
          return res.status(400).json({message:"Invaild Password"});
      }

      // CREATING A TOKEN WITH 3 ARGUMNETS 
      const token=jwt.sign({id:user.id},"my_secret",{expiresIn:"1h"});
      res.status(200).json({token});

  }
  catch(error){
      return res.status(500).json({message:"Internal server error"});
  }

});


app.listen(3000, () => {
  console.log('Backend server is running on http://localhost:3000');
});
