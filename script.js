// Constants
const STORAGE_KEY = 'drinkstock-manager-data';
const HISTORY_KEY = 'drinkstock-manager-history';
const CRITICAL_THRESHOLD = 5;

// Initial drinks data
const initialDrinks = [
    { id: 1, nom: 'Heineken', prixAchat: 300, prixVente: 550, quantite: 12 },
    { id: 2, nom: 'Corona', prixAchat: 350, prixVente: 600, quantite: 3 },
    { id: 3, nom: 'Coca-Cola', prixAchat: 200, prixVente: 350, quantite: 24 },
    { id: 4, nom: 'Sprite', prixAchat: 200, prixVente: 350, quantite: 8 },
    { id: 5, nom: 'Whisky Coca', prixAchat: 500, prixVente: 900, quantite: 15 },
];

// State
let drinks = [];
let history = [];
let showForm = false;
let showHistory = false;
let drinkToDelete = null;
let currentPage = 1;
const itemsPerPage = 10;
// Long press state
let longPressTimer = null;
let selectedDrinkForQuantity = null;

// DOM Elements
const elements = {
    totalDrinks: document.getElementById('total-drinks'),
    totalValue: document.getElementById('total-value'),
    totalProfit: document.getElementById('total-profit'),
    criticalCount: document.getElementById('critical-count'),
    criticalCard: document.getElementById('critical-card'),
    toggleFormBtn: document.getElementById('toggle-form-btn'),
    toggleHistoryBtn: document.getElementById('toggle-history-btn'),
    historyModal: document.getElementById('history-modal'),
    historyModalClose: document.getElementById('history-modal-close'),
    historyModalCancel: document.getElementById('history-modal-cancel'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),
    addForm: document.getElementById('add-form'),
    historyList: document.getElementById('history-list'),
    drinkName: document.getElementById('drink-name'),
    drinkPurchasePrice: document.getElementById('drink-purchase-price'),
    drinkSalePrice: document.getElementById('drink-sale-price'),
    drinkQuantity: document.getElementById('drink-quantity'),
    saveDrinkBtn: document.getElementById('save-drink-btn'),
    cancelBtn: document.getElementById('cancel-btn'),
    drinksList: document.getElementById('drinks-list'),
    emptyState: document.getElementById('empty-state'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    themeToggle: document.getElementById('theme-toggle'),
    // Quantity modals elements
    sellQuantityModal: document.getElementById('sell-quantity-modal'),
    sellQuantityModalClose: document.getElementById('sell-quantity-modal-close'),
    sellDrinkName: document.getElementById('sell-drink-name'),
    sellQuantityInput: document.getElementById('sell-quantity-input'),
    sellAvailableStock: document.getElementById('sell-available-stock'),
    confirmSellQuantity: document.getElementById('confirm-sell-quantity'),
    cancelSellQuantity: document.getElementById('cancel-sell-quantity'),
    restockQuantityModal: document.getElementById('restock-quantity-modal'),
    restockQuantityModalClose: document.getElementById('restock-quantity-modal-close'),
    restockDrinkName: document.getElementById('restock-drink-name'),
    restockQuantityInput: document.getElementById('restock-quantity-input'),
    restockCurrentStock: document.getElementById('restock-current-stock'),
    confirmRestockQuantity: document.getElementById('confirm-restock-quantity'),
    cancelRestockQuantity: document.getElementById('cancel-restock-quantity'),
    // Delete modal elements
    deleteModal: document.getElementById('delete-modal'),
    deleteModalClose: document.getElementById('delete-modal-close'),
    deleteDrinkName: document.getElementById('delete-drink-name'),
    confirmDeleteBtn: document.getElementById('confirm-delete-btn'),
    cancelDeleteBtn: document.getElementById('cancel-delete-btn')
};

// Initialize app
function init() {
    console.log('init called');
    console.log('DOM elements check:', {
        drinksList: elements.drinksList,
        emptyState: elements.emptyState,
        totalDrinks: elements.totalDrinks,
        totalValue: elements.totalValue,
        totalProfit: elements.totalProfit
    });
    
    loadDrinks();
    loadHistory();
    setupEventListeners();
    render();
    initializeTheme();
    console.log('init completed');
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Toggle theme
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    elements.themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Clear all data and reset to initial state
function clearAllData() {
    console.log('Clearing all data');
    localStorage.removeItem(STORAGE_KEY);
    drinks = [...initialDrinks];
    saveDrinks();
    render();
    showNotification('Données réinitialisées', 'success');
}

// Load drinks from localStorage
function loadDrinks() {
    console.log('loadDrinks called');
    const saved = localStorage.getItem(STORAGE_KEY);
    console.log('Saved data from localStorage:', saved);
    
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            console.log('Parsed data:', parsed);
            
            // Check if data is in old format (has 'prix' instead of 'prixAchat'/'prixVente')
            if (parsed.length > 0 && parsed[0].hasOwnProperty('prix')) {
                console.log('Migrating old format data');
                // Migrate old data to new format
                drinks = parsed.map(drink => ({
                    id: drink.id,
                    nom: drink.nom,
                    prixAchat: Math.round(drink.prix * 0.6), // Estimate purchase price as 60% of sale price
                    prixVente: drink.prix,
                    quantite: drink.quantite
                }));
                console.log('Migrated drinks:', drinks);
                // Save migrated data
                saveDrinks();
            } else {
                console.log('Using new format data');
                // Clean up corrupted data (null prices)
                drinks = parsed.map(drink => ({
                    ...drink,
                    prixAchat: drink.prixAchat || 0,
                    prixVente: drink.prixVente || 0
                }));
                console.log('Cleaned drinks:', drinks);
                // Save cleaned data
                saveDrinks();
            }
        } catch (e) {
            console.error('Error parsing saved data:', e);
            drinks = [...initialDrinks];
        }
    } else {
        console.log('No saved data, using initial drinks');
        drinks = [...initialDrinks];
    }
    
    console.log('Final drinks array:', drinks);
}

