import express from "express";
import cors from "cors";
import "dotenv/config";
import cookieParser from "cookie-parser";

//Routes
import authRoutes from "./routes/auth.js"
import membershipRoutes from "./routes/membership.js"
import indexRoutes from "./routes/landingPage.js"
import adminRoutes from "./routes/admin/checkAdmin.js"

//Starts APP
const app = express();

//Makes extrenal connection possible
app.use(
    cors({
        origin: process.env.FrontendURL,
        credentials: true,
    }
    )
);

//Parses the cookies
app.use(cookieParser());

//Makes the use of json possible
app.use(
    express.json()
);

//Routes
app.use('/api/auth', authRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/index', indexRoutes);
app.use('/api/admin', adminRoutes);

app.get('/ping', (req, res) => {
    res.status(200).send('Server is awake');
});

//Logs Requests
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

//Starts the server
app.listen(process.env.PORT, () => {
    console.log(`Gym backend running at: http://localhost:${process.env.PORT}`)
});

//HTTP 400 means roughly: "The client sent a bad/invalid request."
// 201 means: Created successfully.
// 409 means: There's a conflict with the current state of the resource.
// 500 means: Something went wrong on the server.
// 401 means: Unauthorized