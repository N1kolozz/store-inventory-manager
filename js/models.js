/**
 * @fileoverview Models layer for the vanilla JavaScript SPA.
 * Contains data models, API services, utilities, and business logic.
 * Pure data/state layer with no DOM operations.
 */

// ============================================================================
// CONFIGURATION AND CONSTANTS
// ============================================================================

/**
 * Application configuration object containing API endpoints and messages.
 * @constant {Object}
 * @property {string} API_ROOT - Base URL for API requests
 * @property {Object} ENDPOINTS - API endpoint paths
 * @property {Object} MESSAGES - User-facing messages for various operations
 */
export const CONFIG = {
  API_ROOT: "http://localhost:4004/v2/root",
  ENDPOINTS: {
    STORES: "Stores",
    PRODUCTS: "Products",
  },
  MESSAGES: {
    STORE_CREATED: "Store successfully created",
    STORE_DELETED: "Store successfully deleted",
    PRODUCT_CREATED: "Product successfully created",
    PRODUCT_DELETED: "Product successfully deleted",
    ERROR_LOADING: "Failed to load data. Please try again.",
    ERROR_CREATING: "Failed to create item. Please try again.",
    ERROR_DELETING: "Failed to delete item. Please try again.",
    CONFIRM_DELETE_STORE: "Do you want delete this store",
    CONFIRM_DELETE_PRODUCT: "Do you want delete this product?",
  },
};

// ============================================================================
// BASE CLASSES AND PATTERNS
// ============================================================================

/**
 * Base model class implementing the observer pattern for data change notifications.
 * Provides subscription mechanism for views to listen to model changes.
 * @class
 */
export class BaseModel {
  /**
   * Creates a new BaseModel instance.
   * Initializes the listeners set for the observer pattern.
   * @constructor
   */
  constructor() {
    this._listeners = new Set();
  }

  /**
   * Subscribes a listener function to model changes.
   * @param {Function} listener - Callback function to be called on model changes
   * @returns {() => boolean} Unsubscribe function to remove the listener
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notifies all subscribed listeners with the provided payload.
   * @param {*} payload - Data to send to all listeners
   */
  notify(payload) {
    for (const listener of this._listeners) {
      listener(payload);
    }
  }
}

// ============================================================================
// API SERVICE LAYER
// ============================================================================

/**
 * Static API service class for handling HTTP requests to the backend.
 * Provides CRUD operations for stores and products with proper error handling.
 * @class
 */
export class ApiService {
  /**
   * Makes an HTTP request with proper headers and error handling.
   * @static
   * @async
   * @param {string} url - The URL to make the request to
   * @param {Object} [options={}] - Fetch options (method, body, headers, etc.)
   * @returns {Promise<Object|null>} Parsed JSON response or null for 204 responses
   * @throws {Error} Throws error if HTTP request fails
   */
  static async request(url, options = {}) {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  /**
   * Retrieves stores from the API with optional filtering and ordering.
   * Supports text search across Name, Address, Email fields and numeric search for FloorArea.
   * @static
   * @async
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.search] - Search term for filtering stores
   * @param {string} [filters.orderBy] - Field to order results by
   * @returns {Promise<Array>} Array of store objects
   * @throws {Error} Throws error if API request fails
   */
  static async getStores(filters = {}) {
    let url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}`;
    const params = new URLSearchParams();

    if (filters.search) {
      const searchTerm = String(filters.search).toLowerCase();
      const isNumeric = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));
      let searchFilter = `(substringof(tolower('${searchTerm}'), tolower(Name)) eq true) or (substringof(tolower('${searchTerm}'), tolower(Address)) eq true) or (substringof(tolower('${searchTerm}'), tolower(Email)) eq true)`;
      if (isNumeric) {
        const numericValue = parseFloat(searchTerm);
        searchFilter += ` or (FloorArea eq ${numericValue})`;
      }
      params.append("$filter", searchFilter);
    }

    if (filters.orderBy) params.append("$orderby", filters.orderBy);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await this.request(url);
    return response.value || response.d?.results || response;
  }

  /**
   * Creates a new store via API.
   * @static
   * @async
   * @param {Object} storeData - Store data object
   * @param {string} storeData.Name - Store name
   * @param {string} storeData.Email - Store email
   * @param {string} storeData.PhoneNumber - Store phone number
   * @param {string} storeData.Address - Store address
   * @param {string} storeData.Established - Store establishment date (ISO string)
   * @param {number} storeData.FloorArea - Store floor area in square meters
   * @returns {Promise<Object>} Created store object
   * @throws {Error} Throws error if API request fails
   */
  static async createStore(storeData) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}`;
    return await this.request(url, {
      method: "POST",
      body: JSON.stringify(storeData),
    });
  }