// Save drinks to localStorage
function saveDrinks() {
    console.log('saveDrinks called, saving:', drinks);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drinks));
    console.log('Data saved to localStorage');
}

// Save history to localStorage
function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

// Load history from localStorage
function loadHistory() {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (saved) {
        try {
            history = JSON.parse(saved);
        } catch (e) {
            history = [];
        }
    } else {
        history = [];
    }
}

// Add entry to history
function addToHistory(type, drinkName, quantity, price = null) {
    const entry = {
        id: Date.now(),
        type: type, // 'sale', 'restock', 'add', 'delete'
        drinkName: drinkName,
        quantity: quantity,
        price: price,
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
    
    history.unshift(entry); // Add at beginning
    
    // Keep only last 100 entries
    if (history.length > 100) {
        history = history.slice(0, 100);
    }
    
    saveHistory();
    renderHistory();
}

// Render history
function renderHistory() {
    if (!elements.historyList) return;
    
    elements.historyList.innerHTML = '';
    
    if (history.length === 0) {
        elements.historyList.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-history text-2xl mb-2"></i>
                <p>Aucun mouvement enregistré</p>
            </div>
        `;
        return;
    }
    
    // Render all history items
    history.forEach((entry, index) => {
        const entryElement = createHistoryElement(entry);
        entryElement.style.marginBottom = index < history.length - 1 ? '0.5rem' : '0';
        elements.historyList.appendChild(entryElement);
    });
}

// Create history element
function createHistoryElement(entry) {
    const div = document.createElement('div');
    div.className = 'history-item animate-slide-in';
    
    const typeConfig = {
        sale: { icon: 'fas fa-shopping-cart', color: '#10b981', label: 'Vente' },
        restock: { icon: 'fas fa-plus-circle', color: '#2563eb', label: 'Réapprovisionnement' },
        add: { icon: 'fas fa-plus', color: '#059669', label: 'Ajout' },
        delete: { icon: 'fas fa-trash', color: '#ef4444', label: 'Suppression' }
    };
    
    const config = typeConfig[entry.type] || typeConfig.add;
    
    div.innerHTML = `
        <div class="history-item-content">
            <div class="history-item-left">
                <i class="${config.icon}" style="color: ${config.color}"></i>
                <div class="history-item-info">
                    <span class="history-item-type" style="color: ${config.color}">${config.label}</span>
                    <span class="history-item-name">${entry.drinkName}</span>
                    <span class="history-item-quantity">${entry.quantity} unité${entry.quantity > 1 ? 's' : ''}</span>
                    ${entry.price ? `<span class="history-item-price">${entry.price.toFixed(0)} FCFA</span>` : ''}
                </div>
            </div>
            <div class="history-item-right">
                <span class="history-item-time">${entry.time}</span>
                <span class="history-item-date">${entry.date}</span>
            </div>
        </div>
    `;
    
    return div;
}

// Toggle history modal
function toggleHistory() {
    elements.historyModal.classList.remove('hidden');
    renderHistory();
}

// Hide history modal
function hideHistoryModal() {
    elements.historyModal.classList.add('hidden');
}

// Clear history
function clearHistory() {
    if (confirm('Êtes-vous sûr de vouloir vider tout l\'historique ? Cette action est irréversible.')) {
        history = [];
        saveHistory();
        renderHistory();
        showNotification('Historique vidé', 'success');
    }
}

// Long press handlers
function handleLongPressStart(drink, action) {
    selectedDrinkForQuantity = { drink, action };
    longPressTimer = setTimeout(() => {
        showQuantityModal(drink, action);
    }, 500); // 500ms for long press
}

function handleLongPressEnd() {
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }
}

// Show quantity modal
function showQuantityModal(drink, action) {
    selectedDrinkForQuantity = { drink, action };
    
    if (action === 'sell') {
        elements.sellDrinkName.textContent = drink.nom;
        elements.sellAvailableStock.textContent = drink.quantite;
        elements.sellQuantityInput.value = 1;
        elements.sellQuantityInput.max = drink.quantite;
        elements.sellQuantityModal.classList.remove('hidden');
        elements.sellQuantityInput.focus();
    } else if (action === 'restock') {
        elements.restockDrinkName.textContent = drink.nom;
        elements.restockCurrentStock.textContent = drink.quantite;
        elements.restockQuantityInput.value = 1;
        elements.restockQuantityModal.classList.remove('hidden');
        elements.restockQuantityInput.focus();
    }
}

// Hide quantity modals
function hideSellQuantityModal() {
    elements.sellQuantityModal.classList.add('hidden');
    selectedDrinkForQuantity = null;
}

function hideRestockQuantityModal() {
    elements.restockQuantityModal.classList.add('hidden');
    selectedDrinkForQuantity = null;
}

// Confirm quantity actions
function confirmSellQuantity() {
    if (!selectedDrinkForQuantity) return;
    
    const quantity = parseInt(elements.sellQuantityInput.value);
    const drink = selectedDrinkForQuantity.drink;
    
    if (isNaN(quantity) || quantity < 1 || quantity > drink.quantite) {
        showNotification('Quantité invalide', 'error');
        return;
    }
    
    drink.quantite -= quantity;
    saveDrinks();
    addToHistory('sale', drink.nom, quantity, drink.prixVente);
    hideSellQuantityModal();
    render();
    showNotification(`Vente: ${quantity}x ${drink.nom}`, 'success');
}

function confirmRestockQuantity() {
    if (!selectedDrinkForQuantity) return;
    
    const quantity = parseInt(elements.restockQuantityInput.value);
    const drink = selectedDrinkForQuantity.drink;
    
    if (isNaN(quantity) || quantity < 1) {
        showNotification('Quantité invalide', 'error');
        return;
    }
    
    drink.quantite += quantity;
    saveDrinks();
    addToHistory('restock', drink.nom, quantity, drink.prixAchat);
    hideRestockQuantityModal();
    render();
    showNotification(`Réapprovisionnement: +${quantity}x ${drink.nom}`, 'success');
}

// Setup event listeners
function setupEventListeners() {
    elements.toggleFormBtn.addEventListener('click', toggleForm);
    elements.toggleHistoryBtn.addEventListener('click', toggleHistory);
    elements.saveDrinkBtn.addEventListener('click', addDrink);
    elements.cancelBtn.addEventListener('click', hideForm);
    elements.themeToggle?.addEventListener('click', toggleTheme);
    
    // History modal event listeners
    elements.historyModalClose.addEventListener('click', hideHistoryModal);
    elements.historyModalCancel.addEventListener('click', hideHistoryModal);
    elements.clearHistoryBtn.addEventListener('click', clearHistory);
    elements.historyModal.addEventListener('click', (e) => {
        if (e.target === elements.historyModal) {
            hideHistoryModal();
        }
    });
    
    // Quantity modals event listeners
    elements.sellQuantityModalClose.addEventListener('click', hideSellQuantityModal);
    elements.cancelSellQuantity.addEventListener('click', hideSellQuantityModal);
    elements.confirmSellQuantity.addEventListener('click', confirmSellQuantity);
    elements.sellQuantityModal.addEventListener('click', (e) => {
        if (e.target === elements.sellQuantityModal) {
            hideSellQuantityModal();
        }
    });
    
    elements.restockQuantityModalClose.addEventListener('click', hideRestockQuantityModal);
    elements.cancelRestockQuantity.addEventListener('click', hideRestockQuantityModal);
    elements.confirmRestockQuantity.addEventListener('click', confirmRestockQuantity);
    elements.restockQuantityModal.addEventListener('click', (e) => {
        if (e.target === elements.restockQuantityModal) {
            hideRestockQuantityModal();
        }
    });
    
    // Delete modal event listeners
    elements.deleteModalClose?.addEventListener('click', hideDeleteModal);
    elements.cancelDeleteBtn?.addEventListener('click', hideDeleteModal);
    elements.confirmDeleteBtn?.addEventListener('click', confirmDelete);
    elements.deleteModal?.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            hideDeleteModal();
        }
    });
    
    // Enter key support for form inputs
    elements.drinkName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addDrink();
    });
    elements.drinkPurchasePrice.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addDrink();
    });
    elements.drinkSalePrice.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addDrink();
    });
    elements.drinkQuantity.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addDrink();
    });
}

// Toggle form visibility
function toggleForm() {
    showForm = !showForm;
    if (showForm) {
        elements.addForm.classList.remove('hidden');
        elements.addForm.classList.add('animate-fade-in');
        elements.drinkName.focus();
    } else {
        hideForm();
    }
}

// Hide form and reset inputs
function hideForm() {
    showForm = false;
    elements.addForm.classList.add('hidden');
    clearForm();
}

// Clear form inputs
function clearForm() {
    elements.drinkName.value = '';
    elements.drinkPurchasePrice.value = '';
    elements.drinkSalePrice.value = '';
    elements.drinkQuantity.value = '';
}

// Add new drink
function addDrink() {
    console.log('addDrink called');
    const name = elements.drinkName.value.trim();
    const purchasePrice = parseFloat(elements.drinkPurchasePrice.value);
    const salePrice = parseFloat(elements.drinkSalePrice.value);
    const quantity = parseInt(elements.drinkQuantity.value);

    console.log('Form values:', { name, purchasePrice, salePrice, quantity });

    if (!name || isNaN(purchasePrice) || isNaN(salePrice) || isNaN(quantity) || purchasePrice <= 0 || salePrice <= 0 || quantity < 0) {
        showNotification('Veuillez remplir tous les champs correctement', 'error');
        return;
    }

    const drink = {
        id: Date.now(),
        nom: name,
        prixAchat: purchasePrice,
        prixVente: salePrice,
        quantite: quantity
    };

    console.log('New drink:', drink);
    drinks.push(drink);
    console.log('Drinks after add:', drinks);
    saveDrinks();
    addToHistory('add', drink.nom, quantity, purchasePrice);
    hideForm();
    render();
    showNotification(`${drink.nom} ajouté avec succès`, 'success');
}

// Delete drink
function deleteDrink(id) {
    const drink = drinks.find(d => d.id === id);
    if (drink) {
        drinkToDelete = drink;
        elements.deleteDrinkName.textContent = drink.nom;
        elements.deleteModal.classList.remove('hidden');
    }
}

// Show delete modal
function showDeleteModal() {
    elements.deleteModal.classList.remove('hidden');
}

// Hide delete modal
function hideDeleteModal() {
    elements.deleteModal.classList.add('hidden');
    drinkToDelete = null;
}

// Confirm delete
function confirmDelete() {
    if (drinkToDelete) {
        const deletedDrink = drinkToDelete;
        drinks = drinks.filter(d => d.id !== drinkToDelete.id);
        saveDrinks();
        addToHistory('delete', deletedDrink.nom, deletedDrink.quantite, deletedDrink.prixAchat);
        hideDeleteModal();
        render();
        showNotification(`${drinkToDelete.nom} supprimé`, 'success');
    }
}

// Restock drink
function restockDrink(id) {
    const drink = drinks.find(d => d.id === id);
    if (drink) {
        drink.quantite += 1;
        saveDrinks();
        addToHistory('restock', drink.nom, 1, drink.prixAchat);
        render();
    }
}

// Sell drink
function sellDrink(id) {
    const drink = drinks.find(d => d.id === id);
    if (!drink || drink.quantite <= 0) {
        showNotification('Stock insuffisant', 'error');
        return;
    }

    drink.quantite -= 1;
    saveDrinks();
    addToHistory('sale', drink.nom, 1, drink.prixVente);
    render();
    showNotification(`Vente: ${drink.nom}`, 'success');
}

// Show notification
function showNotification(message, type) {
    elements.notificationMessage.textContent = message;
    elements.notification.className = `notification ${type} animate-slide-up`;
    elements.notification.classList.remove('hidden');

    // Set icon
    const icon = elements.notification.querySelector('.notification-icon') || document.createElement('i');
    icon.className = 'notification-icon fas';
    icon.className += type === 'success' ? ' fa-check-circle' : ' fa-exclamation-circle';
    
    if (!elements.notification.contains(icon)) {
        elements.notification.insertBefore(icon, elements.notificationMessage);
    }

    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 3000);
}

// Update statistics
function updateStats() {
    const totalStockValue = drinks.reduce((sum, drink) => sum + (drink.prixVente ? drink.prixVente * drink.quantite : 0), 0);
    const totalProfit = drinks.reduce((sum, drink) => {
        if (drink.prixAchat && drink.prixVente) {
            return sum + (drink.prixVente - drink.prixAchat) * drink.quantite;
        }
        return sum;
    }, 0);
    const criticalItems = drinks.filter(d => d.quantite <= CRITICAL_THRESHOLD).length;

    // Update stats elements safely
    if (elements.totalDrinks) elements.totalDrinks.textContent = drinks.length;
    if (elements.totalValue) elements.totalValue.textContent = `${totalStockValue.toFixed(0)} FCFA`;
    if (elements.totalProfit) elements.totalProfit.textContent = `${totalProfit.toFixed(0)} FCFA`;
    if (elements.criticalCount) elements.criticalCount.textContent = criticalItems;
}

// Create drink element
function createDrinkElement(drink, index) {
    const isCritical = drink.quantite <= CRITICAL_THRESHOLD;
    const div = document.createElement('div');
    div.className = `drink-card ${isCritical ? 'critical' : ''} animate-slide-in`;
    div.style.animationDelay = `${index * 0.05}s`;

    div.innerHTML = `
        <div class="drink-header">
            <div class="drink-title">
                <i class="fas fa-beer"></i>
                <span>${drink.nom}</span>
                ${isCritical ? '<span class="critical-badge">⚠️ Stock Critique</span>' : ''}
            </div>
            <div class="drink-category">Boisson</div>
        </div>
        
        <div class="drink-stats">
            <div class="drink-stat">
                <div class="drink-stat-label">Prix d'achat</div>
                <div class="drink-stat-value">${drink.prixAchat ? drink.prixAchat.toFixed(0) : 'N/A'} FCFA</div>
            </div>
            <div class="drink-stat">
                <div class="drink-stat-label">Prix de vente</div>
                <div class="drink-stat-value">${drink.prixVente ? drink.prixVente.toFixed(0) : 'N/A'} FCFA</div>
            </div>
            <div class="drink-stat">
                <div class="drink-stat-label">Stock</div>
                <div class="drink-stat-value ${isCritical ? 'text-red-400' : ''}">${drink.quantite} unités</div>
            </div>
            <div class="drink-stat">
                <div class="drink-stat-label">Bénéfice total</div>
                <div class="drink-stat-value text-blue-400">${drink.prixAchat && drink.prixVente ? ((drink.prixVente - drink.prixAchat) * drink.quantite).toFixed(0) : 'N/A'} FCFA</div>
            </div>
            <div class="drink-stat">
                <div class="drink-stat-label">Valeur</div>
                <div class="drink-stat-value text-emerald-400">${drink.prixVente ? (drink.prixVente * drink.quantite).toFixed(0) : 'N/A'} FCFA</div>
            </div>
        </div>

        <div class="drink-actions">
            <button
                onmousedown="handleLongPressStart(drinks[${index}], 'restock')"
                onmouseup="handleLongPressEnd()"
                onmouseleave="handleLongPressEnd()"
                ontouchstart="handleLongPressStart(drinks[${index}], 'restock')"
                ontouchend="handleLongPressEnd()"
                onclick="if (!longPressTimer) restockDrink(${drink.id})"
                class="action-btn restock"
                title="Réapprovisionner (appui long pour quantité personnalisée)"
            >
                <i class="fas fa-plus"></i>
            </button>
            <button
                onmousedown="handleLongPressStart(drinks[${index}], 'sell')"
                onmouseup="handleLongPressEnd()"
                onmouseleave="handleLongPressEnd()"
                ontouchstart="handleLongPressStart(drinks[${index}], 'sell')"
                ontouchend="handleLongPressEnd()"
                onclick="if (!longPressTimer) sellDrink(${drink.id})"
                ${drink.quantite <= 0 ? 'disabled' : ''}
                class="action-btn sell"
                title="Vendre (appui long pour quantité personnalisée)"
            >
                <i class="fas fa-shopping-cart"></i>
            </button>
            <button
                onclick="deleteDrink(${drink.id})"
                class="action-btn delete"
                title="Supprimer"
            >
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return div;
}

// Render the app
function render() {
    console.log('render called, drinks length:', drinks.length);
    // Clear current list
    elements.drinksList.innerHTML = '';

    // Update stats
    updateStats();

    // Show/hide empty state
    if (drinks.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.emptyState.classList.add('animate-fade-in');
    } else {
        elements.emptyState.classList.add('hidden');

        // Render drinks
        drinks.forEach((drink, index) => {
            console.log('Rendering drink:', drink);
            const drinkElement = createDrinkElement(drink, index);
            elements.drinksList.appendChild(drinkElement);
        });
    }
}

// Make functions globally accessible for onclick handlers
window.deleteDrink = deleteDrink;
window.restockDrink = restockDrink;
window.sellDrink = sellDrink;
window.clearAllData = clearAllData;
window.clearHistory = clearHistory;
window.handleLongPressStart = handleLongPressStart;
window.handleLongPressEnd = handleLongPressEnd;
window.confirmSellQuantity = confirmSellQuantity;
window.confirmRestockQuantity = confirmRestockQuantity;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', init);
