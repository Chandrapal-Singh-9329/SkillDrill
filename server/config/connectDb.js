import mongoose from 'mongoose';

const connectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log(`Database connected ${mongoose.connection.host}`);
        
    } catch (error) {
        console.log(`DataBase Error: ${error.message}`)
    }
}

export default connectDB;