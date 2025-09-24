using com.sap.learning as db from '../db/schema';

service StoreService @(path: '/root') {
    entity Stores as projection on db.Stores;
    entity Products as projection on db.Products;
    entity ProductComments as projection on db.ProductComments;
}