  /**
   * Updates an existing store via API.
   * @static
   * @async
   * @param {string} storeId - ID of the store to update
   * @param {Object} storeData - Updated store data
   * @returns {Promise<Object>} Updated store object
   * @throws {Error} Throws error if API request fails
   */
  static async updateStore(storeId, storeData) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}('${storeId}')`;
    return await this.request(url, {
      method: "PUT",
      body: JSON.stringify(storeData),
    });
  }

  /**
   * Deletes a store via API.
   * @static
   * @async
   * @param {string} storeId - ID of the store to delete
   * @returns {Promise<null>} Returns null on successful deletion
   * @throws {Error} Throws error if API request fails
   */
  static async deleteStore(storeId) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}('${storeId}')`;
    return await this.request(url, { method: "DELETE" });
  }

  /**
   * Retrieves products from the API with optional filtering by store and search criteria.
   * Supports text search across multiple fields and numeric search for Price and Rating.
   * @static
   * @async
   * @param {string|null} [storeId=null] - ID of the store to get products from, or null for all products
   * @param {Object} [filters={}] - Filter options
   * @param {string} [filters.search] - Search term for filtering products
   * @param {string} [filters.status] - Product status filter (OK, STORAGE, OUT_OF_STOCK)
   * @param {string} [filters.orderBy] - Field to order results by
   * @returns {Promise<Array>} Array of product objects
   * @throws {Error} Throws error if API request fails
   */
  static async getProducts(storeId = null, filters = {}) {
    let url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}`;
    const params = new URLSearchParams();

    if (storeId) {
      url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}('${storeId}')/Products`;
    }

    if (filters.search) {
      const searchTerm = String(filters.search).toLowerCase();
      const isNumeric = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));
      let searchFilter = `(substringof(tolower('${searchTerm}'), tolower(Name)) eq true) or (substringof(tolower('${searchTerm}'), tolower(Specs)) eq true) or (substringof(tolower('${searchTerm}'), tolower(SupplierInfo)) eq true) or (substringof(tolower('${searchTerm}'), tolower(MadeIn)) eq true) or (substringof(tolower('${searchTerm}'), tolower(ProductionCompanyName)) eq true)`;
      if (isNumeric) {
        const numericValue = parseFloat(searchTerm);
        searchFilter += ` or (Price_amount eq ${numericValue}) or (Rating eq ${numericValue})`;
      }
      params.append("$filter", searchFilter);
    }

    if (filters.status) {
      const statusFilter = `Status eq '${filters.status}'`;
      if (params.get("$filter")) {
        params.set(
          "$filter",
          `(${params.get("$filter")}) and (${statusFilter})`,
        );
      } else {
        params.append("$filter", statusFilter);
      }
    }

    if (filters.orderBy) params.append("$orderby", filters.orderBy);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await this.request(url);
    return response.d?.results || response.value || response;
  }

  /**
   * Creates a new product via API.
   * @static
   * @async
   * @param {Object} productData - Product data object
   * @param {string} productData.Name - Product name
   * @param {number} productData.Price_amount - Product price amount
   * @param {string} productData.Price_currency - Product price currency
   * @param {string} productData.Specs - Product specifications
   * @param {number} productData.Rating - Product rating (1-5)
   * @param {string} productData.SupplierInfo - Supplier information
   * @param {string} productData.MadeIn - Country of origin
   * @param {string} productData.ProductionCompanyName - Production company name
   * @param {string} productData.Status - Product status
   * @param {string} productData.Store_ID - ID of the store this product belongs to
   * @returns {Promise<Object>} Created product object
   * @throws {Error} Throws error if API request fails
   */
  static async createProduct(productData) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}`;
    return await this.request(url, {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  /**
   * Updates an existing product via API.
   * @static
   * @async
   * @param {string} productId - ID of the product to update
   * @param {Object} productData - Updated product data
   * @returns {Promise<Object>} Updated product object
   * @throws {Error} Throws error if API request fails
   */
  static async updateProduct(productId, productData) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}('${productId}')`;
    return await this.request(url, {
      method: "PUT",
      body: JSON.stringify(productData),
    });
  }

  /**
   * Deletes a product via API.
   * @static
   * @async
   * @param {string} productId - ID of the product to delete
   * @returns {Promise<null>} Returns null on successful deletion
   * @throws {Error} Throws error if API request fails
   */
  static async deleteProduct(productId) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}('${productId}')`;
    return await this.request(url, { method: "DELETE" });
  }
}

// ============================================================================
// DOMAIN ENTITIES
// ============================================================================

/**
 * Store entity class representing a store in the application.
 * Maps API data to a consistent internal representation.
 * @class
 */
export class Store {
  /**
   * Creates a new Store instance from API data.
   * @constructor
   * @param {Object} storeData - Raw store data from API
   * @param {string} storeData.ID - Store ID
   * @param {string} storeData.Name - Store name
   * @param {string} storeData.Email - Store email
   * @param {string} storeData.PhoneNumber - Store phone number
   * @param {string} storeData.Address - Store address
   * @param {string} storeData.Established - Store establishment date
   * @param {number} storeData.FloorArea - Store floor area in square meters
   */
  constructor(storeData) {
    this.id = storeData.ID;
    this.Name = storeData.Name;
    this.Email = storeData.Email;
    this.PhoneNumber = storeData.PhoneNumber;
    this.Address = storeData.Address;
    this.Established = storeData.Established;
    this.FloorArea = storeData.FloorArea;
  }
}

/**
 * Store model class for managing store data and operations.
 * Extends BaseModel to provide observer pattern functionality.
 * Handles CRUD operations, search, and selection state for stores.
 * @class
 * @extends BaseModel
 */
export class StoreModel extends BaseModel {
  /**
   * Creates a new StoreModel instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {Object} [options.api] - API service instance for making requests
   * @param {Object} [options.toast] - Toast manager for user notifications
   */
  constructor({ api, toast } = {}) {
    super();
    this.api = api;
    this.toast = toast;
    this.stores = [];
    this.selectedId = null;
  }

  /**
   * Loads stores from the API with optional filtering.
   * Notifies observers when stores are loaded.
   * @async
   * @param {Object} [filters={}] - Filter options for the API request
   * @returns {Promise<Array<Store>>} Array of Store instances
   */
  async loadStores(filters = {}) {
    try {
      const storesData = await this.api.getStores(filters);
      this.stores = (storesData || []).map((s) => new Store(s));
      this.notify({ type: "storesLoaded", stores: this.stores });
      return this.stores;
    } catch (e) {
      this.toast?.error?.("Failed to load data. Please try again.");
      return [];
    }
  }

  /**
   * Searches stores by term and reloads the store list.
   * @async
   * @param {string} term - Search term to filter stores
   * @returns {Promise<Array<Store>>} Array of filtered Store instances
   */
  async searchStores(term) {
    const filters = term ? { search: term } : {};
    return this.loadStores(filters);
  }

  /**
   * Creates a new store and reloads the store list.
   * @async
   * @param {Object} storeData - Store data to create
   * @throws {Error} Throws error if creation fails
   */
  async createStore(storeData) {
    await this.api.createStore(storeData);
    await this.loadStores();
  }

  /**
   * Updates an existing store and reloads the store list.
   * @async
   * @param {string} id - ID of the store to update
   * @param {Object} storeData - Updated store data
   * @throws {Error} Throws error if update fails
   */
  async updateStore(id, storeData) {
    await this.api.updateStore(id, storeData);
    await this.loadStores();
  }

  /**
   * Deletes a store and reloads the store list.
   * Clears selection if the deleted store was selected.
   * @async
   * @param {string} id - ID of the store to delete
   * @throws {Error} Throws error if deletion fails
   */
  async deleteStore(id) {
    await this.api.deleteStore(id);
    await this.loadStores();
    if (String(this.selectedId) === String(id)) {
      this.selectedId = null;
      this.notify({ type: "selectionCleared" });
    }
  }

  /**
   * Gets the current list of stores.
   * @returns {Array<Store>} Array of Store instances
   */
  getStores() {
    return this.stores;
  }

  /**
   * Gets the currently selected store.
   * @returns {Store|null} Selected Store instance or null if none selected
   */
  getSelectedStore() {
    return (
      this.stores.find((s) => String(s.id) === String(this.selectedId)) || null
    );
  }

  /**
   * Selects a store by ID and notifies observers.
   * @param {string} id - ID of the store to select
   * @returns {boolean} True if store was found and selected, false otherwise
   */
  selectStoreById(id) {
    const found = this.stores.find((s) => String(s.id) === String(id));
    if (!found) return false;
    this.selectedId = found.id;
    this.notify({ type: "storeSelected", store: found });
    return true;
  }
}

/**
 * Product model class for managing product data and operations.
 * Extends BaseModel to provide observer pattern functionality.
 * Handles product loading, filtering, and status counting.
 * @class
 * @extends BaseModel
 */
export class ProductModel extends BaseModel {
  /**
   * Creates a new ProductModel instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {Object} [options.api] - API service instance for making requests
   * @param {Object} [options.toast] - Toast manager for user notifications
   */
  constructor({ api, toast } = {}) {
    super();
    this.api = api;
    this.toast = toast;
    this.products = [];
    this.currentStoreId = null;
  }

  /**
   * Loads products for a specific store with optional filtering.
   * Notifies observers when products are loaded.
   * @async
   * @param {string|null} storeId - ID of the store to load products for, or null to clear
   * @param {Object} [filters={}] - Filter options for the API request
   * @returns {Promise<Array>} Array of product objects
   */
  async loadProducts(storeId, filters = {}) {
    if (!storeId) {
      this.products = [];
      this.currentStoreId = null;
      this.notify({ type: "productsLoaded", products: [] });
      return [];
    }
    try {
      this.currentStoreId = storeId;
      const list = await this.api.getProducts(storeId, filters);
      this.products = Array.isArray(list) ? list : [];
      this.notify({ type: "productsLoaded", products: this.products, storeId });
      return this.products;
    } catch (e) {
      this.toast?.error?.("Failed to load products");
      return [];
    }
  }

  /**
   * Calculates product counts by status.
   * @param {Array|null} [products=null] - Products array to count, or null to use current products
   * @returns {Object} Object with counts for ALL, OK, STORAGE, and OUT_OF_STOCK
   */
  getCounts(products = null) {
    const arr = products || this.products || [];
    const counts = { ALL: arr.length, OK: 0, STORAGE: 0, OUT_OF_STOCK: 0 };
    arr.forEach((product) => {
      if (counts.hasOwnProperty(product.Status)) counts[product.Status]++;
    });
    return counts;
  }
}

/**
 * Utility class for managing loading states on DOM elements.
 * Provides static methods to show/hide loading indicators.
 * @class
 */
export class LoadingManager {
  /**
   * Sets the loading state of a DOM element by adding/removing CSS classes.
   * @static
   * @param {HTMLElement|null} element - DOM element to set loading state on
   * @param {boolean} isLoading - Whether the element should show loading state
   */
  static setLoading(element, isLoading) {
    if (!element) return;
    if (isLoading) {
      element.classList.add("loading");
    } else {
      element.classList.remove("loading");
    }
  }
}

/**
 * Manages custom scrollbar behavior for DOM elements.
 * Provides auto-hide functionality and custom scrollbar styling.
 * @class
 */
export class ScrollbarManager {
  /**
   * Creates a new ScrollbarManager instance for the specified element.
   * @constructor
   * @param {string|HTMLElement} elementSelector - CSS selector string or DOM element
   */
  constructor(elementSelector) {
    this.element =
      typeof elementSelector === "string"
        ? document.querySelector(elementSelector)
        : elementSelector;
    this.isScrolling = false;
    this.scrollTimeout = null;
    if (this.element) {
      this.hideScrollbar();
      this._boundHandler = this.handleScroll.bind(this);
      this.element.addEventListener("scroll", this._boundHandler);
    }
  }
  /**
   * Handles scroll events to show/hide scrollbar with auto-hide functionality.
   * @private
   */
  handleScroll() {
    if (!this.isScrolling) {
      this.showScrollbar();
      this.isScrolling = true;
    }
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => {
      this.hideScrollbar();
      this.isScrolling = false;
    }, 500);
  }
  /**
   * Shows the scrollbar by setting CSS custom properties.
   */
  showScrollbar() {
    if (this.element) {
      this.element.style.setProperty("--scrollbar-width", "7px");
      this.element.style.setProperty("--scrollbar-opacity", "1");
    }
  }
  /**
   * Hides the scrollbar by reducing opacity via CSS custom properties.
   */
  hideScrollbar() {
    if (this.element) {
      this.element.style.setProperty("--scrollbar-width", "7px");
      this.element.style.setProperty("--scrollbar-opacity", "0.2");
    }
  }
  /**
   * Cleans up event listeners and timeouts.
   * Should be called when the ScrollbarManager is no longer needed.
   */
  dispose() {
    if (this.element && this._boundHandler) {
      this.element.removeEventListener("scroll", this._boundHandler);
    }
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
  }
}


/**
 * Manages confirmation dialogs for user actions.
 * Provides modal dialogs for confirming destructive operations.
 * @class
 */
export class ConfirmationDialog {
  /**
   * Creates a new ConfirmationDialog instance and initializes the dialog.
   * @constructor
   */
  constructor() {
    this.createDialog();
  }
  /**
   * Creates the confirmation dialog DOM structure if it doesn't exist.
   * @private
   */
  createDialog() {
    if (!document.getElementById("confirmationModal")) {
      const dialog = document.createElement("div");
      dialog.id = "confirmationModal";
      dialog.className = "modal-overlay";
      dialog.innerHTML = `
        <div class="modal-container confirmation-modal">
          <div class="modal-header delete-modal-header">
            <img width="20" src="assets/icons/warning-icon.svg" alt="warning-icon">
            <h2 class="modal-title">Warning</h2>
          </div>
          <div class="modal-body">
            <p class="confirmation-message"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="modal-btn modal-btn-confirm">Yes</button>
            <button type="button" class="modal-btn modal-btn-cancel">No</button>
          </div>
        </div>`;
      document.body.appendChild(dialog);
    }
  }
  /**
   * Shows the confirmation dialog with a custom message and callbacks.
   * @param {string} message - Confirmation message to display
   * @param {Function} onConfirm - Callback function to execute on confirmation
   * @param {Function|null} [onCancel=null] - Optional callback function to execute on cancellation
   */
  show(message, onConfirm, onCancel = null) {
    const modal = document.getElementById("confirmationModal");
    const messageEl = modal.querySelector(".confirmation-message");
    const confirmBtn = modal.querySelector(".modal-btn-confirm");
    const cancelBtn = modal.querySelector(".modal-btn-cancel");
    messageEl.textContent = message;
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    const cleanup = () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleBackdropClick);
    };
    const handleConfirm = () => {
      this.hide();
      onConfirm && onConfirm();
      cleanup();
    };
    const handleCancel = () => {
      this.hide();
      onCancel && onCancel();
      cleanup();
    };
    const handleBackdropClick = (e) => {
      if (e.target === modal) handleCancel();
    };
    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleBackdropClick);
  }
  /**
   * Hides the confirmation dialog and restores page scrolling.
   */
  hide() {
    const modal = document.getElementById("confirmationModal");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
}

class NotFoundPageManager {
  constructor() {
    this.isShowing = false;
  }
  show() {
    if (this.isShowing) return;
    this.isShowing = true;
    this.hideMainContent();
    this.create404Page();
  }
  hide() {
    if (!this.isShowing) return;
    this.isShowing = false;
    const notFoundElement = document.getElementById("notFoundPage");
    if (notFoundElement) notFoundElement.remove();
    this.showMainContent();
  }
  hideMainContent() {
    const storeListSection = document.querySelector(".store-sidebar");
    const storeDetailsSection = document.querySelector(
      ".store-details-section",
    );
    if (storeListSection) storeListSection.style.display = "none";
    if (storeDetailsSection) storeDetailsSection.style.display = "none";
  }
  showMainContent() {
    const storeListSection = document.querySelector(".store-sidebar");
    const storeDetailsSection = document.querySelector(
      ".store-details-section",
    );
    if (storeListSection) storeListSection.style.display = "";
    if (storeDetailsSection) storeDetailsSection.style.display = "";
  }
  create404Page() {
    const existing = document.getElementById("notFoundPage");
    if (existing) existing.remove();
    const notFoundPage = document.createElement("div");
    notFoundPage.id = "notFoundPage";
    notFoundPage.className = "not-found-page";
    notFoundPage.innerHTML = `
      <div class="not-found-container">
        <div class="not-found-icon">
          <img src="assets/icons/warning-icon.svg" alt="404-icon">
        </div>
        <h1 class="not-found-title">Page Not Found</h1>
        <p class="not-found-message">The page you're looking for doesn't exist.</p>
        <button class="not-found-btn" id="goToHomeBtn">Go to Home</button>
      </div>`;
    document.body.appendChild(notFoundPage);
    const goToHomeBtn = document.getElementById("goToHomeBtn");
    if (goToHomeBtn)
      goToHomeBtn.addEventListener("click", () => this.goToHome());
  }
  goToHome() {
    window.history.replaceState({}, "", "#");
    if (window.urlRouter) window.urlRouter.handleRouteChange();
    this.hide();
  }
}

/**
 * URL router for handling client-side navigation and routing.
 * Manages browser history and route parsing for the SPA.
 * @class
 */
export class URLRouter {
  /**
   * Creates a new URLRouter instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {Function} [options.onNavigateStore] - Callback for store navigation
   */
  constructor({ onNavigateStore } = {}) {
    this.currentRoute = null;
    this.onNavigateStore = onNavigateStore;
    this.notFoundPageManager = new NotFoundPageManager();
    window.addEventListener("popstate", () => this.handleRouteChange());
  }
  /**
   * Parses the current URL hash to determine the route type and parameters.
   * @returns {Object|null} Route object with type and parameters, or null for home route
   */
  parseCurrentURL() {
    const hash = window.location.hash;
    if (hash?.startsWith("#store/")) {
      const storeId = decodeURIComponent(hash.replace("#store/", ""));
      return { type: "store", id: storeId };
    }
    if (hash && hash !== "#" && hash !== "#/")
      return { type: "invalid", path: hash };
    return null;
  }
  /**
   * Handles route changes by parsing the URL and executing appropriate actions.
   * @async
   */
  async handleRouteChange() {
    const route = this.parseCurrentURL();
    this.notFoundPageManager.hide();
    if (route?.type === "store") {
      const success = await this.onNavigateStore?.(route.id);
      if (!success) this.show404();
    } else if (route?.type === "invalid") {
      this.show404();
    } else {
      this.currentRoute = null;
    }
  }
  /**
   * Shows the 404 not found page.
   */
  show404() {
    this.notFoundPageManager.show();
    this.currentRoute = { type: "notfound" };
  }
  /**
   * Navigates to a specific store by ID.
   * @param {string} storeId - ID of the store to navigate to
   * @param {boolean} [updateURL=true] - Whether to update the browser URL
   * @returns {boolean} True if navigation was successful
   */
  navigateToStore(storeId, updateURL = true) {
    if (!storeId) return false;
    if (updateURL) {
      const newURL = `#store/${encodeURIComponent(storeId)}`;
      window.history.pushState({ storeId }, "", newURL);
    }
    return this.onNavigateStore?.(storeId) ?? false;
  }
}

