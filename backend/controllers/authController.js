//จัดการเกี่ยวกับการยืนยันตัวตนของผู้ใช้ เช่นการลงทะเบียน
//import user model ซึ่งเป็นตัวแทนของผู้ใช้ในฐานข้อมูล
import userModel from "../models/userModel.js"
//import bcrypt ซึ่งใช้สำหรับการเข้ารหัสในส่วนของรหัสผ่านผู้ใช้
import bcrypt from 'bcryptjs'
//import jsonwebtoken ซึ่งใช้สำหรับการสร้างและตรวจสอบโทเค็นที่ใช้ใการยืนยันตัวตนของผู้ใช้
//token เป็นสตริงที่ถูกสร้างขึ้นโดยเซิฟเวอร์
// และส่งกลับไปยังไคลเอนต์หลังจากที่ผู้ใช้เข้าสู่ระบบสำเร็จ
import jwt from 'jsonwebtoken'
import transporter from "../config/nodemailer.js"

//ฟังก์ชันสำหรับการลงทะเบียนผู้ใช้ใหม่
export const register = async (req,res) =>{
    const {name, email, password} = req.body
    
    //ใช้ if เพื่อตรวจสอบว่าผู้ใช้กรอกข้อมูลครบถ้วนหรือไม่
    //เครื่องหมาย || หมายถึง "หรือ" ถ้าข้อมูลใดข้อมูลหนึ่งไม่ครบถ้วนก็จะส่งข้อความแจ้งเตือนกลับไปยังผู้ใช้
    if(!name || !email || !password){
        return res.json({success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน"})
    }
    try{
        //ใช้คำสั่ง findOne เพื่อตรวจสอบว่ามีผู้ใช้ที่มีอีเมล์เดียวกันในฐานข้อมูลแล้วหรือไม่
        // คำสั่ง await หมายถึงการรอผลลัพธ์จากคำสั่ง findOne ก่อนจะดำเนินการต่อไป
        const existingUser = await userModel.findOne({email})
        
        if (existingUser){
            return res.json({success: false, message: "อีเมลนี้ถูกใช้งานแล้ว"})
        }
        // ใช้คำสั่ง hash ของ bcrypt เพื่อเข้ารหัสรหัสผ่านของผู้ใช้ก่อนเก็บลงในฐานข้อมูล
        // โดยใช้ salt rounds เป็น 10 ซึ่งเป็นค่าแนะนำ สำหรับการเข้ารหัสรหัสผ่านที่ปลอดภัย
        // หากใช้ค่ามากไปอาจทำให้กระบวนการช้าลง
        const hashedPassword = await bcrypt.hash(password, 10)

        //สร้างอินสแตนซ์ใหม่ของ userModel โดยส่งข้อมูลที่ได้รับจากผู้ใช้และรหัสผ่านที่เข้ารหัสแล้ว
        const user = new userModel({name, email, password: hashedPassword})
        await user.save()//บันทึกข้อมูลลงในฐานข้อมูล
        
        //สร้าง token สำหรับ user ที่เพิ่งลงทะเบียนสำเร็จ และเก็บไว้ในตัวแปร token
        // jwt.sign เป็นฟังก์ชันที่ใช้ในการสร้าง token โดยรับพารามิเตอร์ดังนี้:
        // 1. payload: ข้อมูลที่ต้องการเก็บใน token ในที่นี้คือ id ของผู้ใช้
        // 2. secret: คีย์ลับที่ใช้ในการเข้ารหัส token ซึ่งควรเก็บเป็นความลับและไม่ควรเปิดเผย
        // 3. options: ตัวเลือกเพิ่มเติมเช่น expiresIn ที่กำหนดวันหมดอายุของ token ในที่นี้กำหนด 7 วัน
        const token = jwt.sign({id:  user._id},process.env.jwt_secret,{expiresIn: '7d'})

        res.cookie('token', token, { //add token ลงฝนคุกกี้ของ browser
            httpOnly: true, // ทำให้ cookie ไม่สามารถเข้าถึงได้จากฝั่ง cilent
            secure: process.env.node_env === 'production', //
            sameSite: process.env.node_env === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // กำหนดอายุของ cookie เป็น 7 วัน
        })
        const mailOption={
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: 'Welcome to our Website',
            text: `Your account are create by this Email: ${email}`
        }
        await transporter.sendMail(mailOption)

        return res.json({
            success: true, message: "ลงทะเบียนสำเร็จ",
            user: {name: user.name, email: user.email}
        })
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

export const login = async (req, res) => {
    const {email, password} = req.body
    
    if (!email || !password) {
        return res.json({success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน"})
    }
    try {
        const user = await userModel.findOne({email})
        if(!user){
            return res.json ({success: false, message: "ข้อมูลไม่ถูกต้อง"})
            // เป็นการตรวจสอบว่ามีอีเมล์นี้ในฐานข้อมูลหรือไม่ ถ้าไม่จะไม่แจ้งว่าไม่พบอีเมล์
            // แต่จะส่งข้อความว่า "ข้อมูลไม่ถูกต้อง"
            // เพื่อป้องกันการโจมตีแบบ brute-force ที่พยายามเดาอีเมล์ที่มีอยู่ในระบบ
        }
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.json({success: false,message: "ข้อมูลไม่ถูกต้อง"})
        }
        const token = jwt.sign({id:user._id}, process.env.jwt_secret,{expiresIn: '7d'})
        res.cookie('token', token, { //add token ลงฝนคุกกี้ของ browser
            httpOnly: true, // ทำให้ cookie ไม่สามารถเข้าถึงได้จากฝั่ง cilent
            secure: process.env.node_env === 'production', //
            sameSite: process.env.node_env === 'production' ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // กำหนดอายุของ cookie เป็น 7 วัน
        })
        return res.json({success: true,message: "เข้าสู่ระบบสำเร็จ"})
    } catch (error) {
        return res.json({success:false,message:error.message})
    }
}

export const logout = async(req,res) =>{
    try{
    res.clearCookie ('token',{
        httpOnly: true,
        secure: process.env.node_env === 'production',
        sameSite: process.env.node_env === 'production' ? 'none' : 'lax',
    })
    return res.json ({success: true, message:"ออกจากระบบสำเร็จ"})
    }catch(error){
        return res.json({success:false,message: error.message})
    }
}