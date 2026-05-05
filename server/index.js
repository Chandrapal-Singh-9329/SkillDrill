import express from 'express'
import dotenv from 'dotenv'
import connectDB from './config/connectDB.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/authRoute.js';


dotenv.config();
connectDB();

const app = express();
app.use(cors({
    origin:'http://localhost:5173',
    credentials: true
}))

app.use(express.json());
app.use(cookieParser());

app.use('/api/auth' , authRouter);


const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=>{
    console.log(`server is running on port ${PORT}`);  
})
