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
    // Garson çağırma butonu
    const callWaiterBtn = document.getElementById('callWaiterButton');
    if (callWaiterBtn) {
        callWaiterBtn.addEventListener('click', async () => {
            await supabase.from('waiter_calls').insert({
                table_id: tableId,
                table_number: tableId,
                type: 'garson'
            });
            // ...
        });
    }
    // Köz çağırma butonu
    const callCoalBtn = document.getElementById('requestCoalButton');
    if (callCoalBtn) {
        callCoalBtn.addEventListener('click', async () => {
            await supabase.from('waiter_calls').insert({
                table_id: tableId,
                table_number: tableId,
                type: 'coal'
            });
            // ...
        });
    }
    // Dinamik topbar yüksekliği için body padding
    const topbar = document.querySelector('.topbar-fixed');
    const categoryNav = document.getElementById('categoryNav');
    if (topbar && categoryNav) {
        const setTopbarPadding = () => {
            const total = topbar.offsetHeight;
            document.body.style.paddingTop = total + 'px';
        };
        setTopbarPadding();
        window.addEventListener('resize', setTopbarPadding);
        new ResizeObserver(setTopbarPadding).observe(topbar);
        new ResizeObserver(setTopbarPadding).observe(categoryNav);
    }
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
        const tableNumberElement = document.getElementById('tableNumber');
        if (tableNumberElement) {
            tableNumberElement.textContent = tableNumber;
        }
        
        const loadingPage = document.getElementById('loadingPage');
        const qrPage = document.getElementById('qrPage');
        
        if (loadingPage) loadingPage.style.display = 'none';
        if (qrPage) qrPage.style.display = 'flex';
        
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
    if (!container) return;
    
    container.innerHTML = '';
    categories.forEach(categoryName => {
        const button = document.createElement('button');
        button.className = 'menu-category-button';
        button.textContent = categoryName;
        button.dataset.category = categoryName;
        button.addEventListener('click', () => {
            document.querySelectorAll('.menu-category-button').forEach(btn => btn.classList.remove('bg-primary'));
            button.classList.add('bg-primary');
            renderMenuItems(categoryName);
        });
        container.appendChild(button);
    });
    // İlk butonu aktif yap (Tümü)
    if (container.firstChild) {
        container.firstChild.classList.add('bg-primary');
    }
}

