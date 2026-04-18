const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { validateRequest } = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../utils/validation');

const SALT_ROUNDS = 10;

// Register a new user
router.post('/register', validateRequest(registerSchema), async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['customer', 'mechanic', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be customer, mechanic, or admin.' });
    }

    try {
        // Hash the password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Insert into Supabase
        const { data, error } = await supabase
            .from('users')
            .insert([{ name, email, password_hash: passwordHash, role }])
            .select('id, name, email, role')
            .single();

        if (error) {
            if (error.code === '23505') { // Unique violation
                return res.status(409).json({ error: 'Email already exists' });
            }
            throw error;
        }

        res.status(201).json({ message: 'User registered successfully', user: data });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({ error: 'Internal server error during registration' });
    }
});

// Login user
router.post('/login', validateRequest(loginSchema), async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        // Find user in Supabase
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Compare password with hash
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' } // Token valid for 24 hours
        );

        // Return user info (excluding password) and token
        const { password_hash, ...userInfo } = user;

        res.json({
            message: 'Login successful',
            token,
            user: userInfo
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ error: 'Internal server error during login' });
    }
});

module.exports = router;
