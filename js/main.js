const CONFIG = {
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

class ApiService {
  static async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }

      const text = await response.text();
      return text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }

  static async getStores(filters = {}) {
    let url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}`;
    const params = new URLSearchParams();

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const isNumeric = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));

      let searchFilter = `(substringof(tolower('${searchTerm}'), tolower(Name)) eq true) or (substringof(tolower('${searchTerm}'), tolower(Address)) eq true) or (substringof(tolower('${searchTerm}'), tolower(Email)) eq true)`;

      if (isNumeric) {
        const numericValue = parseFloat(searchTerm);
        searchFilter += ` or (FloorArea eq ${numericValue})`;
      }

      params.append("$filter", searchFilter);
    }

    if (filters.orderBy) {
      params.append("$orderby", filters.orderBy);
    }

    if (params.toString()) {
      url += "?" + params.toString();
    }

    const response = await this.request(url);
    return response.value || response.d?.results || response;
  }

  static async createStore(storeData) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}`;
    return await this.request(url, {
      method: "POST",
      body: JSON.stringify(storeData),
    });
  }

  static async deleteStore(storeId) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}('${storeId}')`;
    return await this.request(url, {
      method: "DELETE",
    });
  }

  static async getProducts(storeId = null, filters = {}) {
    let url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}`;
    const params = new URLSearchParams();

    if (storeId) {
      url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.STORES}('${storeId}')/Products`;
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
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

    if (filters.orderBy) {
      params.append("$orderby", filters.orderBy);
    }

    if (params.toString()) {
      url += "?" + params.toString();
    }

    const response = await this.request(url);
    return response.d?.results || response.value || response;
  }

  static async createProduct(productData) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}`;
    return await this.request(url, {
      method: "POST",
      body: JSON.stringify(productData),
    });
  }

  static async deleteProduct(productId) {
    const url = `${CONFIG.API_ROOT}/${CONFIG.ENDPOINTS.PRODUCTS}('${productId}')`;
    return await this.request(url, {
      method: "DELETE",
    });
  }
}

class ToastManager {
  constructor() {
    this.createToastContainer();
  }

  createToastContainer() {
    if (!document.getElementById("toastContainer")) {
      const container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
  }

  show(message, type, duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
          <div class="toast-content">
              <span class="toast-message">${message}</span>
              <button class="toast-close">&times;</button>
          </div>
      `;

    const container = document.getElementById("toastContainer");
    container.appendChild(toast);

    setTimeout(() => {
      this.remove(toast);
    }, duration);

    toast.querySelector(".toast-close").addEventListener("click", () => {
      this.remove(toast);
    });

    requestAnimationFrame(() => {
      toast.classList.add("toast-show");
    });
  }

  remove(toast) {
    if (toast && toast.parentNode) {
      toast.classList.add("toast-hide");
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }
  }

  success(message) {
    this.show(message, "success");
  }

  error(message) {
    this.show(message, "error", 5000);
  }
}

class ConfirmationDialog {
  constructor() {
    this.createDialog();
  }

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
              </div>
          `;
      document.body.appendChild(dialog);
    }
  }

  show(message, onConfirm, onCancel = null) {
    const modal = document.getElementById("confirmationModal");
    const messageEl = modal.querySelector(".confirmation-message");
    const confirmBtn = modal.querySelector(".modal-btn-confirm");
    const cancelBtn = modal.querySelector(".modal-btn-cancel");

    messageEl.textContent = message;

    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    const handleConfirm = () => {
      this.hide();
      if (onConfirm) onConfirm();
      cleanup();
    };

    const handleCancel = () => {
      this.hide();
      if (onCancel) onCancel();
      cleanup();
    };

    const cleanup = () => {
      confirmBtn.removeEventListener("click", handleConfirm);
      cancelBtn.removeEventListener("click", handleCancel);
      modal.removeEventListener("click", handleBackdropClick);
    };

    const handleBackdropClick = (event) => {
      if (event.target === modal) {
        handleCancel();
      }
    };

    confirmBtn.addEventListener("click", handleConfirm);
    cancelBtn.addEventListener("click", handleCancel);
    modal.addEventListener("click", handleBackdropClick);
  }

  hide() {
    const modal = document.getElementById("confirmationModal");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }
}

class LoadingManager {
  static setLoading(element, isLoading) {
    if (!element) return;

    if (isLoading) {
      element.classList.add("loading");
    } else {
      element.classList.remove("loading");
    }
  }
}

class ProductUtils {
  static formatPrice(price) {
    const numericPrice = parseFloat(price) || 0;
    return numericPrice.toLocaleString();
  }

  static generateStarRating(rating) {
    let starsHTML = "";
    const totalStars = 5;

    for (let i = 1; i <= totalStars; i++) {
      if (i <= rating) {
        starsHTML +=
          '<img src="assets/icons/goldStar-icon.svg" width="20" alt="gold star" style="margin-right: 2px;">';
      } else {
        starsHTML +=
          '<img src="assets/icons/grayStar-icon.svg" width="20" alt="gray star" style="margin-right: 2px;">';
      }
    }

    return starsHTML;
  }
}

class Store {
  constructor(storeData) {
    this.id = storeData.ID;
    this.name = storeData.Name;
    this.email = storeData.Email;
    this.phoneNumber = storeData.PhoneNumber;
    this.address = storeData.Address;
    this.established = storeData.Established;
    this.floorArea = storeData.FloorArea;
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

    const notFoundPage = document.getElementById("notFoundPage");
    if (notFoundPage) {
      notFoundPage.remove();
    }

    this.showMainContent();
  }

  hideMainContent() {
    const storeListSection = document.querySelector(".store-list-section");
    const storeDetailsSection = document.querySelector(
      ".store-details-section",
    );

    if (storeListSection) {
      storeListSection.style.display = "none";
    }
    if (storeDetailsSection) {
      storeDetailsSection.style.display = "none";
    }
  }

