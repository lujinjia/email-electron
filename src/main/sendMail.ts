const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 587,
  secure: false,
  auth: {
    user: '924515022@qq.com',
    pass: 'hysmlengxpicbfie'
  }
})

export async function sendMail(mailInfo) {
  const info = await transporter.sendMail({
    from: mailInfo.from,
    to: mailInfo.to,
    subject: mailInfo.subject,
    html: mailInfo.text
  })

  console.log('send mail success: ', info.messageId)

  return true
}
