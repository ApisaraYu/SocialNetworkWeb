import nodemailer from 'nodemailer'

// สร้าง transporter สำหรับส่ง email ผ่าน Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password จาก Google
  },
})

// ส่ง OTP สำหรับยืนยัน email ตอนสมัครสมาชิก
const sendVerifyOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Socialio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'ยืนยัน Email ของคุณ',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">ยืนยัน Email ของคุณ</h2>
        <p>กรอกรหัส OTP นี้เพื่อยืนยัน Email ของคุณ</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="color: #4CAF50; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="color: #999;">รหัสนี้จะหมดอายุใน <strong>10 นาที</strong></p>
        <p style="color: #999;">หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

// ส่ง OTP สำหรับรีเซ็ตรหัสผ่าน
const sendResetPasswordOTP = async (email, otp) => {
  const mailOptions = {
    from: `"Socialio" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'รีเซ็ตรหัสผ่าน',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">รีเซ็ตรหัสผ่าน</h2>
        <p>กรอกรหัส OTP นี้เพื่อรีเซ็ตรหัสผ่านของคุณ</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px;">
          <h1 style="color: #f44336; letter-spacing: 8px;">${otp}</h1>
        </div>
        <p style="color: #999;">รหัสนี้จะหมดอายุใน <strong>10 นาที</strong></p>
        <p style="color: #999;">หากคุณไม่ได้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  }

  await transporter.sendMail(mailOptions)
}

export { sendVerifyOTP, sendResetPasswordOTP }