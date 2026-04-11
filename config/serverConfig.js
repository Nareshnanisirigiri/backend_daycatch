import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5001;
export const MYSQL_HOST = process.env.MYSQL_HOST || "localhost";
export const MYSQL_PORT = process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306;
export const MYSQL_DATABASE = process.env.MYSQL_DATABASE;
export const MYSQL_USER = process.env.MYSQL_USER;
export const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD;
export const CLIENT_ORIGINS = process.env.CLIENT_ORIGINS 
    ? process.env.CLIENT_ORIGINS.split(",") 
    : ["http://localhost:3000", "https://daycatchadmin.vercel.app"];
