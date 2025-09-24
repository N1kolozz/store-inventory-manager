/**
 * @fileoverview View layer for the vanilla JavaScript SPA.
 * Contains view classes for rendering UI components and handling user interactions.
 * Follows the MVC pattern with separation of concerns.
 */

import { FormValidator } from "./models.js";

/**
 * Base view class providing common functionality for all views.
 * Handles basic DOM element management and visibility control.
 * @class
 */
export class BaseView {
  /**
   * Creates a new BaseView instance.
   * @constructor
   * @param {string|HTMLElement} root - CSS selector string or DOM element to use as root
   */
  constructor(root) {
    this.root = typeof root === "string" ? document.querySelector(root) : root;
  }
}

/**
 * Preview view for store creation modal.
 * Shows a preview of the store being created in the store list.
 * @class
 * @private
 */
class StorePreviewView {
  /**
   * Creates a new StorePreviewView instance.
   * @constructor
   * @param {string} [containerSelector='.stores-items'] - CSS selector for the container element
   */
  constructor(containerSelector = ".stores-items") {
    this.container = document.querySelector(containerSelector);
    this.previewItem = null;
    this.isVisible = false;
    this.formData = { Name: "", Address: "", FloorArea: 0 };
  }
  _ensureItem() {
    if (!this.previewItem) {
      const listItem = document.createElement("li");
      listItem.className = "store-items__list";
      listItem.dataset.isPreview = "true";
      this.previewItem = listItem;
    }
  }
  update(formData) {
    this.formData = {
      Name: formData?.Name ?? this.formData.Name,
      Address: formData?.Address ?? this.formData.Address,
      FloorArea: formData?.FloorArea ?? this.formData.FloorArea,
    };
    if (!this.isVisible) return;
    this._render();
  }
  _render() {
    if (!this.previewItem) return;
    const floorArea = parseInt(this.formData.FloorArea || 0) || 0;
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
      </div>`;
  }
  showDefault() {
    this.formData = {
      Name: "New store",
      Address: "",
      FloorArea: 0,
    };
    this._ensureItem();
    this.isVisible = true;
    if (this.container) {
      if (this.container.firstChild)
        this.container.insertBefore(
          this.previewItem,
          this.container.firstChild,
        );
      else this.container.appendChild(this.previewItem);
    }
    this._render();
  }
  hide() {
    this.formData = { Name: "", Address: "", FloorArea: 0 };
    if (
      this.previewItem &&
      this.container &&
      this.container.contains(this.previewItem)
    ) {
      this.container.removeChild(this.previewItem);
    }
    this.isVisible = false;
  }
}

/**
 * View for rendering and managing the store list.
 * Handles store selection, highlighting, and user interactions.
 * @class
 * @extends BaseView
 */
export class StoreListView extends BaseView {
  /**
   * Creates a new StoreListView instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {string|HTMLElement} [options.container] - Container element for the store list
   * @param {Function} [options.onStoreClick] - Callback function for store click events
   */
  constructor({ container, onStoreClick } = {}) {
    super(container || ".stores-items");
    this.container = this.root;
    this.onStoreClick = onStoreClick;
    this.currentActiveItem = null;
  }

  /**
   * Renders the list of stores in the DOM.
   * Creates list items for each store with click handlers.
   * @param {Array<Store>} stores - Array of store objects to render
   */
  render(stores) {
    if (!this.root) return;
    this.root.innerHTML = "";
    if (!stores || stores.length === 0) {
      const listItem = document.createElement("li");
      listItem.className = "store-items__list";
      listItem.style.textAlign = "center";
      listItem.style.padding = "2rem";
      listItem.style.color = "var(--secondary-color)";
      listItem.innerHTML = "<p>No stores found.</p>";
      this.root.appendChild(listItem);
      return;
    }

    stores.forEach((store) => {
      const listItem = document.createElement("li");
      listItem.className = "store-items__list";
      listItem.dataset.storeId = store.id;
      listItem.innerHTML = `
        <div class="store-items__list-info">
          <div class="store-items__list-info-wrapper-left">
            <h2 class="store-items__list-info-name">${store.Name}</h2>
            <address class="store-items__list-info-address">${store.Address}</address>
          </div>
          <div class="store-items__list-info-wrapper-right">
            <h2 class="store-items__list-info-floor-area">${(store.FloorArea || 0).toLocaleString()}</h2>
            <p class="store-items__list-info-squareM">sq.m</p>
          </div>
          <img width="15px" class="store-items__right-arrow-icon" src="assets/icons/rightArrow-icon.svg" alt="">
        </div>`;
      listItem.addEventListener("click", (e) => {
        this.selectElement(listItem);
        this.onStoreClick && this.onStoreClick(store.id, { fromView: true });
      });
      this.root.appendChild(listItem);
    });
  }

  /**
   * Selects a store element and applies active styling.
   * Removes active class from previously selected element.
   * @param {HTMLElement} el - DOM element to select
   */
  selectElement(el) {
    if (this.currentActiveItem && this.currentActiveItem !== el) {
      this.currentActiveItem.classList.remove("active");
    }
    el.classList.add("active");
    this.currentActiveItem = el;
  }

  /**
   * Highlights a store by its ID.
   * Finds the store element and applies selection styling.
   * @param {string} storeId - ID of the store to highlight
   */
  highlightById(storeId) {
    if (!this.root) return;
    const storeElement = this.root.querySelector(`[data-store-id="${storeId}"]`);
    if (storeElement) this.selectElement(storeElement);
  }
}

class ProductPreviewView {
  constructor(tableBodySelector = ".products-table__body") {
    this.tableBody = document.querySelector(tableBodySelector);
    this.previewRow = null;
    this.isVisible = false;
    this.isEditMode = false;
    this.originalRow = null;
    this.originalRowHTML = "";
    this.formData = {
      Name: "",
      Price_amount: 0,
      Price_currency: "USD",
      Specs: "",
      SupplierInfo: "",
      MadeIn: "",
      ProductionCompanyName: "",
      Rating: 1,
    };
  }
  _ensureRow() {
    if (!this.previewRow) {
      const tableRow = document.createElement("tr");
      tableRow.className = "products-table__cell-row";
      tableRow.dataset.isPreview = "true";
      this.previewRow = tableRow;
    }
  }
  _stars(rating) {
    const ratingValue = parseInt(rating) || 0;
    let htmlContent = "";
    
    for (let starIndex = 1; starIndex <= 5; starIndex++) {
      const isFilledStar = starIndex <= ratingValue;
      const iconName = isFilledStar ? "goldStar-icon.svg" : "grayStar-icon.svg";
      
      htmlContent += `<img src="assets/icons/${iconName}" class="star-rating__icon" alt="star">`;
    }
    
    return `<div class="star-rating">${htmlContent}</div>`;
  }
  _render() {
    if (!this.previewRow) return;
    const price = parseFloat(this.formData.Price_amount || 0) || 0;
    this.previewRow.innerHTML = `
      <td class="products-table__cell bold-cell__text">${this.formData.Name || "New product"}</td>
      <td class="products-table__cell ellipsis-wrapper bold-cell__text">${price.toLocaleString()}<span class="muted-usd"> ${this.formData.Price_currency || "USD"}</span></td>
      <td class="products-table__cell ellipsis-wrapper">${this.formData.Specs || ""}</td>
      <td class="products-table__cell ellipsis-wrapper">${this.formData.SupplierInfo || ""}</td>
      <td class="products-table__cell ellipsis-wrapper">${this.formData.MadeIn || ""}</td>
      <td class="products-table__cell ellipsis-wrapper">${this.formData.ProductionCompanyName || ""}</td>
      <td class="products-table__cell">${this._stars(this.formData.Rating)}</td>
      <td class="products-table__cell edit-cell__icons">
        <img width="20" height="20" src="assets/icons/edit-icon.svg" alt="Edit" class="edit-btn">
        <img width="20" height="20" src="assets/icons/blueDelete-icon.svg" alt="Delete" class="row-delete-btn">
      </td>`;
  }
  update(formData) {
    this.formData = {
      ...this.formData,
      ...(formData || {}),
    };
    if (this.isEditMode && this.originalRow) {
      const tmp = document.createElement("tbody");
      this._ensureRow();
      this._render();
      tmp.appendChild(this.previewRow.cloneNode(true));
      this.originalRow.innerHTML = tmp.firstChild.innerHTML;
    } else if (this.isVisible) {
      this._render();
    }
  }
  setEditMode(rowEl) {
    this.isEditMode = true;
    this.originalRow = rowEl || null;
    if (this.originalRow && !this.originalRowHTML) {
      this.originalRowHTML = this.originalRow.innerHTML;
    }
    if (
      this.previewRow &&
      this.tableBody &&
      this.tableBody.contains(this.previewRow)
    ) {
      this.tableBody.removeChild(this.previewRow);
      this.isVisible = false;
    }
  }
  clearEditMode() {
    this.isEditMode = false;
    this.originalRow = null;
    this.originalRowHTML = "";
  }
  showDefault() {
    this.clearEditMode();
    this.formData = {
      Name: "New product",
      Price_amount: 0,
      Price_currency: "USD",
      Specs: "",
      SupplierInfo: "",
      MadeIn: "",
      ProductionCompanyName: "",
      Rating: 1,
    };
    this._ensureRow();
    if (!this.tableBody)
      this.tableBody = document.querySelector(".products-table__body");
    if (!this.tableBody) return;
    if (!this.isVisible) {
      if (this.tableBody.firstChild)
        this.tableBody.insertBefore(this.previewRow, this.tableBody.firstChild);
      else this.tableBody.appendChild(this.previewRow);
    }
    this.isVisible = true;
    this._render();
  }
  showForEdit(rowEl, initialData) {
    this.setEditMode(rowEl);
    if (initialData) {
      this.formData = { ...this.formData, ...initialData };
    }
    this.update({});
  }
  hide() {
    if (this.isEditMode) {
      if (this.originalRow && this.originalRowHTML) {
        this.originalRow.innerHTML = this.originalRowHTML;
      }
      this.clearEditMode();
      return;
    }
    if (
      this.previewRow &&
      this.tableBody &&
      this.tableBody.contains(this.previewRow)
    ) {
      this.tableBody.removeChild(this.previewRow);
    }
    this.isVisible = false;
    this.formData = {
      Name: "",
      Price_amount: 0,
      Price_currency: "USD",
      Specs: "",
      SupplierInfo: "",
      MadeIn: "",
      ProductionCompanyName: "",
      Rating: 1,
    };
  }
}

/**
 * Modal view for creating and editing products.
 * Handles form validation, preview updates, and modal lifecycle.
 * @class
 */
export class ProductModalView {
  /**
   * Creates a new ProductModalView instance.
   * @constructor
   * @param {Object} [options={}] - Configuration options
   * @param {string} [options.modal='#createProductModal'] - Modal element selector
   * @param {string} [options.form='#createProductForm'] - Form element selector
   * @param {string} [options.createBtn='#createProductBtn'] - Create button selector
   * @param {string} [options.cancelBtn='#cancelProductBtn'] - Cancel button selector
   */
  constructor({
    modal = "#createProductModal",
    form = "#createProductForm",
    createBtn = "#createProductBtn",
    cancelBtn = "#cancelProductBtn",
  } = {}) {
    this.modal = document.querySelector(modal);
    this.form = document.querySelector(form);
    this.createBtn = document.querySelector(createBtn);
    this.cancelBtn = document.querySelector(cancelBtn);
    this.modalTitle = this.modal?.querySelector(".modal-title");
    this.isEditMode = false;
    this.editingProductId = null;
    if (this.cancelBtn)
      this.cancelBtn.addEventListener("click", () => this.close());
    if (this.modal)
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.close();
      });
    if (this.form) FormValidator.setupRealTimeValidation(this.form);

    this.previewView = new ProductPreviewView();
    if (this.form) {
      this.form.addEventListener("input", () => {
        const formData = new FormData(this.form);
        this.previewView.update({
          Name: (formData.get("productName") || "").toString(),
          Price_amount: parseFloat(formData.get("productPrice") || "0") || 0,
          Specs: (formData.get("productSpecs") || "").toString(),
          SupplierInfo: (formData.get("productSupplierInfo") || "").toString(),
          MadeIn: (formData.get("productCountryOfOrigin") || "").toString(),
          ProductionCompanyName: (formData.get("productCompany") || "").toString(),
          Rating: parseInt(formData.get("productRating") || "1") || 1,
        });
      });
    }
  }
  /**
   * Opens the modal in create mode for adding a new product.
   */
  openCreate() {
    this.isEditMode = false;
    this.editingProductId = null;
    if (this.modalTitle) this.modalTitle.textContent = "Create new product";
    if (this.createBtn) this.createBtn.textContent = "Create";
    if (this.form) {
      this.form.reset();
      FormValidator.clearAllErrors(this.form);
    }
    this._open();
    this.previewView.showDefault();
  }
  /**
   * Opens the modal in edit mode for modifying an existing product.
   * @param {Object} product - Product object to edit
   */
  openEdit(product) {
    this.isEditMode = true;
    this.editingProductId = product?.ID;
    if (this.modalTitle) this.modalTitle.textContent = "Edit product";
    if (this.createBtn) this.createBtn.textContent = "Save";
    if (this.form && product) {
      FormValidator.clearAllErrors(this.form);
      this.form.querySelector('[name="productName"]').value =
        product.Name || "";
      this.form.querySelector('[name="productPrice"]').value =
        product.Price_amount || "";
      this.form.querySelector('[name="productSpecs"]').value =
        product.Specs || "";
      this.form.querySelector('[name="productRating"]').value =
        product.Rating || "";
      this.form.querySelector('[name="productSupplierInfo"]').value =
        product.SupplierInfo || "";
      this.form.querySelector('[name="productCountryOfOrigin"]').value =
        product.MadeIn || "";
      this.form.querySelector('[name="productCompany"]').value =
        product.ProductionCompanyName || "";
      this.form.querySelector('[name="productStatus"]').value =
        product.Status || "OK";
    }
    this._open();

    this.previewView.hide();

    const row = document.querySelector(
      `tr.products-table__cell-row[data-product-id="${product?.ID}"]`,
    );
    this._currentRowEl = row || null;
    if (this._currentRowEl)
      this.previewView.showForEdit(this._currentRowEl, {
        Name: product.Name || "",
        Price_amount: parseFloat(product.Price_amount || 0) || 0,
        Price_currency: product.Price_currency || "USD",
        Specs: product.Specs || "",
        SupplierInfo: product.SupplierInfo || "",
        MadeIn: product.MadeIn || "",
        ProductionCompanyName: product.ProductionCompanyName || "",
        Rating: parseInt(product.Rating || 1) || 1,
      });
  }
  _open() {
    if (!this.modal) return;
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const first = this.form?.querySelector("input");
      first && first.focus();
    }, 50);
  }
  /**
   * Closes the modal and resets its state.
   * Clears form data, validation errors, and preview.
   */
  close() {
    if (!this.modal) return;
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    this.previewView.hide();

    if (this.form) {
      this.form.reset();
      FormValidator.clearAllErrors(this.form);
    }
    this.isEditMode = false;
    this.editingProductId = null;
    this._currentRowEl = null;
  }
  /**
   * Binds the submit callback to form submission events.
   * @param {Function} onSubmit - Callback function to handle form submission
   */
  bindSubmit(onSubmit) {
    if (this.createBtn)
      this.createBtn.addEventListener("click", () => this._submit(onSubmit));
    if (this.form)
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this._submit(onSubmit);
      });
  }
  _submit(onSubmit) {
    if (!this.form) return;
    if (!FormValidator.validateProductForm(this.form)) return;
    const formData = new FormData(this.form);
    const data = {
      Name: (formData.get("productName") || "").trim(),
      Price_amount: parseFloat(formData.get("productPrice") || "0") || 0,
      Price_currency: "USD",
      Specs: (formData.get("productSpecs") || "").trim(),
      Rating: parseInt(formData.get("productRating") || "0") || 0,
      SupplierInfo: (formData.get("productSupplierInfo") || "").trim(),
      MadeIn: (formData.get("productCountryOfOrigin") || "").trim(),
      ProductionCompanyName: (formData.get("productCompany") || "").trim(),
      Status: formData.get("productStatus") || "OK",
    };
    onSubmit &&
      onSubmit({
        data,
        isEdit: this.isEditMode,
        id: this.editingProductId,
      });
  }
}

export class StoreModalView {
  constructor({
    modal = "#createStoreModal",
    form = "#createStoreForm",
    createBtn = "#createStoreBtn",
    cancelBtn = "#cancelStoreBtn",
  } = {}) {
    this.modal = document.querySelector(modal);
    this.form = document.querySelector(form);
    this.createBtn = document.querySelector(createBtn);
    this.cancelBtn = document.querySelector(cancelBtn);
    this.isEditMode = false;
    this.editingStoreId = null;
    if (this.cancelBtn)
      this.cancelBtn.addEventListener("click", () => this.close());
    if (this.modal)
      this.modal.addEventListener("click", (e) => {
        if (e.target === this.modal) this.close();
      });
    if (this.form) FormValidator.setupRealTimeValidation(this.form);
    // Preview
    this.previewView = new StorePreviewView();
    if (this.form) {
      this.form.addEventListener("input", () => {
        const formData = new FormData(this.form);
        this.previewView.update({
          Name: (formData.get("storeName") || "").toString(),
          Address: (formData.get("storeAddress") || "").toString(),
          FloorArea: parseInt(formData.get("storeFloorArea") || "0") || 0,
        });
      });
    }
  }
  openCreate() {
    this.isEditMode = false;
    this.editingStoreId = null;
    if (this.createBtn) this.createBtn.textContent = "Create";
    if (this.form) {
      this.form.reset();
      FormValidator.clearAllErrors(this.form);
    }
    this._open();
    this.previewView.showDefault();
  }
  openEdit(store) {
    this.isEditMode = true;
    this.editingStoreId = store?.id;
    if (this.createBtn) this.createBtn.textContent = "Save";
    if (this.form && store) {
      FormValidator.clearAllErrors(this.form);
      this.form.querySelector('[name="storeName"]').value = store.Name || "";
      this.form.querySelector('[name="storeEmail"]').value = store.Email || "";
      this.form.querySelector('[name="storePhone"]').value =
        store.PhoneNumber || "";
      this.form.querySelector('[name="storeAddress"]').value =
        store.Address || "";
      if (store.Established) {
        const establishedDate = new Date(store.Established);
        const local = new Date(establishedDate.getTime() - establishedDate.getTimezoneOffset() * 60000);
        this.form.querySelector('[name="storeEstablished"]').value = local
          .toISOString()
          .slice(0, 16);
      }
      this.form.querySelector('[name="storeFloorArea"]').value =
        store.FloorArea || "";
    }
    this._open();
    this.previewView.showDefault();
    const formData = new FormData(this.form);
    this.previewView.update({
      Name: (formData.get("storeName") || "").toString(),
      Address: (formData.get("storeAddress") || "").toString(),
      FloorArea: parseInt(formData.get("storeFloorArea") || "0") || 0,
    });
  }
  _open() {
    if (!this.modal) return;
    this.modal.classList.add("show");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const first = this.form?.querySelector("input");
      if (first) first.focus();
    }, 50);
  }
  close() {
    if (!this.modal) return;
    this.modal.classList.remove("show");
    document.body.style.overflow = "";
    this.previewView.hide();
    if (this.form) {
      this.form.reset();
      FormValidator.clearAllErrors(this.form);
    }
    this.isEditMode = false;
    this.editingStoreId = null;
  }
  bindSubmit(onSubmit) {
    if (this.createBtn)
      this.createBtn.addEventListener("click", () => this._submit(onSubmit));
    if (this.form)
      this.form.addEventListener("submit", (e) => {
        e.preventDefault();
        this._submit(onSubmit);
      });
  }
  _submit(onSubmit) {
    if (!this.form) return;
    if (!FormValidator.validateStoreForm(this.form)) return;
    const formData = new FormData(this.form);
    let established = (formData.get("storeEstablished") || "").toString();
    let isoDate = "";
    if (established) {
      const establishedDate = new Date(established);
      if (!isNaN(establishedDate.getTime())) isoDate = establishedDate.toISOString();
    }
    const data = {
      Name: (formData.get("storeName") || "").trim(),
      Email: (formData.get("storeEmail") || "").trim(),
      PhoneNumber: (formData.get("storePhone") || "").trim(),
      Address: (formData.get("storeAddress") || "").trim(),
      Established: isoDate,
      FloorArea: parseInt(formData.get("storeFloorArea") || "0") || 0,
    };
    onSubmit &&
      onSubmit({
        data,
        isEdit: this.isEditMode,
        id: this.editingStoreId,
      });
  }
}

/**
 * View for displaying store details and product statistics.
 * Manages store information display and product count updates.
 * @class
 * @extends BaseView
 */
export class StoreDetailsView extends BaseView {
  /**
   * Creates a new StoreDetailsView instance.
   * @constructor
   */
  constructor() {
    super(document.querySelector(".store-details-section"));
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
    this.visibilityManager = new StoreVisibilityManager();
  }

  setNoSelectionVisible(visible) {
    if (this.noStoreSelected)
      this.noStoreSelected.style.display = visible ? "block" : "none";
    if (this.infoBlock) this.infoBlock.style.display = visible ? "none" : "";
  }

  clear() {
    if (!this.elements) return;
    this.elements.email.textContent = "-";
    this.elements.phone.textContent = "-";
    this.elements.address.textContent = "-";
    this.elements.established.textContent = "-";
    this.elements.floorArea.textContent = "-";
    this.visibilityManager.onNoStoreSelected();
  }

  /**
   * Renders store details in the view.
   * Updates all store information fields and shows the store content.
   * @param {Store|null} store - Store object to render, or null to clear
   */
  render(store) {
    if (!store) {
      this.clear();
      return;
    }
    this.visibilityManager.onStoreSelected();
    const formatDate = (dateString) => {
      if (!dateString) return "Not specified";
      try {
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) return "Invalid date format";
        return parsedDate.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch {
        return "Date format error";
      }
    };
    this.elements.email.textContent = store.Email || "-";
    this.elements.phone.textContent = store.PhoneNumber || "-";
    this.elements.address.textContent = store.Address || "-";
    this.elements.established.textContent = formatDate(store.Established);
    this.elements.floorArea.textContent = (
      store.FloorArea || 0
    ).toLocaleString();
    this.setNoSelectionVisible(false);
  }

  /**
   * Updates the product count displays.
   * @param {Object} counts - Object containing product counts by status
   * @param {number} counts.ALL - Total product count
   * @param {number} counts.OK - Count of products with OK status
   * @param {number} counts.STORAGE - Count of products in storage
   * @param {number} counts.OUT_OF_STOCK - Count of out-of-stock products
   */
  setCounts(counts) {
    if (!counts) return;
    if (this.elements.itemsQuantity)
      this.elements.itemsQuantity.textContent = counts.ALL ?? 0;
    if (this.elements.statusOk)
      this.elements.statusOk.textContent = counts.OK ?? 0;
    if (this.elements.statusStorage)
      this.elements.statusStorage.textContent = counts.STORAGE ?? 0;
    if (this.elements.statusOutOfStock)
      this.elements.statusOutOfStock.textContent = counts.OUT_OF_STOCK || 0;
  }

  /**
   * Binds click handlers to status filter elements.
   * @param {Function} onFilter - Callback function for filter changes
   */
  bindStatusFilters(onFilter) {
    const statusItems = document.querySelectorAll(
      ".store-details-section__status-item",
    );
    const allItem = document.querySelector(
      ".store-details-section__status-item-quantity",
    );
    const statuses = ["OK", "STORAGE", "OUT_OF_STOCK"];

    const clearActive = () => {
      document
        .querySelectorAll(
          ".store-details-section__status-item, .store-details-section__status-item-quantity",
        )
        .forEach((el) => el.classList.remove("active"));
    };

    statusItems.forEach((el, idx) => {
      el.addEventListener("click", () => {
        clearActive();
        el.classList.add("active");
        onFilter && onFilter(statuses[idx] || null);
      });
    });

    if (allItem) {
      allItem.addEventListener("click", () => {
        clearActive();
        allItem.classList.add("active");
        onFilter && onFilter(null);
      });

      allItem.classList.add("active");
    }
  }
}

export class StoreSearchView {
  constructor({
    input = ".store-sidebar__search input",
    resetBtn = ".store-sidebar__reset-button",
    searchBtn = ".store-sidebar__search-button",
    onSearch,
  } = {}) {
    this.input = document.querySelector(input);
    this.resetBtn = document.querySelector(resetBtn);
    this.searchBtn = document.querySelector(searchBtn);
    this.onSearch = onSearch;
    this._visibleReset = false;
    this._bind();
  }
  _bind() {
    if (this.input) {
      this.input.addEventListener("input", (e) => {
        const inputValue = e.target.value.trim();
        this._toggleReset(inputValue.length > 0);
      });
      this.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this._doSearch();
        }
      });
    }
    if (this.searchBtn)
      this.searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this._doSearch();
      });
    if (this.resetBtn)
      this.resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.clear();
      });
    this._toggleReset(false);
  }
  _doSearch() {
    this.onSearch &&
      this.onSearch((this.input?.value || "").trim().toLowerCase());
  }
  clear() {
    if (this.input) this.input.value = "";
    this._toggleReset(false);
    this._doSearch();
  }
  _toggleReset(show) {
    if (!this.resetBtn) return;
    this.resetBtn.style.display = show ? "block" : "none";
    this._visibleReset = show;
  }
}

/**
 * View for rendering and managing the products table.
 * Handles product display, sorting, and row actions.
 * @class
 * @extends BaseView
 */
export class ProductTableView extends BaseView {
  /**
   * Creates a new ProductTableView instance.
   * @constructor
   * @param {string} [root='.products-table__body'] - CSS selector for the table body element
   */
  constructor(root = ".products-table__body") {
    super(root);
  }
  /**
   * Clears all content from the table body.
   */
  clear() {
    if (this.root) this.root.innerHTML = "";
  }
  /**
   * Shows a "No data" message in the table.
   */
  showNoData() {
    if (!this.root) return;
    this.root.innerHTML = `
      <tr class="products-table__cell-row" style="display: flex; justify-content: center;">
        <td class="products-table__cell" colspan="8" style="color: var(--primary-color); font-size: 0.9rem; font-weight: 500;">No data</td>
      </tr>`;
  }
  /**
   * Renders the products table with the provided product data.
   * Creates table rows with product information and action buttons.
   * @param {Array} [products=[]] - Array of product objects to render
   */
  render(products = []) {
    if (!this.root) return;
    if (!products.length) {
      this.showNoData();
      return;
    }
    this.root.innerHTML = "";
    products.forEach((product) => {
      const tableRow = document.createElement("tr");
      tableRow.className = "products-table__cell-row";
      tableRow.dataset.productId = product.ID;
      tableRow.innerHTML = `
        <td class="products-table__cell bold-cell__text">${product.Name}</td>
        <td class="products-table__cell ellipsis-wrapper bold-cell__text">${(parseFloat(product.Price_amount) || 0).toLocaleString()}<span class="muted-usd"> ${product.Price_currency || "USD"}</span></td>
        <td class="products-table__cell ellipsis-wrapper">${product.Specs ?? ""}</td>
        <td class="products-table__cell ellipsis-wrapper">${product.SupplierInfo ?? ""}</td>
        <td class="products-table__cell ellipsis-wrapper">${product.MadeIn ?? ""}</td>
        <td class="products-table__cell ellipsis-wrapper">${product.ProductionCompanyName ?? ""}</td>
        <td class="products-table__cell">${this._stars(product.Rating)}</td>
        <td class="products-table__cell edit-cell__icons">
          <img width="20" height="20" src="assets/icons/edit-icon.svg" alt="Edit" class="edit-btn">
          <img width="20" height="20" src="assets/icons/blueDelete-icon.svg" alt="Delete" class="row-delete-btn">
        </td>`;
      this.root.appendChild(tableRow);
    });
  }
  /**
   * Generates HTML for star rating display.
   * @private
   * @param {number} rating - Rating value (1-5)
   * @returns {string} HTML string for star rating
   */
  _stars(rating) {
    const ratingValue = parseInt(rating) || 0;
    let htmlContent = "";
    
    for (let starIndex = 1; starIndex <= 5; starIndex++) {
      const isFilledStar = starIndex <= ratingValue;
      const iconName = isFilledStar ? "goldStar-icon.svg" : "grayStar-icon.svg";
      
      htmlContent += `<img src="assets/icons/${iconName}" class="star-rating__icon" alt="star">`;
    }
    
    return `<div class="star-rating">${htmlContent}</div>`;
  }

  bindSorting(onSort) {
    const headers = document.querySelectorAll(
      ".products-table__header.sortable",
    );
    headers.forEach((header) => {
      header.addEventListener("click", () => {
        const field = header.dataset.sortField;
        onSort && onSort(field);
      });
    });
  }

  updateSortIcons(activeField, direction) {
    const headers = document.querySelectorAll(
      ".products-table__header.sortable",
    );
    headers.forEach((header) => {
      const icon = header.querySelector(".sort-icon");
      if (!icon) return;
      if (header.dataset.sortField === activeField) {
        icon.src =
          direction === "asc"
            ? "assets/icons/sortingUp-icon.svg"
            : "assets/icons/sortingDown-icon.svg";
      } else {
        icon.src = "assets/icons/reverseArrows-icon.svg";
      }
    });
  }

  /**
   * Binds click handlers for edit and delete actions on table rows.
   * @param {Function} onEdit - Callback function for edit button clicks
   * @param {Function} onDelete - Callback function for delete button clicks
   */
  bindRowActions(onEdit, onDelete) {
    if (!this.root) return;
    this.root.addEventListener("click", (e) => {
      const productId = e.target.closest("tr")?.dataset?.productId;
      if (!productId) return;
      if (e.target.classList.contains("edit-btn")) {
        e.stopPropagation();
        onEdit && onEdit(productId);
      } else if (e.target.classList.contains("row-delete-btn")) {
        e.stopPropagation();
        onDelete && onDelete(productId);
      }
    });
  }
}

export class ProductsSearchView {
  constructor({
    input = ".store-details-section__search input",
    resetBtn = ".store-details-section__reset-button",
    searchBtn = ".store-details-section__search-button",
    onSearch,
  } = {}) {
    this.input = document.querySelector(input);
    this.resetBtn = document.querySelector(resetBtn);
    this.searchBtn = document.querySelector(searchBtn);
    this.onSearch = onSearch;
    this._bind();
  }
  _bind() {
    if (this.input) {
      this.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this._doSearch();
        }
      });
      this.input.addEventListener("input", (e) => {
        const inputValue = e.target.value.trim();
        if (this.resetBtn) this.resetBtn.style.display = inputValue ? "block" : "none";
      });
    }
    if (this.searchBtn)
      this.searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this._doSearch();
      });
    if (this.resetBtn)
      this.resetBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.clear();
      });
    if (this.resetBtn) this.resetBtn.style.display = "none";
  }
  _doSearch() {
    this.onSearch &&
      this.onSearch((this.input?.value || "").trim().toLowerCase());
  }
  clear() {
    if (this.input) this.input.value = "";
    if (this.resetBtn) this.resetBtn.style.display = "none";
    this._doSearch();
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
      if (element) element.style.display = "none";
    });
    if (this.storeTitle) this.storeTitle.style.marginBottom = "unset";
  }
  showStoreContent() {
    Object.values(this.elementsToHide).forEach((element) => {
      if (element) element.style.display = "";
    });
    if (this.storeTitle) this.storeTitle.style.marginBottom = "";
  }
  showNoStoreSelected() {
    if (this.noStoreSelected) this.noStoreSelected.style.display = "block";
  }
  hideNoStoreSelected() {
    if (this.noStoreSelected) this.noStoreSelected.style.display = "none";
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
