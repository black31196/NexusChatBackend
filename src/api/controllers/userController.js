// api/controllers/userController.js
const { pool } = require('../../db/postgresql');

exports.getAllUsers = async (req, res) => {
  const result = await pool.query('SELECT id, username, email, role, first_name, last_name FROM fb_users ORDER BY id ASC');
  res.status(200).json({
    status: 'success',
    results: result.rowCount,
    data: {
      users: result.rows,
    },
  });
};

exports.getUserById = async (req, res) => {
  const { id } = req.params;

  // Admin can get anyone, user can only get themselves
  if (req.user.role !== 'admin' && req.user.id.toString() !== id) {
     return res.status(403).json({ status: 'fail', message: 'You do not have permission to view this user.' });
  }
  
  const result = await pool.query('SELECT id, username, email, role, first_name, last_name FROM fb_users WHERE id = $1', [id]);
  
  if (result.rowCount === 0) {
    return res.status(404).json({ status: 'fail', message: 'No user found with that ID' });
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: result.rows[0],
    },
  });
};