function renderMenuItems(categoryName) {
    const container = document.getElementById('menuItemsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    let itemsToShow = [];
    if (categoryName === 'Tümü') {
        // Tüm kategorilerdeki ürünleri birleştir
        itemsToShow = Object.values(menu).flat();
    } else {
        itemsToShow = menu[categoryName] || [];
    }
    if (itemsToShow.length === 0) {
        container.innerHTML = `<p class="text-center p-3 text-gray-500 text-sm">Bu kategoride ürün bulunmuyor.</p>`;
        return;
    }
    itemsToShow.forEach(item => {
        const itemInCart = cart.find(cartItem => cartItem.id === item.id);
        const imageUrl = item.image_url || DEFAULT_IMAGES[item.kategori?.toLowerCase()] || DEFAULT_IMAGES.default;
        const itemElement = document.createElement('div');
        itemElement.className = 'modern-card';
        itemElement.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${item.ad}" onerror="this.src='${DEFAULT_IMAGES.default}'">
                </div>
                <div>
                    <h3 class="font-semibold text-sm text-white truncate max-w-[150px]">${item.ad}</h3>
                    <p class="price-color text-sm mt-1">${item.fiyat?.toLocaleString('tr-TR') || ''}₺</p>
                </div>
            </div>
            <div class="flex items-center">
                ${itemInCart ? `
                    <div class="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                        <button class="quantity-btn" data-id="${item.id}" data-action="decrease">-</button>
                        <span class="px-2 text-sm">${itemInCart.quantity}</span>
                        <button class="quantity-btn" data-id="${item.id}" data-action="increase">+</button>
                    </div>
                ` : `
                    <button class="add-to-cart-btn" data-id="${item.id}">
                        <i class="ri-add-line"></i>
                    </button>
                `}
            </div>
        `;
        container.appendChild(itemElement);
    });
    
    // Sepete ekle butonlarına olay dinleyicileri ekle
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.id);
            const item = itemsToShow.find(item => item.id === itemId);
            if (item) {
                addToCart(item);
            }
        });
    });
    
    // Miktar butonlarına olay dinleyicileri ekle
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.id);
            const action = this.dataset.action;
            
            if (action === 'increase') {
                increaseQuantity(itemId);
            } else if (action === 'decrease') {
                decreaseQuantity(itemId);
            }
        });
    });
}

function setupEventListeners() {
    // Garson çağırma butonu
    const callWaiterBtn = document.getElementById('callWaiterButton');
    if (callWaiterBtn) {
        callWaiterBtn.addEventListener('click', callWaiter);
    }
    
    // Köz isteme butonu
    const coalBtn = document.getElementById('requestCoalButton');
    if (coalBtn) {
        coalBtn.addEventListener('click', requestCoal);
    }
    
    // Sepet görüntüleme butonu
    const viewCartBtn = document.getElementById('viewCartButton');
    if (viewCartBtn) {
        viewCartBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openCartModal();
        });
    }
    
    // Sipariş verme butonu
    const placeOrderBtn = document.getElementById('placeOrderButton');
    if (placeOrderBtn) {
        placeOrderBtn.addEventListener('click', placeOrder);
    }
    
    // Sepet popup kapatma butonu
    const closeCartBtn = document.getElementById('closeCartModal');
    if (closeCartBtn) {
        closeCartBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeCartModal();
        });
    }
    
    // Dışarı tıklanınca popup kapansın
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('cartModal');
        const viewCartBtn = document.getElementById('viewCartButton');
        const backdrop = document.getElementById('modalBackdrop');
        
        if (modal && modal.classList.contains('open')) {
            if (backdrop && backdrop === e.target) {
                closeCartModal();
                return;
            }

            if (!modal.contains(e.target) && (!viewCartBtn || !viewCartBtn.contains(e.target))) {
                closeCartModal();
            }
        }
    });
}

function setupRealtimeSubscriptions() {
    try {
        // Sipariş durumu değişikliklerini dinle
        const orderChannel = supabase
            .channel('orders-channel')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'siparisler',
                filter: `masa_id=eq.${tableId}`
            }, payload => {
                console.log('Sipariş güncellendi:', payload);
                showToast(`Siparişiniz ${getOrderStatusText(payload.new.durum)} durumuna güncellendi.`, 'success');
            })
            .subscribe();
            
        realtimeChannels.push(orderChannel);
        
        console.log('Gerçek zamanlı abonelikler kuruldu.');
    } catch (error) {
        console.error('Gerçek zamanlı abonelikler kurulurken hata:', error);
    }
}

async function callWaiter() {
    try {
        const callWaiterBtn = document.getElementById('callWaiterButton');
        if (callWaiterBtn) {
            callWaiterBtn.disabled = true;
        }
        
        const { error } = await supabase.from('waiter_calls').insert({
            table_id: tableId,
            table_number: tableNumber,
            type: 'garson'
        });
        
        if (error) throw error;
        
        showToast('Garson çağrınız iletildi.', 'success');
        
        // 30 saniye sonra butonu tekrar aktif et
        setTimeout(() => {
            if (callWaiterBtn) {
                callWaiterBtn.disabled = false;
            }
        }, 30000);
        
    } catch (error) {
        console.error('Garson çağırma hatası:', error);
        showError('Garson çağrılamadı. Lütfen tekrar deneyin.');
        
        const callWaiterBtn = document.getElementById('callWaiterButton');
        if (callWaiterBtn) {
            callWaiterBtn.disabled = false;
        }
    }
}

async function requestCoal() {
    try {
        const coalBtn = document.getElementById('requestCoalButton');
        if (coalBtn) {
            coalBtn.disabled = true;
        }
        
        const { error } = await supabase.from('waiter_calls').insert({
            table_id: tableId,
            table_number: tableNumber,
            type: 'coal'
        });
        
        if (error) throw error;
        
        showToast('Köz talebiniz iletildi.', 'success');
        
        // 30 saniye sonra butonu tekrar aktif et
        setTimeout(() => {
            if (coalBtn) {
                coalBtn.disabled = false;
            }
        }, 30000);
        
    } catch (error) {
        console.error('Köz isteme hatası:', error);
        showError('Köz isteği iletilemedi. Lütfen tekrar deneyin.');
        
        const coalBtn = document.getElementById('requestCoalButton');
        if (coalBtn) {
            coalBtn.disabled = false;
        }
    }
}

function addToCart(item) {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: item.id,
            name: item.ad,
            price: item.fiyat || 0,
            quantity: 1
        });
    }
    
    updateCartUI();
    renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'Tümü');
}

function decreaseQuantity(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        if (cart[itemIndex].quantity > 1) {
            cart[itemIndex].quantity -= 1;
        } else {
            cart.splice(itemIndex, 1);
        }
        
        updateCartUI();
        renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'Tümü');
    }
}

function increaseQuantity(itemId) {
    const item = cart.find(item => item.id === itemId);
    
    if (item) {
        item.quantity += 1;
        updateCartUI();
        renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'Tümü');
    }
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.add('open');
    }
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.style.display = 'block';
    document.body.classList.add('modal-open');
}

function closeCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) {
        modal.classList.remove('open');
    }
    const backdrop = document.getElementById('modalBackdrop');
    if (backdrop) backdrop.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function updateCartUI() {
    // Sepet sayacını güncelle
    const cartCount = document.getElementById('cartItemCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        cartCount.textContent = totalItems;
        
        if (totalItems > 0) {
            cartCount.style.display = 'flex';
        } else {
            cartCount.style.display = 'none';
        }
    }
    
    // Sepet içeriğini güncelle
    const cartItemsList = document.getElementById('cartItemsList');
    if (!cartItemsList) return;
    
    if (cart.length === 0) {
        cartItemsList.innerHTML = `<p class="text-gray-500 text-center text-xs py-2">Sepetiniz boş</p>`;
        return;
    }
    
    let totalPrice = 0;
    cartItemsList.innerHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between items-center py-1.5 border-b border-gray-700';
        itemElement.innerHTML = `
            <div class="min-w-0 flex-1">
                <div class="font-medium text-sm truncate">${item.name}</div>
                <div class="text-xs text-gray-400">${item.quantity} x ${item.price.toLocaleString('tr-TR')}₺</div>
            </div>
            <div class="flex items-center">
                <div class="text-primary font-bold text-sm">${itemTotal.toLocaleString('tr-TR')}₺</div>
                <button class="ml-2 text-gray-400 hover:text-red-500 text-sm" data-remove="${item.id}">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </div>
        `;
        cartItemsList.appendChild(itemElement);
    });
    
    // Toplam tutarı ekle
    const totalElement = document.createElement('div');
    totalElement.className = 'flex justify-between items-center py-1.5 mt-1.5 border-t border-gray-700';
    totalElement.innerHTML = `
        <div class="font-bold text-sm">Toplam</div>
        <div class="text-primary font-bold text-base">${totalPrice.toLocaleString('tr-TR')}₺</div>
    `;
    cartItemsList.appendChild(totalElement);
    
    // Silme butonlarına olay dinleyicileri ekle
    document.querySelectorAll('[data-remove]').forEach(btn => {
        btn.addEventListener('click', function() {
            const itemId = parseInt(this.dataset.remove);
            const itemIndex = cart.findIndex(item => item.id === itemId);
            
            if (itemIndex !== -1) {
                cart.splice(itemIndex, 1);
                updateCartUI();
                renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'Tümü');
            }
        });
    });
}

async function placeOrder() {
    if (cart.length === 0) {
        showError('Sepetiniz boş. Lütfen sipariş vermek için ürün ekleyin.');
        return;
    }
    
    try {
        const orderNote = document.getElementById('orderNoteInput')?.value || '';
        const orderButton = document.getElementById('placeOrderButton');
        
        if (orderButton) {
            orderButton.disabled = true;
            orderButton.textContent = 'Gönderiliyor...';
        }
        
        // Sipariş oluştur
        const { data: order, error: orderError } = await supabase
            .from('siparisler')
            .insert({
                masa_id: tableId,
                masa_no: tableNumber,
                durum: 'yeni',
                not: orderNote,
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity
                }))
            })
            .select()
            .single();
            
        if (orderError) throw orderError;
        
        // Sipariş detaylarını ekle
        const orderItems = cart.map(item => ({
            siparis_id: order.id,
            urun_id: item.id,
            urun_adi: item.name,
            fiyat: item.price,
            miktar: item.quantity
        }));
        
        const { error: itemsError } = await supabase
            .from('siparis_urunler')
            .insert(orderItems);
            
        if (itemsError) {
            console.error('Sipariş ürünleri eklenirken hata:', itemsError);
            // Ana sipariş oluşturulduğu için devam et
        }
        
        // Sepeti temizle
        cart = [];
        updateCartUI();
        renderMenuItems(document.querySelector('.menu-category-button.bg-primary')?.dataset.category || 'Tümü');
        closeCartModal();
        
        showToast('Siparişiniz alındı!', 'success');
        
    } catch (error) {
        console.error('Sipariş verme hatası:', error);
        showError('Sipariş verilemedi. Lütfen tekrar deneyin.');
    } finally {
        const orderButton = document.getElementById('placeOrderButton');
        if (orderButton) {
            orderButton.disabled = false;
            orderButton.textContent = 'Sipariş Ver';
        }
    }
}

function getOrderStatusText(status) {
    const statusMap = {
        'yeni': 'Yeni',
        'hazirlaniyor': 'Hazırlanıyor',
        'hazir': 'Hazır',
        'teslim_edildi': 'Teslim Edildi',
        'tamamlandi': 'Tamamlandı',
        'iptal': 'İptal Edildi'
    };
    
    return statusMap[status] || status;
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
    
    if (!toast || !toastMessage || !toastIcon) return;
    
    // Simge ve renk ayarla
    if (type === 'error') {
        toast.classList.add('bg-red-500');
        toast.classList.remove('bg-primary', 'bg-green-500');
        toastIcon.innerHTML = '<i class="ri-error-warning-line"></i>';
    } else if (type === 'success') {
        toast.classList.add('bg-green-500');
        toast.classList.remove('bg-primary', 'bg-red-500');
        toastIcon.innerHTML = '<i class="ri-check-line"></i>';
    } else {
        toast.classList.add('bg-primary');
        toast.classList.remove('bg-green-500', 'bg-red-500');
        toastIcon.innerHTML = '<i class="ri-information-line"></i>';
    }
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    toast.classList.add('flex');
    
    // 3 saniye sonra gizle
    setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('flex');
    }, 3000);
} 