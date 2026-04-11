import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import {
    AdminProducts,
    CancelledOrders,
    CompletedOrders,
    DayWiseOrders,
    MissedOrders,
    OngoingOrders,
    Orders,
    OutForOrders,
    PayoutRequests,
    PaymentFailedOrders,
    PendingOrders,
    StoreCallbackRequests,
    StoreList,
    StorePayments,
    StoreProducts
} from "../models/index.js";

const createEmptyCollectionModel = () => ({
    find: () => ({
        lean: async () => []
    }),
    findById: () => ({
        lean: async () => null
    }),
    findByIdAndUpdate: async () => null,
    findOne: async () => null,
    findOneAndUpdate: async () => null,
    create: async () => null,
    collection: {
        find: () => ({
            skip() {
                return this;
            },
            limit() {
                return this;
            },
            toArray: async () => []
        }),
        findOne: async () => null,
        insertOne: async () => ({ insertedId: null }),
        findOneAndUpdate: async () => null,
        deleteMany: async () => ({ deletedCount: 0 })
    }
});

const SafeAdminProducts = AdminProducts || createEmptyCollectionModel();
const SafeCancelledOrders = CancelledOrders || createEmptyCollectionModel();
const SafeCompletedOrders = CompletedOrders || createEmptyCollectionModel();
const SafeDayWiseOrders = DayWiseOrders || createEmptyCollectionModel();
const SafeMissedOrders = MissedOrders || createEmptyCollectionModel();
const SafeOngoingOrders = OngoingOrders || createEmptyCollectionModel();
const SafeOrders = Orders || createEmptyCollectionModel();
const SafeOutForOrders = OutForOrders || createEmptyCollectionModel();
const SafePayoutRequests = PayoutRequests || createEmptyCollectionModel();
const SafePaymentFailedOrders = PaymentFailedOrders || createEmptyCollectionModel();
const SafePendingOrders = PendingOrders || createEmptyCollectionModel();
const SafeStoreCallbackRequests = StoreCallbackRequests || createEmptyCollectionModel();
const SafeStoreList = StoreList || createEmptyCollectionModel();
const SafeStorePayments = StorePayments || createEmptyCollectionModel();
const SafeStoreProducts = StoreProducts || createEmptyCollectionModel();

const normalize = (value) => String(value ?? "").trim().toLowerCase();
const sameId = (left, right) => String(left ?? "") === String(right ?? "");

const getStringValue = (...values) => {
    for (const value of values) {
        if (value === undefined || value === null) continue;
        const stringValue = String(value).trim();
        if (stringValue) return stringValue;
    }
    return "";
};

const getNumberValue = (...values) => {
    for (const value of values) {
        if (value === undefined || value === null || value === "") continue;
        const parsedValue = Number(value);
        if (Number.isFinite(parsedValue)) return parsedValue;
    }
    return 0;
};

const getDateValue = (value) => {
    if (!value) return null;
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
};

const getStoreName = (store) =>
    getStringValue(
        store?.["Store Name"],
        store?.storeName,
        store?.name
    );

const buildStoreProfile = (store) => ({
    id: String(store?._id ?? store?.id ?? ""),
    name: getStoreName(store),
    owner: getStringValue(store?.["owner name"], store?.["Employee Name"], store?.owner, "N/A"),
    phone: getStringValue(store?.Mobile, store?.contact, store?.phone, "N/A"),
    email: getStringValue(store?.Email, store?.mail, store?.email, "N/A"),
    city: getStringValue(store?.City, store?.city, "N/A"),
    address: getStringValue(store?.address, store?.Address, store?.Details?.address, "N/A"),
    adminShare: getNumberValue(store?.["admin share"], store?.["Admin Share"]),
    deliveryRange: getStringValue(store?.["Delivery Range"], store?.range, store?.deliveryRange, "N/A"),
    ordersPerSlot: getNumberValue(store?.["Orders Per Slot"], store?.ordersPerSlot, store?.slot),
    startTime: getStringValue(store?.["Start Time"], store?.startTime, store?.time, "N/A"),
    endTime: getStringValue(store?.["End Time"], store?.endTime, "N/A"),
    logo: getStringValue(store?.["Profile Pic"], store?.logo),
    settings: {
        openingTime: getStringValue(store?.["Start Time"], store?.startTime, store?.time, "06:00"),
        closingTime: getStringValue(store?.["End Time"], store?.endTime, "21:00"),
        interval: getNumberValue(store?.["Slot Interval"], store?.slotInterval, 30),
        freeDeliveryLimit: getNumberValue(store?.["Free Delivery Limit"], store?.freeDeliveryLimit),
        deliveryCharge: getNumberValue(store?.["Delivery Charge"], store?.deliveryCharge),
        minOrderValue: getNumberValue(store?.["Minimum Order Value"], store?.minOrderValue),
        maxOrderValue: getNumberValue(store?.["Maximum Order Value"], store?.maxOrderValue),
        driverIncentive: getNumberValue(store?.["Driver Incentive"], store?.driverIncentive)
    }
});

