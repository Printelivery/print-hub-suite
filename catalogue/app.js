let currentPage = 1;
let pageSize = 10;
let activeModalProductPhotos = [];
let activeModalPhotoIndex = 0;
let selectedProductInDetailView = null;

window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        if (document.getElementById('mediaViewModal').style.display === 'flex') closeMediaViewModal();
        else if (document.getElementById('productDetailModal').style.display === 'flex') closeProductDetailModal();
        else if (document.getElementById('addressCaptureModal').style.display === 'flex') closeAddressCollectionModal();
        else if (document.getElementById('cartDrawerModal').style.display === 'flex') closeCartViewModal();
    }
    if (document.getElementById('mediaViewModal').style.display === 'flex') {
        if (event.key === 'ArrowRight') navigateModalImage(1);
        else if (event.key === 'ArrowLeft') navigateModalImage(-1);
    }
});

function alterGridLayout(columnsNumber) { document.getElementById('catalog').className = `catalog-grid cols-${columnsNumber}`; }
function alterPageSize(size) { pageSize = parseInt(size); currentPage = 1; renderCatalogViewEngine(); }

function renderCatalogViewEngine() {
    const catalogContainer = document.getElementById('catalog');
    catalogContainer.innerHTML = '';
    const paginatedItems = localProductsRegistry.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    paginatedItems.forEach((prod, index) => {
        const cartItem = shoppingCartState[prod.id];
        let actionWidgetHTML = `<button class="order-button" onclick="addItemToCart('${prod.id}'); event.stopPropagation();">Add to Cart</button>`;
        if (cartItem) actionWidgetHTML = `<div class="inline-qty-control" onclick="event.stopPropagation()"><button class="inline-qty-btn" onclick="alterItemQuantity('${prod.id}', -1)">-</button><span class="inline-qty-val">${cartItem.qty}</span><button class="inline-qty-btn" onclick="alterItemQuantity('${prod.id}', 1)">+</button></div>`;
        
        catalogContainer.innerHTML += `
            <div class="product-card" onclick="launchProductDetailModal('${prod.id}')">
                <div class="image-container"><img id="card-img-${prod.id}" class="product-image" src="https://placehold.co/600x400/075E54/white?text=${prod.name}"></div>
                <div class="product-details">
                    <div class="product-group-tag">${prod.group}</div>
                    <div class="product-id">ID: ${prod.id}</div>
                    <h3 class="product-title">${prod.name}</h3>
                    <p class="product-desc">${prod.desc.substring(0, 120)}</p>
                    <div class="action-row"><span class="price">${prod.price}</span><div id="action-wrapper-${prod.id}" onclick="event.stopPropagation()">${actionWidgetHTML}</div></div>
                </div>
            </div>`;
        checkMultiImages(prod.id, (currentPage - 1) * pageSize + index);
    });
    buildPaginationControlsUI();
}

function checkMultiImages(productId, globalIndex) {
    const product = localProductsRegistry[globalIndex];
    const firstMultiImage = new Image();
    firstMultiImage.src = `https://print-hub-suite.vercel.app/images/1_${productId}.jpg`;
    firstMultiImage.onload = () => {
        const cardImgElement = document.getElementById(`card-img-${productId}`);
        if (cardImgElement) cardImgElement.src = firstMultiImage.src;
        product.loadedImages = [firstMultiImage.src];
    };
    firstMultiImage.onerror = () => {
        const singleImg = new Image();
        singleImg.src = `https://print-hub-suite.vercel.app/images/${productId}.jpg`;
        singleImg.onload = () => {
            const cardImgElement = document.getElementById(`card-img-${productId}`);
            if (cardImgElement) cardImgElement.src = singleImg.src;
            product.loadedImages = [singleImg.src];
        };
    };
}

function launchProductDetailModal(productId) {
    selectedProductInDetailView = localProductsRegistry.find(p => p.id === productId);
    document.getElementById('detailPaneImg').src = selectedProductInDetailView.loadedImages[0] || '';
    document.getElementById('detailPaneGroup').innerText = selectedProductInDetailView.group;
    document.getElementById('detailPaneTitle').innerText = selectedProductInDetailView.name;
    document.getElementById('detailPaneDesc').innerText = selectedProductInDetailView.desc;
    document.getElementById('detailPanePrice').innerText = selectedProductInDetailView.price;
    syncDetailModalActionWidgetBlock();
    document.getElementById('productDetailModal').style.display = 'flex';
}

function syncDetailModalActionWidgetBlock() {
    const wrapper = document.getElementById('detailPaneActionWrapper');
    const cartItem = shoppingCartState[selectedProductInDetailView.id];
    if (cartItem) {
        wrapper.innerHTML = `<div class="inline-qty-control"><button class="inline-qty-btn" onclick="alterItemQuantity('${selectedProductInDetailView.id}', -1); syncDetailModalActionWidgetBlock();">-</button><span class="inline-qty-val">${cartItem.qty}</span><button class="inline-qty-btn" onclick="alterItemQuantity('${selectedProductInDetailView.id}', 1); syncDetailModalActionWidgetBlock();">+</button></div>`;
    } else {
        wrapper.innerHTML = `<button class="order-button" onclick="addItemToCart('${selectedProductInDetailView.id}'); syncDetailModalActionWidgetBlock();">Add to Cart</button>`;
    }
}

function closeProductDetailModal() { document.getElementById('productDetailModal').style.display = 'none'; }
function openCartViewModal() { renderCartDrawerListContent(); document.getElementById('cartDrawerModal').style.display = 'flex'; }
function closeCartViewModal() { document.getElementById('cartDrawerModal').style.display = 'none'; }
function openAddressCollectionModal() { closeCartViewModal(); document.getElementById('addressCaptureModal').style.display = 'flex'; }
function closeAddressCollectionModal() { document.getElementById('addressCaptureModal').style.display = 'none'; }

function renderCartDrawerListContent() {
    const container = document.getElementById('cartItemsContainer');
    const summary = document.getElementById('cartSummaryBlock');
    container.innerHTML = '';
    Object.values(shoppingCartState).forEach(item => {
        container.innerHTML += `<div class="cart-item"><h4>${item.metadata.name}</h4><p>${item.qty} x ${item.metadata.price}</p><div class="qty-controls"><button class="qty-btn" onclick="alterItemQuantity('${item.metadata.id}', -1)">-</button>${item.qty}<button class="qty-btn" onclick="alterItemQuantity('${item.metadata.id}', 1)">+</button></div></div>`;
    });
}

function buildPaginationControlsUI() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';
    const totalPages = Math.ceil(localProductsRegistry.length / pageSize);
    for (let i = 1; i <= totalPages; i++) {
        container.innerHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="jumpToPage(${i})">${i}</button>`;
    }
}
function jumpToPage(p) { currentPage = p; renderCatalogViewEngine(); }
async function compileFinalInvoiceAndSend(event) {
    event.preventDefault();
    const canvas = document.getElementById('invoiceRenderCanvas');
    canvas.innerHTML = `<h3>Invoice Generated</h3><p>Order processed.</p>`;
    const pdfOptions = { filename: 'Invoice.pdf', html2canvas: { scale: 2 } };
    const pdf = await html2pdf().from(canvas).set(pdfOptions).output('datauristring');
    triggerEmailBackend({name: document.getElementById('custName').value}, "INV-123", pdf.split(',')[1], "Items", "Total");
    alert("Order processed!");
    closeAddressCollectionModal();
}

fetchProducts();