/**
 * @fileoverview Product controller for managing product-related operations.
 * Coordinates between product model, views, and handles user interactions.
 */

import { BaseController } from "./BaseController.js";
import { LoadingManager, ProductSortingManager } from "./models.js";

/**
 * Controller for managing product-related operations.
 * Coordinates between product model, views, and handles user interactions.
 * @class
 * @extends BaseController
 */
export class ProductController extends BaseController {
  /**
   * Creates a new ProductController instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {ProductModel} [options.model] - Product model instance
   * @param {ProductTableView} [options.tableView] - Product table view instance
   * @param {StoreDetailsView} [options.detailsView] - Store details view instance
   * @param {StoreModel} [options.storeModel] - Store model instance
   * @param {ProductsSearchView} [options.searchView] - Product search view instance
   * @param {ToastManager} [options.toast] - Toast manager instance
   */
  constructor({
    model,
    tableView,
    detailsView,
    storeModel,
    searchView,
    toast,
  } = {}) {
    super();
    this.model = model;
    this.tableView = tableView;
    this.detailsView = detailsView;
    this.storeModel = storeModel;
    this.searchView = searchView;
    this.toast = toast;
    this.currentProducts = [];
    this.currentStatus = null;
    this.currentSearch = "";

    this.sortingManager = new ProductSortingManager(
      this.tableView,
      this.detailsView,
    );

    this.subscribe(this.model, async (e) => {
      if (e?.type === "productsLoaded") {
        this.currentProducts = e.products || [];

        this.sortingManager.updateProducts(this.currentProducts);

        const store = this.storeModel.getSelectedStore();
        if (
          store &&
          (this.currentStatus ||
            (this.currentSearch && this.currentSearch.length))
        ) {
          const all = await this.model.api.getProducts(store.id, {});
          this.detailsView.setCounts(this.model.getCounts(all));
        } else {
          this.detailsView.setCounts(
            this.model.getCounts(this.currentProducts),
          );
        }
      }
    });

    this.subscribe(this.storeModel, async (e) => {
      if (e?.type === "storeSelected" && e.store) {
        this.sortingManager.resetSort();
        await this.model.loadProducts(e.store.id, {});
      }
      if (e?.type === "selectionCleared") {
        await this.model.loadProducts(null, {});
        this.tableView.clear();
        this.detailsView.setCounts({
          ALL: 0,
          OK: 0,
          STORAGE: 0,
          OUT_OF_STOCK: 0,
        });
        this.sortingManager.resetSort();
      }
    });

    if (this.searchView) {
      this.searchView.onSearch = async (term) => {
        const store = this.storeModel.getSelectedStore();
        if (!store) return;
        this.currentSearch = term || "";
        const filters = {};
        if (this.currentSearch) filters.search = this.currentSearch;
        if (this.currentStatus) filters.status = this.currentStatus;
        await this.model.loadProducts(store.id, filters);
      };
    }

    this.detailsView.bindStatusFilters((status) =>
      this._onStatusFilter(status),
    );
    this.tableView.bindRowActions(
      (id) => this._onEditProduct(id),
      (id) => this._onDeleteProduct(id),
    );
  }

  /**
   * Handles filtering by product status and reloads products accordingly.
   * @private
   * @param {("OK"|"STORAGE"|"OUT_OF_STOCK"|null)} status - Status filter or null for all
   * @returns {Promise<void>}
   */
  async _onStatusFilter(status) {
    this.setLoading(true);
    try {
      this.currentStatus = status;
      const store = this.storeModel.getSelectedStore();
      if (!store) return;
      const filters = {};
      if (this.currentSearch) filters.search = this.currentSearch;
      if (this.currentStatus) filters.status = this.currentStatus;
      await this.model.loadProducts(store.id, filters);
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Toggles loading state on the product table view container.
   * @param {boolean} loading - Whether the view should show loading state
   * @returns {void}
   */
  setLoading(loading) {
    if (this.tableView?.container) {
      LoadingManager.setLoading(this.tableView.container, loading);
    }
  }

  /**
   * Attaches a modal view for product creation/editing.
   * @param {ProductModalView} modalView - Modal view instance to attach
   */
  attachModal(modalView) {
    this.modalView = modalView;
    if (!this.modalView) return;
    this.modalView.bindSubmit(async ({ data, isEdit, id }) => {
      const store = this.storeModel.getSelectedStore();
      if (!store) {
        this.toast?.error?.(
          "Please select a store first before adding products.",
        );
        return;
      }
      try {
        if (isEdit && id) {
          await this.model.api.updateProduct(id, {
            ...data,
            Store_ID: store.id,
          });
          this.toast?.success?.("Product successfully updated");
        } else {
          await this.model.api.createProduct({ ...data, Store_ID: store.id });
          this.toast?.success?.("Product successfully created");
        }
        const filters = {};
        if (this.currentSearch) filters.search = this.currentSearch;
        if (this.currentStatus) filters.status = this.currentStatus;
        await this.model.loadProducts(store.id, filters);
        this.modalView.close();
      } catch (e) {
        this.toast?.error?.("Failed to save product. Please try again.");
      }
    });
  }

  /**
   * Opens the product creation modal.
   */
  openCreateProduct() {
    this.modalView?.openCreate();
  }

  /**
   * Opens edit modal for a given product id if present in current list.
   * @private
   * @param {string|number} productId - Product identifier
   * @returns {void}
   */
  _onEditProduct(productId) {
    const product = this.currentProducts.find(
      (p) => String(p.ID) === String(productId),
    );
    if (product) this.modalView?.openEdit(product);
  }

  /**
   * Requests deletion of the product and refreshes the list on success.
   * Shows a confirmation dialog before deleting.
   * @private
   * @param {string|number} productId - Product identifier
   * @returns {void}
   */
  _onDeleteProduct(productId) {
    const product = this.currentProducts.find(
      (p) => String(p.ID) === String(productId),
    );
    if (!product) return;
    if (typeof window !== "undefined" && window.confirmationDialog) {
      window.confirmationDialog.show(
        "Do you want delete this product?",
        async () => {
          try {
            await this.model.api.deleteProduct(productId);
            const store = this.storeModel.getSelectedStore();
            if (store) {
              const filters = {};
              if (this.currentSearch) filters.search = this.currentSearch;
              if (this.currentStatus) filters.status = this.currentStatus;
              await this.model.loadProducts(store.id, filters);
            }
            this.toast?.success?.("Product successfully deleted");
          } catch (e) {
            this.toast?.error?.("Failed to delete product. Please try again.");
          }
        },
      );
    }
  }
}