const buildStoreSettingsPayload = (payload = {}) => ({
    "Start Time": getStringValue(payload.openingTime, payload["Start Time"], "06:00"),
    "End Time": getStringValue(payload.closingTime, payload["End Time"], "21:00"),
    "Slot Interval": getNumberValue(payload.interval, payload["Slot Interval"], 30),
    "Free Delivery Limit": getNumberValue(payload.freeDeliveryLimit, payload["Free Delivery Limit"]),
    "Delivery Charge": getNumberValue(payload.deliveryCharge, payload["Delivery Charge"]),
    "Minimum Order Value": getNumberValue(payload.minOrderValue, payload["Minimum Order Value"]),
    "Maximum Order Value": getNumberValue(payload.maxOrderValue, payload["Maximum Order Value"]),
    "Driver Incentive": getNumberValue(payload.driverIncentive, payload["Driver Incentive"]),
});

const matchesStoreRecord = (record, storeProfile) => {
    const storeName = normalize(storeProfile.name);
    const storeId = normalize(storeProfile.id);

    const candidates = [
        record?.storeId,
        record?.Store,
        record?.store,
        record?.["Store Name"],
        record?.storeName,
        record?.Details?.Store,
        record?.Details?.store,
        record?.["Select store"]
    ];

    return candidates.some((candidate) => {
        const normalizedCandidate = normalize(candidate);
        if (!normalizedCandidate) return false;
        return (
            (storeId && normalizedCandidate === storeId) ||
            (storeName &&
                (normalizedCandidate === storeName ||
                    normalizedCandidate.includes(storeName) ||
                    storeName.includes(normalizedCandidate)))
        );
    });
};

const resolveDealStatus = (deal) => {
    if (!deal) return null;

    const fromDate = getDateValue(deal.fromDate);
    const toDate = getDateValue(deal.toDate);
    const now = new Date();

    if (fromDate && now < fromDate) return "Scheduled";
    if (toDate && now > toDate) return "Expired";
    return "Active";
};

const serializeStoreProduct = (product) => {
    const deal = product?.deal
        ? {
              ...product.deal,
              status: resolveDealStatus(product.deal)
          }
        : null;

    return {
        id: String(product?._id ?? product?.id ?? ""),
        storeId: getStringValue(product?.storeId),
        adminProductId: getStringValue(product?.adminProductId),
        productCode: getStringValue(product?.["Product Id"]),
        productName: getStringValue(product?.["Product Name"], product?.name),
        image: getStringValue(product?.Image),
        category: getStringValue(product?.Category, product?.category),
        type: getStringValue(product?.Type, product?.type),
        price: getNumberValue(product?.Price, product?.price),
        mrp: getNumberValue(product?.MRP),
        stock: getNumberValue(product?.stock, product?.Stock),
        orderQuantity: getNumberValue(product?.["Order Quantity"], product?.orderQuantity, 1),
        storeName: getStringValue(product?.Store, product?.["Store Name"]),
        status: getStringValue(product?.status, "Pending"),
        deal,
        spotlight: product?.spotlight || { enabled: false, position: null },
        reviewNotes: getStringValue(product?.reviewNotes),
        submittedAt: product?.submittedAt || null,
        updatedAt: product?.updatedAt || null,
        approvedAt: product?.approvedAt || null,
        reviewedAt: product?.reviewedAt || null
    };
};

const getOrderIdentity = (order) =>
    getStringValue(order?.["Cart ID"], order?.cartId, order?._id, order?.id);

const buildRecentOrderRecord = (order) => ({
    id: String(order?._id ?? order?.id ?? ""),
    cartId: getStringValue(order?.["Cart ID"], order?.cartId, "N/A"),
    customer: getStringValue(order?.User, order?.customer, "Unknown User"),
    amount: getNumberValue(order?.["Cart price"], order?.["Total Price"], order?.amount),
    status: getStringValue(order?.Status, order?.status, "Placed"),
    deliveryDate: order?.["Delivery Date"] || order?.deliveryDate || null
});