/**
 * Form validation utility class with static methods for validating form inputs.
 * Provides comprehensive validation for different field types and form handling.
 * @class
 */
export class FormValidator {
  /**
   * Validates an email address format.
   * @static
   * @param {string} email - Email address to validate
   * @returns {boolean} True if email format is valid
   */
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates a phone number format.
   * @static
   * @param {string} phone - Phone number to validate
   * @returns {boolean} True if phone format is valid
   */
  static validatePhone(phone) {
    const phoneRegex = /^[\+]?\d[\d\s\-()]{7,}$/;
    return phoneRegex.test((phone || "").toString().replace(/\s/g, ""));
  }

  /**
   * Validates that a value is required (not empty).
   * @static
   * @param {*} value - Value to validate
   * @returns {boolean} True if value is not empty
   */
  static validateRequired(value) {
    return !!value && value.toString().trim().length > 0;
  }

  /**
   * Validates a numeric value with optional min/max constraints.
   * @static
   * @param {*} value - Value to validate as number
   * @param {number|null} [min=null] - Minimum allowed value
   * @param {number|null} [max=null] - Maximum allowed value
   * @returns {boolean} True if value is a valid number within constraints
   */
  static validateNumber(value, min = null, max = null) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  }

  /**
   * Validates an integer value with optional min/max constraints.
   * @static
   * @param {*} value - Value to validate as integer
   * @param {number|null} [min=null] - Minimum allowed value
   * @param {number|null} [max=null] - Maximum allowed value
   * @returns {boolean} True if value is a valid integer within constraints
   */
  static validateInteger(value, min = null, max = null) {
    const num = parseInt(value);
    if (isNaN(num)) return false;
    if (!Number.isInteger(num)) return false;
    if (min !== null && num < min) return false;
    if (max !== null && num > max) return false;
    return true;
  }

  /**
   * Validates a date string and ensures it's not in the future.
   * @static
   * @param {string} dateString - Date string to validate
   * @returns {boolean} True if date is valid and not in the future
   */
  static validateDate(dateString) {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && date <= new Date();
  }

  static showFieldError(field, message) {
    this.clearFieldError(field);
    field.classList.add("error");
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    field.parentNode.appendChild(errorDiv);
  }

  static clearFieldError(field) {
    field.classList.remove("error");
    const errorMessage = field.parentElement?.querySelector(".error-message");
    if (errorMessage) errorMessage.remove();
    delete field.dataset.errorMessage;
  }

  static clearAllErrors(form) {
    const errorFields = form.querySelectorAll(".form-input.error");
    errorFields.forEach((field) => this.clearFieldError(field));
    const messages = form.querySelectorAll(".error-message");
    messages.forEach((message) => message.remove());
  }

  static setupRealTimeValidation(form) {
    if (!form) return;
    const fields = form.querySelectorAll(".form-input");
    fields.forEach((field) => {
      const name = field.name;
      field.addEventListener("input", () => {
        if (field.classList.contains("error")) {
          this.validateFieldRealTime(field, name);
        }
      });
      field.addEventListener("focus", () => {
        const msg = field.parentElement?.querySelector(".error-message");
        if (field.classList.contains("error") && msg) msg.classList.add("show");
      });
      field.addEventListener("blur", () => {
        const msg = field.parentElement?.querySelector(".error-message");
        if (msg) msg.classList.remove("show");
        if (field.value.trim()) this.validateFieldRealTime(field, name);
      });
    });
  }

  static validateFieldRealTime(field, fieldName) {
    const value = field.value.trim();
    this.clearFieldError(field);
    switch (fieldName) {
      case "storeEmail":
        return this.validateEmail(value);
      case "storePhone":
        return this.validatePhone(value);
      case "storeEstablished":
        return this.validateDate(value);
      case "storeFloorArea":
        return this.validateInteger(value, 1);
      case "productPrice":
        return this.validateNumber(value, 0);
      case "productRating":
        return this.validateInteger(value, 1, 5);
      case "storeName":
      case "storeAddress":
      case "productName":
      case "productSpecs":
      case "productSupplierInfo":
      case "productCountryOfOrigin":
      case "productCompany":
        return value.length > 0;
      default:
        return true;
    }
  }

  static validateStoreForm(form) {
    const errors = [];
    this.clearAllErrors(form);
    const get = (sel) => form.querySelector(sel);
    let firstInvalid = null;

    const nameField = get('[name="storeName"]');
    if (!this.validateRequired(nameField.value)) {
      this.showFieldError(nameField, "Store name is required");
      errors.push("name");
      if (!firstInvalid) firstInvalid = nameField;
    }

    const emailField = get('[name="storeEmail"]');
    if (!this.validateRequired(emailField.value)) {
      this.showFieldError(emailField, "Email is required");
      errors.push("email");
      if (!firstInvalid) firstInvalid = emailField;
    } else if (!this.validateEmail(emailField.value)) {
      this.showFieldError(emailField, "Please enter a valid email address");
      errors.push("email");
      if (!firstInvalid) firstInvalid = emailField;
    }

    const phoneField = get('[name="storePhone"]');
    if (!this.validateRequired(phoneField.value)) {
      this.showFieldError(phoneField, "Phone number is required");
      errors.push("phone");
      if (!firstInvalid) firstInvalid = phoneField;
    } else if (!this.validatePhone(phoneField.value)) {
      this.showFieldError(phoneField, "Please enter a valid phone number");
      errors.push("phone");
      if (!firstInvalid) firstInvalid = phoneField;
    }

    const addressField = get('[name="storeAddress"]');
    if (!this.validateRequired(addressField.value)) {
      this.showFieldError(addressField, "Address is required");
      errors.push("address");
      if (!firstInvalid) firstInvalid = addressField;
    }

    const establishedField = get('[name="storeEstablished"]');
    if (!this.validateRequired(establishedField.value)) {
      this.showFieldError(establishedField, "Establishment date is required");
      errors.push("established");
      if (!firstInvalid) firstInvalid = establishedField;
    } else if (!this.validateDate(establishedField.value)) {
      this.showFieldError(establishedField, "Please enter a valid date");
      errors.push("established");
      if (!firstInvalid) firstInvalid = establishedField;
    }

    const floorAreaField = get('[name="storeFloorArea"]');
    if (!this.validateRequired(floorAreaField.value)) {
      this.showFieldError(floorAreaField, "Floor area is required");
      errors.push("floorArea");
      if (!firstInvalid) firstInvalid = floorAreaField;
    } else if (!this.validateInteger(floorAreaField.value, 1)) {
      this.showFieldError(
        floorAreaField,
        "Floor area must be a positive number",
      );
      errors.push("floorArea");
      if (!firstInvalid) firstInvalid = floorAreaField;
    }

    if (errors.length > 0 && firstInvalid) {
      firstInvalid.focus();
      const msg = firstInvalid.parentElement?.querySelector(".error-message");
      if (msg) msg.classList.add("show");
    }
    return errors.length === 0;
  }

  static validateProductForm(form) {
    const errors = [];
    this.clearAllErrors(form);
    const get = (sel) => form.querySelector(sel);
    let firstInvalid = null;

    const nameField = get('[name="productName"]');
    if (!this.validateRequired(nameField.value)) {
      this.showFieldError(nameField, "Product name is required");
      errors.push("name");
      if (!firstInvalid) firstInvalid = nameField;
    }

    const priceField = get('[name="productPrice"]');
    if (!this.validateRequired(priceField.value)) {
      this.showFieldError(priceField, "Price is required");
      errors.push("price");
      if (!firstInvalid) firstInvalid = priceField;
    } else if (!this.validateNumber(priceField.value, 0)) {
      this.showFieldError(priceField, "Price must be a valid positive number");
      errors.push("price");
      if (!firstInvalid) firstInvalid = priceField;
    }

    const specsField = get('[name="productSpecs"]');
    if (!this.validateRequired(specsField.value)) {
      this.showFieldError(specsField, "Specs are required");
      errors.push("specs");
      if (!firstInvalid) firstInvalid = specsField;
    }

    const ratingField = get('[name="productRating"]');
    if (!this.validateRequired(ratingField.value)) {
      this.showFieldError(ratingField, "Rating is required");
      errors.push("rating");
      if (!firstInvalid) firstInvalid = ratingField;
    } else if (!this.validateInteger(ratingField.value, 1, 5)) {
      this.showFieldError(
        ratingField,
        "Rating must be a number between 1 and 5",
      );
      errors.push("rating");
      if (!firstInvalid) firstInvalid = ratingField;
    }

    const supplierField = get('[name="productSupplierInfo"]');
    if (!this.validateRequired(supplierField.value)) {
      this.showFieldError(supplierField, "Supplier info is required");
      errors.push("supplier");
      if (!firstInvalid) firstInvalid = supplierField;
    }

    const countryField = get('[name="productCountryOfOrigin"]');
    if (!this.validateRequired(countryField.value)) {
      this.showFieldError(countryField, "Country of origin is required");
      errors.push("country");
      if (!firstInvalid) firstInvalid = countryField;
    }

    const companyField = get('[name="productCompany"]');
    if (!this.validateRequired(companyField.value)) {
      this.showFieldError(companyField, "Production company is required");
      errors.push("company");
      if (!firstInvalid) firstInvalid = companyField;
    }

    if (errors.length > 0 && firstInvalid) {
      firstInvalid.focus();
      const msg = firstInvalid.parentElement?.querySelector(".error-message");
      if (msg) msg.classList.add("show");
    }
    return errors.length === 0;
  }
}

