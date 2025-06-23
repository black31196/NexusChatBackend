// api/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../../middlewares/auth');

const router = express.Router();

// All routes below are protected
router.use(authMiddleware.protect);

router.get('/', authMiddleware.restrictTo('admin'), userController.getAllUsers);
router.get('/:id', userController.getUserById);

module.exports = router;