  showMainContent() {
    const storeListSection = document.querySelector(".store-list-section");
    const storeDetailsSection = document.querySelector(
      ".store-details-section",
    );

    if (storeListSection) {
      storeListSection.style.display = "";
    }
    if (storeDetailsSection) {
      storeDetailsSection.style.display = "";
    }
  }

  create404Page() {
    const existing = document.getElementById("notFoundPage");
    if (existing) {
      existing.remove();
    }

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
          </div>
      `;

    document.body.appendChild(notFoundPage);

    const goToHomeBtn = document.getElementById("goToHomeBtn");
    if (goToHomeBtn) {
      goToHomeBtn.addEventListener("click", () => {
        this.goToHome();
      });
    }
  }

  goToHome() {
    if (window.urlRouter) {
      window.urlRouter.clearStoreSelection();
    }

    this.hide();

    window.history.replaceState({}, "", "#");

    if (window.urlRouter) {
      window.urlRouter.handleRouteChange();
    }
  }
}

class StoreVisibilityManager {
  constructor() {
    this.elementsToHide = {
      storeInfo: document.querySelector(".store-details__info"),
      controlsButton: document.querySelector(".controls__details-button"),
      statusSection: document.querySelector(".store-details-section__status"),
      searchContainer: document.querySelector(
        ".store-details-section__search-container",
      ),
      productsContainer: document.querySelector(".products-container"),
      footer: document.querySelector(".store-details-section__footer"),
    };

    this.noStoreSelected = document.querySelector(".no-store-selected");
    this.storeTitle = document.querySelector(".store-details__title");

    this.hideStoreContent();
    this.showNoStoreSelected();
  }

  hideStoreContent() {
    Object.values(this.elementsToHide).forEach((element) => {
      if (element) {
        element.style.display = "none";
      }
    });

    if (this.storeTitle) {
      this.storeTitle.style.marginBottom = "unset";
    }
  }

  showStoreContent() {
    Object.values(this.elementsToHide).forEach((element) => {
      if (element) {
        element.style.display = "";
      }
    });

    if (this.storeTitle) {
      this.storeTitle.style.marginBottom = "";
    }
  }

  showNoStoreSelected() {
    if (this.noStoreSelected) {
      this.noStoreSelected.style.display = "block";
    }
  }

  hideNoStoreSelected() {
    if (this.noStoreSelected) {
      this.noStoreSelected.style.display = "none";
    }
  }

  onStoreSelected() {
    this.hideNoStoreSelected();
    this.showStoreContent();
  }

  onNoStoreSelected() {
    this.showNoStoreSelected();
    this.hideStoreContent();
  }
}

class ScrollbarManager {
  constructor(elementSelector) {
    this.element = document.querySelector(elementSelector);
    this.isScrolling = false;
    this.scrollTimeout = null;

    if (this.element) {
      this.hideScrollbar();
      this.element.addEventListener("scroll", this.handleScroll);
    }
  }

  handleScroll = () => {
    if (!this.isScrolling) {
      this.showScrollbar();
      this.isScrolling = true;
    }

    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = setTimeout(() => {
      this.hideScrollbar();
      this.isScrolling = false;
    }, 500);
  };

  showScrollbar() {
    if (this.element) {
      this.element.style.setProperty("--scrollbar-width", "7px");
      this.element.style.setProperty("--scrollbar-opacity", "1");
    }
  }

  hideScrollbar() {
    if (this.element) {
      this.element.style.setProperty("--scrollbar-width", "7px");
      this.element.style.setProperty("--scrollbar-opacity", "0.2");
    }
  }
}

class StoreListManager {
  constructor(containerSelector, storeDetailsManager) {
    this.container = document.querySelector(containerSelector);
    this.stores = [];
    this.currentActiveItem = null;
    this.storeDetailsManager = storeDetailsManager;
    this.isLoading = false;

    this.init();
  }

  async init() {
    await this.loadStores();
    this.renderStores();
    this.attachEventListeners();
  }

  async loadStores(filters = {}) {
    try {
      this.setLoading(true);
      const storesData = await ApiService.getStores(filters);
      this.stores = storesData.map((storeData) => new Store(storeData));
      return this.stores;
    } catch (error) {
      console.error("Failed to load stores:", error);
      toastManager.error(CONFIG.MESSAGES.ERROR_LOADING);
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  setLoading(loading) {
    this.isLoading = loading;
    LoadingManager.setLoading(this.container, loading);
  }

  renderStores() {
    this.container.innerHTML = "";

    if (this.stores.length === 0) {
      const noResultsElement = document.createElement("li");
      noResultsElement.className = "store-items__list";
      noResultsElement.style.textAlign = "center";
      noResultsElement.style.padding = "2rem";
      noResultsElement.style.color = "var(--secondary-color)";
      noResultsElement.innerHTML = "<p>No stores found.</p>";
      this.container.appendChild(noResultsElement);
      return;
    }

    this.stores.forEach((store, index) => {
      const storeElement = this.createStoreElement(store, index);
      this.container.appendChild(storeElement);
    });
  }

  createStoreElement(store, index) {
    const li = document.createElement("li");
    li.className = "store-items__list";
    li.dataset.storeId = store.id;

    li.innerHTML = `
          <div class="store-items__list-info">
              <div class="store-items__list-info-wrapper-left">
                  <h2 class="store-items__list-info-name">${store.name}</h2>
                  <address class="store-items__list-info-address">${store.address}</address>
              </div>
              <div class="store-items__list-info-wrapper-right">
                  <h2 class="store-items__list-info-floor-area">${store.floorArea.toLocaleString()}</h2>
                  <p class="store-items__list-info-squareM">sq.m</p>
              </div>
              <img width="15px" class="store-items__right-arrow-icon" src="assets/icons/rightArrow-icon.svg" alt="">
          </div>
      `;

    return li;
  }

  attachEventListeners() {
    const storeItems = this.container.querySelectorAll(".store-items__list");

    storeItems.forEach((item, index) => {
      item.addEventListener("click", (event) => {
        this.handleItemClick(event, item, index);
      });
    });
  }

  handleItemClick = (event, clickedItem, index) => {
    if (this.currentActiveItem && this.currentActiveItem !== clickedItem) {
      this.currentActiveItem.classList.remove("active");
    }

    clickedItem.classList.add("active");
    this.currentActiveItem = clickedItem;

    const storeId = clickedItem.dataset.storeId;
    const selectedStore = this.stores.find((store) => store.id == storeId);

    if (window.urlRouter && !event.fromRouter && storeId) {
      window.urlRouter.navigateToStore(storeId);
    }

    if (this.storeDetailsManager && selectedStore) {
      this.storeDetailsManager.updateDetails(selectedStore);
    }
  };

  async createStore(storeData) {
    try {
      this.setLoading(true);

      await ApiService.createStore(storeData);

      await this.loadStores();
      this.renderStores();
      this.attachEventListeners();

      toastManager.success(CONFIG.MESSAGES.STORE_CREATED);
      return true;
    } catch (error) {
      console.error("Failed to create store:", error);
      toastManager.error(CONFIG.MESSAGES.ERROR_CREATING);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  async deleteStore(storeId) {
    try {
      this.setLoading(true);

      await ApiService.deleteStore(storeId);

      await this.loadStores();
      this.renderStores();
      this.attachEventListeners();

      if (this.storeDetailsManager) {
        this.storeDetailsManager.clearDetails();
      }

      toastManager.success(CONFIG.MESSAGES.STORE_DELETED);
      return true;
    } catch (error) {
      console.error("Failed to delete store:", error);
      toastManager.error(CONFIG.MESSAGES.ERROR_DELETING);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  async searchStores(searchTerm) {
    const filters = searchTerm ? { search: searchTerm } : {};
    await this.loadStores(filters);
    this.renderStores();
    this.attachEventListeners();
  }

  getStores() {
    return this.stores;
  }

  getStoreById(id) {
    return this.stores.find((store) => store.id == id);
  }

  getSelectedStore() {
    if (!this.currentActiveItem) return null;
    const storeId = this.currentActiveItem.dataset.storeId;
    return this.getStoreById(storeId);
  }

  async selectStoreById(storeId, showErrors = true) {
    if (!storeId || storeId.toString().trim() === "") {
      if (showErrors) {
        console.warn(`Invalid store ID: ${storeId}`);
        if (window.toastManager) {
          window.toastManager.error(`Invalid store ID: ${storeId}`);
        }
      }
      return false;
    }

    if (this.stores.length === 0) {
      await this.loadStores();
      this.renderStores();
      this.attachEventListeners();
    }

    const store = this.getStoreById(storeId);
    if (!store) {
      if (showErrors) {
        console.warn(`Store with ID ${storeId} not found`);
        if (window.toastManager) {
          window.toastManager.error(`Store with ID ${storeId} not found`);
        }
      }
      return false;
    }

    const storeElement = this.container.querySelector(
      `[data-store-id="${storeId}"]`,
    );
    if (!storeElement) {
      if (showErrors) {
        console.warn(`Store element with ID ${storeId} not found in DOM`);
      }
      return false;
    }

    if (this.currentActiveItem && this.currentActiveItem !== storeElement) {
      this.currentActiveItem.classList.remove("active");
    }

    const mockEvent = { fromRouter: true };
    const index = Array.from(this.container.children).indexOf(storeElement);
    this.handleItemClick(mockEvent, storeElement, index);

    storeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

    return true;
  }
}

class StoreDetailsManager {
  constructor(
    productsTableManager,
    storeVisibilityManager,
    productsSearchManager,
  ) {
    this.elements = {
      email: document.getElementById("storeEmail"),
      phone: document.getElementById("storePhone"),
      address: document.getElementById("storeAddress"),
      established: document.getElementById("storeEstablished"),
      floorArea: document.getElementById("storeFloorArea"),
      itemsQuantity: document.getElementById("itemsQuantity"),
      statusOk: document.getElementById("statusOk"),
      statusStorage: document.getElementById("statusStorage"),
      statusOutOfStock: document.getElementById("statusOutOfStock"),
    };

    this.productsTableManager = productsTableManager;
    this.storeVisibilityManager = storeVisibilityManager;
    this.productsSearchManager = productsSearchManager;
    this.productSortingManager = null;
    this.currentStore = null;
    this.currentStatusFilter = null;

    this.clearDetails();
    this.initStatusFilterListeners();
  }

  initStatusFilterListeners() {
    const statusItems = document.querySelectorAll(
      ".store-details-section__status-item",
    );
    statusItems.forEach((item, index) => {
      const statusTypes = ["OK", "STORAGE", "OUT_OF_STOCK"];
      const status = statusTypes[index];

      item.addEventListener("click", () => {
        this.filterByStatus(status, item);
      });
    });

    const allItem = document.querySelector(
      ".store-details-section__status-item-quantity",
    );
    if (allItem) {
      allItem.addEventListener("click", () => {
        this.clearStatusFilter();
      });
    }
  }

  async filterByStatus(status, clickedElement) {
    if (!this.currentStore) return;

    this.updateStatusHighlighting(clickedElement);
    this.currentStatusFilter = status;

    await this.loadStoreProducts({ status });
  }

  async clearStatusFilter() {
    if (!this.currentStore) return;

    this.updateStatusHighlighting(null);
    this.currentStatusFilter = null;

    await this.loadStoreProducts();
  }

  updateStatusHighlighting(activeElement) {
    document
      .querySelectorAll(
        ".store-details-section__status-item, .store-details-section__status-item-quantity",
      )
      .forEach((item) => item.classList.remove("active"));

    if (activeElement) {
      activeElement.classList.add("active");
    } else {
      document
        .querySelector(".store-details-section__status-item-quantity")
        ?.classList.add("active");
    }
  }

  async updateDetails(store) {
    if (!store) {
      this.clearDetails();
      return;
    }

    this.currentStore = store;

    if (this.productSortingManager) {
      this.productSortingManager.resetSort();
    }

    if (this.storeVisibilityManager) {
      this.storeVisibilityManager.onStoreSelected();
    }

    this.elements.email.textContent = store.email;
    this.elements.phone.textContent = store.phoneNumber;
    this.elements.address.textContent = store.address;
    this.elements.established.textContent = this.formatDate(store.established);
    this.elements.floorArea.textContent = store.floorArea.toLocaleString();

    await this.loadStoreProducts();

    if (this.productsSearchManager) {
      this.productsSearchManager.updateStoreProducts(store);
    }
  }

  async loadStoreProducts(filters = {}) {
    if (!this.currentStore) return;

    try {
      const products = await ApiService.getProducts(
        this.currentStore.id,
        filters,
      );

      if (this.productsTableManager) {
        this.productsTableManager.updateProducts(products);
      }

      let allProducts;
      if (Object.keys(filters).length > 0) {
        allProducts = await ApiService.getProducts(this.currentStore.id, {});
      } else {
        allProducts = products;
      }

      this.updateStatusCounts(allProducts);
    } catch (error) {
      console.error("Failed to load products:", error);
      toastManager.error("Failed to load products");
    }
  }

  updateStatusCounts(products) {
    const statusCounts = this.getProductStatusCounts(products);
    this.elements.itemsQuantity.textContent = products.length;
    this.elements.statusOk.textContent = statusCounts.OK;
    this.elements.statusStorage.textContent = statusCounts.STORAGE;
    this.elements.statusOutOfStock.textContent = statusCounts.OUT_OF_STOCK;
  }

  clearDetails() {
    this.currentStore = null;
    this.currentStatusFilter = null;

    if (this.storeVisibilityManager) {
      this.storeVisibilityManager.onNoStoreSelected();
    }

    if (this.productsSearchManager) {
      this.productsSearchManager.updateStoreProducts(null);
    }

    if (this.productsTableManager) {
      this.productsTableManager.clearTable();
    }

    this.updateStatusHighlighting(null);
  }

  formatDate(dateString) {
    if (!dateString || dateString.toString().trim() === "") {
      return "Not specified";
    }

    try {
      let date;

      const msDateMatch = dateString.match(/\/Date\((\d+)([-+]\d{4})?\)\//);

      if (msDateMatch) {
        const timestamp = parseInt(msDateMatch[1]);
        date = new Date(timestamp);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.warn("Invalid date string:", dateString);
        return "Invalid date format";
      }

      const options = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "UTC",
      };

      return date.toLocaleString("en-US", options);
    } catch (error) {
      console.error(
        "Error formatting date:",
        error,
        "Date string:",
        dateString,
      );
      return "Date format error";
    }
  }

  getProductStatusCounts(products) {
    const statusCounts = {
      OK: 0,
      STORAGE: 0,
      OUT_OF_STOCK: 0,
    };

    products.forEach((product) => {
      if (statusCounts.hasOwnProperty(product.Status)) {
        statusCounts[product.Status]++;
      }
    });

    return statusCounts;
  }

  async deleteCurrentStore() {
    if (!this.currentStore) return false;

    return new Promise((resolve) => {
      confirmationDialog.show(
        CONFIG.MESSAGES.CONFIRM_DELETE_STORE,
        async () => {
          const success = await window.storeListManager.deleteStore(
            this.currentStore.id,
          );
          resolve(success);
        },
        () => resolve(false),
      );
    });
  }
}

class URLRouter {
  constructor(storeListManager) {
    this.storeListManager = storeListManager;
    this.currentRoute = null;
    this.notFoundPageManager = new NotFoundPageManager();

    window.addEventListener("popstate", (event) => {
      this.handleRouteChange();
    });
  }

  parseCurrentURL() {
    const hash = window.location.hash;
    let route = null;

    if (hash && hash !== "#" && hash !== "#/") {
      route = { type: "invalid", path: hash };
    }

    return route;
  }

  async handleRouteChange() {
    const route = this.parseCurrentURL();

    this.notFoundPageManager.hide();

    if (route && route.type === "store") {
      const success = await this.navigateToStore(route.id, false);
      if (!success) {
        this.show404Page();
      }
    } else if (route && route.type === "invalid") {
      this.show404Page();
    } else {
      this.clearStoreSelection();
    }
  }

  show404Page() {
    this.notFoundPageManager.show();
    this.currentRoute = { type: "notfound" };
  }

  async navigateToStore(storeId, updateURL = true) {
    if (!storeId || storeId.toString().trim() === "") {
      console.warn(`Invalid store ID for navigation: ${storeId}`);
      return false;
    }

    if (updateURL) {
      const newURL = `#store/${encodeURIComponent(storeId)}`;
      window.history.pushState({ storeId }, "", newURL);
    }

