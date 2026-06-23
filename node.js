import express from "express";
import bodyParser from "body-parser";
import bcrypt from "bcrypt";
import cors from "cors";
import db from "./db.js";
import userRoutes from './routes/userRoutes.js';

const app = express();
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for frontend requests
app.use(express.static('.')); // Serve static files

// User routes
app.use('/api/users', userRoutes);

// API route for operator registration
app.post("/register-operator", async (req, res) => {
  const { company_name, owner_name, email, phone, password, address, bank_account, ifsc_code, fleet_size } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = `INSERT INTO operators
        (company_name, owner_name, email, phone, password, address, bank_account, ifsc_code, fleet_size, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;

    db.query(sql, [company_name, owner_name, email, phone, hashedPassword, address, bank_account, ifsc_code, fleet_size],
      (err, result) => {
        if (err) return res.status(500).send("❌ Error: " + err.message);
        res.send("✅ Operator registered successfully! Awaiting approval.");
      }
    );
  } catch (error) {
    res.status(500).send("❌ Error hashing password");
  }
});

// API route for searching buses
app.get("/api/search-buses", (req, res) => {
  const { from, to, date } = req.query;

  if (!from || !to || !date) {
    return res.status(400).json({ error: "Missing required parameters: from, to, date" });
  }

  const sql = `
    SELECT b.id, b.bus_type, b.capacity, b.departure_time, b.arrival_time, b.price,
           o.company_name as operator, b.route_from, b.route_to
    FROM buses b
    LEFT JOIN operators o ON b.operator_id = o.id
    WHERE b.route_from = ? AND b.route_to = ? AND DATE(b.departure_time) = ?
  `;

  db.query(sql, [from, to, date], (err, results) => {
    if (err) {
      console.error("DB query error:", err);
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// API route for getting bus details by ID
app.get("/api/bus/:id", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT b.id, b.bus_type, b.capacity, b.departure_time, b.arrival_time, b.price,
           o.company_name as operator, b.route_from, b.route_to
    FROM buses b
    LEFT JOIN operators o ON b.operator_id = o.id
    WHERE b.id = ?
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Bus not found" });
    res.json(results[0]);
  });
});

// API route for getting occupied seats for a bus
app.get("/api/bus/:id/occupied-seats", (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT p.seat_no
    FROM passengers p
    JOIN bookings b ON p.booking_id = b.id
    WHERE b.bus_id = ? AND b.status = 'confirmed'
  `;

  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    const occupiedSeats = results.map(row => parseInt(row.seat_no));
    res.json(occupiedSeats);
  });
});

// API route for updating a bus
app.put("/api/bus/:id", (req, res) => {
  const { id } = req.params;
  const { bus_type, capacity, route_from, route_to, departure_time, arrival_time, price, amenities } = req.body;

  const sql = `
    UPDATE buses
    SET bus_type = ?, capacity = ?, route_from = ?, route_to = ?, departure_time = ?, arrival_time = ?, price = ?, amenities = ?
    WHERE id = ?
  `;

  db.query(sql, [bus_type, capacity, route_from, route_to, departure_time, arrival_time, price, amenities, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Bus not found" });
    res.json({ message: "Bus updated successfully!" });
  });
});

// API route for booking seats
app.post("/api/book-seats", (req, res) => {
  const { bus_id, passengers, total_amount } = req.body;

  if (!bus_id || !passengers || passengers.length === 0) {
    return res.status(400).json({ error: "Missing required data" });
  }

  // Generate PNR
  const pnr = "PR" + Math.floor(100000 + Math.random() * 900000);

  // Insert booking
  const bookingSql = "INSERT INTO bookings (pnr, bus_id, booking_date, total_amount, status) VALUES (?, ?, NOW(), ?, 'confirmed')";
  db.query(bookingSql, [pnr, bus_id, total_amount], (err, bookingResult) => {
    if (err) return res.status(500).json({ error: err.message });

    const bookingId = bookingResult.insertId;

    // Insert passengers
    const passengerValues = passengers.map(p => [bookingId, p.name, p.age, p.gender, p.phone, p.email, p.seat]);
    const passengerSql = "INSERT INTO passengers (booking_id, name, age, gender, phone, email, seat_no) VALUES ?";

    db.query(passengerSql, [passengerValues], (err, passengerResult) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({ pnr, booking_id: bookingId, message: "Booking confirmed!" });
    });
  });
});

