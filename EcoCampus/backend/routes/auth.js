const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = express.Router();

const pool = require("../db");

const {
    authenticate
} = require("../middleware/auth");


const JWT_SECRET =
    process.env.JWT_SECRET || "ecocampus_secret_key";


// ======================================================
// REGISTER
// POST /api/auth/register
// ======================================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // -----------------------------------------------
        // Validate input
        // -----------------------------------------------

        if (!name || !email || !password) {

            return res.status(400).json({
                message:
                    "Name, email and password are required."
            });

        }


        if (name.trim().length < 2) {

            return res.status(400).json({
                message:
                    "Please enter a valid name."
            });

        }


        if (password.length < 6) {

            return res.status(400).json({
                message:
                    "Password must contain at least 6 characters."
            });

        }


        const cleanName =
            name.trim();


        const cleanEmail =
            email.trim().toLowerCase();


        // -----------------------------------------------
        // Check if email already exists
        // -----------------------------------------------

        const [existingUsers] =
            await pool.query(
                "SELECT id FROM users WHERE email = ? LIMIT 1",
                [cleanEmail]
            );


        if (existingUsers.length > 0) {

            return res.status(409).json({

                message:
                    "An account with this email already exists."

            });

        }


        // -----------------------------------------------
        // Hash password
        // -----------------------------------------------

        const passwordHash =
            await bcrypt.hash(
                password,
                10
            );


        // -----------------------------------------------
        // Create user
        // -----------------------------------------------

        const [result] =
            await pool.query(
                `
                INSERT INTO users
                (
                    name,
                    email,
                    password_hash,
                    role
                )
                VALUES (?, ?, ?, 'user')
                `,
                [
                    cleanName,
                    cleanEmail,
                    passwordHash
                ]
            );


        // -----------------------------------------------
        // Return JSON response
        // -----------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Account created successfully.",

            user: {

                id: result.insertId,

                name: cleanName,

                email: cleanEmail,

                role: "user"

            }

        });


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        // Duplicate email protection
        if (error.code === "ER_DUP_ENTRY") {

            return res.status(409).json({

                message:
                    "An account with this email already exists."

            });

        }


        return res.status(500).json({

            message:
                "Server error while creating account."

        });

    }

});


// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                message:
                    "Email and password are required."

            });

        }


        const cleanEmail =
            email.trim().toLowerCase();


        // -----------------------------------------------
        // Find user
        // -----------------------------------------------

        const [users] =
            await pool.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    password_hash,
                    role,
                    created_at
                FROM users
                WHERE email = ?
                LIMIT 1
                `,
                [cleanEmail]
            );


        if (users.length === 0) {

            return res.status(401).json({

                message:
                    "Invalid email or password."

            });

        }


        const user =
            users[0];


        // -----------------------------------------------
        // Check password
        // -----------------------------------------------

        const passwordMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!passwordMatch) {

            return res.status(401).json({

                message:
                    "Invalid email or password."

            });

        }


        // -----------------------------------------------
        // Create JWT
        // -----------------------------------------------

        const token =
            jwt.sign(

                {
                    id: user.id,

                    email: user.email,

                    role: user.role

                },

                JWT_SECRET,

                {
                    expiresIn: "24h"
                }

            );


        // -----------------------------------------------
        // Send response
        // -----------------------------------------------

        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token: token,

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                role: user.role,

                created_at:
                    user.created_at

            }

        });


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        return res.status(500).json({

            message:
                "Server error while logging in."

        });

    }

});


// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get(
    "/me",
    authenticate,
    async (req, res) => {

        try {

            const [users] =
                await pool.query(
                    `
                    SELECT
                        id,
                        name,
                        email,
                        role,
                        created_at
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [req.user.id]
                );


            if (users.length === 0) {

                return res.status(404).json({

                    message:
                        "User not found."

                });

            }


            return res.status(200).json({

                success: true,

                user: users[0]

            });


        } catch (error) {

            console.error(
                "ME ERROR:",
                error
            );


            return res.status(500).json({

                message:
                    "Server error."

            });

        }

    }
);


// ======================================================
// LOGOUT
// ======================================================

router.post("/logout", authenticate, (req, res) => {

    return res.status(200).json({

        success: true,

        message:
            "Logged out successfully."

    });

});


module.exports = router;