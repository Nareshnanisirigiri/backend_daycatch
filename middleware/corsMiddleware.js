import cors from "cors";
import { CLIENT_ORIGINS } from "../config/serverConfig.js";

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl) or from allowed origins
        if (!origin || CLIENT_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 200 // Some browsers (IE11) choke on 204
};

const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
