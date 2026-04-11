import pkg from "@prisma/client";
import mysql from "mysql2/promise";
import { 
    MYSQL_HOST, 
    MYSQL_USER, 
    MYSQL_PASSWORD, 
    MYSQL_DATABASE 
} from "./serverConfig.js";
import { ensureSubAdminCityAccessTable } from "../utils/subAdminAccessUtils.js";

const { PrismaClient } = pkg;

// Initialize Prisma Client
export const prisma = new PrismaClient({
    log: ["warn", "error"]
});

async function ensureDatabaseExists() {
    try {
        const connection = await mysql.createConnection({
            host: MYSQL_HOST,
            user: MYSQL_USER,
            password: MYSQL_PASSWORD
        });

        // Use standard industry SQL to guarantee db presence
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`;`);
        await connection.end();
        console.log(`Database verification complete: "${MYSQL_DATABASE}" is ready.`);
    } catch (err) {
        console.error("Critical: Could not verify/create database:", err.message);
        // We don't throw here, prisma.$connect() will provide the final verdict
    }
}

export default async function connectDatabase() {
    try {
        // Step 1: Pre-verify database exists (Common local developer pain point)
        await ensureDatabaseExists();

        // Step 2: Connect Prisma
        await prisma.$connect();
        await ensureSubAdminCityAccessTable();
        console.log("Prisma Client Connected Successfully");
        
    } catch (err) {
        console.error("Database connection failure:", err.message);
        throw err;
    }
}
