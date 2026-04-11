import { prisma } from "../config/db.js";

export const SUPER_ADMIN_ROLE_NAME = "Super Admin";
export const ADMIN_ACCOUNT_TYPES = Object.freeze({
    SUPER: "super_admin",
    SUB: "sub_admin"
});

export const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
export const normalizeRoleName = (roleName = "") => String(roleName || "").trim();
export const isSuperAdminRole = (roleName = "") =>
    normalizeRoleName(roleName).toLowerCase() === SUPER_ADMIN_ROLE_NAME.toLowerCase();

export const getAdminAccountTypeForRole = (roleName = "", roleId = null) =>
    isSuperAdminRole(roleName) || Number(roleId) === 0
        ? ADMIN_ACCOUNT_TYPES.SUPER
        : ADMIN_ACCOUNT_TYPES.SUB;

const getModelByAccountType = (accountType = "") => {
    if (accountType === ADMIN_ACCOUNT_TYPES.SUPER) {
        if (!prisma.super_admin) {
            throw new Error("Prisma super_admin model is unavailable.");
        }
        return prisma.super_admin;
    }

    if (accountType === ADMIN_ACCOUNT_TYPES.SUB) {
        if (!prisma.sub_admin) {
            throw new Error("Prisma sub_admin model is unavailable.");
        }
        return prisma.sub_admin;
    }

    return null;
};

const withAccountType = (user, accountType = "") => {
    if (!user) return null;
    const resolvedAccountType = accountType || getAdminAccountTypeForRole(user.role_name, user.role_id);
    return { accountType: resolvedAccountType, user };
};

const findByEmailInAccountType = async (normalizedEmail = "", accountType) => {
    const model = getModelByAccountType(accountType);
    if (!model) return null;

    return model.findFirst({
        where: { email: normalizedEmail }
    });
};

export const findAdminAccountByEmail = async (normalizedEmail = "") => {
    if (!normalizedEmail) return null;

    const superAdmin = await findByEmailInAccountType(normalizedEmail, ADMIN_ACCOUNT_TYPES.SUPER);
    if (superAdmin) return withAccountType(superAdmin, ADMIN_ACCOUNT_TYPES.SUPER);

    const subAdmin = await findByEmailInAccountType(normalizedEmail, ADMIN_ACCOUNT_TYPES.SUB);
    return withAccountType(subAdmin, ADMIN_ACCOUNT_TYPES.SUB);
};

export const findSuperAdminAccount = async () => {
    const admin = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUPER).findFirst({
        where: {
            OR: [
                { role_name: SUPER_ADMIN_ROLE_NAME },
                { role_id: 0 }
            ]
        }
    });

    return withAccountType(admin, ADMIN_ACCOUNT_TYPES.SUPER);
};

export const findAdminAccountById = async (id, accountType = "") => {
    if (!id) return null;

    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) return null;

    if (accountType) {
        const model = getModelByAccountType(accountType);
        if (!model) return null;
        const user = await model.findUnique({ where: { id: parsedId } });
        return withAccountType(user, accountType);
    }

    const superAdmin = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUPER).findUnique({
        where: { id: parsedId }
    });
    if (superAdmin) return withAccountType(superAdmin, ADMIN_ACCOUNT_TYPES.SUPER);

    const subAdmin = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUB).findUnique({
        where: { id: parsedId }
    });
    return withAccountType(subAdmin, ADMIN_ACCOUNT_TYPES.SUB);
};

export const findAdminAccountByResetToken = async (hashedToken = "") => {
    if (!hashedToken) return null;

    const superUser = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUPER).findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: new Date() }
        }
    });
    if (superUser) return withAccountType(superUser, ADMIN_ACCOUNT_TYPES.SUPER);

    const subUser = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUB).findFirst({
        where: {
            passwordResetToken: hashedToken,
            passwordResetExpires: { gt: new Date() }
        }
    });

    return withAccountType(subUser, ADMIN_ACCOUNT_TYPES.SUB);
};

export const findDuplicateAdminByEmail = async (normalizedEmail = "", exclude = {}) => {
    if (!normalizedEmail) return null;

    const excludedId = exclude?.id ? parseInt(exclude.id, 10) : null;
    const excludedType = exclude?.accountType || "";

    const superUser = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUPER).findFirst({
        where: {
            email: normalizedEmail,
            ...((excludedId && excludedType === ADMIN_ACCOUNT_TYPES.SUPER) ? { NOT: { id: excludedId } } : {})
        }
    });
    if (superUser) return withAccountType(superUser, ADMIN_ACCOUNT_TYPES.SUPER);

    const subUser = await getModelByAccountType(ADMIN_ACCOUNT_TYPES.SUB).findFirst({
        where: {
            email: normalizedEmail,
            ...((excludedId && excludedType === ADMIN_ACCOUNT_TYPES.SUB) ? { NOT: { id: excludedId } } : {})
        }
    });

    return withAccountType(subUser, ADMIN_ACCOUNT_TYPES.SUB);
};
