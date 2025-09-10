import { Stores } from "./data.js";


class StoreSearchManager {
    constructor(searchInputSelector, resetButtonSelector, searchButtonSelector, storeListManager) {
        this.searchInput = document.querySelector(searchInputSelector);
        this.resetButton = document.querySelector(resetButtonSelector);
        this.searchButton = document.querySelector(searchButtonSelector);
        this.storeListManager = storeListManager;
        this.isVisible = false;
        this.allStores = [];
        this.filteredStores = [];
        

        if (this.storeListManager) {
            this.allStores = this.storeListManager.getStores();
            this.filteredStores = [...this.allStores];
        }
        
        this.hideResetButton();
        

        this.searchInput.addEventListener('input', this.handleInputChange);
        this.searchInput.addEventListener('keypress', this.handleKeyPress);
        this.searchButton.addEventListener('click', this.handleSearchClick);
        this.resetButton.addEventListener('click', this.handleResetClick);
    }
    
    handleInputChange = (event) => {
        const value = event.target.value.trim();
        
        if (value.length > 0) {
            this.showResetButton();
        } else {
            this.hideResetButton();
        }
    }
    
    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.performSearch();
        }
    }
    
    handleSearchClick = (event) => {
        event.preventDefault();
        this.performSearch();
    }
    
    handleResetClick = (event) => {
        event.preventDefault();
        this.clearSearch();
    }
    
    performSearch() {
        const searchTerm = this.searchInput.value.trim();
        
        if (searchTerm === '') {

            this.filteredStores = [...this.allStores];
        } else {
            this.filteredStores = this.allStores.filter(store => {
                return this.matchesSearchTerm(store, searchTerm.toLowerCase());
            });
        }
        

        this.updateStoreList();

    }
    
    matchesSearchTerm(store, searchTerm) {

        const fieldsToSearch = [
            store.name,
            store.email,
            store.phoneNumber,
            store.address,
            store.floorArea.toString()
        ];
        

        return fieldsToSearch.some(field => {
            return field && field.toLowerCase().includes(searchTerm);
        });
    }
    
    updateStoreList() {

        const container = this.storeListManager.container;
        container.innerHTML = '';
        
        if (this.filteredStores.length === 0) {

            const noResultsElement = document.createElement('li');
            noResultsElement.className = 'store-items__list';
            noResultsElement.style.textAlign = 'center';
            noResultsElement.style.padding = '2rem';
            noResultsElement.style.color = 'var(--secondary-color)';
            noResultsElement.innerHTML = '<p>No stores found matching your search.</p>';
            container.appendChild(noResultsElement);
        } else {

            this.filteredStores.forEach((store, index) => {
                const storeElement = this.storeListManager.createStoreElement(store, index);
                container.appendChild(storeElement);
            });
            

            this.storeListManager.attachEventListeners();
        }
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.hideResetButton();
        

        this.filteredStores = [...this.allStores];
        this.updateStoreList();

    }
    
    showResetButton() {
        if (!this.isVisible) {
            this.resetButton.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hideResetButton() {
        if (this.isVisible) {
            this.resetButton.style.display = 'none';
            this.isVisible = false;
        }
    }
    

    updateStores(newStores) {
        this.allStores = newStores;
        this.filteredStores = [...this.allStores];
        this.updateStoreList();
    }
}


class SearchManager {
    constructor(searchInputSelector, resetButtonSelector) {
        this.searchInput = document.querySelector(searchInputSelector);
        this.resetButton = document.querySelector(resetButtonSelector);
        this.isVisible = false;
        
        this.hideResetButton();
        

        this.searchInput.addEventListener('input', this.handleInputChange);
        this.resetButton.addEventListener('click', this.handleResetClick);
    }
    
    handleInputChange = (event) => {
        const value = event.target.value.trim();
        
        if (value.length > 0) {
            this.showResetButton();
        } else {
            this.hideResetButton();
        }
    }

    handleResetClick = (event) => {
        event.preventDefault();
        this.clearSearch();
    }
    
    showResetButton() {
        if (!this.isVisible) {
            this.resetButton.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hideResetButton() {
        if (this.isVisible) {
            this.resetButton.style.display = 'none';
            this.isVisible = false;
        }
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.hideResetButton();
    }
}


class ProductsSearchManager {
    constructor(searchInputSelector, resetButtonSelector, searchButtonSelector, productsTableManager) {
        this.searchInput = document.querySelector(searchInputSelector);
        this.resetButton = document.querySelector(resetButtonSelector);
        this.searchButton = document.querySelector(searchButtonSelector);
        this.productsTableManager = productsTableManager;
        this.isVisible = false;
        this.allProducts = [];
        this.filteredProducts = [];
        this.currentStore = null;
        
        this.hideResetButton();
        

        this.searchInput.addEventListener('input', this.handleInputChange);
        this.searchInput.addEventListener('keypress', this.handleKeyPress);
        this.searchButton.addEventListener('click', this.handleSearchClick);
        this.resetButton.addEventListener('click', this.handleResetClick);
    }
    
    handleInputChange = (event) => {
        const value = event.target.value.trim();
        
        if (value.length > 0) {
            this.showResetButton();
        } else {
            this.hideResetButton();
        }
    }
    
    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.performSearch();
        }
    }
    
    handleSearchClick = (event) => {
        event.preventDefault();
        this.performSearch();
    }
    
    handleResetClick = (event) => {
        event.preventDefault();
        this.clearSearch();
    }
    
    performSearch() {
        const searchTerm = this.searchInput.value.trim();
        
        if (searchTerm === '') {

            this.filteredProducts = [...this.allProducts];
        } else {
            this.filteredProducts = this.allProducts.filter(product => {
                return this.matchesSearchTerm(product, searchTerm.toLowerCase());
            });
        }
        

        this.updateProductsTable();
    }
    
    matchesSearchTerm(product, searchTerm) {

        const fieldsToSearch = [
            product.Name,
            product.Specs,
            product.SupplierInfo,
            product.MadeIn,
            product.ProductionCompanyName,
            product.Price.toString(),
            product.Rating.toString()
        ];
        
        return fieldsToSearch.some(field => {
            return field && field.toLowerCase().includes(searchTerm);
        });
    }
    
    updateProductsTable() {
        if (this.filteredProducts.length === 0) {

            this.productsTableManager.showNoResults();
        } else {

            this.productsTableManager.updateProducts(this.filteredProducts);
        }
    }
    
    clearSearch() {
        this.searchInput.value = '';
        this.hideResetButton();
        
        if (this.currentStore) {

            this.filteredProducts = [...this.allProducts];
            this.updateProductsTable();
        }

    }
    

    updateStoreProducts(store) {
        this.currentStore = store;
        if (store && store.products) {
            this.allProducts = store.products;
            this.filteredProducts = [...this.allProducts];
            

            this.searchInput.value = '';
            this.hideResetButton();
        } else {
            this.allProducts = [];
            this.filteredProducts = [];
            this.currentStore = null;
        }
    }
    
    showResetButton() {
        if (!this.isVisible) {
            this.resetButton.style.display = 'block';
            this.isVisible = true;
        }
    }
    
    hideResetButton() {
        if (this.isVisible) {
            this.resetButton.style.display = 'none';
            this.isVisible = false;
        }
    }
}

class ScrollbarManager {
    constructor(elementSelector) {
        this.element = document.querySelector(elementSelector);
        this.isScrolling = false;
        this.scrollTimeout = null;
        
        this.hideScrollbar();
        
        this.element.addEventListener('scroll', this.handleScroll);
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
    }
    
    showScrollbar() {
        this.element.style.setProperty('--scrollbar-width', '7px');
        this.element.style.setProperty('--scrollbar-opacity', '1');
    }
    
    hideScrollbar() {
        this.element.style.setProperty('--scrollbar-width', '7px');
        this.element.style.setProperty('--scrollbar-opacity', '0.2');
    }
}


const sidebarScrollbarManager = new ScrollbarManager('.store-sidebar');


class StoreDetailsManager {
    constructor(productsTableManager, storeVisibilityManager, productsSearchManager) {
        this.elements = {
            email: document.getElementById('storeEmail'),
            phone: document.getElementById('storePhone'),
            address: document.getElementById('storeAddress'),
            established: document.getElementById('storeEstablished'),
            floorArea: document.getElementById('storeFloorArea'),
            itemsQuantity: document.getElementById('itemsQuantity'),
            statusOk: document.getElementById('statusOk'),
            statusStorage: document.getElementById('statusStorage'),
            statusOutOfStock: document.getElementById('statusOutOfStock')
        };
        
        this.productsTableManager = productsTableManager;
        this.storeVisibilityManager = storeVisibilityManager;
        this.productsSearchManager = productsSearchManager;
        
        this.clearDetails();
    }
    
    updateDetails(store) {
        if (!store) {
            this.clearDetails();
            return;
        }
        
        if (this.storeVisibilityManager) {
            this.storeVisibilityManager.onStoreSelected();
        }
        
        this.elements.email.textContent = store.email;
        this.elements.phone.textContent = store.phoneNumber;
        this.elements.address.textContent = store.address;
        this.elements.established.textContent = this.formatDate(store.established);
        this.elements.floorArea.textContent = store.floorArea.toLocaleString();
        this.elements.itemsQuantity.textContent = store.products.length;
        
        const statusCounts = this.getProductStatusCounts(store.products);
        this.elements.statusOk.textContent = statusCounts.OK;
        this.elements.statusStorage.textContent = statusCounts.STORAGE;
        this.elements.statusOutOfStock.textContent = statusCounts.OUT_OF_STOCK;
        
        if (this.productsSearchManager) {
            this.productsSearchManager.updateStoreProducts(store);
        }
        
        if (this.productsTableManager) {
            this.productsTableManager.updateProducts(store.products);
        }
    }
    
    clearDetails() {
        if (this.storeVisibilityManager) {
            this.storeVisibilityManager.onNoStoreSelected();
        }
        
        if (this.productsSearchManager) {
            this.productsSearchManager.updateStoreProducts(null);
        }
           
        if (this.productsTableManager) {
            this.productsTableManager.clearTable();
        }
    }
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const dateOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC'
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
            timeZone: 'UTC'
        };
        
        const formattedDate = date.toLocaleDateString('en-US', dateOptions);
        const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
        
        return `${formattedDate}, ${formattedTime}`;
    }

    getProductStatusCounts(products) {
        const statusCounts = {
            OK: 0,
            STORAGE: 0,
            OUT_OF_STOCK: 0
        };
        
        products.forEach(product => {
            if (statusCounts.hasOwnProperty(product.Status)) {
                statusCounts[product.Status]++;
            }
        });
        
        return statusCounts;
    }
}


