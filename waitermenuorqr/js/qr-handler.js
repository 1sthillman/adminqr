// QR kod yönetimi için fonksiyonlar
const SUPABASE_URL = 'https://egcklzfiyxxnvyxwoowq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnY2tsemZpeXh4bnZ5eHdvb3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjQxMTcsImV4cCI6MjA2NDA0MDExN30.dfRQv3lYFCaI1T5ydOw4HyoEJ0I1wOSIUcG8ueEbxKQ';

// Supabase istemcisini başlat
let supabase = null;
let tableNumber = null;
let tableId = null; // Masa ID'sini saklamak için
let menu = {}; // Kategorilere ayrılmış menü
let cart = []; // Müşterinin sepeti
let realtimeChannels = []; // Gerçek zamanlı kanalları saklamak için
let categories = [];
let activeCategory = 'all';

// Kategori görselleri için varsayılan değerler
const DEFAULT_IMAGES = {
    'starters': 'img/placeholders/starter-placeholder.svg',
    'mains': 'img/placeholders/main-placeholder.svg',
    'drinks': 'img/placeholders/drink-placeholder.svg',
    'desserts': 'img/placeholders/dessert-placeholder.svg',
    'default': 'img/placeholders/food-placeholder.svg'
};

document.addEventListener('DOMContentLoaded', () => {
    initQrPage();
    // Modal kapatma butonu
    document.getElementById('closeCartModal').addEventListener('click', () => {
        document.getElementById('orderCartPanel').classList.remove('open');
    });
    // Sepet butonuna tıklama (en sade ve hatasız)
    const cartBtn = document.getElementById('viewCartButton');
    const cartPanel = document.getElementById('orderCartPanel');
    cartBtn.style.display = 'flex';
    cartBtn.style.opacity = '1';
    cartBtn.onclick = () => {
        cartPanel.classList.add('open');
        updateCartUI();
    };
    // Sayfa ilk açıldığında panel kapalı olsun
    cartPanel.classList.remove('open');
});

async function initQrPage() {
    try {
    const urlParams = new URLSearchParams(window.location.search);
    tableNumber = urlParams.get('table');
    
    if (!tableNumber) {
            return showError('Geçersiz masa numarası.');
    }
    
        // Supabase bağlantısını oluştur
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase bağlantısı kuruldu.');
        
        // Masa bilgilerini getir veya oluştur
        await getOrCreateTable();
        
        // Arayüzü hazırla
        document.getElementById('tableNumber').textContent = tableNumber;
        document.getElementById('loadingPage').classList.add('hidden');
        document.getElementById('qrPage').classList.remove('hidden');
        
        // Menüyü yükle ve olay dinleyicilerini ayarla
        await loadAndRenderMenu();
        setupEventListeners();
        setupRealtimeSubscriptions();
        
    } catch (error) {
        console.error('Sayfa başlatılırken hata oluştu:', error);
        showError('Sistem başlatılamadı. Lütfen sayfayı yenileyin.');
    }
}

async function getOrCreateTable() {
    const { data, error } = await supabase
            .from('masalar')
            .select('id')
            .eq('masa_no', tableNumber)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116: "single" sorguda sonuç bulunamadı hatası
        throw new Error('Masa bilgisi alınamadı: ' + error.message);
    }

    if (data) {
        tableId = data.id;
        console.log(`Masa ${tableNumber} bulundu. ID: ${tableId}`);
    } else {
        // Sadece masa_no ve durum ile yeni masa ekle, id gönderme
        const { data: newTable, error: insertError } = await supabase
            .from('masalar')
            .insert({ masa_no: tableNumber, durum: 'bos' })
            .select('id')
            .single();
        
        if (insertError) {
            throw new Error('Yeni masa oluşturulamadı: ' + insertError.message);
        }
        tableId = newTable.id;
        console.log(`Masa ${tableNumber} oluşturuldu. ID: ${tableId}`);
    }
}

