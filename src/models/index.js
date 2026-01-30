const sequelize = require('../config/database');
const Category = require('./Category');
const Item = require('./Item');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const User = require('./User');
const Variant = require('./Variant');
const Addon = require('./Addon');
const Aggregator = require('./Aggregator');
const Table = require('./Table');
const Tax = require('./Tax');
const SpecialNote = require('./SpecialNote');
const PosDevice = require('./PosDevice');
const Subscription = require('./Subscription');
const Wastage = require('./Wastage');
const WastageItem = require('./WastageItem');

const Discount = require('./Discount');
const Setting = require('./Setting');
const Tenant = require('./Tenant');

// Add User <-> Tenant Relationship
User.belongsTo(Tenant, { foreignKey: 'tenantId' });
Tenant.hasMany(User, { foreignKey: 'tenantId' });

// Tenant Hierarchy
Tenant.hasMany(Tenant, { as: 'subTenants', foreignKey: 'parentTenantId' });
Tenant.belongsTo(Tenant, { as: 'parentTenant', foreignKey: 'parentTenantId' });

const AddonGroup = require('./AddonGroup');
const VariationGroup = require('./VariationGroup');
const ItemAddonGroup = require('./ItemAddonGroup');
const ItemVariationGroup = require('./ItemVariationGroup');
const RawMaterial = require('./RawMaterial');
const Recipe = require('./Recipe');
const RecipeIngredient = require('./RecipeIngredient');
const Supplier = require('./Supplier');
const Purchase = require('./Purchase');
const PurchaseItem = require('./PurchaseItem');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const PurchaseReturn = require('./PurchaseReturn');
const PurchaseReturnItem = require('./PurchaseReturnItem');
const Outlet = require('./Outlet');

// Relationships
Category.hasMany(Item, { foreignKey: 'categoryId' });
Item.belongsTo(Category, { foreignKey: 'categoryId' });

Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parentId' });
Category.belongsTo(Category, { as: 'parentCategory', foreignKey: 'parentId' });

Item.hasMany(Variant, { foreignKey: 'itemId' });
Variant.belongsTo(Item, { foreignKey: 'itemId' });

Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

Item.hasMany(OrderItem, { foreignKey: 'itemId' });
OrderItem.belongsTo(Item, { foreignKey: 'itemId' });

Variant.hasMany(OrderItem, { foreignKey: 'variantId' });
OrderItem.belongsTo(Variant, { foreignKey: 'variantId' });

// Groups Relationships
AddonGroup.hasMany(Addon, { foreignKey: 'addonGroupId' });
Addon.belongsTo(AddonGroup, { foreignKey: 'addonGroupId' });

VariationGroup.hasMany(Variant, { foreignKey: 'variationGroupId' });
Variant.belongsTo(VariationGroup, { foreignKey: 'variationGroupId' });

// Many-to-Many Item <-> Groups
Item.belongsToMany(AddonGroup, { through: ItemAddonGroup, foreignKey: 'itemId', as: 'addonGroups' });
AddonGroup.belongsToMany(Item, { through: ItemAddonGroup, foreignKey: 'addonGroupId', as: 'items' });

Item.belongsToMany(VariationGroup, { through: ItemVariationGroup, foreignKey: 'itemId', as: 'variationGroups' });
VariationGroup.belongsToMany(Item, { through: ItemVariationGroup, foreignKey: 'variationGroupId', as: 'items' });

// Inventory / Recipe Relationships
Item.hasOne(Recipe, { foreignKey: 'itemId' });
Recipe.belongsTo(Item, { foreignKey: 'itemId' });

Variant.hasOne(Recipe, { foreignKey: 'variantId' });
Recipe.belongsTo(Variant, { foreignKey: 'variantId' });

Recipe.hasMany(RecipeIngredient, { foreignKey: 'recipeId' });
RecipeIngredient.belongsTo(Recipe, { foreignKey: 'recipeId' });

RawMaterial.hasMany(RecipeIngredient, { foreignKey: 'rawMaterialId' });
RecipeIngredient.belongsTo(RawMaterial, { foreignKey: 'rawMaterialId' });

// Procurement Relationships
Supplier.hasMany(Purchase, { foreignKey: 'supplierId' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplierId' });

Purchase.hasMany(PurchaseItem, { foreignKey: 'purchaseId' });
PurchaseItem.belongsTo(Purchase, { foreignKey: 'purchaseId' });

RawMaterial.hasMany(PurchaseItem, { foreignKey: 'rawMaterialId' });
PurchaseItem.belongsTo(RawMaterial, { foreignKey: 'rawMaterialId' });

Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplierId' });
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplierId' });

PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchaseOrderId' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchaseOrderId' });