class ProductsTableManager {
    constructor() {
        this.tableBody = document.querySelector('.products-table__body');
        
        this.clearTable();
    }
    
    updateProducts(products) {
        if (!products || products.length === 0) {
            this.clearTable();
            return;
        }
        
        this.tableBody.innerHTML = '';
        
        products.forEach(product => {
            const row = this.createProductRow(product);
            this.tableBody.appendChild(row);
        });
    }
    
    createProductRow(product) {
        const tr = document.createElement('tr');
        tr.className = 'products-table__cell-row';
        
        tr.innerHTML = `
            <td class="products-table__cell bold-cell__text">${product.Name}</td>
            <td class="products-table__cell ellipsis-wrapper bold-cell__text">${this.formatPrice(product.Price)}<span class="muted-usd"> USD</span></td>
            <td class="products-table__cell ellipsis-wrapper">${product.Specs}</td>
            <td class="products-table__cell ellipsis-wrapper">${product.SupplierInfo}</td>
            <td class="products-table__cell ellipsis-wrapper">${product.MadeIn}</td>
            <td class="products-table__cell ellipsis-wrapper">${product.ProductionCompanyName}</td>
            <td class="products-table__cell">${this.generateStarRating(product.Rating)}</td>
            <td class="products-table__cell ellipsis-wrapper edit-cell__icons">
                <img width="20px" src="assets/icons/edit-icon.svg" alt="">
                <img width="20px" src="assets/icons/blueDelete-icon.svg" alt="">
            </td>
        `;
        
        return tr;
    }
    