async function loadAndRenderMenu() {
    try {
        // Kategorileri çek
        const { data: kategoriler, error: kategoriError } = await supabase
            .from('kategoriler')
            .select('*')
            .order('sira', { ascending: true });
        if (kategoriError) throw kategoriError;
        categories = kategoriler || [];
        renderCategoryButtons();

        // Ürünleri çek
        const { data: urunler, error } = await supabase
            .from('urunler')
            .select('*')
            .eq('mevcut', true);
        if (error) throw error;
        window.lastUrunlerList = urunler;
        renderAllMenuItems(urunler);
    } catch (error) {
        console.error('Menü yüklenirken hata:', error);
        showError('Menü yüklenemedi.');
    }
}

function renderCategoryButtons() {
    const container = document.querySelector('.flex.space-x-2.pb-2');
    if (!container) return;
    container.innerHTML = '';
    // Tümü butonu
    const allBtn = document.createElement('button');
    allBtn.className = `menu-category-button flex-shrink-0 px-4 py-2 rounded-full ${activeCategory==='all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`;
    allBtn.dataset.category = 'all';
    allBtn.textContent = 'Tümü';
    allBtn.onclick = () => { activeCategory = 'all'; renderCategoryButtons(); renderAllMenuItems(window.lastUrunlerList); };
    container.appendChild(allBtn);
    // Diğer kategoriler
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `menu-category-button flex-shrink-0 px-4 py-2 rounded-full ${activeCategory===cat.ad ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`;
        btn.dataset.category = cat.ad;
        btn.textContent = cat.ad;
        btn.onclick = () => { activeCategory = cat.ad; renderCategoryButtons(); renderAllMenuItems(window.lastUrunlerList); };
        container.appendChild(btn);
    });
}

function renderAllMenuItems(urunler) {
    const container = document.getElementById('menuItemsContainer');
    container.innerHTML = '';
    if (!urunler || urunler.length === 0) {
        container.innerHTML = `<p class="text-center p-4 text-gray-500">Hiç ürün bulunmuyor.</p>`;
        return;
    }
    // Kategoriye göre filtrele
    let filtered = urunler;
    if (activeCategory !== 'all') {
        filtered = urunler.filter(u => u.kategori === activeCategory);
    }
    if (filtered.length === 0) {
        container.innerHTML = `<p class="text-center p-4 text-gray-500">Bu kategoride ürün yok.</p>`;
        return;
    }
    filtered.forEach(item => {
        const itemInCart = cart.find(cartItem => cartItem.id === item.id);
        const imageUrl = item.image_url || DEFAULT_IMAGES.default;
        const itemElement = document.createElement('div');
        itemElement.className = 'menu-item-card bg-white rounded-lg shadow-sm p-3 flex flex-col items-center mb-2 relative';
        itemElement.innerHTML = `
            <div class="w-20 h-20 mb-2 rounded-lg overflow-hidden flex-shrink-0 mx-auto">
                <img src="${imageUrl}" alt="${item.ad}" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_IMAGES.default}'">
            </div>
            <div class="font-medium text-center w-full">${item.ad}</div>
            <div class="text-xs text-cyan-400 font-semibold mt-1 text-center w-full">${item.kategori || ''}</div>
            <div class="text-primary font-semibold mt-1 text-center w-full">${item.fiyat ? item.fiyat.toLocaleString('tr-TR') + '₺' : ''}</div>
            <div class="flex items-center justify-center gap-1 mt-2 w-full">
                ${itemInCart ? `<button class='quantity-btn px-2 py-1 bg-gray-100 text-xs rounded' data-id='${item.id}' data-action='decrease'>-</button><span class='px-1 text-xs font-semibold'>${itemInCart.quantity}</span><button class='quantity-btn px-2 py-1 bg-gray-100 text-xs rounded' data-id='${item.id}' data-action='increase'>+</button>` : ''}
            </div>
        `;
        // Kartın tamamı tıklanabilir, + butonu yok
        itemElement.addEventListener('click', (e) => {
            // Eğer -+ butonlarına tıklanıyorsa kartı tetikleme
            if (e.target.classList.contains('quantity-btn')) return;
            // Geri tepme animasyonu
            itemElement.style.transform = 'scale(0.96)';
            setTimeout(() => { itemElement.style.transform = ''; }, 120);
            addToCart(item);
        });
        container.appendChild(itemElement);
    });
}

