import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/connectDB.js';

dotenv.config();
connectDB();

const app = express();

const PORT = process.env.PORT || 8000;

app.get('/', (req,res)=>{
    return res.json({message:"Server Started"});
})

app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);  
})