    const success = await this.storeListManager.selectStoreById(storeId, false);

    if (success) {
      this.currentRoute = { type: "store", id: storeId };
      this.notFoundPageManager.hide();
    }

    return success;
  }

  clearStoreSelection() {
    window.history.pushState({}, "", "#");

    this.notFoundPageManager.hide();

    if (this.storeListManager.currentActiveItem) {
      this.storeListManager.currentActiveItem.classList.remove("active");
      this.storeListManager.currentActiveItem = null;
    }

    if (this.storeListManager.storeDetailsManager) {
      this.storeListManager.storeDetailsManager.clearDetails();
    }

    this.currentRoute = null;
  }

  async init() {
    await this.handleRouteChange();
  }
}

// Global instances
let toastManager;
let confirmationDialog;
let urlRouter;

class ProductsTableManager {
  constructor(storeDetailsManager) {
    this.tableBody = document.querySelector(".products-table__body");
    this.storeDetailsManager = storeDetailsManager;
    this.isLoading = false;
    this.sortingManager = null;

    this.clearTable();
  }

  setLoading(loading) {
    this.isLoading = loading;
    LoadingManager.setLoading(this.tableBody, loading);
  }

  updateProducts(products) {
    if (!products || products.length === 0) {
      this.showNoData();
      return;
    }

    if (this.sortingManager) {
      this.sortingManager.updateProducts(products);
      return;
    }

    this.renderProducts(products);
  }

