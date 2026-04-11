import { wrapPrismaModel } from "./prismaShim.js";

// Core admin/user models
export const Users = wrapPrismaModel("users");
export const SubAdmin = wrapPrismaModel("sub_admin");
export const SuperAdmin = wrapPrismaModel("super_admin");
export const Role = wrapPrismaModel("roles");
export const Session = wrapPrismaModel("sessions");

// Catalog
export const ParentCategories = wrapPrismaModel("categories");
export const SubCategories = wrapPrismaModel("subcategories");
export const AdminProducts = wrapPrismaModel("admin_products");
export const StoreProducts = wrapPrismaModel("store_products");
export const TrendingSearch = wrapPrismaModel("trending_search");
export const Tax = wrapPrismaModel("tax");

// Geography
export const Cities = wrapPrismaModel("city");
export const Area = wrapPrismaModel("area");

// Stores
export const StoreList = wrapPrismaModel("store");
export const StorePayments = wrapPrismaModel("cart_payments");
export const StoreApproval = wrapPrismaModel("store");
export const StoreNotifications = wrapPrismaModel("store_notification");
export const StoreCallbackRequests = wrapPrismaModel("store_callback_req");
export const StoreFeedback = wrapPrismaModel("store");

// Orders
export const Orders = wrapPrismaModel("orders");
export const PendingOrders = wrapPrismaModel("pending_orders");
export const CancelledOrders = wrapPrismaModel("cancelled_orders");
export const OngoingOrders = wrapPrismaModel("ongoingorders");
export const OutForOrders = wrapPrismaModel("out_for_orders");
export const PaymentFailedOrders = wrapPrismaModel("payment_failed_orders");
export const CompletedOrders = wrapPrismaModel("completed_orders");
export const DayWiseOrders = wrapPrismaModel("day_wise_orders");
export const MissedOrders = wrapPrismaModel("missed_orders");
export const OrderByPhotoRequests = wrapPrismaModel("order_by_photo_requests");

// Payouts & rewards
export const PayoutRequests = wrapPrismaModel("payout_requests");
export const Payouts = wrapPrismaModel("payouts");
export const Rewards = wrapPrismaModel("rewards");
export const RedeemValue = wrapPrismaModel("reedm_value");

// Delivery
export const DeliveryBoy = wrapPrismaModel("deliveryboy");
export const DeliveryBoyIncentives = wrapPrismaModel("deliveryboy_incentives");
export const DeliveryBoyFeedback = wrapPrismaModel("deliveryboyfeedback");
export const DeliveryBoyCallbackRequests = wrapPrismaModel("deliveryboycallbackrequests");
export const DriverNotifications = wrapPrismaModel("driver_notifications");

// Content
export const PagesAbout = wrapPrismaModel("aboutuspage");
export const TermsAndConditions = wrapPrismaModel("termsandconditions");
export const AppNotice = wrapPrismaModel("appnotice");
export const AppLink = wrapPrismaModel("applink");

// Misc
export const Membership = wrapPrismaModel("membership");
export const IdDocument = wrapPrismaModel("id");
export const Reports = wrapPrismaModel("reports");
export const Coupons = wrapPrismaModel("coupons");
export const CategoryBanners = wrapPrismaModel("category_banners");
export const ProductBanners = wrapPrismaModel("product_banners");
export const Globalsettings = wrapPrismaModel("globalsettings");
export const SmsSettings = wrapPrismaModel("sms_settings");
export const FcmKeys = wrapPrismaModel("fcm_keys");
export const PaymentMode = wrapPrismaModel("payment_mode");
export const MapSettings = wrapPrismaModel("map_settings");
export const DriverIncentive = wrapPrismaModel("driver_incentive");
export const ImgStore = wrapPrismaModel("img_store");
export const CancellingReason = wrapPrismaModel("cancelling_reason");
export const Rejectedbystore = wrapPrismaModel("rejectedbystore");
export const UserNotifications = wrapPrismaModel("user_notifications");
export const UserFeedback = wrapPrismaModel("userfeedback");
export const UserCallbackRequests = wrapPrismaModel("usercallbackrequests");
export const WalletRechargeHistory = wrapPrismaModel("wallet_recharge_history");
export const AdminProductsLegacy = wrapPrismaModel("admin_products");