    formatPrice(price) {
        return price.toLocaleString();
    }
    
    generateStarRating(rating) {
        let starsHTML = '';
        const totalStars = 5;
        
        for (let i = 1; i <= totalStars; i++) {
            if (i <= rating) {
                starsHTML += '<img src="assets/icons/goldStar-icon.svg" width="20" alt="gold star" style="margin-right: 2px;">';
            } else {
                starsHTML += '<img src="assets/icons/grayStar-icon.svg" width="20" alt="gray star" style="margin-right: 2px;">';
            }
        }
        
        return starsHTML;
    }
    
    clearTable() {
        this.tableBody.innerHTML = '';
    }
    
    showNoResults() {
        this.tableBody.innerHTML = `
            <tr class="products-table__cell-row">
                <td class="products-table__cell" colspan="8" style="text-align: center; left: 35vw; position: sticky; color: var(--secondary-color);">
                    No products found matching your search.
                </td>
            </tr>
        `;
    }
}


class StoreVisibilityManager {
    constructor() {
        this.elementsToHide = {
            storeInfo: document.querySelector('.store-details__info'),
            controlsButton: document.querySelector('.controls__details-button'),
            statusSection: document.querySelector('.store-details-section__status'),
            searchContainer: document.querySelector('.store-details-section__search-container'),
            productsContainer: document.querySelector('.products-container'),
            footer: document.querySelector('.store-details-section__footer')
        };
        
        this.noStoreSelected = document.querySelector('.no-store-selected');
        this.storeTitle = document.querySelector('.store-details__title');
        
        this.hideStoreContent();
        this.showNoStoreSelected();
    }
    
