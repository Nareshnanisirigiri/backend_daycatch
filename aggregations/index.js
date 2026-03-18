import {
    AdminProducts,
    Area,
    CancelledOrders,
    Cities,
    CompletedOrders,
    DayWiseOrders,
    DeliveryBoy,
    DeliveryBoyCallbackRequests,
    DeliveryBoyFeedback,
    DeliveryBoyIncentives,
    DriverNotifications,
    IdDocument,
    ItemRequirement,
    ItemSaleReport,
    Membership,
    MissedOrders,
    OngoingOrders,
    Orders,
    OutForOrders,
    PagesAbout,
    ParentCategories,
    PayoutRequests,
    Payouts,
    PaymentFailedOrders,
    PendingOrders,
    RedeemValue,
    Rewards,
    StoreApproval,
    StoreCallbackRequests,
    StoreFeedback,
    StoreList,
    StoreNotifications,
    StorePayments,
    StoreProducts,
    SubAdmin,
    SubCategories,
    Tax,
    TaxReport,
    TermsAndConditions,
    UserCallbackRequests,
    UserFeedback,
    UserNotifications,
    Users,
    WalletRechargeHistory
} from "../models/index.js";

function lookup({ from, localField, foreignField, as, project }) {
    const pipeline = [
        {
            $match: {
                $expr: {
                    $eq: [`$${foreignField}`, "$$localValue"]
                }
            }
        }
    ];

    if (project) {
        pipeline.push({ $project: project });
    }

    return {
        $lookup: {
            from,
            let: { localValue: `$${localField}` },
            pipeline,
            as
        }
    };
}

function flatten(as) {
    return {
        $addFields: {
            [as]: {
                $cond: [
                    { $gt: [{ $size: `$${as}` }, 0] },
                    { $arrayElemAt: [`$${as}`, 0] },
                    null
                ]
            }
        }
    };
}

function buildPipeline({ lookups = [] }) {
    const pipeline = [];

    for (const definition of lookups) {
        pipeline.push(lookup(definition));
        pipeline.push(flatten(definition.as));
    }

    return pipeline;
}

