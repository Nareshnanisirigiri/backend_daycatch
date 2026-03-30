import mongoose from "mongoose";
import connectDatabase from "./config/db.js";
import { SubAdmin, SuperAdmin } from "./models/index.js";
import { SUPER_ADMIN_ROLE_NAME, normalizeEmail } from "./utils/adminAccountUtils.js";

const getComparableEmail = (record) => normalizeEmail(record?.Email || record?.email || "");

const logRecord = (label, record) => {
    console.log(
        `${label}: ${record?._id || "unknown-id"} | ${record?.Name || "Unknown"} | ${record?.Email || "no-email"}`
    );
};

async function migrateSuperAdmins() {
    await connectDatabase();

    const canonicalSuperAdmins = await SuperAdmin.find({ "role Name": SUPER_ADMIN_ROLE_NAME })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    const legacySuperAdmins = await SubAdmin.find({ "role Name": SUPER_ADMIN_ROLE_NAME })
        .sort({ createdAt: 1, _id: 1 })
        .lean();

    console.log(`Found ${canonicalSuperAdmins.length} super-admin record(s) in "super-admin".`);
    console.log(`Found ${legacySuperAdmins.length} legacy super-admin record(s) in "sub-admin".`);

    if (canonicalSuperAdmins.length > 1) {
        console.error('Aborting: multiple records already exist in the "super-admin" collection.');
        canonicalSuperAdmins.forEach((record, index) => logRecord(`super-admin[${index}]`, record));
        process.exitCode = 1;
        return;
    }

    if (legacySuperAdmins.length === 0) {
        console.log("Nothing to migrate. No legacy Super Admin records were found in sub-admin.");
        return;
    }

    if (legacySuperAdmins.length > 1) {
        console.error('Aborting: multiple legacy Super Admin records exist in the "sub-admin" collection.');
        legacySuperAdmins.forEach((record, index) => logRecord(`sub-admin[${index}]`, record));
        process.exitCode = 1;
        return;
    }

    const legacySuperAdmin = legacySuperAdmins[0];
    const canonicalSuperAdmin = canonicalSuperAdmins[0] || null;

    if (canonicalSuperAdmin) {
        const canonicalEmail = getComparableEmail(canonicalSuperAdmin);
        const legacyEmail = getComparableEmail(legacySuperAdmin);

        if (canonicalEmail && legacyEmail && canonicalEmail !== legacyEmail) {
            console.error("Aborting: a Super Admin already exists in the target collection with a different email.");
            logRecord("target", canonicalSuperAdmin);
            logRecord("legacy", legacySuperAdmin);
            process.exitCode = 1;
            return;
        }

        await SubAdmin.deleteOne({ _id: legacySuperAdmin._id });
        console.log('Cleanup complete: removed the duplicate legacy Super Admin from "sub-admin".');
        logRecord("kept", canonicalSuperAdmin);
        return;
    }

    const { _id, ...legacyPayload } = legacySuperAdmin;

    const createdSuperAdmin = await SuperAdmin.create({
        ...legacyPayload,
        Email: getComparableEmail(legacySuperAdmin),
        "role Name": SUPER_ADMIN_ROLE_NAME,
        scope: "platform",
        storeId: "",
        storeName: ""
    });

    await SubAdmin.deleteOne({ _id: legacySuperAdmin._id });

    console.log('Migration complete: moved the legacy Super Admin from "sub-admin" to "super-admin".');
    logRecord("created", createdSuperAdmin);
}

migrateSuperAdmins()
    .catch((error) => {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