  renderProducts(products) {
    this.tableBody.innerHTML = "";

    products.forEach((product) => {
      const row = this.createProductRow(product);
      this.tableBody.appendChild(row);
    });
  }

  createProductRow(product) {
    const tr = document.createElement("tr");
    tr.className = "products-table__cell-row";
    tr.dataset.productId = product.ID;

    tr.innerHTML = `
          <td class="products-table__cell bold-cell__text">${product.Name}</td>
          <td class="products-table__cell ellipsis-wrapper bold-cell__text">${ProductUtils.formatPrice(product.Price_amount)}<span class="muted-usd"> ${product.Price_currency || "USD"}</span></td>
          <td class="products-table__cell ellipsis-wrapper">${product.Specs}</td>
          <td class="products-table__cell ellipsis-wrapper">${product.SupplierInfo}</td>
          <td class="products-table__cell ellipsis-wrapper">${product.MadeIn}</td>
          <td class="products-table__cell ellipsis-wrapper">${product.ProductionCompanyName}</td>
          <td class="products-table__cell">${ProductUtils.generateStarRating(product.Rating)}</td>
          <td class="products-table__cell ellipsis-wrapper edit-cell__icons">
              <img width="20px" src="assets/icons/edit-icon.svg" alt="Edit" class="edit-btn">
              <img width="20px" src="assets/icons/blueDelete-icon.svg" alt="Delete" class="row-delete-btn">
          </td>
      `;

    const editBtn = tr.querySelector(".edit-btn");
    const deleteBtn = tr.querySelector(".row-delete-btn");

    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleEditProduct(product);
    });

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.handleDeleteProduct(product);
    });

    return tr;
  }

  handleEditProduct(product) {}

  async handleDeleteProduct(product) {
    confirmationDialog.show(
      CONFIG.MESSAGES.CONFIRM_DELETE_PRODUCT,
      async () => {
        try {
          this.setLoading(true);

          await ApiService.deleteProduct(product.ID);

          if (
            this.storeDetailsManager &&
            this.storeDetailsManager.currentStore
          ) {
            await this.storeDetailsManager.loadStoreProducts(
              this.storeDetailsManager.currentStatusFilter
                ? { status: this.storeDetailsManager.currentStatusFilter }
                : {},
            );
          }

          toastManager.success(CONFIG.MESSAGES.PRODUCT_DELETED);
        } catch (error) {
          console.error("Failed to delete product:", error);
          toastManager.error(CONFIG.MESSAGES.ERROR_DELETING);
        } finally {
          this.setLoading(false);
        }
      },
    );
  }

  async createProduct(productData) {
    try {
      this.setLoading(true);

      await ApiService.createProduct(productData);

      if (this.storeDetailsManager && this.storeDetailsManager.currentStore) {
        await this.storeDetailsManager.loadStoreProducts(
          this.storeDetailsManager.currentStatusFilter
            ? { status: this.storeDetailsManager.currentStatusFilter }
            : {},
        );
      }

      toastManager.success(CONFIG.MESSAGES.PRODUCT_CREATED);
      return true;
    } catch (error) {
      console.error("Failed to create product:", error);
      toastManager.error(CONFIG.MESSAGES.ERROR_CREATING);
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  clearTable() {
    this.tableBody.innerHTML = "";
  }

  showNoData() {
    this.tableBody.innerHTML = `
          <tr class="products-table__cell-row" style="display: flex; justify-content: center;">
              <td class="products-table__cell" colspan="8" style="color: var(--primary-color); font-size: 0.9rem; font-weight: 500;">
                  No data
              </td>
          </tr>
      `;
  }
}

class ProductSortingManager {
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

    this.productsTableManager.renderProducts(sortedProducts);
  }

  updateProducts(products) {
    this.currentProducts = products;

    if (this.currentSortField && this.currentSortDirection) {
      this.sortAndDisplayProducts();
    } else {
      this.productsTableManager.renderProducts(products);
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

class StoreSearchManager {
  constructor(
    searchInputSelector,
    resetButtonSelector,
    searchButtonSelector,
    storeListManager,
  ) {
    this.searchInput = document.querySelector(searchInputSelector);
    this.resetButton = document.querySelector(resetButtonSelector);
    this.searchButton = document.querySelector(searchButtonSelector);
    this.storeListManager = storeListManager;
    this.isVisible = false;

    this.hideResetButton();
    this.initEventListeners();
  }

  initEventListeners() {
    this.searchInput.addEventListener("input", this.handleInputChange);
    this.searchInput.addEventListener("keypress", this.handleKeyPress);
    this.searchButton.addEventListener("click", this.handleSearchClick);
    this.resetButton.addEventListener("click", this.handleResetClick);
  }

  handleInputChange = (event) => {
    const value = event.target.value.trim();

    if (value.length > 0) {
      this.showResetButton();
    } else {
      this.hideResetButton();
    }
  };

  handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.performSearch();
    }
  };

  handleSearchClick = (event) => {
    event.preventDefault();
    this.performSearch();
  };

  handleResetClick = (event) => {
    event.preventDefault();
    this.clearSearch();
  };

  async performSearch() {
    const searchTerm = this.searchInput.value.trim().toLowerCase();
    await this.storeListManager.searchStores(searchTerm);
  }

  async clearSearch() {
    this.searchInput.value = "";
    this.hideResetButton();
    await this.storeListManager.searchStores("");
  }

  showResetButton() {
    if (!this.isVisible) {
      this.resetButton.style.display = "block";
      this.isVisible = true;
    }
  }

  hideResetButton() {
    if (this.isVisible) {
      this.resetButton.style.display = "none";
      this.isVisible = false;
    }
  }
}

class ProductsSearchManager {
  constructor(
    searchInputSelector,
    resetButtonSelector,
    searchButtonSelector,
    storeDetailsManager,
  ) {
    this.searchInput = document.querySelector(searchInputSelector);
    this.resetButton = document.querySelector(resetButtonSelector);
    this.searchButton = document.querySelector(searchButtonSelector);
    this.storeDetailsManager = storeDetailsManager;
    this.isVisible = false;
    this.currentStore = null;

    this.hideResetButton();
    this.initEventListeners();
  }

  initEventListeners() {
    this.searchInput.addEventListener("input", this.handleInputChange);
    this.searchInput.addEventListener("keypress", this.handleKeyPress);
    this.searchButton.addEventListener("click", this.handleSearchClick);
    this.resetButton.addEventListener("click", this.handleResetClick);
  }

  handleInputChange = (event) => {
    const value = event.target.value.trim();

    if (value.length > 0) {
      this.showResetButton();
    } else {
      this.hideResetButton();
    }
  };

  handleKeyPress = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      this.performSearch();
    }
  };

  handleSearchClick = (event) => {
    event.preventDefault();
    this.performSearch();
  };

  handleResetClick = (event) => {
    event.preventDefault();
    this.clearSearch();
  };

  async performSearch() {
    if (!this.currentStore) return;

    const searchTerm = this.searchInput.value.trim().toLowerCase();
    const filters = {
      search: searchTerm,
    };

    if (this.storeDetailsManager.currentStatusFilter) {
      filters.status = this.storeDetailsManager.currentStatusFilter;
    }

    await this.storeDetailsManager.loadStoreProducts(filters);
  }

  async clearSearch() {
    this.searchInput.value = "";
    this.hideResetButton();

    if (this.currentStore) {
      const filters = {};

      if (this.storeDetailsManager.currentStatusFilter) {
        filters.status = this.storeDetailsManager.currentStatusFilter;
      }

      await this.storeDetailsManager.loadStoreProducts(filters);
    }
  }

  updateStoreProducts(store) {
    this.currentStore = store;

    this.searchInput.value = "";
    this.hideResetButton();
  }

  showResetButton() {
    if (!this.isVisible) {
      this.resetButton.style.display = "block";
      this.isVisible = true;
    }
  }

  hideResetButton() {
    if (this.isVisible) {
      this.resetButton.style.display = "none";
      this.isVisible = false;
    }
  }
}