function setupEventListeners() {
    document.getElementById('callWaiterButton').addEventListener('click', callWaiter);
    document.getElementById('viewCartButton').addEventListener('click', toggleCartPanel);
    document.getElementById('placeOrderButton').addEventListener('click', placeOrder);
    // Köz İstiyorum butonu
    document.getElementById('hookahButton').addEventListener('click', callHookah);
    // Menü container'ı için olay delegasyonu (event delegation)
    const menuContainer = document.getElementById('menuItemsContainer');
    menuContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const itemId = target.dataset.id;
        if (target.classList.contains('add-to-cart-btn')) {
            // Ürünü doğrudan urunler listesinden bul
            const item = window.lastUrunlerList?.find(p => p.id == itemId);
            if (item) addToCart(item);
        } else if (target.classList.contains('quantity-btn')) {
            const action = target.dataset.action;
            if (action === 'increase') {
                increaseQuantity(itemId);
            } else if (action === 'decrease') {
                decreaseQuantity(itemId);
            }
        }
    });
}

function setupRealtimeSubscriptions() {
    // Önceki kanalları temizle
    realtimeChannels.forEach(channel => supabase.removeChannel(channel));
    realtimeChannels = [];
    
    // Ürünler veya kategoriler değiştiğinde menüyü yeniden yükle
    const productChanges = supabase.channel('product-and-category-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'urunler' }, () => loadAndRenderMenu())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'kategoriler' }, () => loadAndRenderMenu())
        .subscribe(status => {
            if (status === 'SUBSCRIBED') console.log('Ürün ve kategori değişiklikleri dinleniyor.');
        });
        
    realtimeChannels.push(productChanges);
}

async function callWaiter() {
    const callButton = document.getElementById('callWaiterButton');
    callButton.disabled = true;
    callButton.innerHTML = `<i class="ri-loader-2-line animate-spin mr-2"></i> Çağrılıyor...`;

    try {
        const { error } = await supabase.from('waiter_calls').insert({
            table_id: tableId,
            table_number: tableNumber,
            status: 'waiting'
        });

        if (error) throw error;

        showSuccess('Garson çağrıldı. En kısa sürede masanıza gelecektir.');
        // Butonu bir süre pasif tut
        setTimeout(() => {
            callButton.disabled = false;
            callButton.innerHTML = `<i class="ri-user-voice-line mr-1"></i> Garson Çağır`;
        }, 20000); // 20 saniye bekleme süresi

    } catch (error) {
        console.error('Garson çağırma hatası:', error);
        showError('Garson çağrılamadı. Lütfen tekrar deneyin.');
        callButton.disabled = false;
        callButton.innerHTML = `<i class="ri-user-voice-line mr-1"></i> Garson Çağır`;
    }
}

async function callHookah() {
    const hookahButton = document.getElementById('hookahButton');
    hookahButton.disabled = true;
    hookahButton.innerHTML = `<i class="ri-loader-2-line animate-spin mr-2"></i> Gönderiliyor...`;
    try {
        const { error } = await supabase.from('waiter_calls').insert({
            table_id: tableId,
            table_number: tableNumber,
            status: 'hookah'
        });
        if (error) throw error;
        showSuccess('Köz isteğiniz alındı. Garson en kısa sürede getirecek.');
        setTimeout(() => {
            hookahButton.disabled = false;
            hookahButton.innerHTML = `<i class="ri-fire-line mr-1"></i> Köz İstiyorum`;
        }, 20000);
    } catch (error) {
        console.error('Köz isteği hatası:', error);
        showError('Köz isteği gönderilemedi. Lütfen tekrar deneyin.');
        hookahButton.disabled = false;
        hookahButton.innerHTML = `<i class="ri-fire-line mr-1"></i> Köz İstiyorum`;
    }
}

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
    renderAllMenuItems(window.lastUrunlerList || []);
    // Sepet panelini aç
    const panel = document.getElementById('orderCartPanel');
    if (panel && !panel.classList.contains('open')) {
        panel.classList.add('open');
    }
}

