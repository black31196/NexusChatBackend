// src/middlewares/errorHandler.js
function errorHandler(err, req, res, next) { console.error(err); res.status(err.status || 500).json({ message: err.message || 'Internal Error' }); }
function asyncWrapper(fn) { return (req, res, next) => Promise.resolve(fn(req,res,next)).catch(next); }
module.exports = { errorHandler, asyncWrapper };