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
        // Kategorileri ve ürünleri aynı anda çek
        const [kategorilerRes, urunlerRes] = await Promise.all([
            supabase.from('kategoriler').select('ad, sira').order('sira'),
            supabase.from('urunler').select('*').eq('mevcut', true).order('ad')
        ]);

        if (kategorilerRes.error) throw kategorilerRes.error;
        if (urunlerRes.error) throw urunlerRes.error;

        const kategoriler = kategorilerRes.data;
        const urunler = urunlerRes.data;

        // Menüyü yapılandır
        menu = {};
        kategoriler.forEach(k => {
            menu[k.ad] = [];
        });
        menu['Diğer'] = [];

        urunler.forEach(urun => {
            if (urun.kategori && menu[urun.kategori]) {
                menu[urun.kategori].push(urun);
            } else {
                menu['Diğer'].push(urun);
            }
        });

        // 'Tümü' kategorisini ekle
        const allCategories = ['Tümü', ...kategoriler.map(k => k.ad)];
        renderCategoryButtons(allCategories);
        renderMenuItems('Tümü');

    } catch (error) {
        console.error('Menü yüklenirken hata:', error);
        showError('Menü yüklenemedi.');
    }
}

function renderCategoryButtons(categories) {
    const container = document.getElementById('categoryButtons');
    container.innerHTML = '';
    categories.forEach(categoryName => {
        const button = document.createElement('button');
        button.className = 'menu-category-button flex-shrink-0 px-4 py-2 text-sm font-medium rounded-full mr-2 bg-gray-200 text-gray-700 transition-colors duration-200';
        button.textContent = categoryName;
        button.dataset.category = categoryName;
        button.addEventListener('click', () => {
            document.querySelectorAll('.menu-category-button').forEach(btn => btn.classList.remove('bg-primary', 'text-white'));
            button.classList.add('bg-primary', 'text-white');
            renderMenuItems(categoryName);
        });
        container.appendChild(button);
    });
    // İlk butonu aktif yap (Tümü)
    if (container.firstChild) {
        container.firstChild.classList.add('bg-primary', 'text-white');
    }
}

function renderMenuItems(categoryName) {
    const container = document.getElementById('menuItemsContainer');
    container.innerHTML = '';
    let itemsToShow = [];
    if (categoryName === 'Tümü') {
        // Tüm kategorilerdeki ürünleri birleştir
        itemsToShow = Object.values(menu).flat();
    } else {
        itemsToShow = menu[categoryName] || [];
    }
    if (itemsToShow.length === 0) {
        container.innerHTML = `<p class="text-center p-4 text-gray-500">Bu kategoride ürün bulunmuyor.</p>`;
        return;
    }
    itemsToShow.forEach(item => {
        const itemInCart = cart.find(cartItem => cartItem.id === item.id);
        const imageUrl = item.image_url || DEFAULT_IMAGES[item.kategori?.toLowerCase()] || DEFAULT_IMAGES.default;
        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white rounded-lg shadow-sm p-3 flex justify-between items-center';
        itemElement.innerHTML = `
            <div class="flex items-center flex-1">
                <div class="w-16 h-16 mr-3 rounded-lg overflow-hidden flex-shrink-0">
                    <img src="${imageUrl}" alt="${item.ad}" class="w-full h-full object-cover" onerror="this.src='${DEFAULT_IMAGES.default}'">
                </div>
                <div class="flex-1">
                    <div class="font-medium">${item.ad}</div>
                    <div class="text-gray-500 text-sm">${item.aciklama || ''}</div>
                    <div class="text-primary font-semibold mt-1">${item.fiyat?.toLocaleString('tr-TR') || ''}₺</div>
                </div>
            </div>
            <div class="flex items-center">
                ${itemInCart ? `
                    <div class="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                        <button class="quantity-btn px-2 py-1 bg-gray-100" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="px-3">${itemInCart.quantity}</span>
                        <button class="quantity-btn px-2 py-1 bg-gray-100" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                ` : `
                    <button class="add-to-cart-btn bg-primary text-white px-3 py-1 rounded-full" data-id="${item.id}">
                        <i class="ri-add-line"></i>
                    </button>
                `}
            </div>
        `;
        container.appendChild(itemElement);
    });
}