class StorePreviewManager {
  constructor(storeListManager) {
    this.storeListManager = storeListManager;
    this.previewItem = null;
    this.isPreviewVisible = false;
    this.formData = {
      Name: "",
      Email: "",
      PhoneNumber: "",
      Address: "",
      Established: "",
      FloorArea: 0,
    };
  }

  createPreviewItem() {
    if (!this.previewItem) {
      const li = document.createElement("li");
      li.className = "store-items__list";
      li.dataset.isPreview = "true";

      this.previewItem = li;
    }

    this.updatePreviewContent();
    return this.previewItem;
  }

  updatePreviewContent() {
    if (!this.previewItem) return;

    const floorArea = this.formData.FloorArea || 0;

    this.previewItem.innerHTML = `
          <div class="store-items__list-info">
              <div class="store-items__list-info-wrapper-left">
                  <h2 class="store-items__list-info-name">${this.formData.Name || "New store"}</h2>
                  <address class="store-items__list-info-address">${this.formData.Address || ""}</address>
              </div>
              <div class="store-items__list-info-wrapper-right">
                  <h2 class="store-items__list-info-floor-area">${floorArea.toLocaleString()}</h2>
                  <p class="store-items__list-info-squareM">sq.m</p>
              </div>
              <img width="15px" class="store-items__right-arrow-icon" src="assets/icons/rightArrow-icon.svg" alt="">
          </div>
      `;
  }

