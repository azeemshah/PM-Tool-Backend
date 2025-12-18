import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

export const getSmtpConfig = () => ({
    transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
        },
    },
    tls: {
      ciphers: 'SSLv3', // Helps some servers, can be omitted if unnecessary
      rejectUnauthorized: true, // keep true for Office365
    },
    defaults: {
        from: '"NoReply" <noreply@maab.com>',
    },
    template: {
        dir: join(__dirname, "..", process.env.NODE_ENV === 'production' ? 'templates' : './templates'),
        adapter: new HandlebarsAdapter(),
        options: {
            strict: true,
        },
    },
});