export class ProductSortingManager {
  constructor(productsTableManager, storeDetailsManager) {
    this.productsTableManager = productsTableManager;
    this.storeDetailsManager = storeDetailsManager;
    this.currentSortField = null;
    this.currentSortDirection = null;
    this.currentProducts = [];
    this.initSortingListeners();
  }

  initSortingListeners() {
    const sortableHeaders = document.querySelectorAll(
      ".products-table__header.sortable",
    );
    sortableHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        const sortField = header.dataset.sortField;
        this.handleSort(sortField, header);
      });
    });
  }

  handleSort(sortField, clickedHeader) {
    let newDirection = "asc";
    if (this.currentSortField === sortField) {
      newDirection = this.currentSortDirection === "asc" ? "desc" : "asc";
    }
    this.clearSortIndicators();
    this.currentSortField = sortField;
    this.currentSortDirection = newDirection;
    this.updateSortIndicator(clickedHeader, newDirection);
    this.sortAndDisplayProducts();
  }

  clearSortIndicators() {
    const allHeaders = document.querySelectorAll(
      ".products-table__header.sortable",
    );
    allHeaders.forEach((header) => {
      const sortIcon = header.querySelector(".sort-icon");
      if (sortIcon) {
        sortIcon.src = "assets/icons/reverseArrows-icon.svg";
      }
    });
  }

  updateSortIndicator(header, direction) {
    const sortIcon = header.querySelector(".sort-icon");
    if (!sortIcon) return;
    if (direction === "asc") {
      sortIcon.src = "assets/icons/sortingUp-icon.svg";
    } else {
      sortIcon.src = "assets/icons/sortingDown-icon.svg";
    }
  }

  sortProducts(products, sortField, direction) {
    return [...products].sort((a, b) => {
      let valueA = a[sortField];
      let valueB = b[sortField];
      if (sortField === "Price_amount" || sortField === "Rating") {
        valueA = parseFloat(valueA) || 0;
        valueB = parseFloat(valueB) || 0;
      } else {
        valueA = String(valueA || "").toLowerCase();
        valueB = String(valueB || "").toLowerCase();
      }
      let comparison = 0;
      if (valueA > valueB) {
        comparison = 1;
      } else if (valueA < valueB) {
        comparison = -1;
      }
      return direction === "desc" ? comparison * -1 : comparison;
    });
  }

  async sortAndDisplayProducts() {
    if (!this.currentProducts || this.currentProducts.length === 0) {
      return;
    }
    const sortedProducts = this.sortProducts(
      this.currentProducts,
      this.currentSortField,
      this.currentSortDirection,
    );
    if (
      this.productsTableManager &&
      typeof this.productsTableManager.render === "function"
    ) {
      this.productsTableManager.render(sortedProducts);
    } else if (
      this.productsTableManager &&
      typeof this.productsTableManager.renderProducts === "function"
    ) {
      this.productsTableManager.renderProducts(sortedProducts);
    }
  }

  updateProducts(products) {
    this.currentProducts = products;
    if (this.currentSortField && this.currentSortDirection) {
      this.sortAndDisplayProducts();
    } else {
      if (
        this.productsTableManager &&
        typeof this.productsTableManager.render === "function"
      ) {
        this.productsTableManager.render(products);
      } else if (
        this.productsTableManager &&
        typeof this.productsTableManager.renderProducts === "function"
      ) {
        this.productsTableManager.renderProducts(products);
      }
    }
  }

  clearSort() {
    this.currentSortField = null;
    this.currentSortDirection = null;
    this.currentProducts = [];
    this.clearSortIndicators();
  }

  resetSort() {
    this.clearSort();
  }
}

if (typeof window !== "undefined") {
  window.CONFIG = CONFIG;
  window.ApiService = ApiService;
}