  showPreview() {
    const container = this.storeListManager.container;
    if (!container) {
      return;
    }

    if (!this.isPreviewVisible) {
      const previewItem = this.createPreviewItem();
      if (container.firstChild) {
        container.insertBefore(previewItem, container.firstChild);
      } else {
        container.appendChild(previewItem);
      }
      this.isPreviewVisible = true;
    } else {
      this.updatePreviewContent();
    }
  }

  hidePreview() {
    if (this.previewItem && this.isPreviewVisible) {
      const container = this.storeListManager.container;
      if (container && container.contains(this.previewItem)) {
        container.removeChild(this.previewItem);
      }
      this.isPreviewVisible = false;
    }
  }

  showDefaultPreview() {
    this.formData = {
      Name: "New store",
      Email: "",
      PhoneNumber: "",
      Address: "",
      Established: "",
      FloorArea: 0,
    };
    this.showPreview();
  }

  updateFromForm(form) {
    if (!form) return;

    const formData = new FormData(form);

    this.formData = {
      Name: (formData.get("storeName") || "").trim(),
      Email: (formData.get("storeEmail") || "").trim(),
      PhoneNumber: (formData.get("storePhone") || "").trim(),
      Address: (formData.get("storeAddress") || "").trim(),
      Established: (formData.get("storeEstablished") || "").trim(),
      FloorArea: parseInt(formData.get("storeFloorArea")) || 0,
    };

    if (this.isPreviewVisible) {
      this.updatePreviewContent();
    }
  }

