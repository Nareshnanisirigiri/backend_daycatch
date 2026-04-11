import { createCollectionModel, types } from "./createCollectionModel.js";

const { string, date, integer, number } = types;

export default createCollectionModel("Users", "users", {
    name: string,
    email: { type: string, unique: true },
    email_verified_at: date,
    password: string,
    user_phone: string,
    user_image: string,
    user_city: integer,
    user_area: integer,
    otp_value: integer,
    status: { type: integer, defaultValue: 1 },
    wallet: { type: number, defaultValue: 0 },
    rewards: { type: integer, defaultValue: 0 },
    is_verified: { type: integer, defaultValue: 0 },
    block: { type: integer, defaultValue: 0 },
    reg_date: date,
    app_otp: integer,
    facebook_id: string,
    referral_code: string,
    membership: { type: integer, defaultValue: 0 },
    mem_plan_id: { type: integer, defaultValue: 0 },
    mem_start_date: date,
    mem_end_date: date,
    device_id: string
}, { timestamps: true, createdAt: "created_at", updatedAt: "updated_at" });