    hideStoreContent() {
        Object.values(this.elementsToHide).forEach(element => {
            element.style.display = 'none';
        });
        
        this.storeTitle.style.marginBottom = 'unset';
    }
    
    showStoreContent() {
        Object.values(this.elementsToHide).forEach(element => {
            element.style.display = '';
        });
        
        this.storeTitle.style.marginBottom = '';
    }
    
    showNoStoreSelected() {
        this.noStoreSelected.style.display = 'block';
    }
    
    hideNoStoreSelected() {
        this.noStoreSelected.style.display = 'none';
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
class Store {
    constructor(storeData) {
        this.id = storeData.id;
        this.name = storeData.Name;
        this.email = storeData.Email;
        this.phoneNumber = storeData.PhoneNumber;
        this.address = storeData.Address;
        this.established = storeData.Established;
        this.floorArea = storeData.FloorArea;
        this.products = storeData.rel_Products || [];
    }
    

    getInfo() {
        return {
            id: this.id,
            name: this.name,
            email: this.email,
            phoneNumber: this.phoneNumber,
            address: this.address,
            floorArea: this.floorArea,
            productsCount: this.products.length
        };
    }
}


class StoreListManager {
    constructor(containerSelector, storesData, storeDetailsManager) {
        this.container = document.querySelector(containerSelector);
        this.stores = storesData.map(storeData => new Store(storeData));
        this.currentActiveItem = null;
        this.storeDetailsManager = storeDetailsManager;
        
        this.renderStores();
        this.attachEventListeners();
    }
    
    renderStores() {
        // Clear existing content
        this.container.innerHTML = '';
        
        this.stores.forEach((store, index) => {
            const storeElement = this.createStoreElement(store, index);
            this.container.appendChild(storeElement);
        });
    }
    
    createStoreElement(store, index) {
        const li = document.createElement('li');
        li.className = 'store-items__list';
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
        const storeItems = this.container.querySelectorAll('.store-items__list');
        
        storeItems.forEach((item, index) => {
            item.addEventListener('click', (event) => {
                this.handleItemClick(event, item, index);
            });
        });
    }
    
    handleItemClick = (event, clickedItem, index) => {
        if (this.currentActiveItem && this.currentActiveItem !== clickedItem) {
            this.currentActiveItem.classList.remove('active');
        }
        
        clickedItem.classList.add('active');
        this.currentActiveItem = clickedItem;
        
        const storeId = parseInt(clickedItem.dataset.storeId);
        const selectedStore = this.stores.find(store => store.id === storeId);
        
        if (this.storeDetailsManager && selectedStore) {
            this.storeDetailsManager.updateDetails(selectedStore);
        }

    }
    

    getStores() {
        return this.stores;
    }
    

    getStoreById(id) {
        return this.stores.find(store => store.id === id);
    }
    

    getSelectedStore() {
        if (!this.currentActiveItem) return null;
        const storeId = parseInt(this.currentActiveItem.dataset.storeId);
        return this.getStoreById(storeId);
    }
    

}


const storeVisibilityManager = new StoreVisibilityManager();


const productsTableManager = new ProductsTableManager();


const productsSearchManager = new ProductsSearchManager(
    '.store-details-section__search input',
    '.store-details-section__reset-button', 
    '.store-details-section__search-button',
    productsTableManager
);


const storeDetailsManager = new StoreDetailsManager(productsTableManager, storeVisibilityManager, productsSearchManager);


const storeListManager = new StoreListManager('.stores-items', Stores, storeDetailsManager);


const sidebarSearchManager = new StoreSearchManager(
    '.store-sidebar__search input', 
    '.store-sidebar__reset-button',
    '.store-sidebar__search-button',
    storeListManager
);