  resetPreview() {
    this.formData = {
      Name: "",
      Email: "",
      PhoneNumber: "",
      Address: "",
      Established: "",
      FloorArea: 0,
    };
    this.hidePreview();
  }
}

class ModalManager {
  constructor(modalSelector, storeListManager) {
    this.modal = document.querySelector(modalSelector);
    this.form = document.querySelector("#createStoreForm");
    this.createBtn = document.querySelector("#createStoreBtn");
    this.cancelBtn = document.querySelector("#cancelStoreBtn");
    this.storeListManager = storeListManager;
    this.previewManager = new StorePreviewManager(storeListManager);

    this.initEventListeners();
  }

  initEventListeners() {
    this.cancelBtn.addEventListener("click", () => this.closeModal());

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.closeModal();
      }
    });

    this.createBtn.addEventListener("click", () => this.handleCreateStore());

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleCreateStore();
    });

    this.setupPreviewUpdateListeners();
  }

  setupPreviewUpdateListeners() {
    this.form.addEventListener("input", () => {
      this.previewManager.updateFromForm(this.form);
    });
  }

  openModal() {
    this.previewManager.showDefaultPreview();

    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      const firstInput = this.form.querySelector("input");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    this.previewManager.resetPreview();
    this.clearForm();
  }

  clearForm() {
    this.form.reset();
  }

  async handleCreateStore() {
    const formData = new FormData(this.form);

    const establishedValue = formData.get("storeEstablished");
    let establishedDate;

    try {
      establishedDate = new Date(establishedValue);
      if (isNaN(establishedDate.getTime())) {
        throw new Error("Invalid date");
      }
      establishedDate = establishedDate.toISOString();
    } catch (error) {
      toastManager.error(
        "Please enter a valid date for the establishment date.",
      );
      return;
    }

    const newStore = {
      Name: formData.get("storeName").trim(),
      Email: formData.get("storeEmail").trim(),
      PhoneNumber: formData.get("storePhone").trim(),
      Address: formData.get("storeAddress").trim(),
      Established: establishedDate,
      FloorArea: parseInt(formData.get("storeFloorArea")),
    };

    const success = await this.storeListManager.createStore(newStore);

    if (success) {
      this.closeModal();
    }
  }
}

class ProductPreviewManager {
  constructor(productsTableManager) {
    this.productsTableManager = productsTableManager;
    this.previewRow = null;
    this.isPreviewVisible = false;
    this.formData = {
      Name: "",
      Price: 0,
      Specs: "",
      Rating: 0,
      SupplierInfo: "",
      MadeIn: "",
      ProductionCompanyName: "",
      Status: "OK",
    };
  }

  createPreviewRow() {
    if (!this.previewRow) {
      const tr = document.createElement("tr");
      tr.className = "products-table__cell-row";
      tr.dataset.isPreview = "true";

      this.previewRow = tr;
    }

    this.updatePreviewContent();
    return this.previewRow;
  }

  updatePreviewContent() {
    if (!this.previewRow) return;

    const price = this.formData.Price || 0;
    const rating = this.formData.Rating || 1;

    this.previewRow.innerHTML = `
          <td class="products-table__cell bold-cell__text">${this.formData.Name || "New product"}</td>
          <td class="products-table__cell ellipsis-wrapper bold-cell__text">${ProductUtils.formatPrice(price)}<span class="muted-usd"> USD</span></td>
          <td class="products-table__cell ellipsis-wrapper">${this.formData.Specs || ""}</td>
          <td class="products-table__cell ellipsis-wrapper">${this.formData.SupplierInfo || ""}</td>
          <td class="products-table__cell ellipsis-wrapper">${this.formData.MadeIn || ""}</td>
          <td class="products-table__cell ellipsis-wrapper">${this.formData.ProductionCompanyName || ""}</td>
          <td class="products-table__cell">${ProductUtils.generateStarRating(rating)}</td>
          <td class="products-table__cell ellipsis-wrapper edit-cell__icons">
              <img width="20px" src="assets/icons/edit-icon.svg" alt="">
              <img width="20px" src="assets/icons/blueDelete-icon.svg" alt="">
          </td>
      `;
  }

  showPreview() {
    const tableBody =
      this.productsTableManager?.tableBody ||
      document.querySelector(".products-table__body");
    if (!tableBody) {
      return;
    }

    if (!this.isPreviewVisible) {
      const previewRow = this.createPreviewRow();
      if (tableBody.firstChild) {
        tableBody.insertBefore(previewRow, tableBody.firstChild);
      } else {
        tableBody.appendChild(previewRow);
      }
      this.isPreviewVisible = true;
    } else {
      this.updatePreviewContent();
    }
  }

  hidePreview() {
    if (this.previewRow && this.isPreviewVisible) {
      const tableBody =
        this.productsTableManager?.tableBody ||
        document.querySelector(".products-table__body");
      if (tableBody && tableBody.contains(this.previewRow)) {
        tableBody.removeChild(this.previewRow);
      }
      this.isPreviewVisible = false;
    }
  }

  showDefaultPreview() {
    this.formData = {
      Name: "New product",
      Price: 0,
      Specs: "",
      Rating: 1,
      SupplierInfo: "",
      MadeIn: "",
      ProductionCompanyName: "",
      Status: "OK",
    };
    this.showPreview();
  }

  updateFromForm(form) {
    if (!form) return;

    const formData = new FormData(form);

    this.formData = {
      Name: (formData.get("productName") || "").trim(),
      Price: parseFloat(formData.get("productPrice") || "0") || 0,
      Specs: (formData.get("productSpecs") || "").trim(),
      Rating: parseInt(formData.get("productRating") || "1") || 1,
      SupplierInfo: (formData.get("productSupplierInfo") || "").trim(),
      MadeIn: (formData.get("productCountryOfOrigin") || "").trim(),
      ProductionCompanyName: (formData.get("productCompany") || "").trim(),
      Status: formData.get("productStatus") || "OK",
    };

    if (this.isPreviewVisible) {
      this.updatePreviewContent();
    }
  }