function setupEventListeners() {
    document.getElementById('callWaiterButton').addEventListener('click', callWaiter);
    document.getElementById('viewCartButton').addEventListener('click', openCartModal);
    document.getElementById('placeOrderButton').addEventListener('click', placeOrder);
    // Köz İstiyorum butonu için event listener
    const coalBtn = document.getElementById('requestCoalButton');
    if (coalBtn) {
        coalBtn.addEventListener('click', requestCoal);
    }
    // Sepet popup kapatma
    const closeCartBtn = document.getElementById('closeCartModal');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', closeCartModal);
    }
    // Menü container'ı için olay delegasyonu (event delegation)
    const menuContainer = document.getElementById('menuItemsContainer');
    menuContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const itemId = target.dataset.id;
        if (target.classList.contains('add-to-cart-btn')) {
            const item = Object.values(menu).flat().find(p => p.id == itemId);
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

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }
    updateCartUI();
    renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'all');
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
    renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'all');
}

function increaseQuantity(itemId) {
    const item = cart.find(item => item.id == itemId);
    if (item) {
        item.quantity++;
    }
    updateCartUI();
    renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'all');
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    modal.classList.remove('hidden', 'translate-y-full');
    modal.classList.add('translate-y-0');
    showCartOverlay();
    updateCartUI();
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    modal.classList.add('translate-y-full');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
    hideCartOverlay();
}

// Sepet popup açıldığında arka planı karartmak için overlay fonksiyonları
function showCartOverlay() {
    let overlay = document.getElementById('cartOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'cartOverlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-40 z-40';
        overlay.onclick = closeCartModal;
        document.body.appendChild(overlay);
    }
    overlay.classList.remove('hidden');
}

function hideCartOverlay() {
    const overlay = document.getElementById('cartOverlay');
    if (overlay) overlay.classList.add('hidden');
}

function updateCartUI() {
    const cartButton = document.getElementById('viewCartButton');
    const cartItemCount = document.getElementById('cartItemCount');
    const cartItemsList = document.getElementById('cartItemsList');
    const cartTotal = document.getElementById('cartTotal');
    const placeOrderButton = document.getElementById('placeOrderButton');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 0) {
        cartButton.style.transform = 'scale(1)';
        cartItemCount.textContent = totalItems;
        placeOrderButton.disabled = false;
        cartItemsList.innerHTML = '';
        cart.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center py-2 border-b border-gray-100';
            const imageUrl = item.image_url || DEFAULT_IMAGES[item.kategori?.toLowerCase()] || DEFAULT_IMAGES.default;
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
    } else {
        cartButton.style.transform = 'scale(0)';
        placeOrderButton.disabled = true;
        cartItemsList.innerHTML = '<p class="text-gray-500 text-center text-sm py-2">Sepetiniz boş</p>';
        cartTotal.textContent = '0₺';
    }
}

async function placeOrder() {
    const placeOrderButton = document.getElementById('placeOrderButton');
        if (cart.length === 0) {
        return showError('Sipariş vermek için sepetinizde ürün olmalı.');
        }
        
        placeOrderButton.disabled = true;
    placeOrderButton.innerHTML = `<i class="ri-loader-2-line animate-spin mr-2"></i> Gönderiliyor...`;

    try {
        const totalAmount = cart.reduce((sum, item) => sum + item.fiyat * item.quantity, 0);
        const orderNote = document.getElementById('orderNoteInput').value || null;

        // 1. "orders" tablosuna ana sipariş kaydını oluştur
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .insert({
                table_id: tableId,
                status: 'pending_approval', // Garson onayı bekliyor
                total_price: totalAmount,
                note: orderNote,
                source: 'qr'
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
        openCartModal();
        renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'all');

    } catch (error) {
        console.error('Sipariş oluşturma hatası:', error);
        showError('Sipariş gönderilemedi. Lütfen tekrar deneyin.');
    } finally {
        placeOrderButton.disabled = false;
        placeOrderButton.innerHTML = 'Siparişi Onayla';
    }
}

async function requestCoal() {
    const coalBtn = document.getElementById('requestCoalButton');
    coalBtn.disabled = true;
    coalBtn.innerHTML = `<i class="ri-loader-2-line animate-spin mr-2"></i> Gönderiliyor...`;
    try {
        const { error } = await supabase.from('waiter_calls').insert({
            table_id: tableId,
            table_number: tableNumber,
            status: 'coal'
        });
        if (error) throw error;
        showToast('Köz isteğiniz alındı.', 'success');
        setTimeout(() => {
            coalBtn.disabled = false;
            coalBtn.innerHTML = `<i class='ri-fire-line mr-1'></i> Köz İstiyorum`;
        }, 10000);
    } catch (error) {
        showError('Köz isteği gönderilemedi.');
        coalBtn.disabled = false;
        coalBtn.innerHTML = `<i class='ri-fire-line mr-1'></i> Köz İstiyorum`;
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