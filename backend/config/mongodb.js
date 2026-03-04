import mongoose from "mongoose";
const conn = async () =>{
    try{
        mongoose.connection.on('connected', ()=> console.log('MongoDB connected successfully'))
        
        mongoose.connection.on('error',(err) => console.log('MongoDB connection error:',err))
        
        await mongoose.connect(process.env.Mongo_url)
    
    } catch (err) {
        console.log('Failed to connect to MongoDB:', err.message)
    }
}
export default conn