import * as Models from "../models/index.js";
import { getModelByCollectionName } from "../models/collectionRegistry.js";

const {
    AdminProducts, Cities, DeliveryBoy, Membership, IdDocument,
    Orders, ParentCategories, StoreList, Tax, Users,
    ItemRequirement, ItemSaleReport, TaxReport, UserNotifications,
    StoreNotifications, DriverNotifications, WalletRechargeHistory,
    SubCategories, StoreProducts, Area, StorePayments, StoreApproval,
    PendingOrders, CancelledOrders, OngoingOrders, OutForOrders,
    PaymentFailedOrders, CompletedOrders, DayWiseOrders, MissedOrders,
    PayoutRequests, DeliveryBoyIncentives, UserFeedback, StoreFeedback,
    DeliveryBoyFeedback, UserCallbackRequests, StoreCallbackRequests,
    DeliveryBoyCallbackRequests, SuperAdmin, SubAdmin, Tax: TaxModel,
    RedeemValue, Rewards, PagesAbout, TermsAndConditions
} = Models;

const aggregationDefinitions = {
    "super-admin": { model: SuperAdmin },
    "sub-admin": { model: SubAdmin },
    membership: { model: Membership },
    id: { model: IdDocument },
    tax: { model: TaxModel },
    item_requirement: {
        model: ItemRequirement,
        include: ["storeDetails", "cityDetails"]
    },
    item_sale_report: {
        model: ItemSaleReport,
        include: ["productDetails"]
    },
    tax_report: {
        model: TaxReport,
        include: ["productDetails"]
    },
    user_notifications: {
        model: UserNotifications,
        include: ["userDetails"]
    },
    store_notifications: {
        model: StoreNotifications,
        include: ["storeDetails"]
    },
    driver_notifications: {
        model: DriverNotifications,
        include: ["driverDetails"]
    },
    users: { model: Users },
    Wallet_Rechage_History: {
        model: WalletRechargeHistory,
        include: ["userDetails"]
    },
    parentcategories: {
        model: ParentCategories,
        include: ["taxDetails"]
    },
    subcategories: {
        model: SubCategories,
        include: ["parentCategoryDetails"]
    },
    Adminproducts: {
        model: AdminProducts,
        include: ["categoryDetails"]
    },
    storeProducts: {
        model: StoreProducts,
        include: ["storeDetails", "productDetails"]
    },
    cities: { model: Cities },
    area: {
        model: Area,
        include: ["cityDetails"]
    },
    storeList: {
        model: StoreList,
        include: ["cityDetails"]
    },
    storepayments: {
        model: StorePayments,
        include: ["storeDetails"]
    },
    storeapproval: {
        model: StoreApproval,
        include: ["cityDetails"]
    },
    orders: {
        model: Orders,
        include: ["userDetails", "assignedDriverDetails"]
    },
    "pending orders": {
        model: PendingOrders,
        include: ["userDetails"]
    },
    "cancelled orders": {
        model: CancelledOrders,
        include: ["userDetails", "storeDetails", "driverDetails"]
    },
    ongoingorders: {
        model: OngoingOrders,
        include: ["userDetails", "storeDetails"]
    },
    "out for orders": {
        model: OutForOrders,
        include: ["userDetails"]
    },
    "payment failed orders": {
        model: PaymentFailedOrders,
        include: ["userDetails"]
    },
    "completed orders": {
        model: CompletedOrders,
        include: ["userDetails", "storeDetails", "driverDetails"]
    },
    "day wise orders": {
        model: DayWiseOrders,
        include: ["userDetails", "storeDetails", "driverDetails"]
    },
    "missed orders": {
        model: MissedOrders,
        include: ["userDetails", "storeDetails", "assignedDriverDetails"]
    },
    "payout requests": {
        model: PayoutRequests,
        include: ["storeDetails"]
    },
    deliveryboy_incentives: {
        model: DeliveryBoyIncentives,
        include: ["driverDetails"]
    },
    Userfeedback: {
        model: UserFeedback,
        include: ["userDetails"]
    },
    storefeedback: {
        model: StoreFeedback,
        include: ["storeDetails"]
    },
    deliveryboyfeedback: {
        model: DeliveryBoyFeedback,
        include: ["driverDetails"]
    },
    usercallbackrequests: {
        model: UserCallbackRequests,
        include: ["userDetails"]
    },
    storecallbackrequests: {
        model: StoreCallbackRequests,
        include: ["storeDetails"]
    },
    deliveryboycallbackrequests: {
        model: DeliveryBoyCallbackRequests,
        include: ["driverDetails"]
    }
};

export function getAggregationDefinition(key) {
    return aggregationDefinitions[key] || null;
}

export async function runAggregation(definition, { skip = 0, limit = 50 } = {}) {
    // High-Performance Industry standard: Using Sequelize SQL JOINS
    const query = {
        offset: skip,
        limit,
        // We use plain: true inside the wrapper usually, but here we want formatted results
    };

    if (definition.include) {
        query.include = definition.include.map(alias => ({
            association: alias,
            required: false // LEFT OUTER JOIN
        }));
    }

    const results = await definition.model.findAll(query);
    
    // Convert Sequelize instances to plain JSON
    return results.map(row => typeof row.toJSON === 'function' ? row.toJSON() : row);
}
