const nodemailer = require("nodemailer");

module.exports = {
    sendEmail: async function (to, subject, content) {
        
        let transporter = nodemailer.createTransport({
            host: "hwsmtp.exmail.qq.com",
            port: "465",
            secure: true,
            auth: {
                user: "noreply@ezcampus.onexmail.com",
                pass: "Lzk940505"
            }
        });
        
        let mailOptions = {
            from: "noreply@ezcampus.onexmail.com",
            to: to,
            subject: subject,
            text: content
        }

        return await transporter.sendMail(mailOptions);
    }
}