const ORDER_VIEW_CONFIG = {
    all: { model: SafeOrders, collectionName: "orders" },
    pending: { model: SafePendingOrders, collectionName: "pending orders" },
    cancelled: { model: SafeCancelledOrders, collectionName: "cancelled orders" },
    confirmed: { model: SafeOngoingOrders, collectionName: "ongoingorders" },
    out_for_delivery: { model: SafeOutForOrders, collectionName: "out for orders" },
    payment_failed: { model: SafePaymentFailedOrders, collectionName: "payment failed orders" },
    completed: { model: SafeCompletedOrders, collectionName: "completed orders" },
    missed: { model: SafeMissedOrders, collectionName: "missed orders" },
    day_wise: { model: SafeDayWiseOrders, collectionName: "day wise orders" },
    today: { model: SafeDayWiseOrders, collectionName: "day wise orders", dateMode: "today" },
    next_day: { model: SafeDayWiseOrders, collectionName: "day wise orders", dateMode: "next_day" }
};

const ORDER_COLLECTIONS = {
    orders: SafeOrders.collection,
    "pending orders": SafePendingOrders.collection,
    "cancelled orders": SafeCancelledOrders.collection,
    ongoingorders: SafeOngoingOrders.collection,
    "out for orders": SafeOutForOrders.collection,
    "payment failed orders": SafePaymentFailedOrders.collection,
    "completed orders": SafeCompletedOrders.collection,
    "missed orders": SafeMissedOrders.collection,
    "day wise orders": SafeDayWiseOrders.collection
};

const ORDER_CLEANUP_COLLECTIONS = [
    "pending orders",
    "cancelled orders",
    "ongoingorders",
    "out for orders",
    "payment failed orders",
    "completed orders",
    "missed orders"
];

const ORDER_STATUS_TRANSITIONS = {
    accepted: { targetCollection: "ongoingorders", status: "Accepted" },
    processing: { targetCollection: "ongoingorders", status: "Processing" },
    cancelled: { targetCollection: "cancelled orders", status: "Cancelled" },
    "out for delivery": { targetCollection: "out for orders", status: "Out For Delivery" },
    delivered: { targetCollection: "completed orders", status: "Delivered" }
};

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
});

const getRawCollectionDocuments = async (model) => model.collection.find({}).toArray();

const getOrderDeliveryDate = (order) =>
    getDateValue(order?.["Delivery Date"] || order?.deliveryDate || order?.createdAt);

const getDateKey = (value) => {
    const dateValue = value instanceof Date ? value : getDateValue(value);
    return dateValue ? dateKeyFormatter.format(dateValue) : "";
};

const getComparisonDateKey = (offset = 0) => {
    const comparisonDate = new Date();
    comparisonDate.setDate(comparisonDate.getDate() + offset);
    return getDateKey(comparisonDate);
};

const getOrderPaymentMethod = (order) =>
    getStringValue(
        order?.paymentMethod,
        order?.payment,
        order?.paymentStatus,
        order?.["Payment Method"],
        order?.["Payment Status"]
    );

const matchesPaymentMethod = (order, paymentMethod = "") => {
    const normalizedPaymentFilter = normalize(paymentMethod);
    if (!normalizedPaymentFilter || normalizedPaymentFilter === "all") return true;
    return normalize(getOrderPaymentMethod(order)) === normalizedPaymentFilter;
};

const matchesDateWindow = (order, filters = {}) => {
    const { fromDate = "", toDate = "" } = filters;
    if (!fromDate && !toDate) return true;

    const orderDateKey = getDateKey(getOrderDeliveryDate(order));
    if (!orderDateKey) return false;
    if (fromDate && orderDateKey < fromDate) return false;
    if (toDate && orderDateKey > toDate) return false;
    return true;
};

const dedupeOrders = (orders = []) => {
    const dedupedOrders = new Map();

    for (const order of orders) {
        const identity = getOrderIdentity(order) || String(order?._id ?? "");
        if (!identity) continue;

        const currentOrder = dedupedOrders.get(identity);
        const currentDate = getOrderDeliveryDate(currentOrder)?.getTime() || 0;
        const nextDate = getOrderDeliveryDate(order)?.getTime() || 0;

        if (!currentOrder || nextDate >= currentDate) {
            dedupedOrders.set(identity, order);
        }
    }

    return Array.from(dedupedOrders.values());
};

const getOrdersForAllView = async () => {
    const orderModels = [
        SafeOrders,
        SafePendingOrders,
        SafeCancelledOrders,
        SafeOngoingOrders,
        SafeOutForOrders,
        SafePaymentFailedOrders,
        SafeCompletedOrders,
        SafeMissedOrders
    ];

    const results = await Promise.all(orderModels.map((model) => getRawCollectionDocuments(model)));
    return dedupeOrders(results.flat());
};

