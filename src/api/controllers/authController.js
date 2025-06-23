// api/controllers/authController.js

const { pool } = require('../../src/models/postgresql');
const bcrypt = require('bcryptjs');

// POST /api/auth/login
exports.login = async (req, res) => {
  const { username, password } = req.body;

  // Basic input validation
  if (!username || !password) {
    return res.status(400).json({ status: 'fail', message: 'Username and password are required.' });
  }

  try {
    // Check for user in line_agents table
    const result = await pool.query(
      `SELECT agent_id, username, password_hash, role, display_name, status
       FROM line_agents
       WHERE username = $1`, [username]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ status: 'fail', message: 'Invalid username or password.' });
    }

    const user = result.rows[0];

    // Check for active status
    if (user.status !== 'active') {
      return res.status(403).json({ status: 'fail', message: 'Account is inactive.' });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ status: 'fail', message: 'Invalid username or password.' });
    }

    // --- For now, just return user info (add JWT here if you want sessions) ---
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          agent_id: user.agent_id,
          username: user.username,
          role: user.role,
          display_name: user.display_name,
        }
      }
    });

  } catch (err) {
    console.error('Error in login:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};

// POST /api/auth/logout
exports.logout = (req, res) => {
  // This is just a placeholder (for stateless JWT: client just deletes token)
  res.status(200).json({ status: 'success', message: 'Logged out.' });
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  // Example: assumes req.user is set by authMiddleware.protect (with JWT)
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'fail', message: 'Not authenticated.' });
    }

    const result = await pool.query(
      `SELECT agent_id, username, role, display_name, status
       FROM line_agents WHERE agent_id = $1`, [req.user.agent_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    const user = result.rows[0];
    res.status(200).json({
      status: 'success',
      data: { user }
    });
  } catch (err) {
    console.error('Error in getMe:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error.' });
  }
};
