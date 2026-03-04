import 'dotenv/config'

import express from "express"
import cors from "cors"

import cookieParser from "cookie-parser"
import conn from "./config/mongodb.js"
import dns from 'dns/promises';
dns.setServers(['8.8.8.8','1.1.1.1']);
import authRouter from "./routes/authroutes.js"

const app = express()
const port = process.env.port || 4000

conn()

app.use(express.json())
app.use(cookieParser())
app.use(cors({credentials: true})) // send cookies when response
app.get('/',(req,res)=> res.json("API is working."))
//กำหนดเส้นทางสำหรับการจัดการรับรองความถูกต้องของผู้ใช้ โดยใช้ authRouter
//ที่นำเข้าจากไฟล์ routes/authroutes.js
// '/api/auth'เป็นเส้นทางหลักที่ใช้สำหรับการจัดการการรับรองความถูกต้องของผู้ใช้
app.use('/api/auth',authRouter)
app.listen(port,()=> console.log(`Server Started on PORT:${port}`))