function decreaseQuantity(itemId) {
    const itemIndex = cart.findIndex(item => item.id == itemId);
    if (itemIndex > -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity--;
        } else {
            cart.splice(itemIndex, 1); // Miktar 1 ise sepetten çıkar
        }
    }
    updateCartUI();
    renderAllMenuItems(window.lastUrunlerList || []);
}

function increaseQuantity(itemId) {
    const item = cart.find(item => item.id == itemId);
    if (item) {
        item.quantity++;
    }
    updateCartUI();
    renderAllMenuItems(window.lastUrunlerList || []);
}

function updateCartUI() {
    const cartButton = document.getElementById('viewCartButton');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    const placeOrderButton = document.getElementById('placeOrderButton');
    const orderNoteInput = document.getElementById('orderNoteInput');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartButton.style.transform = 'scale(1)';
        cartItemCount.textContent = totalItems;
        placeOrderButton.disabled = false;
        cartItemsList.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center py-2 border-b border-gray-100';
            const imageUrl = item.image_url || DEFAULT_IMAGES.default;
            itemElement.innerHTML = `
                <div class="flex items-center flex-1">
                    <div class="w-10 h-10 mr-2 rounded overflow-hidden flex-shrink-0">
                        <img src="${imageUrl}" alt="${item.ad}" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_IMAGES.default}'">
                    </div>
                    <div class="flex-1">
                        <div class="text-sm font-medium">${item.ad} <span class="text-xs text-gray-500">x${item.quantity}</span></div>
                    </div>
                </div>
                <div class="text-sm font-medium">${(item.fiyat * item.quantity).toLocaleString('tr-TR')}₺</div>
            `;
            cartItemsList.appendChild(itemElement);
        });
        const total = cart.reduce((sum, item) => sum + (item.fiyat * item.quantity), 0);
        cartTotal.textContent = `${total.toLocaleString('tr-TR')}₺`;
        // Not ekleme alanı ve siparişi onayla butonu her zaman görünür
        if (orderNoteInput) orderNoteInput.style.display = '';
        if (placeOrderButton) placeOrderButton.style.display = '';
    } else {
        cartButton.style.transform = 'scale(0)';
        placeOrderButton.disabled = true;
        cartItemsList.innerHTML = '<p class="text-gray-500 text-center text-sm py-2">Sepetiniz boş</p>';
        cartTotal.textContent = '0₺';
        if (orderNoteInput) orderNoteInput.style.display = '';
        if (placeOrderButton) placeOrderButton.style.display = '';
        document.getElementById('orderCartPanel').classList.remove('open');
    }
}

function toggleCartPanel() {
    const panel = document.getElementById('orderCartPanel');
    if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        updateCartUI(); // Panel açılırken içeriği güncelle
    } else {
        panel.classList.remove('open');
    }
}

function openCartModal() {
    const overlay = document.querySelector('.cart-modal-overlay');
    overlay.classList.add('active');
}

function closeCartModal() {
    const overlay = document.querySelector('.cart-modal-overlay');
    overlay.classList.remove('active');
}