// API route for retrieving ticket by PNR
app.get("/api/ticket/:pnr", (req, res) => {
  const { pnr } = req.params;

  const sql = `
    SELECT b.pnr, b.total_amount, b.booking_date,
           bus.bus_type, bus.departure_time, bus.arrival_time, bus.price,
           o.company_name as operator,
           r.from_city, r.to_city
    FROM bookings b
    JOIN buses bus ON b.bus_id = bus.id
    JOIN operators o ON bus.operator_id = o.id
    JOIN routes r ON bus.route_id = r.id
    WHERE b.pnr = ?
  `;

  db.query(sql, [pnr], (err, bookingResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (bookingResults.length === 0) return res.status(404).json({ error: "PNR not found" });

    const booking = bookingResults[0];

    // Get passengers
    const passengerSql = "SELECT name, age, gender, seat_no FROM passengers WHERE booking_id = ?";
    db.query(passengerSql, [booking.id], (err, passengerResults) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        pnr: booking.pnr,
        operator: booking.operator,
        bus_type: booking.bus_type,
        route: `${booking.from_city} to ${booking.to_city}`,
        departure: booking.departure_time,
        arrival: booking.arrival_time,
        price: booking.price,
        total_amount: booking.total_amount,
        passengers: passengerResults
      });
    });
  });
});

// API route for operator login
app.post("/api/operator/login", async (req, res) => {
  const { email, password } = req.body;

  // Bypass authentication if email or phone is "9967-64043" and password is "12345678"
  if ((email === "9967-64043" || phone === "9967-64043") && password === "12345678") {
    return res.json({
      id: 0,
      company_name: "Bypassed Operator",
      email: "9967-64043"
    });
  }

  const sql = "SELECT * FROM operators WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const operator = results[0];
    const isValidPassword = await bcrypt.compare(password, operator.password);
    if (!isValidPassword) return res.status(401).json({ error: "Invalid credentials" });

    if (operator.status !== 'approved') {
      return res.status(403).json({ error: "Account not approved yet" });
    }

    res.json({
      id: operator.id,
      company_name: operator.company_name,
      email: operator.email
    });
  });
});

// API route for adding bus
app.post("/api/add-bus", (req, res) => {
  const { operator_id, bus_type, capacity, route_from, route_to, departure_time, arrival_time, price, amenities } = req.body;

  // operator_id is optional, default to null if not provided
  const op_id = operator_id || null;

  // Find route_id
  const routeSql = "SELECT id FROM routes WHERE from_city = ? AND to_city = ?";
  db.query(routeSql, [route_from, route_to], (err, routeResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (routeResults.length === 0) return res.status(400).json({ error: "Route not found" });

    const route_id = routeResults[0].id;

    const busSql = `INSERT INTO buses (operator_id, route_id, bus_type, capacity, route_from, route_to, departure_time, arrival_time, price, amenities)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    db.query(busSql, [op_id, route_id, bus_type, capacity, route_from, route_to, departure_time, arrival_time, price, amenities], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Bus added successfully!" });
    });
  });
});

// API route for admin login (hardcoded for simplicity)
app.post("/api/admin/login", (req, res) => {
  const { email, password } = req.body;
  if (email === "parakeshreyash@gmail.com" && password === "12345678") {
    res.json({ message: "Admin logged in" });
  } else {
    res.status(401).json({ error: "Invalid admin credentials" });
  }
});

// API route for getting pending operators
app.get("/api/admin/pending-operators", (req, res) => {
  const sql = "SELECT id, company_name, owner_name, email, phone, address, fleet_size, created_at FROM operators WHERE status = 'pending'";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// API route for getting approved operators
app.get("/api/admin/approved-operators", (req, res) => {
  const sql = "SELECT id, company_name FROM operators WHERE status = 'approved'";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// API route for approving operator
app.post("/api/admin/approve-operator", (req, res) => {
  const { operator_id, action } = req.body; // action: 'approve' or 'reject'
  const status = action === 'approve' ? 'approved' : 'rejected';
  const sql = "UPDATE operators SET status = ? WHERE id = ?";
  db.query(sql, [status, operator_id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: `Operator ${action}d successfully!` });
  });
});

// API route for adding route
app.post("/api/admin/add-route", (req, res) => {
  const { from_city, to_city, distance_km, estimated_duration } = req.body;
  const sql = "INSERT INTO routes (from_city, to_city, distance_km, estimated_duration) VALUES (?, ?, ?, ?)";
  db.query(sql, [from_city, to_city, distance_km, estimated_duration], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Route added successfully!" });
  });
});

// Start server
app.listen(3000, () => console.log("🚀 Server running on http://localhost:3000"));
