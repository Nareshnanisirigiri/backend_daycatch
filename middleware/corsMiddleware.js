import cors from "cors";
import { CLIENT_ORIGINS } from "../config/serverConfig.js";

const corsMiddleware = cors({
    origin: CLIENT_ORIGINS,
    credentials: true
});

export default corsMiddleware;
