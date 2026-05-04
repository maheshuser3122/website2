// Test centres routes - browse and search available centres
const express = require('express');
const router = express.Router();
const db = require('../database');

// ========== LIST ALL CENTRES ==========
router.get('/', (req, res) => {
    try {
        db.all(
            `SELECT 
                id, name, address, city, postcode, 
                capacity, phone, email, hours,
                (SELECT COUNT(*) FROM appointment_slots WHERE centre_id = test_centres.id AND is_available = 1) as available_slots
            FROM test_centres
            ORDER BY city, name`,
            (err, centres) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to fetch centres' });
                }

                res.json({
                    success: true,
                    count: centres.length,
                    centres: centres.map(c => ({
                        id: c.id,
                        name: c.name,
                        location: `${c.city}, ${c.postcode}`,
                        address: c.address,
                        phone: c.phone,
                        email: c.email,
                        hours: c.hours,
                        capacity: c.capacity,
                        available_slots: c.available_slots
                    }))
                });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== SEARCH CENTRES ==========
router.get('/search', (req, res) => {
    try {
        const { city, postcode, keyword } = req.query;
        let query = `SELECT 
                        id, name, address, city, postcode, 
                        capacity, phone, email, hours, distance_km,
                        (SELECT COUNT(*) FROM appointment_slots WHERE centre_id = test_centres.id AND is_available = 1) as available_slots
                    FROM test_centres
                    WHERE 1=1`;
        const params = [];

        if (city) {
            query += ' AND LOWER(city) LIKE ?';
            params.push('%' + city.toLowerCase() + '%');
        }

        if (postcode) {
            query += ' AND postcode LIKE ?';
            params.push('%' + postcode.toUpperCase() + '%');
        }

        if (keyword) {
            query += ' AND (LOWER(name) LIKE ? OR LOWER(address) LIKE ?)';
            params.push('%' + keyword.toLowerCase() + '%');
            params.push('%' + keyword.toLowerCase() + '%');
        }

        query += ' ORDER BY city, name';

        db.all(query, params, (err, centres) => {
            if (err) {
                return res.status(500).json({ error: 'Search failed' });
            }

            if (centres.length === 0) {
                // If no results, return all centres
                db.all(`
                    SELECT 
                        id, name, address, city, postcode, 
                        capacity, phone, email, hours,
                        (SELECT COUNT(*) FROM appointment_slots WHERE centre_id = test_centres.id AND is_available = 1) as available_slots
                    FROM test_centres
                    ORDER BY city, name
                    LIMIT 10
                `, (err, allCentres) => {
                    res.json({
                        success: true,
                        message: 'No exact matches. Showing suggested centres.',
                        count: allCentres.length,
                        centres: allCentres
                    });
                });
            } else {
                res.json({
                    success: true,
                    count: centres.length,
                    centres: centres.map(c => ({
                        id: c.id,
                        name: c.name,
                        location: `${c.city}, ${c.postcode}`,
                        address: c.address,
                        distance_km: c.distance_km,
                        phone: c.phone,
                        email: c.email,
                        hours: c.hours,
                        available_slots: c.available_slots
                    }))
                });
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== GET CENTRE DETAILS ==========
router.get('/:centre_id', (req, res) => {
    try {
        const { centre_id } = req.params;

        db.get(
            `SELECT * FROM test_centres WHERE id = ?`,
            [centre_id],
            (err, centre) => {
                if (!centre) {
                    return res.status(404).json({ error: 'Centre not found' });
                }

                // Get upcoming slots for this centre
                db.all(
                    `SELECT 
                        id, slot_date, slot_time, test_type, price, capacity,
                        (SELECT COUNT(*) FROM bookings WHERE appointment_slot_id = appointment_slots.id AND status = 'confirmed') as booked_count
                    FROM appointment_slots
                    WHERE centre_id = ? AND is_available = 1 AND slot_date >= date('now')
                    ORDER BY slot_date, slot_time
                    LIMIT 30`,
                    [centre_id],
                    (err, slots) => {
                        res.json({
                            success: true,
                            centre: {
                                id: centre.id,
                                name: centre.name,
                                address: centre.address,
                                city: centre.city,
                                postcode: centre.postcode,
                                phone: centre.phone,
                                email: centre.email,
                                hours: centre.hours,
                                capacity: centre.capacity,
                                distance_km: centre.distance_km
                            },
                            available_slots: slots.map(s => ({
                                id: s.id,
                                date: s.slot_date,
                                time: s.slot_time,
                                test_type: s.test_type,
                                price: s.price,
                                available_spaces: s.capacity - s.booked_count,
                                total_capacity: s.capacity
                            }))
                        });
                    }
                );
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ========== GET AVAILABLE SLOTS BY CENTRE ==========
router.get('/:centre_id/slots', (req, res) => {
    try {
        const { centre_id } = req.params;
        const { test_type, date_from, date_to } = req.query;

        let query = `
            SELECT 
                s.id, s.slot_date, s.slot_time, s.test_type, s.price, s.capacity,
                (SELECT COUNT(*) FROM bookings WHERE appointment_slot_id = s.id AND status = 'confirmed') as booked_count,
                c.name as centre_name
            FROM appointment_slots s
            JOIN test_centres c ON s.centre_id = c.id
            WHERE s.centre_id = ? AND s.is_available = 1 AND s.slot_date >= date('now')
        `;
        const params = [centre_id];

        if (test_type) {
            query += ' AND s.test_type = ?';
            params.push(test_type);
        }

        if (date_from) {
            query += ' AND s.slot_date >= ?';
            params.push(date_from);
        }

        if (date_to) {
            query += ' AND s.slot_date <= ?';
            params.push(date_to);
        }

        query += ' ORDER BY s.slot_date, s.slot_time LIMIT 50';

        db.all(query, params, (err, slots) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch slots' });
            }

            res.json({
                success: true,
                count: slots.length,
                slots: slots.map(s => ({
                    id: s.id,
                    centre: s.centre_name,
                    date: s.slot_date,
                    time: s.slot_time,
                    test_type: s.test_type,
                    price: s.price,
                    available_spaces: s.capacity - s.booked_count,
                    capacity: s.capacity,
                    availability_percent: Math.round(((s.capacity - s.booked_count) / s.capacity) * 100)
                }))
            });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
