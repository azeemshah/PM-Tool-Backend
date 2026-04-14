// Validation schema is optional - can be added when joi is installed
// import * as Joi from 'joi';

// export const validationSchema = Joi.object({
//   NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
//   PORT: Joi.number().default(5000),
//   API_PREFIX: Joi.string().default('api/v1'),
//
//   MONGODB_URI: Joi.string().required(),
//
//   JWT_SECRET: Joi.string().required(),
//   JWT_EXPIRATION: Joi.string().default('7d'),
//   JWT_REFRESH_SECRET: Joi.string().required(),
//   JWT_REFRESH_EXPIRATION: Joi.string().default('30d'),
//
//   SMTP_HOST: Joi.string().required(),
//   SMTP_PORT: Joi.number().default(587),
//   SMTP_SECURE: Joi.boolean().default(false),
//   SMTP_USER: Joi.string().required(),
//   SMTP_PASSWORD: Joi.string().required(),
//   EMAIL_FROM: Joi.string().email().required(),
//
//   FRONTEND_URL: Joi.string().uri().required(),
//
//   THROTTLE_TTL: Joi.number().default(60),
//   THROTTLE_LIMIT: Joi.number().default(10),
//
//   PASSWORD_RESET_EXPIRATION: Joi.number().default(3600000),
// });