const aggregationDefinitions = {
    "sub-admin": {
        model: SubAdmin,
        description: "Sub admin records without external references."
    },
    membership: {
        model: Membership,
        description: "Membership plans without external references."
    },
    id: {
        model: IdDocument,
        description: "ID document records without external references."
    },
    tax: {
        model: Tax,
        description: "Tax master records without external references."
    },
    item_requirement: {
        model: ItemRequirement,
        description: "Item requirements enriched with matching store and city data.",
        lookups: [
            {
                from: "storeList",
                localField: "Store Name",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1, address: 1 }
            },
            {
                from: "cities",
                localField: "City",
                foreignField: "City Name",
                as: "cityDetails",
                project: { "City ID": 1, "City Name": 1 }
            }
        ]
    },
    item_sale_report: {
        model: ItemSaleReport,
        description: "Item sale reports enriched with product master data.",
        lookups: [
            {
                from: "Adminproducts",
                localField: "Product Name",
                foreignField: "Product Name",
                as: "productDetails",
                project: { "Product Id": 1, "Product Name": 1, Category: 1, MRP: 1, price: 1 }
            }
        ]
    },
    tax_report: {
        model: TaxReport,
        description: "Tax reports enriched with product master data.",
        lookups: [
            {
                from: "Adminproducts",
                localField: "Product Name",
                foreignField: "Product Name",
                as: "productDetails",
                project: { "Product Id": 1, "Product Name": 1, Category: 1, tax: 1 }
            }
        ]
    },
    user_notifications: {
        model: UserNotifications,
        description: "User notifications enriched with user profile data.",
        lookups: [
            {
                from: "users",
                localField: "Select Users",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1, "Is Verified": 1 }
            }
        ]
    },
    store_notifications: {
        model: StoreNotifications,
        description: "Store notifications enriched with store details.",
        lookups: [
            {
                from: "storeList",
                localField: "Select store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1, address: 1 }
            }
        ]
    },
    driver_notifications: {
        model: DriverNotifications,
        description: "Driver notifications enriched with delivery boy details.",
        lookups: [
            {
                from: "deliveryboy",
                localField: "Select Driver",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1, Orders: 1 }
            }
        ]
    },
    users: {
        model: Users,
        description: "Users without external references."
    },
    Wallet_Rechage_History: {
        model: WalletRechargeHistory,
        description: "Wallet recharge history enriched with user profile data.",
        lookups: [
            {
                from: "users",
                localField: "User Name",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1, "Is Verified": 1 }
            }
        ]
    },
    parentcategories: {
        model: ParentCategories,
        description: "Parent categories enriched with tax master data.",
        lookups: [
            {
                from: "tax",
                localField: "taxtName",
                foreignField: "Tax Type name",
                as: "taxDetails",
                project: { "Tax Type name": 1 }
            }
        ]
    },
    subcategories: {
        model: SubCategories,
        description: "Subcategories enriched with parent category details.",
        lookups: [
            {
                from: "parentcategories",
                localField: "Parent Category",
                foreignField: "Title",
                as: "parentCategoryDetails",
                project: { Title: 1, Category: 1, Image: 1, taxtName: 1 }
            }
        ]
    },
    Adminproducts: {
        model: AdminProducts,
        description: "Admin products enriched with category data.",
        lookups: [
            {
                from: "parentcategories",
                localField: "Category",
                foreignField: "Title",
                as: "categoryDetails",
                project: { Title: 1, Category: 1, taxtName: 1, "Tax percentage": 1 }
            }
        ]
    },
    storeProducts: {
        model: StoreProducts,
        description: "Store products enriched with store and admin product data.",
        lookups: [
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            },
            {
                from: "Adminproducts",
                localField: "Product Name",
                foreignField: "Product Name",
                as: "productDetails",
                project: { "Product Id": 1, "Product Name": 1, Category: 1, MRP: 1, price: 1 }
            }
        ]
    },
    cities: {
        model: Cities,
        description: "Cities without external references."
    },
    area: {
        model: Area,
        description: "Areas enriched with city data.",
        lookups: [
            {
                from: "cities",
                localField: "City Name",
                foreignField: "City Name",
                as: "cityDetails",
                project: { "City ID": 1, "City Name": 1 }
            }
        ]
    },
    storeList: {
        model: StoreList,
        description: "Stores enriched with city and area data.",
        lookups: [
            {
                from: "cities",
                localField: "City",
                foreignField: "City Name",
                as: "cityDetails",
                project: { "City ID": 1, "City Name": 1 }
            },
            {
                from: "area",
                localField: "City",
                foreignField: "City Name",
                as: "areaDetails",
                project: { "Society Name": 1, "City Name": 1 }
            }
        ]
    },
    storepayments: {
        model: StorePayments,
        description: "Store payments enriched with store details.",
        lookups: [
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1, address: 1 }
            }
        ]
    },
    storeapproval: {
        model: StoreApproval,
        description: "Store approvals enriched with city data.",
        lookups: [
            {
                from: "cities",
                localField: "City",
                foreignField: "City Name",
                as: "cityDetails",
                project: { "City ID": 1, "City Name": 1 }
            }
        ]
    },
    orders: {
        model: Orders,
        description: "Orders enriched with user and delivery assignment data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            },
            {
                from: "deliveryboy",
                localField: "Assign",
                foreignField: "Boy Name",
                as: "assignedDriverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    "pending orders": {
        model: PendingOrders,
        description: "Pending orders enriched with user data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            }
        ]
    },
    "cancelled orders": {
        model: CancelledOrders,
        description: "Cancelled orders enriched with user, store, and driver data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            },
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            },
            {
                from: "deliveryboy",
                localField: "Delivery Boy",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    ongoingorders: {
        model: OngoingOrders,
        description: "Ongoing orders enriched with user and store data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            },
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            }
        ]
    },
    "out for orders": {
        model: OutForOrders,
        description: "Out-for-delivery orders enriched with user data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            }
        ]
    },
    "payment failed orders": {
        model: PaymentFailedOrders,
        description: "Failed-payment orders enriched with user data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            }
        ]
    },
    "completed orders": {
        model: CompletedOrders,
        description: "Completed orders enriched with user, store, and driver data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            },
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            },
            {
                from: "deliveryboy",
                localField: "Delivery Boy",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    "day wise orders": {
        model: DayWiseOrders,
        description: "Day-wise orders enriched with user, store, and driver data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            },
            {
                from: "storeList",
                localField: "store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            },
            {
                from: "deliveryboy",
                localField: "Delivery Boy",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    "missed orders": {
        model: MissedOrders,
        description: "Missed orders enriched with user and store data.",
        lookups: [
            {
                from: "users",
                localField: "User",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            },
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            },
            {
                from: "deliveryboy",
                localField: "Assign",
                foreignField: "Boy Name",
                as: "assignedDriverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    "payout requests": {
        model: PayoutRequests,
        description: "Payout requests enriched with store details.",
        lookups: [
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1, address: 1 }
            }
        ]
    },
    payouts: {
        model: Payouts,
        description: "Payout settings without external references."
    },
    rewards: {
        model: Rewards,
        description: "Reward settings without external references."
    },
    "reedm value": {
        model: RedeemValue,
        description: "Redeem value settings without external references."
    },
    deliveryboy: {
        model: DeliveryBoy,
        description: "Delivery boy records without external references."
    },
    deliveryboy_incentives: {
        model: DeliveryBoyIncentives,
        description: "Delivery boy incentives enriched with driver data.",
        lookups: [
            {
                from: "deliveryboy",
                localField: "Delivery Boy",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    "pages About": {
        model: PagesAbout,
        description: "Static page content without external references."
    },
    "termsAnd Conditions": {
        model: TermsAndConditions,
        description: "Static terms content without external references."
    },
    Userfeedback: {
        model: UserFeedback,
        description: "User feedback enriched with user details.",
        lookups: [
            {
                from: "users",
                localField: "Users",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            }
        ]
    },
    storefeedback: {
        model: StoreFeedback,
        description: "Store feedback enriched with store details.",
        lookups: [
            {
                from: "storeList",
                localField: "Store",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            }
        ]
    },
    deliveryboyfeedback: {
        model: DeliveryBoyFeedback,
        description: "Delivery boy feedback enriched with driver details.",
        lookups: [
            {
                from: "deliveryboy",
                localField: "Delivery Boy",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    },
    usercallbackrequests: {
        model: UserCallbackRequests,
        description: "User callback requests enriched with user details.",
        lookups: [
            {
                from: "users",
                localField: "User Name",
                foreignField: "User Name",
                as: "userDetails",
                project: { "User Name": 1, "User Phone": 1, "User Email": 1 }
            }
        ]
    },
    storecallbackrequests: {
        model: StoreCallbackRequests,
        description: "Store callback requests enriched with store details.",
        lookups: [
            {
                from: "storeList",
                localField: "Store Name",
                foreignField: "Store Name",
                as: "storeDetails",
                project: { "Store Name": 1, City: 1, Mobile: 1, Email: 1 }
            }
        ]
    },
    deliveryboycallbackrequests: {
        model: DeliveryBoyCallbackRequests,
        description: "Driver callback requests enriched with driver details.",
        lookups: [
            {
                from: "deliveryboy",
                localField: "Delivery Boy Name",
                foreignField: "Boy Name",
                as: "driverDetails",
                project: { "Boy Name": 1, "Boy Phone": 1, Status: 1 }
            }
        ]
    }
};

for (const definition of Object.values(aggregationDefinitions)) {
    definition.pipeline = buildPipeline(definition);
}

export function listAggregations() {
    return Object.entries(aggregationDefinitions).map(([key, value]) => ({
        key,
        collection: value.model.collection.collectionName,
        description: value.description,
        lookups: value.lookups?.length || 0
    }));
}

export function getAggregationDefinition(key) {
    return aggregationDefinitions[key] || null;
}
