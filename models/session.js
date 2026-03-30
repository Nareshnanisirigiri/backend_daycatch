import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Session must belong to a user."]
    },
    accountType: {
        type: String,
        required: [true, "Session must have an account type."],
        enum: ["super-admin", "sub-admin", "store"]
    },
    refreshToken: {
        type: String,
        required: [true, "Session must have a refresh token."]
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 7 * 24 * 60 * 60 // Auto-delete session after 7 days (matching refresh token expiry)
    },
    userAgent: String,
    ipAddress: String,
    lastUsed: {
        type: Date,
        default: Date.now
    }
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