RawMaterial.hasMany(PurchaseOrderItem, { foreignKey: 'rawMaterialId' });
PurchaseOrderItem.belongsTo(RawMaterial, { foreignKey: 'rawMaterialId' });

Supplier.hasMany(PurchaseReturn, { foreignKey: 'supplierId' });
PurchaseReturn.belongsTo(Supplier, { foreignKey: 'supplierId' });

PurchaseReturn.hasMany(PurchaseReturnItem, { foreignKey: 'purchaseReturnId' });
PurchaseReturnItem.belongsTo(PurchaseReturn, { foreignKey: 'purchaseReturnId' });

RawMaterial.hasMany(PurchaseReturnItem, { foreignKey: 'rawMaterialId' });
PurchaseReturnItem.belongsTo(RawMaterial, { foreignKey: 'rawMaterialId' });

const { Expense, ExpenseCategory } = require('./Expense');
const { Withdrawal, WithdrawalCategory } = require('./Withdrawal');
const { CashTopUp, CashTopUpCategory } = require('./CashTopUp');

// Loyalty Models
const Customer = require('./Customer');
const LoyaltyConfig = require('./LoyaltyConfig');
const LoyaltyTier = require('./LoyaltyTier');
const CustomerLoyalty = require('./CustomerLoyalty');
const LoyaltyTransaction = require('./LoyaltyTransaction');
const LoyaltyReward = require('./LoyaltyReward');

// Gift Card Models
const GiftCard = require('./GiftCard');
const GiftCardTransaction = require('./GiftCardTransaction');
const Feedback = require('./Feedback');

// Loyalty Relationships
Customer.hasOne(CustomerLoyalty, { foreignKey: 'customerId', as: 'loyalty' });
CustomerLoyalty.belongsTo(Customer, { foreignKey: 'customerId' });

CustomerLoyalty.belongsTo(LoyaltyTier, { foreignKey: 'tierId', as: 'tier' });
LoyaltyTier.hasMany(CustomerLoyalty, { foreignKey: 'tierId' });

Customer.hasMany(LoyaltyTransaction, { foreignKey: 'customerId', as: 'loyaltyTransactions' });
LoyaltyTransaction.belongsTo(Customer, { foreignKey: 'customerId' });

Order.belongsTo(Customer, { foreignKey: 'customerId' });
Customer.hasMany(Order, { foreignKey: 'customerId' });

// Gift Card Relationships
GiftCard.hasMany(GiftCardTransaction, { foreignKey: 'giftCardId', as: 'transactions' });
GiftCardTransaction.belongsTo(GiftCard, { foreignKey: 'giftCardId' });

GiftCard.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(GiftCard, { foreignKey: 'customerId', as: 'giftCards' });

// Feedback Relationships
Feedback.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasOne(Feedback, { foreignKey: 'orderId', as: 'feedback' });

Feedback.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Customer.hasMany(Feedback, { foreignKey: 'customerId', as: 'feedbacks' });

// Wastage Relationships
Wastage.hasMany(WastageItem, { foreignKey: 'wastageId', as: 'items' });
WastageItem.belongsTo(Wastage, { foreignKey: 'wastageId' });
WastageItem.belongsTo(RawMaterial, { foreignKey: 'rawMaterialId' });
WastageItem.belongsTo(Item, { foreignKey: 'itemId' });



module.exports = {
    sequelize,
    Category,
    Item,
    Order,
    OrderItem,
    User,
    Variant,
    Addon,
    Table,
    Tax,
    Discount,
    Setting,
    Tenant,
    AddonGroup,
    VariationGroup,
    ItemAddonGroup,
    ItemVariationGroup,
    RawMaterial,
    Recipe,
    RecipeIngredient,
    Supplier,
    Purchase,
    PurchaseItem,
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseReturn,
    PurchaseReturnItem,
    Outlet,
    Aggregator,
    SpecialNote,
    PosDevice,
    Expense,
    ExpenseCategory,
    Withdrawal,
    WithdrawalCategory,
    CashTopUp,
    CashTopUpCategory,
    Customer,
    LoyaltyConfig,
    LoyaltyTier,
    CustomerLoyalty,
    LoyaltyTransaction,
    LoyaltyReward,
    GiftCard,
    GiftCardTransaction,
    Feedback,
    Subscription,
    Wastage,
    WastageItem
};



