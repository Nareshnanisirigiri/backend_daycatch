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
    logo: getStringValue(store?.["Profile Pic"], store?.logo)
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

const findStoreOrFail = async (storeId) => {
    const store = await StoreList.findById(storeId).lean();
    if (!store) {
        throw new APIError("Store not found", 404);
    }
    return store;
};

const getStoreProductsForProfile = async (storeProfile) => {
    const allStoreProducts = await StoreProducts.find().lean();
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

    const adminProduct = await AdminProducts.findById(productId).lean();
    if (!adminProduct) {
        throw new APIError("Store product not found for this store", 404);
    }

    const createdProduct = await StoreProducts.create({
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
        StorePayments.find().lean(),
        Orders.find().lean(),
        PendingOrders.find().lean(),
        CancelledOrders.find().lean(),
        OngoingOrders.find().lean(),
        OutForOrders.find().lean(),
        PaymentFailedOrders.find().lean(),
        CompletedOrders.find().lean(),
        MissedOrders.find().lean(),
        DayWiseOrders.find().lean(),
        StoreCallbackRequests.find().lean(),
        PayoutRequests.find().lean()
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

    const updatedProduct = await StoreProducts.findByIdAndUpdate(
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

    const updatedProduct = await StoreProducts.findByIdAndUpdate(
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

    const updatedProduct = await StoreProducts.findByIdAndUpdate(
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

    const updatedProduct = await StoreProducts.findByIdAndUpdate(
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
            StoreProducts.findByIdAndUpdate(product._id, {
                spotlight: { enabled: false, position: null },
                updatedAt: new Date()
            })
        )
    );

    const selectedProducts = [];

    for (const [index, productId] of productIds.entries()) {
        const storeProduct = await ensureStoreProduct(storeProfile, productId);
        const updatedProduct = await StoreProducts.findByIdAndUpdate(
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