const getStoreWorkspaceOrdersForView = async (storeProfile, view, filters = {}) => {
    const normalizedView = getStringValue(view, "all").replace(/-/g, "_");
    const viewConfig = ORDER_VIEW_CONFIG[normalizedView] || ORDER_VIEW_CONFIG.all;

    let orders = [];

    if (["all", "day_wise", "today", "next_day"].includes(normalizedView)) {
        orders = await getOrdersForAllView();
    } else {
        orders = await getRawCollectionDocuments(viewConfig.model);
    }

    let filteredOrders = orders.filter((order) => matchesStoreRecord(order, storeProfile));

    if (viewConfig.dateMode === "today") {
        const todayKey = getComparisonDateKey(0);
        filteredOrders = filteredOrders.filter(
            (order) => getDateKey(getOrderDeliveryDate(order)) === todayKey
        );
    }

    if (viewConfig.dateMode === "next_day") {
        const nextDayKey = getComparisonDateKey(1);
        filteredOrders = filteredOrders.filter(
            (order) => getDateKey(getOrderDeliveryDate(order)) === nextDayKey
        );
    }

    filteredOrders = filteredOrders.filter((order) => matchesDateWindow(order, filters));
    filteredOrders = filteredOrders.filter((order) => matchesPaymentMethod(order, filters.paymentMethod));

    return filteredOrders.sort((left, right) => {
        const leftDate = getOrderDeliveryDate(left)?.getTime() || 0;
        const rightDate = getOrderDeliveryDate(right)?.getTime() || 0;
        return rightDate - leftDate;
    });
};

const normalizeOrderProduct = (product = {}) => ({
    ...product,
    product_name: getStringValue(product?.product_name, product?.name, product?.title, "Product"),
    qty: getNumberValue(product?.qty, product?.quantity, 1),
    price: getNumberValue(product?.price),
    total: getNumberValue(product?.total, product?.qty * product?.price),
    image: getStringValue(product?.image, product?.img, product?.product_image)
});

const buildOrderMutationPayload = (order, overrides = {}) => {
    const baseOrder = { ...(order || {}) };
    delete baseOrder._id;

    const products =
        baseOrder.Products ||
        baseOrder.products ||
        baseOrder["cart product"] ||
        baseOrder["Cart Products"] ||
        baseOrder.Details?.Products ||
        [];

    const normalizedProducts = Array.isArray(products)
        ? products.map(normalizeOrderProduct)
        : [];

    const nextStatus = getStringValue(
        overrides.Status,
        overrides.status,
        baseOrder.Status,
        baseOrder.status,
        "Pending"
    );
    const nextOrderStatus = getStringValue(
        overrides["Order Status"],
        overrides.orderStatus,
        baseOrder["Order Status"],
        baseOrder.orderStatus,
        nextStatus
    );

    const payload = {
        ...baseOrder,
        "Cart ID": getStringValue(baseOrder?.["Cart ID"], baseOrder?.cartId, order?._id),
        "Cart price": getNumberValue(baseOrder?.["Cart price"], baseOrder?.["Total Price"], baseOrder?.amount),
        User: getStringValue(baseOrder?.User, baseOrder?.user, baseOrder?.customer, "Unknown User"),
        "User Phone": getStringValue(
            baseOrder?.["User Phone"],
            baseOrder?.phone,
            baseOrder?.Details?.phone,
            "N/A"
        ),
        "Delivery Date": baseOrder?.["Delivery Date"] || baseOrder?.deliveryDate || baseOrder?.createdAt || null,
        "Time Slot": getStringValue(
            baseOrder?.["Time Slot"],
            baseOrder?.timeSlot,
            baseOrder?.Details?.["Time Slot"],
            baseOrder?.Details?.timeSlot,
            "N/A"
        ),
        Address: getStringValue(
            baseOrder?.Address,
            baseOrder?.address,
            baseOrder?.Details?.address,
            baseOrder?.Details?.Address,
            "N/A"
        ),
        "Store Name": getStringValue(
            baseOrder?.["Store Name"],
            baseOrder?.storeName,
            baseOrder?.Store,
            baseOrder?.store,
            baseOrder?.Details?.["Store Name"],
            baseOrder?.Details?.Store
        ),
        Store: getStringValue(
            baseOrder?.Store,
            baseOrder?.["Store Name"],
            baseOrder?.storeName,
            baseOrder?.Details?.Store
        ),
        storeId: getStringValue(baseOrder?.storeId, baseOrder?.["Store ID"]),
        "Boy Name": getStringValue(
            baseOrder?.["Boy Name"],
            baseOrder?.["Delivery Boy"],
            baseOrder?.Assign,
            baseOrder?.deliveryBoyName,
            baseOrder?.Details?.["Boy Name"],
            "Not Assigned"
        ),
        Assign: getStringValue(
            baseOrder?.Assign,
            baseOrder?.["Boy Name"],
            baseOrder?.["Delivery Boy"],
            baseOrder?.deliveryBoyName,
            "Not Assigned"
        ),
        Products: normalizedProducts,
        status: nextStatus,
        Status: nextStatus,
        orderStatus: nextOrderStatus,
        "Order Status": nextOrderStatus,
        updatedAt: new Date(),
        ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined))
    };

    delete payload._id;
    return payload;
};

