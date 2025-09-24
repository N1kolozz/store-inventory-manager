/**
 * @fileoverview Main application controller that orchestrates the entire MVC system.
 * Initializes all models, views, controllers, and manages application lifecycle.
 */

import { StoreController } from "./StoreController.js";
import { ProductController } from "./ProductController.js";
import { ToastManager } from "./components/toast.js";
import {
  ApiService,
  CONFIG,
  ConfirmationDialog,
  URLRouter,
  ScrollbarManager,
  StoreModel,
  ProductModel,
} from "./models.js";
import {
  StoreListView,
  StoreDetailsView,
  StoreSearchView,
  ProductTableView,
  ProductsSearchView,
  ProductModalView,
  StoreModalView,
} from "./views.js";

/**
 * Main application controller that orchestrates the entire MVC system.
 * Initializes all models, views, controllers, and manages application lifecycle.
 * @class
 */
export class AppController {
  /**
   * Creates a new AppController instance and initializes the MVC architecture.
   * Sets up all models, views, controllers, and their interconnections.
   * @constructor
   * @returns {AppController}
   */
  constructor() {
    this.toast = new ToastManager();
    this.confirm = new ConfirmationDialog();

    this.storeModel = new StoreModel({ api: ApiService, toast: this.toast });
    this.productModel = new ProductModel({
      api: ApiService,
      toast: this.toast,
    });

    this.storeListView = new StoreListView({ container: ".stores-items" });
    this.storeDetailsView = new StoreDetailsView();
    this.storeSearchView = new StoreSearchView();
    this.productTableView = new ProductTableView();
    this.productsSearchView = new ProductsSearchView();
    this.productModalView = new ProductModalView();
    this.storeModalView = new StoreModalView();

    this.router = new URLRouter({
      onNavigateStore: async (id) =>
        this.storeController.selectStore(id, false),
    });

    this.storeController = new StoreController({
      model: this.storeModel,
      listView: this.storeListView,
      detailsView: this.storeDetailsView,
      searchView: this.storeSearchView,
      router: this.router,
      toast: this.toast,
    });
    this.storeController.attachModal(this.storeModalView);

    this.productController = new ProductController({
      model: this.productModel,
      tableView: this.productTableView,
      detailsView: this.storeDetailsView,
      storeModel: this.storeModel,
      searchView: this.productsSearchView,
      toast: this.toast,
    });
    this.productController.attachModal(this.productModalView);

    if (typeof window !== "undefined") {
      window.toastManager = this.toast;
      window.confirmationDialog = this.confirm;
      window.urlRouter = this.router;
      window.CONFIG = CONFIG;
      window.ApiService = ApiService;
    }

    const createStoreButton = document.querySelector(
      ".store-sidebar__footer-btn",
    );
    createStoreButton?.addEventListener("click", () =>
      this.storeController.openCreateStore(),
    );

    const createProductButton = document.querySelector(
      ".store-details-section__footer-btn:not(.delete-btn)",
    );
    createProductButton?.addEventListener("click", () =>
      this.productController.openCreateProduct(),
    );

    const deleteStoreButton = document.querySelector(
      ".store-details-section__footer-btn.delete-btn",
    );
    deleteStoreButton?.addEventListener("click", () =>
      this.storeController.deleteSelectedStore(),
    );

    this.storeListScrollbar = new ScrollbarManager(".store-sidebar");
    this.productsScrollbar = new ScrollbarManager(".products-container");
  }

  /**
   * Initializes the application by starting the store controller and handling initial routing.
   * @async
   * @returns {Promise<void>} Resolves when initial route is handled
   */
  async init() {
    await this.storeController.init();
    await this.router.handleRouteChange();
  }
}
