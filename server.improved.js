require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//middleware
app.use(express.static("public"));
app.use(express.json());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

//mongodb
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


let allTasks; //for tasks
let allUsers; //for users

//helper function to calculate the suggested deadline based on priority (Urgent: +1 day, High: +2 days, Medium: +7 days, Low: +30 days).
const calculateDeadline = function (startDate, priority) {
    const date = new Date(startDate);
    let daysToAdd = 0;
    switch (priority) {
        case "Urgent":
            daysToAdd = 1;
            break;
        case "High":
            daysToAdd = 2;
            break;
        case "Medium":
            daysToAdd = 7;
            break;
        case "Low":
            daysToAdd = 30;
            break;
    }
    date.setDate(date.getDate() + daysToAdd);
    return date;
}

async function run() {
    try {
        await client.connect();
        console.log("Successfully connected to database");

        allTasks = client.db("todoDB").collection("tasks");
        allUsers = client.db("todoDB").collection("users");

        app.listen(port, () => {
            console.log(`Server is running on http://localhost:${port}`);
        });

    } catch (err) {
        console.error("Failed to connect to mongoDB", err);
        process.exit(1);
    }
}

run();

//user routes
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;
        const existingUser = await allUsers.findOne({ username: username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken." });
        }
        const result = await allUsers.insertOne({ username, password });
        req.session.userId = result.insertedId;
        res.status(201).json({ message: "User created successfully!", userId: result.insertedId, username: req.body.username });
    } catch (error) {
        res.status(500).json({ message: "Error registering user." });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await allUsers.findOne({ username: username, password: password });
        if (user) {
            req.session.userId = user._id;
            res.status(200).json({ message: "Login successful.", userId: user._id, username: user.username });
        } else {
            res.status(401).json({ message: "Invalid credentials." });
        }
    } catch (error) {
        res.status(500).json({ message: "Error logging in." });
    }
});

app.post("/logout", (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Could not log out, please try again." });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logout successful." });
    });
});

app.get("/api/session/status", async (req, res) => {
    if (req.session.userId) {
        // if logged in find username
        const user = await allUsers.findOne({ _id: new ObjectId(req.session.userId) });
        res.status(200).json({ loggedIn: true, username: user.username });
    } else {
        // not logged in, do nothing
        res.status(200).json({ loggedIn: false });
    }
});

//task routes
app.get("/tasks", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in." });
    }
    //only show tasks for logged in user
    const userTasks = await allTasks.find({ ownerId: new ObjectId(req.session.userId) }).toArray();
    res.json(userTasks);
});

app.post("/submit", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in." });
    }
    const newTodo = {
        task: req.body.task,
        priority: req.body.priority,
        dateCreated: new Date(),
        suggestedDeadline: calculateDeadline(new Date(), req.body.priority),
        //assign new task to the userid
        ownerId: new ObjectId(req.session.userId)
    };
    await allTasks.insertOne(newTodo);
    res.status(200).json({ message: "Task added successfully." });
});

app.post("/delete", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in." });
    }
    // users can only delete their own tasks
    const query = {
        _id: new ObjectId(req.body.id),
        ownerId: new ObjectId(req.session.userId)
    };
    await allTasks.deleteOne(query);
    res.status(200).json({ message: "Task deleted successfully." });
});

app.post("/update", async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: "You must be logged in." });
    }
    const { id, priority } = req.body;

    const filter = {
        _id: new ObjectId(id),
        ownerId: new ObjectId(req.session.userId)
    };

    const task = await allTasks.findOne(filter);

    if (!task) {
        return res.status(404).json({ message: "Task not found/insufficient permissions." });
    }

    const updateDoc = {
        $set: {
            priority: priority,
            suggestedDeadline: calculateDeadline(task.dateCreated, priority)
        },
    };
    await allTasks.updateOne(filter, updateDoc);
    res.status(200).json({ message: "Task updated successfully." });
});