const findOrderByIdInCollection = async (collectionName, orderId) => {
    if (!orderId) return null;
    return ORDER_COLLECTIONS[collectionName]?.findOne({ _id: orderId });
};

const findOrderByCartIdInCollection = async (collectionName, cartId) => {
    if (!cartId) return null;

    return ORDER_COLLECTIONS[collectionName]?.findOne({
        $or: [{ "Cart ID": cartId }, { cartId }]
    });
};

const upsertOrderByCartIdInCollection = async (collectionName, cartId, payload) => {
    const collection = ORDER_COLLECTIONS[collectionName];
    if (!collection) {
        throw new APIError(`Unsupported order collection: ${collectionName}`, 400);
    }

    const existingOrder = await findOrderByCartIdInCollection(collectionName, cartId);
    if (existingOrder?._id) {
        await collection.findOneAndUpdate(
            { _id: existingOrder._id },
            { $set: payload },
            { returnDocument: "after" }
        );
        return existingOrder._id;
    }

    const result = await collection.insertOne(payload);
    return result.insertedId;
};

const removeOrderByCartIdFromCollection = async (collectionName, cartId) => {
    if (!cartId || !ORDER_COLLECTIONS[collectionName]) return;
    await ORDER_COLLECTIONS[collectionName].deleteMany({
        $or: [{ "Cart ID": cartId }, { cartId }]
    });
};

const findOrderAcrossCollections = async (orderId) => {
    const collectionNames = ["orders", "day wise orders", ...ORDER_CLEANUP_COLLECTIONS];

    for (const collectionName of collectionNames) {
        const order = await findOrderByIdInCollection(collectionName, orderId);
        if (order) {
            return { collectionName, order };
        }
    }

    return { collectionName: "", order: null };
};

const syncStoreOrderStatusChange = async ({
    sourceCollection,
    order,
    nextStatus,
    cancellationReason
}) => {
    const normalizedStatus = normalize(nextStatus);
    const transition = ORDER_STATUS_TRANSITIONS[normalizedStatus];

    if (!transition) {
        throw new APIError("Unsupported order status transition", 400);
    }

    const cartId = getOrderIdentity(order);
    if (!cartId) {
        throw new APIError("This order does not have a valid cart identifier.", 400);
    }

    const orderFromHistory = await findOrderByCartIdInCollection("orders", cartId);
    const baseOrder = orderFromHistory || order;
    const nextPayload = buildOrderMutationPayload(baseOrder, {
        status: transition.status,
        Status: transition.status,
        orderStatus: transition.orderStatus || transition.status,
        "Order Status": transition.orderStatus || transition.status,
        "Cancelling Reason":
            transition.status === "Cancelled"
                ? getStringValue(
                      cancellationReason,
                      baseOrder?.["Cancelling Reason"],
                      baseOrder?.Details?.["Cancelling Reason"],
                      "Cancelled by Store Manager"
                  )
                : undefined
    });

    await upsertOrderByCartIdInCollection("orders", cartId, nextPayload);

    if (getOrderDeliveryDate(baseOrder)) {
        await upsertOrderByCartIdInCollection("day wise orders", cartId, nextPayload);
    }

    await upsertOrderByCartIdInCollection(transition.targetCollection, cartId, nextPayload);

    for (const collectionName of ORDER_CLEANUP_COLLECTIONS) {
        if (collectionName === transition.targetCollection) continue;
        await removeOrderByCartIdFromCollection(collectionName, cartId);
    }

    if (sourceCollection && sourceCollection !== "orders" && sourceCollection !== "day wise orders") {
        await removeOrderByCartIdFromCollection(sourceCollection, cartId);
    }

    return nextPayload;
};

const findStoreOrFail = async (storeId) => {
    const store = await SafeStoreList.findById(storeId).lean();
    if (!store) {
        throw new APIError("Store not found", 404);
    }
    return store;
};

const getStoreProductsForProfile = async (storeProfile) => {
    const allStoreProducts = await SafeStoreProducts.find().lean();
    return allStoreProducts.filter((record) => matchesStoreRecord(record, storeProfile));
};

const findStoreProductByIdentifier = (storeProducts, productId) =>
    storeProducts.find((product) =>
        sameId(product?._id, productId) ||
        sameId(product?.adminProductId, productId) ||
        sameId(product?.["Product Id"], productId)
    );

