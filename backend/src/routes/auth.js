const express = require('express');
const router = express.Router();
const pool = require('../config/index');
const { hashPassword, comparePassword } = require('../utils/hash');
const jwt = require('jsonwebtoken');
const upload = require('../middleware/upload');


//signup api
router.post(
    '/signup',
    upload.single('photo'),
    async (req, res) => {
        try {
            const { companyName, name, email, phone, password, confirmPassword } = req.body;

            if (!name || !email || !phone || !password || !confirmPassword) {
                return res.status(400).json({ message: 'All fields required' });
            }

            if (password !== confirmPassword) {
                return res.status(400).json({ message: 'Passwords do not match' });
            }

            const hashedPassword = await hashPassword(password);

            const photoPath = req.file ? req.file.path : null;
            const joiningDate = new Date().toISOString().split("T")[0];
            const loginId = await generateLoginId(
                name,
                companyName,
                joiningDate,
                pool
            );
            console.log("Generated Login ID:", loginId);

            const result = await pool.query(
                `INSERT INTO users 
                (name, email, phone, password, photo, is_admin, company_name, login_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING id, name, email, login_id`,
                [
                    name,
                    email,
                    phone,
                    hashedPassword,
                    photoPath,
                    false,
                    companyName,
                    loginId,
                    false
                ]
            );



            res.status(201).json({
                success: true,
                user: result.rows[0]
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
);

//login api
router.post('/login', async (req, res) => {
    const { auth_id, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email=$1 OR login_id=$1', [auth_id]);
        console.log("Login Query Result:", result.rows);
        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const match = await comparePassword(password, user.password);

        if (!match) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'secretkey',
            { expiresIn: '1d' }
        );
        console.log("Generated JWT Token:", token);
        res.cookie('token', token);

        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//logout api
router.post('/logout', async (req, res) => {
    res.clearCookie('token');
    res.json({ success: true, message: 'Logged out successfully' });
});


//profile api
router.get('/profile', async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided 123' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const userId = decoded.id;
        const result = await pool.query('SELECT id, name, email, phone, photo, is_admin, company_name, login_id FROM users WHERE id=$1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


//get all users api
router.get('/getallusers', async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const userId = decoded.id;
        const company_name = await pool.query('SELECT company_name FROM users WHERE id=$1', [userId]);
        const result = await pool.query('SELECT id, name, email, phone, photo, is_admin, company_name, login_id ,is_active FROM users where company_name=$1', [company_name.rows[0].company_name]);
        res.json({ success: true, users: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


//get all employees api
router.get('/getallemps', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, phone, photo, is_admin, company_name, login_id,is_active FROM users where is_admin=false');
        res.json({ success: true, users: result.rows });
    }
    catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

//checkin apis
router.get('/checkin', async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const userId = decoded.id;
        
        // Get login_id from users table
        const userResult = await pool.query('SELECT login_id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const loginId = userResult.rows[0].login_id;
        console.log("Login ID:");
        // Insert into attendance table with status true

        try{
        await pool.query(
            `INSERT INTO attend (employee_id, check_in, status)
             VALUES ($1, CURRENT_TIMESTAMP, true)`,
            [userId]
        );}catch(err){
            return res.status(400).json({ success: false, message: 'Already checked in' });
        }
        
        const result = await pool.query(
            `UPDATE users
     SET is_active = true,
         check_in = CURRENT_TIMESTAMP,
         check_out = NULL
     WHERE id = $1
     RETURNING id, name, is_active, check_in`,
            [userId]
        );
        console.log("Check-in Query Result:", result.rows);
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: result.rows[0], login_id: loginId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


//checkout api
router.get('/checkout', async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const userId = decoded.id;
        
        // Get login_id from users table
        const userResult = await pool.query('SELECT login_id FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const loginId = userResult.rows[0].login_id;
        
        // Update attendance table with check_out and status false
        await pool.query(
            `UPDATE attend 
             SET check_out = CURRENT_TIMESTAMP, status = false
             WHERE employee_id = $1 AND status = true`,
            [userId]
        );
        
        const result = await pool.query(
            `UPDATE users
     SET is_active = false,
         check_out = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING id, name, is_active, check_out`,
            [userId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user: result.rows[0], login_id: loginId });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});


//get attendance api
router.get('/getattendance', async (req, res) => {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        const userId = decoded.id;

        const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [userId]);
        if (adminCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (!adminCheck.rows[0].is_admin) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        // Get attendance records
        const result = await pool.query(
            `SELECT a.id, a.employee_id, a.check_in, a.check_out, a.status, u.login_id, u.name
             FROM attend a
             JOIN users u ON CAST(a.employee_id AS INTEGER) = u.id
             ORDER BY a.check_in DESC`
        );
        console.log("Attendance Query Result:", result.rows);
        const attendance = result.rows.map(mapAttendanceRow);
        res.json({ success: true, attendance });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});




function mapAttendanceRow(row) {
    const checkInIST = formatISTTime(row.check_in);
    const checkOutIST = formatISTTime(row.check_out);
    const workHours = calcWorkHours(row.check_in, row.check_out);

    return {
        id: row.id,
        employee_id: row.employee_id,
        login_id: row.login_id,
        name: row.name,
        check_in: checkInIST,
        check_out: checkOutIST,
        work_hours: workHours,
        status: row.status
    };
}

function formatISTTime(date) {
    if (!date) return null;
    const d = date instanceof Date ? date : new Date(date);
    const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
    return formatter.format(d);
}

function calcWorkHours(checkIn, checkOut) {
    if (!checkIn || !checkOut) return null;
    const inDate = checkIn instanceof Date ? checkIn : new Date(checkIn);
    const outDate = checkOut instanceof Date ? checkOut : new Date(checkOut);
    const diffMs = outDate.getTime() - inDate.getTime();
    return Number((diffMs / (1000 * 60 * 60)).toFixed(2));
}

async function generateLoginId(name, companyName, joiningDate, client) {

    // Company code (first letter of each word)
    const companyCode = companyName
        .split(/\s+/)
        .map(word => word[0].toUpperCase())
        .join("");

    // Split name by space OR tab
    const parts = name.trim().split(/\s+/);

    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";

    const fn = firstName.substring(0, 2).toUpperCase();
    const ln = lastName.substring(0, 2).toUpperCase();

    const year = new Date(joiningDate).getFullYear();

    // Count employees joined in same year for this company
    const result = await client.query(
        `SELECT COUNT(*)
        FROM users
        WHERE EXTRACT(YEAR FROM created_at) = $1
        AND company_name = $2;`,
        [year, companyName]
    );

    const serial = String(Number(result.rows[0].count) + 1).padStart(4, "0");

    return `${companyCode}${fn}${ln}${year}${serial}`;
}


module.exports = router;
