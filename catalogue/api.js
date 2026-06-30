const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSZuJdNU_JDKhM9OSgx4yPa9rWGtL7PJ9dgbaoaWNJ4_0jZ-AUOKLEUiCCACjiHlOYwsvwNG1ftwCMG/pub?output=csv";
const BACKEND_API_ENDPOINT = "https://script.google.com/macros/s/AKfycbyYJdFH5XAyo0LJSO7QsW7KxDToH7SIprX4uZzUhu4GvPn9BHq-LYOYnqOf18A_EYc/exec";

let localProductsRegistry = [];
let shoppingCartState = {};

function parseCSV(text) {
    let p = '', r = []; let q = false; let row = [''];
    for (let i=0; i<text.length; i++) {
        let c = text[i]; let next = text[i+1];
        if (c === '"') { if (q && next === '"') { row[row.length-1] += '"'; i++; } else { q = !q; } }
        else if (c === ',' && !q) { row.push(''); }
        else if ((c === '\r' || c === '\n') && !q) {
            if (c === '\r' && next === '\n') { i++; }
            r.push(row); row = [''];
        } else { row[row.length-1] += c; }
    }
    if (row.length > 1 || row[0] !== '') { r.push(row); }
    return r;
}

async function fetchProducts() {
    try {
        const response = await fetch(CSV_URL + "&cachebuster=" + new Date().getTime());
        const dataText = await response.text();
        const parsedRows = parseCSV(dataText);
        parsedRows.shift();
        localProductsRegistry = parsedRows.map(row => ({
            group: row[0]?.trim() || "", id: row[1]?.trim() || "", name: row[2]?.trim() || "", desc: row[3]?.trim() || "", price: row[4]?.trim() || "", loadedImages: [] 
        })).filter(p => p.id !== "");
        currentPage = 1;
        renderCatalogViewEngine();
    } catch (error) {
        console.error("Error:", error);
        document.getElementById('catalog').innerHTML = `<div class="loading">Failed to load data.</div>`;
    }
}

async function triggerEmailBackend(customerDetails, orderId, pdfBase64, itemsSummary, total) {
    const payload = { ...customerDetails, orderId, itemsText: itemsSummary, grandTotal: total, addressBlock: `${customerDetails.flat}, ${customerDetails.address}, ${customerDetails.pin}`, pdfBase64 };
    try {
        await fetch(BACKEND_API_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (err) { console.error("Email failed:", err); }
}

function addItemToCart(productId) {
    const targetProduct = localProductsRegistry.find(p => p.id === productId);
    if (!targetProduct) return;
    shoppingCartState[productId] = { metadata: targetProduct, qty: 1 };
    synchronizeCartBadgeUI();
    updateCardActionWidget(productId);
}

function alterItemQuantity(productId, modificationDelta) {
    if (!shoppingCartState[productId]) return;
    shoppingCartState[productId].qty += modificationDelta;
    if (shoppingCartState[productId].qty <= 0) delete shoppingCartState[productId];
    synchronizeCartBadgeUI();
    updateCardActionWidget(productId);
    if (document.getElementById('cartDrawerModal').style.display === 'flex') renderCartDrawerListContent();
}

function synchronizeCartBadgeUI() {
    let totalCount = Object.values(shoppingCartState).reduce((acc, item) => acc + item.qty, 0);
    document.getElementById('cartCountBadge').innerText = totalCount;
}

function updateCardActionWidget(productId) {
    const wrapper = document.getElementById(`action-wrapper-${productId}`);
    if (!wrapper) return;
    const cartItem = shoppingCartState[productId];
    if (cartItem && cartItem.qty > 0) {
        wrapper.innerHTML = `<div class="inline-qty-control" onclick="event.stopPropagation()"><button class="inline-qty-btn" onclick="alterItemQuantity('${productId}', -1)">-</button><span class="inline-qty-val">${cartItem.qty}</span><button class="inline-qty-btn" onclick="alterItemQuantity('${productId}', 1)">+</button></div>`;
    } else {
        wrapper.innerHTML = `<button class="order-button" onclick="addItemToCart('${productId}'); event.stopPropagation();">Add to Cart</button>`;
    }
}