import { SuperAdmin, SubAdmin } from "../models/index.js";

export const SUPER_ADMIN_ROLE_NAME = "Super Admin";
export const ADMIN_ACCOUNT_TYPES = Object.freeze({
    SUPER: "super-admin",
    SUB: "sub-admin"
});

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
export const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const normalizeRoleName = (roleName = "") => String(roleName || "").trim();
export const isSuperAdminRole = (roleName = "") =>
    normalizeRoleName(roleName).toLowerCase() === SUPER_ADMIN_ROLE_NAME.toLowerCase();

const EMAIL_LOOKUP_FIELDS = ["Email", "email", "Email ID"];
const ACCOUNT_MODELS = {
    [ADMIN_ACCOUNT_TYPES.SUPER]: SuperAdmin,
    [ADMIN_ACCOUNT_TYPES.SUB]: SubAdmin
};

const applyProjection = (query, projection) => (projection ? query.select(projection) : query);

export const buildEmailLookup = (normalizedEmail = "") => {
    const escapedEmail = escapeRegExp(normalizedEmail);

    return {
        $or: EMAIL_LOOKUP_FIELDS.map((field) => ({
            [field]: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: "i" }
        }))
    };
};

export const getAdminModelByAccountType = (accountType = "") => ACCOUNT_MODELS[accountType] || null;

export const getAdminModelForRole = (roleName = "") =>
    isSuperAdminRole(roleName) ? SuperAdmin : SubAdmin;

export const getAdminAccountTypeForRole = (roleName = "") =>
    isSuperAdminRole(roleName) ? ADMIN_ACCOUNT_TYPES.SUPER : ADMIN_ACCOUNT_TYPES.SUB;

export const findSuperAdminAccount = async (filter = {}, projection = null) => {
    const superAdminFilter = { ...filter, "role Name": SUPER_ADMIN_ROLE_NAME };

    let user = await applyProjection(SuperAdmin.findOne(superAdminFilter), projection);
    if (user) {
        return { accountType: ADMIN_ACCOUNT_TYPES.SUPER, user };
    }

    user = await applyProjection(SubAdmin.findOne(superAdminFilter), projection);
    return user ? { accountType: ADMIN_ACCOUNT_TYPES.SUB, user } : null;
};

export const findAdminAccountByEmail = async (normalizedEmail = "", projection = null) => {
    if (!normalizedEmail) return null;

    const emailLookup = buildEmailLookup(normalizedEmail);
    const superAdminAccount = await findSuperAdminAccount(emailLookup, projection);
    if (superAdminAccount) {
        return superAdminAccount;
    }

    const user = await applyProjection(SubAdmin.findOne(emailLookup), projection);
    return user ? { accountType: ADMIN_ACCOUNT_TYPES.SUB, user } : null;
};

export const findAdminAccountById = async (id, accountType = "", projection = null) => {
    if (!id) return null;

    const specificModel = getAdminModelByAccountType(accountType);
    const accountTypesToSearch = specificModel
        ? [accountType, ...Object.values(ADMIN_ACCOUNT_TYPES).filter((type) => type !== accountType)]
        : [ADMIN_ACCOUNT_TYPES.SUPER, ADMIN_ACCOUNT_TYPES.SUB];

    for (const type of accountTypesToSearch) {
        const model = getAdminModelByAccountType(type);
        if (!model) continue;

        const user = await applyProjection(model.findById(id), projection);
        if (user) {
            return { accountType: type, user };
        }
    }

    return null;
};

export const findAdminAccountByResetToken = async (hashedToken = "", projection = null) => {
    if (!hashedToken) return null;

    const filter = {
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    };

    const superAdminAccount = await findSuperAdminAccount(filter, projection);
    if (superAdminAccount) {
        return superAdminAccount;
    }

    const user = await applyProjection(SubAdmin.findOne(filter), projection);
    return user ? { accountType: ADMIN_ACCOUNT_TYPES.SUB, user } : null;
};

export const findDuplicateAdminByEmail = async (normalizedEmail = "", exclude = {}) => {
    if (!normalizedEmail) return null;

    const emailLookup = buildEmailLookup(normalizedEmail);
    const { accountType = "", id = "" } = exclude;

    const superAdminFilter = { ...emailLookup, "role Name": SUPER_ADMIN_ROLE_NAME };
    if (accountType === ADMIN_ACCOUNT_TYPES.SUPER && id) {
        superAdminFilter._id = { $ne: id };
    }

    let user = await SuperAdmin.findOne(superAdminFilter);
    if (user) {
        return { accountType: ADMIN_ACCOUNT_TYPES.SUPER, user };
    }

    const subAdminFilter = { ...emailLookup };
    if (accountType === ADMIN_ACCOUNT_TYPES.SUB && id) {
        subAdminFilter._id = { $ne: id };
    }

    user = await SubAdmin.findOne(subAdminFilter);
    return user ? { accountType: ADMIN_ACCOUNT_TYPES.SUB, user } : null;
};