const ensureStoreProduct = async (storeProfile, productId) => {
    const existingStoreProducts = await getStoreProductsForProfile(storeProfile);
    const existingProduct = findStoreProductByIdentifier(existingStoreProducts, productId);

    if (existingProduct) {
        return existingProduct;
    }

    const adminProduct = await SafeAdminProducts.findById(productId).lean();
    if (!adminProduct) {
        throw new APIError("Store product not found for this store", 404);
    }

    const createdProduct = await SafeStoreProducts.create({
        storeId: storeProfile.id,
        adminProductId: String(adminProduct._id),
        "Product Id": getStringValue(adminProduct?.["Product Id"]),
        Image: getStringValue(adminProduct?.["Product Image"]),
        "Product Name": getStringValue(adminProduct?.["Product Name"]),
        Category: getStringValue(adminProduct?.Category),
        Type: getStringValue(adminProduct?.Type),
        Price: getNumberValue(adminProduct?.price),
        MRP: getNumberValue(adminProduct?.MRP),
        stock: getNumberValue(adminProduct?.Quantity),
        "Order Quantity": 1,
        Store: storeProfile.name,
        status: "Pending",
        spotlight: { enabled: false, position: null },
        submittedAt: new Date(),
        updatedAt: new Date()
    });

    return createdProduct.toObject();
};

const getDashboardSummary = async (storeProfile) => {
    const [
        storeProducts,
        storePayments,
        orders,
        pendingOrders,
        cancelledOrders,
        ongoingOrders,
        outForOrders,
        paymentFailedOrders,
        completedOrders,
        missedOrders,
        dayWiseOrders,
        callbacks,
        payouts
    ] = await Promise.all([
        getStoreProductsForProfile(storeProfile),
        SafeStorePayments.find().lean(),
        SafeOrders.find().lean(),
        SafePendingOrders.find().lean(),
        SafeCancelledOrders.find().lean(),
        SafeOngoingOrders.find().lean(),
        SafeOutForOrders.find().lean(),
        SafePaymentFailedOrders.find().lean(),
        SafeCompletedOrders.find().lean(),
        SafeMissedOrders.find().lean(),
        SafeDayWiseOrders.find().lean(),
        SafeStoreCallbackRequests.find().lean(),
        SafePayoutRequests.find().lean()
    ]);

    const scopedPayments = storePayments.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedOrders = orders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedPendingOrders = pendingOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedCancelledOrders = cancelledOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedOngoingOrders = ongoingOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedOutForOrders = outForOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedPaymentFailedOrders = paymentFailedOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedCompletedOrders = completedOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedMissedOrders = missedOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedDayWiseOrders = dayWiseOrders.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedCallbacks = callbacks.filter((record) => matchesStoreRecord(record, storeProfile));
    const scopedPayouts = payouts.filter((record) => matchesStoreRecord(record, storeProfile));

    const allScopedOrders = [
        ...scopedOrders,
        ...scopedPendingOrders,
        ...scopedCancelledOrders,
        ...scopedOngoingOrders,
        ...scopedOutForOrders,
        ...scopedPaymentFailedOrders,
        ...scopedCompletedOrders,
        ...scopedMissedOrders,
        ...scopedDayWiseOrders
    ];

    const uniqueOrdersMap = new Map();
    for (const order of allScopedOrders) {
        const identity = getOrderIdentity(order);
        if (!identity) continue;

        const current = uniqueOrdersMap.get(identity);
        const currentDate = getDateValue(current?.["Delivery Date"] || current?.deliveryDate);
        const incomingDate = getDateValue(order?.["Delivery Date"] || order?.deliveryDate);

        if (!current || (incomingDate && (!currentDate || incomingDate > currentDate))) {
            uniqueOrdersMap.set(identity, order);
        }
    }

    const uniqueOrders = Array.from(uniqueOrdersMap.values());

    const revenue =
        scopedPayments.reduce((total, payment) => total + getNumberValue(payment?.["Total Revenue"]), 0) ||
        uniqueOrders.reduce((total, order) => total + getNumberValue(order?.["Cart price"], order?.["Total Price"]), 0);

    const approvedProducts = storeProducts.filter(
        (product) => normalize(product?.status) === "approved"
    ).length;
    const activeDeals = storeProducts.filter((product) => product?.deal?.price).length;
    const spotlightProducts = storeProducts.filter((product) => product?.spotlight?.enabled).length;
    const totalOrders = uniqueOrders.length;
    const completedCount = scopedCompletedOrders.length;
    const fulfillmentRate = totalOrders > 0 ? Math.round((completedCount / totalOrders) * 100) : 0;
    const recentOrders = uniqueOrders
        .sort((left, right) => {
            const leftDate = getDateValue(left?.["Delivery Date"] || left?.deliveryDate)?.getTime() || 0;
            const rightDate = getDateValue(right?.["Delivery Date"] || right?.deliveryDate)?.getTime() || 0;
            return rightDate - leftDate;
        })
        .slice(0, 5)
        .map(buildRecentOrderRecord);

    return {
        store: storeProfile,
        totalOrders,
        totalRevenue: revenue,
        totalProducts: storeProducts.length,
        callbackCount: scopedCallbacks.length,
        fulfillmentRate,
        recentOrders,
        summary: {
            revenue,
            totalOrders,
            newOrders: scopedOrders.length,
            pendingOrders: scopedPendingOrders.length,
            cancelledOrders: scopedCancelledOrders.length,
            ongoingOrders: scopedOngoingOrders.length,
            outForDeliveryOrders: scopedOutForOrders.length,
            paymentFailedOrders: scopedPaymentFailedOrders.length,
            completedOrders: completedCount,
            missedOrders: scopedMissedOrders.length,
            approvedProducts,
            payoutRequests: scopedPayouts.length,
            callbackRequests: scopedCallbacks.length,
            activeDeals,
            spotlightProducts,
            totalProducts: storeProducts.length,
            fulfillmentRate
        },
        counters: {
            lowStockProducts: storeProducts.filter((product) => getNumberValue(product?.stock) > 0 && getNumberValue(product?.stock) <= 5).length
        }
    };
};