async function placeOrder() {
    const placeOrderButton = document.getElementById('placeOrderButton');
    if (cart.length === 0) {
        return showError('Sipariş vermek için sepetinizde ürün olmalı.');
    }
    placeOrderButton.disabled = true;
    placeOrderButton.innerHTML = `<i class="ri-loader-2-line animate-spin mr-2"></i> Gönderiliyor...`;
    try {
        const orderNote = document.getElementById('orderNoteInput').value || null;
        // 1. "orders" tablosuna ana sipariş kaydını oluştur
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                table_id: tableId,
                status: 'pending_approval',
                note: orderNote,
                items: cart.map(item => ({
                    id: item.id,
                    ad: item.ad,
                    fiyat: item.fiyat,
                    quantity: item.quantity
                }))
            })
            .select('id')
            .single();
        if (orderError) throw orderError;
        const newOrderId = orderData.id;
        // 2. "order_items" tablosuna sepetteki her bir ürünü ekle
        const orderItems = cart.map(item => ({
            order_id: newOrderId,
            menu_item_id: item.id,
            quantity: item.quantity,
            price: item.fiyat,
            name: item.ad,
        }));
        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) {
            // Eğer ürünleri eklerken hata olursa, oluşturulan ana siparişi silerek işlemi geri al.
            console.error('Sipariş kalemleri eklenemedi, sipariş siliniyor.', itemsError);
            await supabase.from('orders').delete().eq('id', newOrderId);
            throw itemsError;
        }
        showSuccess('Siparişiniz alındı! Garson onayladıktan sonra hazırlanacaktır.');
        // Sipariş sonrası arayüzü temizle
        cart = [];
        document.getElementById('orderNoteInput').value = '';
        updateCartUI();
        toggleCartPanel();
        renderAllMenuItems(window.lastUrunlerList || []);
    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        showError('Sipariş gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
        placeOrderButton.disabled = false;
        placeOrderButton.innerHTML = 'Siparişi Onayla';
    }
}

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toast.classList.remove('hidden', 'bg-red-500', 'bg-green-500');
    if (type === 'error') {
        toast.classList.add('bg-red-500');
        toastIcon.innerHTML = '<i class="ri-close-circle-line"></i>';
    } else {
        toast.classList.add('bg-green-500');
        toastIcon.innerHTML = '<i class="ri-check-line"></i>';
    }
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function updateCartPanel() {
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    const cartQuantityControls = document.getElementById('cartQuantityControls');
    cartItemsList.innerHTML = '';
    let total = 0;
    let totalQuantity = 0;
    for (const item of cart) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'flex justify-between items-center mb-1';
        itemDiv.innerHTML = `<span class="text-cyan-100">${item.name}</span><span class="text-cyan-300 font-semibold">${item.price * item.quantity}₺</span>`;
        cartItemsList.appendChild(itemDiv);
        total += item.price * item.quantity;
        totalQuantity += item.quantity;
    }
    cartTotal.textContent = total + '₺';
    // Adet kontrolü -+ ve miktar toplam fiyatın hemen altında küçük ve yatay
    cartQuantityControls.innerHTML = `
        <button onclick="decreaseCartQuantity()">-</button>
        <span>${totalQuantity}</span>
        <button onclick="increaseCartQuantity()">+</button>
    `;
    if (cart.length === 0) {
        cartItemsList.innerHTML = '<p class="text-gray-500 text-center text-sm py-2">Sepetiniz boş</p>';
        cartQuantityControls.innerHTML = '';
        cartTotal.textContent = '0₺';
        document.getElementById('orderCartPanel').classList.remove('open');
    }
}

function decreaseCartQuantity() {
    // Sepetteki ilk ürünün adedini azalt (örnek mantık, çoklu ürün için özelleştirilebilir)
    if (cart.length > 0 && cart[0].quantity > 1) {
        cart[0].quantity--;
        updateCartPanel();
    }
}
function increaseCartQuantity() {
    if (cart.length > 0) {
        cart[0].quantity++;
        updateCartPanel();
    }
} 