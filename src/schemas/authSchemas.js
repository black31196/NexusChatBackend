// src/schemas/authSchemas.js
const Joi = require('joi');
const registerSchema = Joi.object({ 
    username: Joi.string().alphanum().min(3).max(30).required(), 
    email: Joi.string().email().required(), 
    password: Joi.string().min(8).required(),
    role : Joi.string().valid('agent','supervisor','admin','superadmin','line_user')
});

const loginSchema = Joi.object({ 
    username: Joi.string().required(), 
    password: Joi.string().required() 
});
module.exports = { registerSchema, loginSchema };