export const getStoreWorkspaceDashboard = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const dashboard = await getDashboardSummary(storeProfile);

    res.status(200).json({
        status: "success",
        data: dashboard
    });
});

export const getStoreWorkspaceSettings = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);

    res.status(200).json({
        status: "success",
        data: storeProfile.settings
    });
});

export const updateStoreWorkspaceSettings = catchAsync(async (req, res) => {
    const existingStore = await findStoreOrFail(req.params.id);
    const updates = buildStoreSettingsPayload(req.body);

    const updatedStore = await SafeStoreList.findByIdAndUpdate(
        existingStore._id,
        {
            ...updates,
            updatedAt: new Date()
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).lean();

    const updatedProfile = buildStoreProfile(updatedStore);

    res.status(200).json({
        status: "success",
        data: updatedProfile.settings
    });
});

export const getStoreCatalogProducts = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProducts = await getStoreProductsForProfile(storeProfile);

    res.status(200).json({
        status: "success",
        results: storeProducts.length,
        data: storeProducts.map(serializeStoreProduct)
    });
});

export const updateStoreCatalogPricing = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProduct = await ensureStoreProduct(storeProfile, req.params.productId);

    const updatedProduct = await SafeStoreProducts.findByIdAndUpdate(
        storeProduct._id || storeProduct.id,
        {
            Price: getNumberValue(req.body.price, req.body.Price, storeProduct.Price),
            MRP: getNumberValue(req.body.mrp, req.body.MRP, storeProduct.MRP),
            updatedAt: new Date()
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).lean();

    res.status(200).json({
        status: "success",
        data: serializeStoreProduct(updatedProduct)
    });
});

export const updateStoreCatalogStock = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProduct = await ensureStoreProduct(storeProfile, req.params.productId);

    const updatedProduct = await SafeStoreProducts.findByIdAndUpdate(
        storeProduct._id || storeProduct.id,
        {
            stock: getNumberValue(req.body.stock, req.body.Stock),
            updatedAt: new Date()
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).lean();

    res.status(200).json({
        status: "success",
        data: serializeStoreProduct(updatedProduct)
    });
});

export const updateStoreCatalogOrderQuantity = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProduct = await ensureStoreProduct(storeProfile, req.params.productId);

    const updatedProduct = await SafeStoreProducts.findByIdAndUpdate(
        storeProduct._id || storeProduct.id,
        {
            "Order Quantity": getNumberValue(req.body.orderQuantity, req.body["Order Quantity"]),
            updatedAt: new Date()
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).lean();

    res.status(200).json({
        status: "success",
        data: serializeStoreProduct(updatedProduct)
    });
});

export const getStoreDeals = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProducts = await getStoreProductsForProfile(storeProfile);

    const deals = storeProducts
        .filter((product) => product?.deal?.price)
        .map((product) => {
            const serializedProduct = serializeStoreProduct(product);
            return {
                id: serializedProduct.id,
                productId: serializedProduct.id,
                productName: serializedProduct.productName,
                dealPrice: getNumberValue(serializedProduct.deal?.price),
                fromDate: serializedProduct.deal?.fromDate || null,
                toDate: serializedProduct.deal?.toDate || null,
                status: serializedProduct.deal?.status || "Scheduled"
            };
        });

    res.status(200).json({
        status: "success",
        results: deals.length,
        data: deals
    });
});

