import mongoose from "mongoose";

const userSchema = new mongoose.Schema({ //รูปแบบของการเก็บข้อมูลผู้ใช้ภายใน mongoDB
    name:{type: String, required: true},
    email:{type: String, required: true, unique: true},
    password:{type: String, required: true},
    verifyOTP:{type: String, default:''},
    verifyOTPExpire:{type: Number, default: 0},
    isVerified:{type: Boolean, default: false},
    resetOTP:{type: String, default: ''}, //ข้อ OTP ใหม่
    resetOTPExpire:{type: Number, default: 0},
})

//บรรทัดนี้สำหรับสร้างโมเดลของผู้ใช้ โดยใช้ชื่อ "user" และโครงสร้างที่กำหนดใน userSchema
//โดยเครื่องหมาย || จะตรวจสอบว่ามีโมเดล "user" อยู่แล้วหรือไม่ถ้ามีจะใช้โมเดลที่มีอยู่แล้ว
//แต่ถ้าไม่มีจะสร้างโมเดลใหม่ขึ้นมา
const userModel = mongoose.model.user || mongoose.model("user",userSchema)

//บรรทัดนี้สำหรับนำไฟล์นี้ใช้ในที่อื่นๆ โดยการเรียกใช้ชื่อ userModel
export default userModel