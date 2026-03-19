import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5001;
export const MONGO_URI = process.env.MONGO_URI;
export const CLIENT_ORIGINS = [
    "http://localhost:3000",
    "https://daycatchadmin.vercel.app"
];
