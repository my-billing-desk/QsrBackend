const sequelize = require('../config/database');
const Category = require('./Category');
const Item = require('./Item');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const User = require('./User');
const Variant = require('./Variant');
const Addon = require('./Addon');
const Aggregator = require('./Aggregator');
const Tax = require('./Tax');
const SpecialNote = require('./SpecialNote');

const Discount = require('./Discount');
const Setting = require('./Setting');
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

module.exports = {
    sequelize,
    Category,
    Item,
    Order,
    OrderItem,
    User,
    Variant,
    Addon,
    Tax,
    Discount,
    Setting,
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
    PurchaseReturn,
    PurchaseReturnItem,
    Outlet,
    Aggregator,
    SpecialNote
};
