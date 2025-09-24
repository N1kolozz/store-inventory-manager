/**
 * @fileoverview Store controller for managing store-related operations.
 * Coordinates between store model, views, and handles user interactions.
 */

import { BaseController } from "./BaseController.js";
import { LoadingManager } from "./models.js";

/**
 * Controller for managing store-related operations.
 * Coordinates between store model, views, and handles user interactions.
 * @class
 * @extends BaseController
 */
export class StoreController extends BaseController {
  /**
   * Creates a new StoreController instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {StoreModel} [options.model] - Store model instance
   * @param {StoreListView} [options.listView] - Store list view instance
   * @param {StoreDetailsView} [options.detailsView] - Store details view instance
   * @param {StoreSearchView} [options.searchView] - Store search view instance
   * @param {URLRouter} [options.router] - URL router instance
   * @param {ToastManager} [options.toast] - Toast manager instance
   */
  constructor({
    model,
    listView,
    detailsView,
    searchView,
    router,
    toast,
  } = {}) {
    super();
    this.model = model;
    this.listView = listView;
    this.detailsView = detailsView;
    this.searchView = searchView;
    this.router = router;
    this.toast = toast;
    this.modalView = null;

    this._bindViewEvents();
    this.subscribe(this.model, (e) => this._onModelEvent(e));
  }

  /**
   * Attaches a modal view for store creation/editing.
   * @param {StoreModalView} modalView - Modal view instance to attach
   */
  attachModal(modalView) {
    this.modalView = modalView;
    if (!this.modalView) return;
    this.modalView.bindSubmit(async ({ data, isEdit, id }) => {
      try {
        if (isEdit && id) {
          await this.model.api.updateStore(id, data);
          await this.model.loadStores();
          await this.selectStore(id, true);
          this.toast?.success?.("Store successfully updated");
        } else {
          const created = await this.model.api.createStore(data);
          await this.model.loadStores();
          let newId = created?.ID;
          if (!newId) {
            const match = this.model
              .getStores()
              .find((s) => s.Name === data.Name && s.Address === data.Address);
            newId = match?.id;
          }
          if (newId) await this.selectStore(newId, true);
          this.toast?.success?.("Store successfully created");
        }
        this.modalView.close();
      } catch (e) {
        this.toast?.error?.("Failed to save store. Please try again.");
      }
    });
  }

  /**
   * Opens the store creation modal dialog.
   * Sets up the form in create mode.
   * @public
   * @returns {void}
   */
  openCreateStore() {
    this.modalView?.openCreate();
  }

  /**
   * Opens the store editing modal for the currently selected store.
   * Does nothing if no store is selected.
   * @public
   * @returns {void}
   */
  openEditSelectedStore() {
    const store = this.model.getSelectedStore();
    if (store) this.modalView?.openEdit(store);
  }

  /**
   * Deletes the currently selected store after user confirmation.
   * @async
   */
  /**
   * Deletes the currently selected store after user confirmation.
   * Prompts user via confirmation dialog before proceeding.
   * @public
   * @returns {Promise<void>}
   */
  async deleteSelectedStore() {
    const store = this.model.getSelectedStore();
    if (!store) return;
    if (typeof window !== "undefined" && window.confirmationDialog) {
      window.confirmationDialog.show(
        "Do you want delete this store",
        async () => {
          try {
            await this.model.deleteStore(store.id);
            window.history.pushState({}, "", "#");
            this.router?.handleRouteChange();
            this.toast?.success?.("Store successfully deleted");
          } catch (e) {
            this.toast?.error?.("Failed to delete store. Please try again.");
          }
        },
      );
    }
  }

  /**
   * Binds view event handlers for list and search interactions.
   * Internal helper to wire up UI callbacks.
   * @private
   * @returns {void}
   */
  _bindViewEvents() {
    if (this.listView) {
      this.listView.onStoreClick = async (id, meta) => {
        await this.selectStore(id, true);
      };
    }
    if (this.searchView) {
      this.searchView.onSearch = async (term) => {
        this.setLoading(true);
        try {
          await this.model.searchStores(term);
          this.listView.render(this.model.getStores());
          const selected = this.model.getSelectedStore();
          if (selected) this.listView.highlightById(selected.id);
        } finally {
          this.setLoading(false);
        }
      };
    }
  }

  /**
   * Initializes the store controller by loading stores and rendering the list.
   * @async
   */
  async init() {
    this.setLoading(true);
    try {
      await this.model.loadStores();
      this.listView.render(this.model.getStores());
      this.detailsView.clear();
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Toggles loading state on the store list view container.
   * @param {boolean} loading - Whether the view should show loading state
   * @returns {void}
   */
  setLoading(loading) {
    if (this.listView?.container) {
      LoadingManager.setLoading(this.listView.container, loading);
    }
  }

  /**
   * Selects a store by ID and updates the UI.
   * @param {string} id - ID of the store to select
   * @param {boolean} [updateUrl=false] - Whether to update the browser URL
   * @returns {boolean} True if store was successfully selected, false otherwise
   */
  /**
   * Selects a store by ID and updates the UI.
   * If updateUrl is true, delegates to the router to update location hash.
   * Ensures stores are loaded before attempting selection on direct navigation.
   * @param {string|number} id - ID of the store to select
   * @param {boolean} [updateUrl=false] - Whether to update the browser URL
   * @returns {Promise<boolean>} True if store was successfully selected, false otherwise
   */
  async selectStore(id, updateUrl = false) {
    if (updateUrl && this.router) {
      // Use router to navigate and update URL
      return this.router.navigateToStore(id, true);
    } else {
      // Direct selection without URL update
      // If stores aren't loaded yet, try to load them first
      if (!this.model.getStores().length) {
        try {
          await this.model.loadStores();
        } catch (error) {
          console.error('Failed to load stores:', error);
          return false;
        }
      }
      
      if (this.model.selectStoreById(id)) {
        const store = this.model.getSelectedStore();
        this.listView.highlightById(store.id);
        this.detailsView.render(store);
        return true;
      }
      return false;
    }
  }

  /**
   * Handles model events to keep the views in sync with store state.
   * @private
   * @param {{type:string, store?:object}} e - Model event payload
   * @returns {Promise<void>}
   */
  async _onModelEvent(e) {
    switch (e?.type) {
      case "storesLoaded":
        this.listView.render(this.model.getStores());
        break;
      case "storeSelected":
        if (e.store) {
          this.listView.highlightById(e.store.id);
          this.detailsView.render(e.store);
        }
        break;
      case "selectionCleared":
        this.detailsView.clear();
        break;
    }
  }
}
