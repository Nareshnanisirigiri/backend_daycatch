import bcrypt from "bcryptjs";
import * as Models from "../models/index.js";

async function seed() {
    try {
        console.log("Seeding super admin and roles...");
        
        // 1. Create Roles
        const roleNames = ["Super Admin", "Manager", "Dispatcher", "Admin Staff"];
        for(let i=0; i<roleNames.length; i++) {
            await Models.Role.create({ role_name: roleNames[i] });
        }
        console.log("Roles seeded.");

        // 2. Create Super Admin
        const hashedPassword = await bcrypt.hash("admin123", 12);
        await Models.SuperAdmin.create({
            Name: "Admin User",
            Email: "admin@daycatch.com",
            password: hashedPassword,
            "role Name": "Super Admin",
            scope: "all",
            status: "Active"
        });
        console.log("Super Admin seeded: admin@daycatch.com / admin123");

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
}

seed();
