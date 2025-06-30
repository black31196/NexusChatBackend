// src/schemas/chatSchemas.js
const Joi = require('joi');
const lineIdPattern = /^U[A-Za-z0-9]+$/;
const idSchema = Joi.alternatives().try(
  Joi.string().uuid(),
  Joi.string().pattern(lineIdPattern)
);

exports.sendMessageSchema = Joi.object({
  to_user:      idSchema.required(),
  content: Joi.string().min(1).required(),
});

exports.historyQuerySchema = Joi.object({
  to_user:    Joi.string().uuid().required(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});