export const createStoreDeal = catchAsync(async (req, res) => {
    const { productId, dealPrice, fromDate, toDate } = req.body;

    if (!productId || !dealPrice || !fromDate || !toDate) {
        throw new APIError("productId, dealPrice, fromDate and toDate are required", 400);
    }

    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProduct = await ensureStoreProduct(storeProfile, productId);

    const deal = {
        price: getNumberValue(dealPrice),
        fromDate: getDateValue(fromDate),
        toDate: getDateValue(toDate),
        status: "Scheduled",
        updatedAt: new Date()
    };

    const updatedProduct = await SafeStoreProducts.findByIdAndUpdate(
        storeProduct._id || storeProduct.id,
        {
            deal,
            updatedAt: new Date()
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).lean();

    res.status(201).json({
        status: "success",
        data: serializeStoreProduct(updatedProduct)
    });
});

export const deleteStoreDeal = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProduct = await ensureStoreProduct(storeProfile, req.params.productId);

    const updatedProduct = await StoreProducts.findByIdAndUpdate(
        storeProduct._id || storeProduct.id,
        {
            deal: null,
            updatedAt: new Date()
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).lean();

    res.status(200).json({
        status: "success",
        data: serializeStoreProduct(updatedProduct)
    });
});

export const getStoreSpotlight = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const storeProducts = await getStoreProductsForProfile(storeProfile);

    const spotlightProducts = storeProducts
        .filter((product) => product?.spotlight?.enabled)
        .sort((left, right) => getNumberValue(left?.spotlight?.position) - getNumberValue(right?.spotlight?.position))
        .map(serializeStoreProduct);

    res.status(200).json({
        status: "success",
        results: spotlightProducts.length,
        data: spotlightProducts
    });
});

export const updateStoreSpotlight = catchAsync(async (req, res) => {
    const { productIds = [] } = req.body;

    if (!Array.isArray(productIds)) {
        throw new APIError("productIds must be an array", 400);
    }

    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const existingStoreProducts = await getStoreProductsForProfile(storeProfile);

    await Promise.all(
        existingStoreProducts.map((product) =>
            SafeStoreProducts.findByIdAndUpdate(product._id, {
                spotlight: { enabled: false, position: null },
                updatedAt: new Date()
            })
        )
    );

    const selectedProducts = [];

    for (const [index, productId] of productIds.entries()) {
        const storeProduct = await ensureStoreProduct(storeProfile, productId);
        const updatedProduct = await SafeStoreProducts.findByIdAndUpdate(
            storeProduct._id || storeProduct.id,
            {
                spotlight: {
                    enabled: true,
                    position: index + 1,
                    updatedAt: new Date()
                },
                updatedAt: new Date()
            },
            {
                returnDocument: "after",
                runValidators: true
            }
        ).lean();

        selectedProducts.push(serializeStoreProduct(updatedProduct));
    }

    res.status(200).json({
        status: "success",
        results: selectedProducts.length,
        data: selectedProducts
    });
});

export const getStoreWorkspaceOrders = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const view = getStringValue(req.query.view, "all").replace(/-/g, "_");
    const filters = {
        fromDate: getStringValue(req.query.fromDate),
        toDate: getStringValue(req.query.toDate),
        paymentMethod: getStringValue(req.query.paymentMethod)
    };

    const orders = await getStoreWorkspaceOrdersForView(storeProfile, view, filters);

    res.status(200).json({
        status: "success",
        results: orders.length,
        data: orders
    });
});

export const updateStoreWorkspaceOrderStatus = catchAsync(async (req, res) => {
    const store = await findStoreOrFail(req.params.id);
    const storeProfile = buildStoreProfile(store);
    const view = getStringValue(req.body.view, req.query.view, "all").replace(/-/g, "_");
    const requestedStatus = getStringValue(req.body.nextStatus, req.body.status);
    const cancellationReason = getStringValue(
        req.body.cancellationReason,
        req.body["Cancelling Reason"]
    );

    if (!requestedStatus) {
        throw new APIError("nextStatus is required for order updates.", 400);
    }

    const initialCollectionName = ORDER_VIEW_CONFIG[view]?.collectionName || "orders";
    let sourceCollection = initialCollectionName;
    let sourceOrder = await findOrderByIdInCollection(initialCollectionName, req.params.orderId);

    if (!sourceOrder) {
        const fallbackResult = await findOrderAcrossCollections(req.params.orderId);
        sourceCollection = fallbackResult.collectionName || initialCollectionName;
        sourceOrder = fallbackResult.order;
    }

    if (!sourceOrder || !matchesStoreRecord(sourceOrder, storeProfile)) {
        throw new APIError("Order not found for this store.", 404);
    }

    const updatedOrder = await syncStoreOrderStatusChange({
        sourceCollection,
        order: sourceOrder,
        nextStatus: requestedStatus,
        cancellationReason
    });

    res.status(200).json({
        status: "success",
        data: updatedOrder
    });
});