  resetPreview() {
    this.formData = {
      Name: "",
      Price: 0,
      Specs: "",
      Rating: 0,
      SupplierInfo: "",
      MadeIn: "",
      ProductionCompanyName: "",
      Status: "OK",
    };
    this.hidePreview();
  }
}

class ProductModalManager {
  constructor(
    modalSelector,
    storeListManager,
    productsTableManager,
    storeDetailsManager,
  ) {
    this.modal = document.querySelector(modalSelector);
    this.form = document.querySelector("#createProductForm");
    this.createBtn = document.querySelector("#createProductBtn");
    this.cancelBtn = document.querySelector("#cancelProductBtn");
    this.storeListManager = storeListManager;
    this.productsTableManager = productsTableManager;
    this.storeDetailsManager = storeDetailsManager;
    this.previewManager = new ProductPreviewManager(productsTableManager);

    this.initEventListeners();
  }

  initEventListeners() {
    this.cancelBtn.addEventListener("click", () => this.closeModal());

    this.modal.addEventListener("click", (event) => {
      if (event.target === this.modal) {
        this.closeModal();
      }
    });

    this.createBtn.addEventListener("click", () => this.handleCreateProduct());

    this.form.addEventListener("submit", (event) => {
      event.preventDefault();
      this.handleCreateProduct();
    });

    this.setupPreviewUpdateListeners();
  }

  setupPreviewUpdateListeners() {
    this.form.addEventListener("input", () => {
      this.previewManager.updateFromForm(this.form);
    });
  }

  openModal() {
    this.previewManager.showDefaultPreview();

    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";

    setTimeout(() => {
      const firstInput = this.form.querySelector("input");
      if (firstInput) {
        firstInput.focus();
      }
    }, 100);
  }

  closeModal() {
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    this.previewManager.resetPreview();
    this.clearForm();
  }

  clearForm() {
    this.form.reset();
  }

  async handleCreateProduct() {
    const selectedStore = this.storeListManager.getSelectedStore();
    if (!selectedStore) {
      toastManager.error("Please select a store first before adding products.");
      return;
    }

    if (!this.form.checkValidity()) {
      this.form.reportValidity();
      return;
    }

    const formData = new FormData(this.form);

    const newProduct = {
      Name: formData.get("productName").trim(),
      Price_amount: parseFloat(formData.get("productPrice")),
      Price_currency: "USD",
      Specs: formData.get("productSpecs").trim(),
      Rating: parseInt(formData.get("productRating")),
      SupplierInfo: formData.get("productSupplierInfo").trim(),
      MadeIn: formData.get("productCountryOfOrigin").trim(),
      ProductionCompanyName: formData.get("productCompany").trim(),
      Status: formData.get("productStatus"),
      Store_ID: selectedStore.id,
    };

    const success = await this.productsTableManager.createProduct(newProduct);

    if (success) {
      this.closeModal();
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  toastManager = new ToastManager();
  window.toastManager = toastManager;
  confirmationDialog = new ConfirmationDialog();
  window.confirmationDialog = confirmationDialog;

  const sidebarScrollbarManager = new ScrollbarManager(".store-sidebar");

  const storeVisibilityManager = new StoreVisibilityManager();

  const productsTableManager = new ProductsTableManager();

  const storeDetailsManager = new StoreDetailsManager(
    productsTableManager,
    storeVisibilityManager,
    null,
  );

  productsTableManager.storeDetailsManager = storeDetailsManager;

  const productSortingManager = new ProductSortingManager(
    productsTableManager,
    storeDetailsManager,
  );

  productsTableManager.sortingManager = productSortingManager;
  storeDetailsManager.productSortingManager = productSortingManager;

  const productsSearchManager = new ProductsSearchManager(
    ".store-details-section__search input",
    ".store-details-section__reset-button",
    ".store-details-section__search-button",
    storeDetailsManager,
  );

  storeDetailsManager.productsSearchManager = productsSearchManager;

  const storeListManager = new StoreListManager(
    ".stores-items",
    storeDetailsManager,
  );

  const sidebarSearchManager = new StoreSearchManager(
    ".store-sidebar__search input",
    ".store-sidebar__reset-button",
    ".store-sidebar__search-button",
    storeListManager,
  );

  const modalManager = new ModalManager("#createStoreModal", storeListManager);
  const productModalManager = new ProductModalManager(
    "#createProductModal",
    storeListManager,
    productsTableManager,
    storeDetailsManager,
  );

  urlRouter = new URLRouter(storeListManager);
  window.urlRouter = urlRouter;

  window.storeListManager = storeListManager;
  window.sidebarSearchManager = sidebarSearchManager;
  window.productsSearchManager = productsSearchManager;
  window.storeDetailsManager = storeDetailsManager;

  const createStoreButton = document.querySelector(
    ".store-sidebar__footer-btn",
  );
  if (createStoreButton) {
    createStoreButton.addEventListener("click", () => {
      modalManager.openModal();
    });
  }

  const createProductButton = document.querySelector(
    ".store-details-section__footer-btn:not(.delete-btn)",
  );
  if (createProductButton) {
    createProductButton.addEventListener("click", () => {
      productModalManager.openModal();
    });
  }

  const deleteStoreButton = document.querySelector(
    ".store-details-section__footer-btn.delete-btn",
  );
  if (deleteStoreButton) {
    deleteStoreButton.addEventListener("click", async () => {
      await storeDetailsManager.deleteCurrentStore();
    });
  }
});
