import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const now = new Date("2026-03-18T10:00:00.000Z");

const sampleDocuments = {
    "sub-admin": {
        filter: { Email: "subadmin@daycatch.test" },
        document: {
            Image: "https://example.com/images/sub-admin.png",
            Name: "Main Sub Admin",
            Email: "subadmin@daycatch.test",
            password: "subadmin123",
            "role Name": "Operations"
        }
    },
    parentcategories: {
        filter: { Title: "Fresh Fish" },
        document: {
            Title: "Fresh Fish",
            Category: "Seafood",
            Image: "https://example.com/images/fresh-fish.png",
            "Cart Id": "CAT-1001",
            tax: "GST 5",
            taxtName: "GST 5",
            "Tax percentage": 5,
            description: "Daily fresh fish category"
        }
    },
    subcategories: {
        filter: { Title: "Rohu Fish" },
        document: {
            Title: "Rohu Fish",
            "Parent Category": "Fresh Fish",
            "Category Image": "https://example.com/images/rohu.png",
            "Cart id": "SUB-2001",
            description: "Popular freshwater fish"
        }
    },
    tax: [
        {
            "Tax Type name": "GST 5",
            "Tax percentage": 5,
            status: "Active"
        },
        {
            "Tax Type name": "GST 12",
            "Tax percentage": 12,
            status: "Active"
        },
        {
            "Tax Type name": "GST 18",
            "Tax percentage": 18,
            status: "Active"
        }
    ],
    id: {
        filter: { ID: "ID-1001" },
        document: {
            ID: "ID-1001",
            "ID Name": "Aadhaar Card",
            "ID number": "1234-5678-9012",
            image: "https://example.com/images/aadhaar.png"
        }
    },
    membership: {
        filter: { "Plan Name": "Gold Plan" },
        document: {
            Image: "https://example.com/images/gold-plan.png",
            "Plan Name": "Gold Plan",
            "Plan Days": 30,
            "Plan Price": 999,
            "Free Delivery": true,
            "Instant Delivery": true,
            Reward: 100,
            Description: "Monthly premium membership"
        }
    },
    reports: {
        filter: { name: "Daily Sales Summary" },
        document: {
            name: "Daily Sales Summary",
            type: "summary",
            createdAt: now,
            status: "generated"
        }
    },
    item_requirement: {
        filter: { "Store Name": "DayCatch Central Store" },
        document: {
            "Store Name": "DayCatch Central Store",
            City: "Hyderabad",
            Mobile: "9876543210",
            Email: "store@daycatch.test",
            "Item Sale Report": "High demand for pomfret"
        }
    },
    item_sale_report: [
        {
            "Product Name": "Premium Rohu",
            "Variant Size": "500g",
            Stock: 120,
            "Total Weight": "60kg"
        },
        {
            "Product Name": "Fresh Katla",
            "Variant Size": "1kg",
            Stock: 80,
            "Total Weight": "80kg"
        }
    ],
    tax_report: {
        filter: { "Product Name": "Premium Rohu" },
        document: {
            "Product Name": "Premium Rohu",
            Quantity: 20
        }
    },
    store_notifications: {
        filter: { Title: "Store Alert" },
        document: {
            "Select store": "DayCatch Central Store",
            Title: "Store Alert",
            Message: "Stock audit scheduled for today.",
            Image: "https://example.com/images/store-alert.png"
        }
    },
    user_notifications: {
        filter: { Title: "Welcome Offer" },
        document: {
            "Select Users": "Ravi Kumar",
            Title: "Welcome Offer",
            Message: "You have received a cashback offer.",
            Image: "https://example.com/images/welcome-offer.png"
        }
    },
    driver_notifications: {
        filter: { Title: "Driver Shift" },
        document: {
            "Select Driver": "Ramesh Driver",
            Title: "Driver Shift",
            Message: "Your evening delivery shift starts at 5 PM.",
            Image: "https://example.com/images/driver-shift.png"
        }
    },
    users: {
        filter: { "User Phone": "9000000001" },
        document: {
            "User Name": "Ravi Kumar",
            "User Phone": "9000000001",
            "User Email": "ravi@daycatch.test",
            "Registration Date": now,
            "Is Verified": true
        }
    },
    Adminproducts: {
        filter: { "Product Id": "PROD-1001" },
        document: {
            "Product Id": "PROD-1001",
            "Product Name": "Premium Rohu",
            Category: "Fresh Fish",
            Type: "Non Veg",
            "Product Image": "https://example.com/images/premium-rohu.png",
            Quantity: 1,
            "EAN code": "EAN1001001",
            Tags: "fresh,popular",
            Unit: "kg",
            MRP: 450,
            price: 399,
            description: "Premium cleaned Rohu fish"
        }
    },
    storeProducts: {
        filter: { "Product Name": "Premium Rohu", Store: "DayCatch Central Store" },
        document: {
            Image: "https://example.com/images/store-rohu.png",
            "Product Name": "Premium Rohu",
            Price: 399,
            MRP: 450,
            Store: "DayCatch Central Store",
            status: "active"
        }
    },
    cities: {
        filter: { "City Name": "Hyderabad" },
        document: {
            "City ID": "CITY-01",
            "City Name": "Hyderabad"
        }
    },
    area: {
        filter: { "Society Name": "Madhapur" },
        document: {
            "Society Name": "Madhapur",
            "City Name": "Hyderabad"
        }
    },
    storeList: {
        filter: { "Store Name": "DayCatch Central Store" },
        document: {
            "Profile Pic": "https://example.com/images/store.png",
            "Store Name": "DayCatch Central Store",
            City: "Hyderabad",
            Mobile: "9876543210",
            Email: "store@daycatch.test",
            orders: 25,
            Details: { type: "flagship" },
            "owner name": "Naresh",
            contact: "9876543210",
            mail: "owner@daycatch.test",
            time: "09:00 AM - 09:00 PM",
            address: "Madhapur Main Road",
            slot: "30 mins",
            "admin share": 12
        }
    },
    storepayments: {
        filter: { Store: "DayCatch Central Store" },
        document: {
            Store: "DayCatch Central Store",
            Address: "Madhapur Main Road",
            "Total Revenue": 50000,
            "Already Paid": 30000,
            "Pending Balance": 20000
        }
    },
    storeapproval: {
        filter: { "Store Name": "Fresh Catch Express" },
        document: {
            "Profile Pic": "https://example.com/images/store-approval.png",
            "Store Name": "Fresh Catch Express",
            City: "Hyderabad",
            Mobile: "9888888888",
            Email: "approval@daycatch.test",
            "Admin Share": 10,
            "Owner name": "Suresh",
            Details: { documentsVerified: true }
        }
    },
    orders: {
        filter: { "Cart ID": "CART-1001" },
        document: {
            "Cart ID": "CART-1001",
            "Cart price": 799,
            User: "Ravi Kumar",
            "Delivery Date": now,
            Status: "Placed",
            Details: { paymentMode: "UPI", phone: "9876543210" },
            "cart product": [{ name: "Premium Rohu", qty: 2 }],
            Assign: "Ramesh Driver"
        }
    },
    "pending orders": {
        filter: { "Cart ID": "PEN-5001" },
        document: {
            "Cart ID": "PEN-5001",
            "Cart price": 450,
            User: "Suresh Raina",
            "Delivery Date": now,
            Status: "Pending",
            "Store Name": "Farm Fresh",
            "Details": { "phone": "9988776655" }
        }
    },
    "cancelled orders": {
        filter: { "Cart ID": "CAN-6001" },
        document: {
            "Cart ID": "CAN-6001",
            "Cart price": 900,
            User: "Vikram Singh",
            "Delivery Date": now,
            Status: "Cancelled",
            "Cancelling Reason": "Customer unavailable",
            "Store Name": "Super Fresh",
            "Boy Name": "Rahul Driver",
            "Details": { "phone": "8877665544" }
        }
    },
    "ongoingorders": {
        filter: { "Cart ID": "ONG-7001" },
        document: {
            "Cart ID": "ONG-7001",
            "Cart price": 1500,
            User: "Priya Patel",
            "Delivery Date": now,
            Status: "Ongoing",
            "Store Name": "Farm Direct",
            "Boy Name": "Amit Driver",
            "Details": { "phone": "7766554433" }
        }
    },
    "out for orders": {
        filter: { "Cart ID": "OUT-8001" },
        document: {
            "Cart ID": "OUT-8001",
            "Cart price": 600,
            User: "Rahul Khanna",
            "Delivery Date": now,
            Status: "Out for Delivery",
            "Store Name": "Village Store",
            "Assign": "Suresh Delivery",
            "Details": { "phone": "6655443322" }
        }
    },
    "payment failed orders": {
        filter: { "Cart ID": "FAIL-9001" },
        document: {
            "Cart ID": "FAIL-9001",
            "Cart price": 250,
            User: "Neha Gupta",
            "Delivery Date": now,
            Status: "Payment Failed",
            "Details": { "phone": "5544332211" }
        }
    },
    "completed orders": {
        filter: { "Cart ID": "COM-1001" },
        document: {
            "Cart ID": "COM-1001",
            "Cart price": 1100,
            User: "Amitabh B",
            "Store Name": "DayCatch Central Store",
            "Boy Name": "Ramesh Driver",
            "Delivery Date": now,
            Status: "Completed",
            "Details": { "phone": "1122334455" }
        }
    },
    "day wise orders": {
        filter: { "Cart ID": "DW-101" },
        document: {
            "Cart ID": "DW-101",
            "Cart price": 300,
            User: "John Doe",
            "Delivery Date": now,
            Status: "Placed",
            "Store Name": "DayCatch Central Store",
            "Boy Name": "Ramesh Driver",
            "Products": [{ name: "Premium Rohu", qty: 1 }],
            "Payment Type": "COD",
            "Details": { "phone": "1234567890" }
        }
    },
    "missed orders": {
        filter: { "Cart ID": "MIS-201" },
        document: {
            "Cart ID": "MIS-201",
            "Store Name": "DayCatch Central Store",
            "Total Price": 400,
            User: "Jane Smith",
            "Delivery Date": now,
            Status: "Missed",
            "Cart Products": [{ name: "Premium Rohu", qty: 1 }],
            Assign: "Ramesh Driver",
            "Order Status": "Missed",
            "Details": { "phone": "0987654321" }
        }
    },
    "rejectedbystore": {
        filter: { "Cart ID": "REJ-301" },
        document: {
            "Cart ID": "REJ-301",
            "Cart price": 500,
            User: "Suresh Raina",
            "Delivery Date": now,
            Status: "Rejected by Store",
            "Store Name": "Super Fresh",
            "Details": { "phone": "1234567890" }
        }
    },
    "payout requests": [
        {
            "Store": "DayCatch Central Store",
            "Address": "Madhapur Main Road",
            "Phone": "9876543210",
            "Total Revenue": 50000,
            "Bank Account Details": {
                "accountNumber": "1234567890",
                "ifsc": "SBIN000123"
            },
            "Already Paid": 30000,
            "Pending Balance": 20000,
            "Amount": 15000,
            "Status": "Pending"
        },
        {
            "Store": "Fresh Fresh Outlet",
            "Address": "Madhapur, Hyderabad",
            "Phone": "9988776655",
            "Total Revenue": 40000,
            "Bank Account Details": "UPI: fresh@upi",
            "Already Paid": 20000,
            "Pending Balance": 20000,
            "Amount": 5000,
            "Status": "Approved",
            "Payment Method": "UPI",
            "Reference ID": "REF-SEC-001"
        }
    ],
    payouts: {
        filter: { "Minimum Amount": 1000 },
        document: {
            "Minimum Amount": 1000,
            "Minimum Days": 7
        }
    },
    rewards: {
        filter: { "Cart Value": 1000 },
        document: {
            "Cart Value": 1000,
            "Reward Points": 50
        }
    },
    "reedm value": {
        filter: { "Reward Points": 50 },
        document: {
            "Reward Points": 50,
            "Redeem Values": 25
        }
    },
    deliveryboy: {
        filter: { "Boy Phone": "9111111111" },
        document: {
            "Boy Name": "Ramesh Driver",
            "Boy Phone": "9111111111",
            "Boy Password": "driver123",
            Status: "Active",
            Orders: 12,
            Details: { vehicle: "Bike" }
        }
    },
    deliveryboy_incentives: {
        filter: { "Delivery Boy": "Ramesh Driver" },
        document: {
            "Delivery Boy": "Ramesh Driver",
            Address: "Madhapur, Hyderabad",
            "Bank/UPI": { upi: "ramesh@upi" },
            "Total Incentive": 5000,
            "Paid Incentive": 3000,
            "Pending Incentive": 2000
        }
    },
    "pages About": {
        filter: { "About Us": "DayCatch delivers fresh seafood to your doorstep." },
        document: {
            "About Us": "DayCatch delivers fresh seafood to your doorstep."
        }
    },
    "termsAnd Conditions": {
        filter: { "Terms & Condition": "Orders once placed cannot be edited after packing starts." },
        document: {
            "Terms & Condition": "Orders once placed cannot be edited after packing starts."
        }
    },
    Userfeedback: {
        filter: { Users: "Ravi Kumar" },
        document: {
            Users: "Ravi Kumar",
            Feedback: "Great delivery experience."
        }
    },
    storefeedback: {
        filter: { Store: "DayCatch Central Store" },
        document: {
            Store: "DayCatch Central Store",
            Feedback: "Store inventory is consistently fresh."
        }
    },
    deliveryboyfeedback: {
        filter: { "Delivery Boy": "Ramesh Driver" },
        document: {
            "Delivery Boy": "Ramesh Driver",
            Feedback: "Reached on time."
        }
    },
    usercallbackrequests: {
        filter: { ID: "UCB-1001" },
        document: {
            ID: "UCB-1001",
            "User Name": "Ravi Kumar",
            "User Phone": "9000000001",
            "Callback To": "Customer Support"
        }
    },
    storecallbackrequests: {
        filter: { ID: "SCB-1001" },
        document: {
            ID: "SCB-1001",
            "Store Name": "DayCatch Central Store",
            "Store Phone": "9876543210"
        }
    },
    deliveryboycallbackrequests: {
        filter: { ID: "DCB-1001" },
        document: {
            ID: "DCB-1001",
            "Delivery Boy Name": "Ramesh Driver",
            "Delivery Boy Phone": "9111111111",
            "Added By": "Admin"
        }
    },
    Globalsettings: {
        filter: { key: "currency" },
        document: {
            key: "currency",
            value: "INR",
            updatedAt: now
        }
    },
    "SMS Settings": {
        filter: { provider: "Twilio" },
        document: {
            provider: "Twilio",
            senderId: "DAYCAT",
            enabled: true
        }
    },
    "FCM keys": {
        filter: { platform: "android" },
        document: {
            platform: "android",
            serverKey: "sample-fcm-server-key",
            updatedAt: now
        }
    },
    "payment mode": {
        filter: { mode: "UPI" },
        document: {
            mode: "UPI",
            enabled: true,
            priority: 1
        }
    },
    "map settings": {
        filter: { provider: "google-maps" },
        document: {
            provider: "google-maps",
            defaultCity: "Hyderabad",
            radiusKm: 15
        }
    },
    "driver incentive": {
        filter: { slab: "default" },
        document: {
            slab: "default",
            perOrder: 25,
            active: true
        }
    },
    "app link": {
        filter: { platform: "android" },
        document: {
            platform: "android",
            url: "https://example.com/daycatch-app.apk"
        }
    },
    "img store": {
        filter: { name: "default-banner" },
        document: {
            name: "default-banner",
            url: "https://example.com/images/banner.png"
        }
    },
    "app notice": {
        filter: { title: "Maintenance Window" },
        document: {
            title: "Maintenance Window",
            message: "App maintenance scheduled tonight at 11 PM."
        }
    },
    "cancelling reason": {
        filter: { reason: "Customer unavailable" },
        document: {
            reason: "Customer unavailable",
            active: true
        }
    },
    Wallet_Rechage_History: {
        filter: { "User Phone": "9000000001", "Recharge Amount": 500 },
        document: {
            "User Name": "Ravi Kumar",
            "User Phone": "9000000001",
            "Recharge Amount": 500,
            "Recharge Date": now,
            Status: "Success",
            Medium: "UPI",
            "Current Amount": 1200,
            Recharge: "Wallet top-up"
        }
    },
    trending_search: {
        filter: { Keyword: "Organic Milk" },
        document: {
            Keyword: "Organic Milk",
            "Search Count": 2857,
            "Last Updated": now
        }
    }
};

async function seedCollections() {
    if (!process.env.MONGO_URI) {
        console.error("MongoDB Error: MONGO_URI is missing from backend/.env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000
        });

        const db = mongoose.connection.db;
        const inserted = [];
        const existing = [];

        for (const [collectionName, data] of Object.entries(sampleDocuments)) {
            const documents = Array.isArray(data) ? data : [data];
            
            for (const item of documents) {
                const filter = item.filter || (item.Store ? { Store: item.Store } : (item["Cart ID"] ? { "Cart ID": item["Cart ID"] } : {}));
                const document = item.document || item;

                const result = await db.collection(collectionName).updateOne(
                    filter,
                    { $setOnInsert: document },
                    { upsert: true }
                );

                if (result.upsertedCount > 0) {
                    inserted.push(`${collectionName} (${document.Store || document["Cart ID"] || "Unnamed"})`);
                } else {
                    existing.push(`${collectionName} (${document.Store || document["Cart ID"] || "Unnamed"})`);
                }
            }
        }

        console.log(`Database: ${db.databaseName}`);
        console.log(`Inserted sample documents: ${inserted.length}`);
        if (inserted.length > 0) {
            console.log(inserted.join("\n"));
        }

        console.log(`Already had sample documents: ${existing.length}`);
        if (existing.length > 0) {
            console.log(existing.join("\n"));
        }
    } catch (error) {
        console.error("MongoDB Error:", error.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

seedCollections();
