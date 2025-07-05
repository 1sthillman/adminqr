// Masalar için varsayılan değerler - Veritabanından yüklenecek
const TABLES = Array.from({ length: 100 }, (_, index) => ({
    id: `temp-${index + 1}`,
    number: index + 1,
    status: 'empty'
}));

const MENU_ITEMS = {
    starters: [
        { id: 1, name: 'Çorba', price: 45, category: 'starters', image: 'waitermenuorqr/www/img/placeholders/starter-placeholder.svg' },
        { id: 2, name: 'Salata', price: 55, category: 'starters', image: 'waitermenuorqr/www/img/placeholders/starter-placeholder.svg' },
        { id: 3, name: 'Bruschetta', price: 65, category: 'starters', image: 'waitermenuorqr/www/img/placeholders/starter-placeholder.svg' },
        { id: 4, name: 'Kalamar', price: 85, category: 'starters', image: 'waitermenuorqr/www/img/placeholders/starter-placeholder.svg' }
    ],
    mains: [
        { id: 5, name: 'Izgara Tavuk', price: 120, category: 'mains', image: 'waitermenuorqr/www/img/placeholders/main-placeholder.svg' },
        { id: 6, name: 'Köfte', price: 135, category: 'mains', image: 'waitermenuorqr/www/img/placeholders/main-placeholder.svg' },
        { id: 7, name: 'Mantı', price: 110, category: 'mains', image: 'waitermenuorqr/www/img/placeholders/main-placeholder.svg' },
        { id: 8, name: 'Pizza', price: 145, category: 'mains', image: 'waitermenuorqr/www/img/placeholders/main-placeholder.svg' }
    ],
    drinks: [
        { id: 9, name: 'Kola', price: 25, category: 'drinks', image: 'waitermenuorqr/www/img/placeholders/drink-placeholder.svg' },
        { id: 10, name: 'Ayran', price: 20, category: 'drinks', image: 'waitermenuorqr/www/img/placeholders/drink-placeholder.svg' },
        { id: 11, name: 'Meyve Suyu', price: 30, category: 'drinks', image: 'waitermenuorqr/www/img/placeholders/drink-placeholder.svg' },
        { id: 12, name: 'Su', price: 10, category: 'drinks', image: 'waitermenuorqr/www/img/placeholders/drink-placeholder.svg' }
    ],
    desserts: [
        { id: 13, name: 'Sütlaç', price: 55, category: 'desserts', image: 'waitermenuorqr/www/img/placeholders/dessert-placeholder.svg' },
        { id: 14, name: 'Baklava', price: 75, category: 'desserts', image: 'waitermenuorqr/www/img/placeholders/dessert-placeholder.svg' },
        { id: 15, name: 'Dondurma', price: 45, category: 'desserts', image: 'waitermenuorqr/www/img/placeholders/dessert-placeholder.svg' },
        { id: 16, name: 'Profiterol', price: 65, category: 'desserts', image: 'waitermenuorqr/www/img/placeholders/dessert-placeholder.svg' }
    ]
};

// Uygulama durumu
let appState = {
    tables: [...TABLES],
    orders: [],
    notifications: [],
    currentTable: null,
    currentOrder: {
        items: [],
        note: ''
    },
    currentUser: null
};

// Supabase değişkenleri
let supabase;
let channel;
const SUPABASE_URL = 'https://egcklzfiyxxnvyxwoowq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnY2tsemZpeXh4bnZ5eHdvb3dxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg0NjQxMTcsImV4cCI6MjA2NDA0MDExN30.dfRQv3lYFCaI1T5ydOw4HyoEJ0I1wOSIUcG8ueEbxKQ';
const rolePrefix = {
    'waiter': 'w',
    'kitchen': 'k',
    'cashier': 'c'
};

// DOM elemanları
const elements = {
    // Giriş ekranı
    loginScreen: document.getElementById('loginScreen'),
    roleSelect: document.getElementById('roleSelect'),
    username: document.getElementById('username'),
    password: document.getElementById('password'),
    loginButton: document.getElementById('loginButton'),
    loginError: document.getElementById('loginError'),
    
    // DOM elemanları yüklendiğinde null olmamasını sağla
    get(id) {
        return document.getElementById(id) || { play: () => {}, pause: () => {} };
    },
    
    // Ana uygulama
    appContainer: document.getElementById('appContainer'),
    userName: document.getElementById('userName'),
    userRole: document.getElementById('userRole'),
    logoutButton: document.getElementById('logoutButton'),
    
    // Garson ekranı
    waiterScreen: document.getElementById('waiterScreen'),
    tableGrid: document.getElementById('tableGrid'),
    refreshTablesButton: document.getElementById('refreshTablesButton'),
    
    // Mutfak ekranı
    kitchenScreen: document.getElementById('kitchenScreen'),
    kitchenOrdersList: document.getElementById('kitchenOrdersList'),
    refreshKitchenButton: document.getElementById('refreshKitchenButton'),
    
    // Kasiyer ekranı
    cashierScreen: document.getElementById('cashierScreen'),
    cashierTablesList: document.getElementById('cashierTablesList'),
    refreshCashierButton: document.getElementById('refreshCashierButton'),
    
    // Sipariş ekranı
    orderScreen: document.getElementById('orderScreen'),
    orderTableTitle: document.getElementById('orderTableTitle'),
    backToTablesButton: document.getElementById('backToTablesButton'),
    categoryButtons: document.querySelectorAll('.category-button'),
    menuItemsGrid: document.getElementById('menuItemsGrid'),
    orderCart: document.getElementById('orderCart'),
    orderNote: document.getElementById('orderNote'),
    submitOrderButton: document.getElementById('submitOrderButton'),
    
    // Sipariş detay ekranı
    orderDetailScreen: document.getElementById('orderDetailScreen'),
    detailTableTitle: document.getElementById('detailTableTitle'),
    detailTableNumber: document.getElementById('detailTableNumber'),
    detailTableStatus: document.getElementById('detailTableStatus'),
    detailTableTime: document.getElementById('detailTableTime'),
    detailTableWaiter: document.getElementById('detailTableWaiter'),
    orderDetailItems: document.getElementById('orderDetailItems'),
    orderDetailNote: document.getElementById('orderDetailNote'),
    orderDetailActions: document.getElementById('orderDetailActions'),
    backFromDetailButton: document.getElementById('backFromDetailButton'),
    
    // Ödeme ekranı
    paymentScreen: document.getElementById('paymentScreen'),
    paymentTitle: document.getElementById('paymentTitle'),
    paymentItems: document.getElementById('paymentItems'),
    paymentTotal: document.getElementById('paymentTotal'),
    cashPayment: document.getElementById('cashPayment'),
    cardPayment: document.getElementById('cardPayment'),
    completePaymentButton: document.getElementById('completePaymentButton'),
    backFromPaymentButton: document.getElementById('backFromPaymentButton'),
    
    // Bildirimler
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toastMessage'),
    notificationButton: document.getElementById('notificationButton'),
    notificationPanel: document.getElementById('notificationPanel'),
    notificationBadge: document.getElementById('notificationBadge'),
    notificationList: document.getElementById('notificationList'),
    get notificationSound() { return elements.get('notificationSound'); },
    get newOrderSound() { return elements.get('newOrderSound'); },
    get orderReadySound() { return elements.get('orderReadySound'); },
    get orderDeliveredSound() { return elements.get('orderDeliveredSound'); },
    get orderServedSound() { return elements.get('orderServedSound'); },
    get paymentCompleteSound() { return elements.get('paymentCompleteSound'); },
    get waiterCallSound() { return elements.get('waiterCallSound'); },
    
    // Ürün Yönetimi
    productManagementButton: document.getElementById('productManagementButton'),
    productManagementScreen: document.getElementById('productManagementScreen'),
    backFromProductManagementButton: document.getElementById('backFromProductManagementButton'),
    productCategoryButtons: document.querySelectorAll('.product-category-button'),
    productsList: document.getElementById('productsList'),
    addNewProductButton: document.getElementById('addNewProductButton'),
    productFormScreen: document.getElementById('productFormScreen'),
    productFormTitle: document.getElementById('productFormTitle'),
    productCategory: document.getElementById('productCategory'),
    productName: document.getElementById('productName'),
    productPrice: document.getElementById('productPrice'),
    productAvailable: document.getElementById('productAvailable'),
    cancelProductButton: document.getElementById('cancelProductButton'),
    saveProductButton: document.getElementById('saveProductButton'),
    productCategoryButtonsContainer: document.getElementById('productCategoryButtonsContainer')
};

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// Ekran boyutu değiştiğinde bildirim panelinin konumunu güncelle
window.addEventListener('resize', () => {
    const panel = document.getElementById('notificationPanel');
    if (panel && !panel.classList.contains('hidden')) {
        if (window.innerWidth < 768) {
            // Mobil görünüm için
            panel.style.left = '50%';
            panel.style.right = 'auto';
            panel.style.transform = 'translateX(-50%)';
            panel.style.maxWidth = '90vw';
        } else {
            // Masaüstü görünüm için
            panel.style.left = 'auto';
            panel.style.right = '0';
            panel.style.transform = 'none';
        }
    }
});

// Uygulama başlatma
function initApp() {
    // Supabase istemcisini başlat
    initSupabase();

    // Oturum kontrolü
    checkAuth();

    // Olay dinleyicileri
    setupEventListeners();
}

// Supabase istemcisini başlat
function initSupabase() {
    try {
        console.log('Supabase bağlantısı kuruluyor...');
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            },
            auth: {
                persistSession: true,
                autoRefreshToken: true
            },
            db: {
                schema: 'public'
            },
            global: {
                fetch: fetch.bind(globalThis)
            }
        });

        // Supabase bağlantısını kontrol et
        supabase.auth.getSession().then(({ data }) => {
            console.log('Supabase bağlantısı başarılı');

            // Gerçek zamanlı senkronizasyon için uygulama verileriyle veritabanını senkronize et
            syncDatabaseWithApp();
        }).catch(error => {
            console.error('Supabase bağlantı hatası:', error);
            showToast('Veritabanı bağlantısı kurulamadı! Lütfen internet bağlantınızı kontrol edin.');
        });
    } catch (err) {
        console.error('Supabase başlatma hatası:', err);
    }
}

// Veritabanı ile uygulama verilerini senkronize et
async function syncDatabaseWithApp() {
    try {
        console.log('Veritabanı ile senkronizasyon başlatılıyor...');
        
        try {
            // Menü verilerini senkronize et
            const { data, error } = await supabase.rpc('sync_menu_data');
            
            if (error) {
                console.warn('Menü verileri senkronizasyon hatası (devam edilecek):', error);
                // Hata olsa bile devam et
            } else {
                console.log('Menü verileri senkronize edildi:', data);
            }
        } catch (rpcError) {
            console.warn('RPC çağrısı hatası (devam edilecek):', rpcError);
            // Hata olsa bile devam et
        }
        
        // Verileri sırayla yükle
        await loadTablesFromSupabase();
        await loadMenuItemsFromSupabase();
        await loadOrdersFromSupabase();

        // Gerçek zamanlı bağlantıyı başlat
        if (appState.currentUser) {
            initRealtimeConnection(appState.currentUser.role, appState.currentUser.fullName);
        }

        console.log('Veritabanı ile senkronizasyon tamamlandı');
    } catch (err) {
        console.error('Senkronizasyon hatası:', err);
        showToast('Veritabanı senkronizasyonu sırasında bir hata oluştu. Lütfen sayfayı yenileyin.');
    }
}

// Supabase'den tabloları yükle
async function loadTablesFromSupabase() {
    try {
        console.log('Masalar yükleniyor...');
        const { data: tables, error } = await supabase
            .from('masalar')
            .select('*')
            .order('masa_no', { ascending: true });

        if (error) {
            console.error('Masalar yüklenirken hata:', error);
            // Hata durumunda varsayılan masaları kullan
            return;
        }

        if (tables && tables.length > 0) {
            console.log('Veritabanından masalar yüklendi:', tables.length);
            // Supabase tablosundan gelen verileri uygulama formatına dönüştür
            appState.tables = tables.map(table => ({
                id: table.id,
                number: table.masa_no,
                status: convertStatusFromDb(table.durum),
                waiterId: table.waiter_id,
                waiterName: table.waiter_name,
                orderId: table.siparis_id || null
            }));

            // UI'ı güncelle
            refreshUI();
        } else {
            console.log('Veritabanında masa bulunamadı, varsayılan masalar yükleniyor');
            // Eğer veritabanında masa yoksa, varsayılan masaları kullan
            appState.tables = [...TABLES];

            // Ayrıca varsayılan masaları veritabanına ekle
            try {
                // İlk 20 masayı ekle
                const initialTables = Array.from({ length: 20 }, (_, index) => ({
                    masa_no: index + 1,
                    durum: 'bos'
                }));

                const { error: insertError } = await supabase
                    .from('masalar')
                    .insert(initialTables);

                if (insertError) {
                    console.error('Varsayılan masalar eklenirken hata:', insertError);
                } else {
                    console.log('Varsayılan masalar veritabanına eklendi');
                }
            } catch (err) {
                console.error('Masalar eklenirken hata:', err);
            }
        }
    } catch (err) {
        console.error('Masalar yüklenirken hata:', err);
    }
}

// Menü ürünlerini Supabase'den yükle
async function loadMenuItemsFromSupabase() {
    try {
        console.log('Menü ürünleri yükleniyor...');
        const { data: menuItems, error } = await supabase
            .from('urunler')
            .select('*, kategoriler(id, ad, sira)')
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Menü ürünleri yüklenirken hata:', error);
            return;
        }

        if (menuItems && menuItems.length > 0) {
            console.log('Veritabanından menü ürünleri yüklendi:', menuItems.length);

            // Kategori eşleme Sabit olarak
            const categoryMap = {
                'Başlangıçlar': 'starters',
                'Ana Yemekler': 'mains',
                'İçecekler': 'drinks',
                'Tatlılar': 'desserts'
            };
            const categorizedItems = {
                starters: [],
                mains: [],
                drinks: [],
                desserts: []
            };

            menuItems.forEach(item => {
                const turkName = item.kategoriler?.ad;
                const key = categoryMap[turkName] || 'mains';
                
                // Görsel URL'si kontrolü
                const imageUrl = item.image_url || 'https://via.placeholder.com/80';
                
                categorizedItems[key].push({
                    id: item.id,
                    name: item.ad,
                    price: parseFloat(item.fiyat),
                    category: key,
                    category_id: item.kategori_id,
                    image: imageUrl,
                    image_url: imageUrl,
                    available: item.stok_durumu
                });
                
                // Konsola her ürünün görsel URL'sini yazdır (hata ayıklama için)
                console.log(`Ürün yüklendi: ${item.ad}, Görsel URL: ${imageUrl}`);
            });

            Object.keys(categorizedItems).forEach(cat => {
                if (categorizedItems[cat].length > 0) {
                    MENU_ITEMS[cat] = categorizedItems[cat];
                }
            });

            console.log('Menü ürünleri güncellendi:', MENU_ITEMS);
        } else {
            console.log('Veritabanında menü ürünü bulunamadı, varsayılan ürünler kullanılıyor');
            // ... existing code for defaults ...
        }
    } catch (err) {
        console.error('Menü ürünleri yüklenirken hata:', err);
    }
}

// Siparişleri Supabase'den yükle
async function loadOrdersFromSupabase() {
    try {
        console.log('Siparişler yükleniyor...');
        const { data: orders, error } = await supabase
            .from('siparisler')
            .select(`
                *,
                siparis_kalemleri(*)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Siparişler yüklenirken hata:', error);
            return;
        }

        if (orders && orders.length > 0) {
            console.log('Veritabanından siparişler yüklendi:', orders.length);

            // Supabase tablosundan gelen verileri uygulama formatına dönüştür
            appState.orders = orders.map(order => {
                const items = order.siparis_kalemleri ? order.siparis_kalemleri.map(item => ({
                    id: item.urun_id,
                    name: item.urun_adi,
                    price: parseFloat(item.birim_fiyat),
                    quantity: item.miktar,
                    category: 'mains', // Varsayılan kategori
                    total: parseFloat(item.toplam_fiyat)
                })) : [];

                const now = new Date(order.created_at);
                const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                const dateString = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();

                return {
                    id: order.id,
                    tableId: order.masa_id,
                    tableNumber: order.masa_no,
                    status: convertStatusFromDb(order.durum),
                    items: items,
                    note: order.siparis_notu || '',
                    waiter: order.waiter_name,
                    time: timeString,
                    date: dateString,
                    total: parseFloat(order.toplam_fiyat),
                    toplam_fiyat: parseFloat(order.toplam_fiyat)
                };
            });

            // UI'ı güncelle
            refreshUI();
        }
    } catch (err) {
        console.error('Siparişler yüklenirken hata:', err);
    }
}

// Durum bilgisini veritabanı formatından uygulama formatına dönüştür
function convertStatusFromDb(status) {
    const statusMap = {
        'bos': 'empty',
        'boş': 'empty',
        'dolu': 'active',
        'hazirlanıyor': 'ready',
        'hazırlanıyor': 'ready',
        'hazirlaniyor': 'ready',
        'hazır': 'ready',
        'beklemede': 'new',
        'tamamlandi': 'ready',
        'tamamlandı': 'ready',
        'teslim_edildi': 'delivered',
        'servis_edildi': 'served',
        'empty': 'empty',
        'occupied': 'active',
        'preparing': 'ready',
        'ready': 'ready',
        'delivered': 'delivered',
        'served': 'served',
        'completed': 'completed',
        'payment': 'payment',
        'QR': 'QR',  // QR siparişi durumu eklendi
        'QR_waiting': 'QR_waiting', // Garson onayı bekleyen QR siparişi
        'QR_confirmed': 'QR_confirmed' // Garson onaylı QR siparişi
    };

    return statusMap[status] || status;
}

// Durum bilgisini uygulama formatından veritabanı formatına dönüştür
function convertStatusToDb(status) {
    const statusMap = {
        'empty': 'bos',
        'occupied': 'dolu',
        'ready': 'hazır',
        'new': 'beklemede',
        'delivered': 'teslim_edildi',
        'served': 'servis_edildi',
        'completed': 'tamamlandi',
        'active': 'dolu', // Bu önemli - 'active' durumu 'dolu' olarak çevrilmeli
        'payment': 'payment',
        'QR': 'QR',  // QR siparişi durumu eklendi
        'QR_waiting': 'QR_waiting', // Garson onayı bekleyen QR siparişi
        'QR_confirmed': 'QR_confirmed' // Garson onaylı QR siparişi
    };

    return statusMap[status] || status;
}

// Supabase gerçek zamanlı bağlantısını başlat
function initRealtimeConnection(role, fullName) {
    // Rol ve kullanıcı adına göre benzersiz bir ID oluştur
    const userId = `${rolePrefix[role]}_${fullName.replace(/\s+/g, '_').toLowerCase()}`;

    // Daha önce açık kanalları kapat
    if (channel) {
        try {
            channel.unsubscribe();
        } catch (err) {
            console.log('Kanal kapatma hatası (önemsiz):', err);
        }
    }

    console.log('Supabase Realtime bağlantısı başlatılıyor...');

    // Realtime kanalına bağlan
    try {
        channel = supabase
            .channel('restaurant-app')
            .on('broadcast', { event: 'restaurant-updates' }, (payload) => {
                console.log('Broadcast alındı:', payload);
                handleIncomingData(payload.payload, payload.payload.sender);
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Supabase Realtime kanalına bağlandı');

                    // Başlangıç bilgilerini yayınla
                    broadcastData({
                        type: 'initial-connect',
                        userId: userId,
                        role: role,
                        fullName: fullName,
                        sender: userId
                    });

                    // Verileri yükle
                    loadTablesFromSupabase();
                    loadOrdersFromSupabase();
                    loadMenuItemsFromSupabase();

                } else if (status === 'CHANNEL_ERROR') {
                    console.log('Kanal bağlantı hatası - yeniden deneniyor...');
                    // Hata durumunda sessizce yeniden dene - kullanıcıya mesaj gösterme
                    setTimeout(() => {
                        initRealtimeConnection(role, fullName);
                    }, 5000);
                }
            });
    } catch (err) {
        console.error('Kanal oluşturma hatası:', err);
    }

    // Veritabanı değişikliklerini dinleyen tüm kanalları tekli bir kanalda birleştir
    try {
        console.log('Veritabanı değişikliklerini izleme başlatılıyor...', role, fullName);

        // Önceki dbChangesChannel'ı temizle
        try {
            const allChannels = supabase.getChannels();
            if (allChannels && allChannels.length > 0) {
                allChannels.forEach(channel => {
                    if (channel.topic === 'realtime:db-changes') {
                        supabase.removeChannel(channel);
                    }
                });
                console.log('Eski veritabanı izleme kanalı temizlendi');
            }
        } catch (err) {
            console.error('Eski kanal temizlenirken hata:', err);
        }

                    const dbChangesChannel = supabase
                .channel('db-changes')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                table: 'masalar'
                }, (payload) => {
                console.log('Masa değişikliği algılandı (tüm durumlar):', payload);
                    handleTableChange(payload);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                table: 'siparisler'
                }, (payload) => {
                console.log('Sipariş durumu değişti:', payload);
                    handleOrderChange(payload);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'orders'
                }, (payload) => {
                    console.log('QR Sipariş durumu değişti:', payload);
                    handleQROrderChange(payload);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'siparis_kalemleri'
                }, (payload) => {
                    console.log('Sipariş kalemi değişikliği algılandı:', payload);
                    handleOrderItemChange(payload);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'order_items'
                }, (payload) => {
                    console.log('QR Sipariş kalemi değişikliği algılandı:', payload);
                    handleQROrderItemChange(payload);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'odemeler'
                }, (payload) => {
                    console.log('Ödeme değişikliği algılandı:', payload);
                    handlePaymentChange(payload);
                })
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'waiter_calls'
                }, (payload) => {
                    console.log('Garson çağrısı algılandı:', payload);
                    handleWaiterCallChange(payload);
                })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Veritabanı değişikliklerini izleme başlatıldı');
                    showToast('Gerçek zamanlı bağlantı kuruldu');
                } else {
                    console.error('Veritabanı izleme kanalı bağlantı hatası:', status);
                }
            });
    } catch (err) {
        console.error('Veritabanı izleme kanalı oluşturma hatası:', err);
        showToast('Gerçek zamanlı bağlantı kurulamadı, lütfen sayfayı yenileyin');
    }

    // Çevrimdışı/Çevrimiçi durumunu yönet
    window.addEventListener('online', () => {
        console.log('Ağ bağlantısı geri geldi, yeniden bağlanılıyor...');
        // Sessizce yeniden bağlan - kullanıcıya mesaj gösterme
        initRealtimeConnection(role, fullName);
    });

    window.addEventListener('offline', () => {
        console.log('Ağ bağlantısı kesildi');
        // Kullanıcıya çevrimdışı olduğunu bildiren bir toast göster, ama sürekli değil
        if (!window._shownOfflineToast) {
            window._shownOfflineToast = true;
            showToast('Çevrimdışı moda geçildi. Bağlantı sağlandığında veriler otomatik senkronize edilecek.');

            // 1 dakika sonra tekrar toast göstermeye izin ver
            setTimeout(() => {
                window._shownOfflineToast = false;
            }, 60000);
        }
    });
}

// Masa değişikliklerini işle
function handleTableChange(payload) {
    console.log('Masa değişikliği işleniyor:', payload);

    // Değişen masa bilgisini uygulama durumuna aktar
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const table = payload.new;

        // Uygulama formatına dönüştür
        const updatedTable = {
            id: table.id,
            number: table.masa_no,
            status: convertStatusFromDb(table.durum),
            waiterId: table.waiter_id,
            waiterName: table.waiter_name,
            orderId: table.siparis_id || null
        };

        console.log('Masa güncelleniyor:', updatedTable);

        // Tabloyu uygulama durumunda güncelle
        updateTableFromRealtime(updatedTable);

        // UI yenile
        refreshUI();

        // Duruma göre bildirim gönder
        if (table.durum === 'hazır' && appState.currentUser.role === 'waiter') {
            addNotification(`Masa ${table.masa_no} siparişi hazır`);
            elements.orderReadySound.play();
        }

        // Sistemdeki diğer masa bağlantılı siparişleri kontrol et ve güncelle
        if (appState.currentUser.role === 'waiter' || appState.currentUser.role === 'kitchen') {
            // Masa durumu değiştiğinde ilgili siparişi bul ve güncelle
            if (table.siparis_id) {
                // Sipariş ID'si varsa direkt o siparişi güncelle
                fetchOrderDetails(table.siparis_id);
            } else {
                // Sipariş ID'si yoksa masa numarasına göre siparişi bul
                const associatedOrder = appState.orders.find(o => o.tableNumber === table.masa_no);
            if (associatedOrder) {
                fetchOrderDetails(associatedOrder.id);
                }
            }
        }
    }
}

// Sipariş değişikliklerini işle
function handleOrderChange(payload) {
    console.log('Sipariş değişikliği işleniyor:', payload);

    // Değişen sipariş bilgisini uygulama durumuna aktar
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const order = payload.new;

        console.log('Sipariş verisi:', order);

        // Siparişi güncellemek için tam sipariş bilgilerini al
        fetchOrderDetails(order.id);

        // İlgili masayı da güncelle
        if (order.masa_no || order.table_number) {
            const tableNumber = order.masa_no || order.table_number;
            fetchTableDetails(tableNumber);

            // Sipariş durumuna göre masa durumunu güncelle
            updateTableStatusFromOrder(tableNumber, order.durum || order.status);
        }

        // Bildirimleri oluştur
        if ((order.durum === 'beklemede' || order.status === 'new') && appState.currentUser.role === 'kitchen') {
            // Yeni sipariş
            const tableNumber = order.masa_no || order.table_number;
            const source = order.source === 'customer' ? ' (Müşteri)' : '';
            addNotification(`Yeni sipariş${source}: Masa ${tableNumber}`);
            elements.newOrderSound.play();
        } else if ((order.durum === 'tamamlandi' || order.status === 'completed') && appState.currentUser.role === 'waiter') {
            // Sipariş hazır
            const tableNumber = order.masa_no || order.table_number;
            addNotification(`Sipariş hazır: Masa ${tableNumber}`);
            elements.orderReadySound.play();
        } else if ((order.durum === 'hazirlaniyor' || order.status === 'preparing') && appState.currentUser.role === 'waiter') {
            // Sipariş hazırlanıyor
            const tableNumber = order.masa_no || order.table_number;
            addNotification(`Sipariş hazırlanıyor: Masa ${tableNumber}`);
        }
    }
}

// Sipariş durumuna göre masa durumunu güncelle
async function updateTableStatusFromOrder(tableNumber, orderStatus) {
    // Sipariş durumuna göre masa durumunu belirle
    let tableDurum = '';

    switch(orderStatus) {
        case 'beklemede':
        case 'new':
        case 'ordered':
            tableDurum = 'dolu';
            break;
        case 'tamamlandi':
        case 'completed':
        case 'ready':
            tableDurum = 'hazır';
            break;
        case 'teslim_edildi':
        case 'delivered':
            tableDurum = 'teslim_edildi';
            break;
        case 'servis_edildi':
        case 'served':
            tableDurum = 'payment';
            break;
        default:
            return; // Diğer durumlar için güncelleme yapma
    }

    try {
        // Masa durumunu güncelle
        console.log(`Masa ${tableNumber} durumu güncelleniyor: ${tableDurum}`);
        const { error } = await supabase
            .from('masalar')
            .update({ durum: tableDurum })
            .eq('masa_no', tableNumber);

        if (error) {
            console.error('Masa durumu güncellenirken hata:', error);
            return;
        }

        console.log(`Masa ${tableNumber} durumu başarıyla güncellendi: ${tableDurum}`);

        // Uygulama durumunu da güncelle
        const tableIndex = appState.tables.findIndex(t => t.number === parseInt(tableNumber));
        if (tableIndex !== -1) {
            const newStatus = convertStatusFromDb(tableDurum);
            appState.tables[tableIndex].status = newStatus;
            console.log(`Masa ${tableNumber} durumu uygulamada güncellendi: ${newStatus}`);
        }
    } catch (err) {
        console.error('Masa durumu güncelleme hatası:', err);
    }
}

// Sipariş kalemlerindeki değişiklikleri işle
function handleOrderItemChange(payload) {
    console.log('Sipariş kalemi değişikliği:', payload);

    // Sipariş kalemindeki değişikliğe göre siparişi güncelle
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        const orderItem = payload.new;

        // İlgili siparişin tam bilgilerini al
        fetchOrderDetails(orderItem.siparis_id);
    }
}

// Ödeme değişikliklerini işle
function handlePaymentChange(payload) {
    console.log('Ödeme değişikliği:', payload);

    // Yeni ödeme eklendiğinde bildirimlere ekle
    if (payload.eventType === 'INSERT') {
        const payment = payload.new;

        if (appState.currentUser.role === 'waiter' || appState.currentUser.role === 'kitchen') {
            addNotification(`Masa ${payment.masa_no} ödemesi tamamlandı`);
            elements.paymentCompleteSound?.play();
        }

        // İlgili masayı güncelle
        fetchTableDetails(payment.masa_no);

        // İlgili siparişi bul ve durumunu güncelle
        const order = appState.orders.find(o => o.id === payment.siparis_id);
        if (order) {
            order.status = 'completed';

            // Tüm cihazlara sipariş güncellemesini gönder
            broadcastData({
                type: 'order-update',
                order: order,
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });

            // UI yenile
            refreshUI();
        }
    }
}

// Garson çağrılarındaki değişiklikleri işle
function handleWaiterCallChange(payload) {
    console.log('Garson çağrısı değişikliği:', payload);

    // Yeni garson çağrısı eklendiğinde bildirimlere ekle
    if (payload.eventType === 'INSERT') {
        const call = payload.new;
        const isCoal = call.type === 'coal';

        if (appState.currentUser.role === 'waiter') {
            const message = isCoal
                ? `Masa ${call.table_number} köz istiyor`
                : `Masa ${call.table_number} garson çağırıyor`;

            const callId = call.id;
            
            // Bildirim ekle
            addNotification(message);
            
            // Özel toast mesajı göster (geliyorum butonlu)
            showWaiterCallToast(message, call.table_number, callId);
            
            try {
                // Çağrı sesi çal (loop özellikli)
                const waiterCallSound = document.getElementById('waiterCallSound');
                if (waiterCallSound) {
                    // Önce durdur (başka bir çağrı sesi çalıyorsa)
                    waiterCallSound.pause();
                    waiterCallSound.currentTime = 0;
                    
                    // Sesi çal - kullanıcı etkileşimi gerekebilir
                    const playPromise = waiterCallSound.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn('Ses otomatik çalınamadı, kullanıcı etkileşimi gerekiyor:', error);
                            // Kullanıcı etkileşimi gerektiğinde toast mesajına bir buton ekleyebiliriz
                        });
                    }
                } else {
                    console.warn('waiterCallSound elementi bulunamadı');
                }
            } catch (err) {
                console.error('Ses çalma hatası:', err);
            }
            
            // Masayı kırmızı yap ve animasyon ekle
            const tableElement = document.querySelector(`.table-card[data-table="${call.table_number}"]`);
            if (tableElement) {
                tableElement.classList.add('animate-pulse');
                tableElement.style.borderColor = isCoal ? '#F97316' : '#ef4444'; // turuncu for coal, kırmızı for waiter
                tableElement.style.borderWidth = '2px';
                // Çağrı yanıtlanana kadar kırmızı kalacak
            }
        }
    }
}

// Garson çağrısı için özel toast mesajı
function showWaiterCallToast(message, tableNumber, callId) {
    // Varsa önceki toast'u kaldır
    const existingToast = document.getElementById('waiterCallToast');
    if (existingToast) {
        document.body.removeChild(existingToast);
    }
    
    // Yeni toast oluştur
    const toastElement = document.createElement('div');
    toastElement.id = 'waiterCallToast';
    toastElement.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center justify-between min-w-[300px]';
    toastElement.innerHTML = `
        <div class="flex items-center">
            <i class="ri-notification-3-fill mr-2"></i>
            <span>${message}</span>
        </div>
        <div class="flex items-center">
            <button id="playCallSoundBtn" class="mr-2 bg-white text-red-500 px-2 py-1 rounded-md text-sm font-medium hover:bg-red-50">
                <i class="ri-volume-up-line"></i>
            </button>
            <button id="waiterComingBtn" data-table="${tableNumber}" data-call-id="${callId}" class="bg-white text-red-500 px-3 py-1 rounded-md text-sm font-medium hover:bg-red-50">
                Geliyorum
            </button>
        </div>
    `;
    
    document.body.appendChild(toastElement);
    
    // Ses çalma butonuna tıklama olayı
    document.getElementById('playCallSoundBtn').addEventListener('click', function() {
        const waiterCallSound = document.getElementById('waiterCallSound');
        if (waiterCallSound) {
            waiterCallSound.currentTime = 0;
            waiterCallSound.play().catch(err => {
                console.error('Ses çalma hatası:', err);
                showToast('Ses çalınamadı. Lütfen ses ayarlarınızı kontrol edin.');
            });
        }
    });
    
    // Geliyorum butonuna tıklama olayı
    document.getElementById('waiterComingBtn').addEventListener('click', async function() {
        const tableNum = this.getAttribute('data-table');
        const callIdentifier = this.getAttribute('data-call-id');
        
        // Sesi durdur
        const waiterCallSound = document.getElementById('waiterCallSound');
        if (waiterCallSound) {
            waiterCallSound.pause();
            waiterCallSound.currentTime = 0;
        }
        
        // Çağrıyı yanıtla
        await respondToWaiterCall(tableNum, appState.currentUser.fullName);
        
        // Toast'u kaldır
        const toast = document.getElementById('waiterCallToast');
        if (toast) {
            document.body.removeChild(toast);
        }
        
        // Masanın görünümünü normale döndür
        const tableElement = document.querySelector(`.table-card[data-table="${tableNum}"]`);
        if (tableElement) {
            tableElement.classList.remove('animate-pulse');
            tableElement.style.borderColor = '';
            tableElement.style.borderWidth = '';
        }
        
        // Bildirim göster
        showToast(`Masa ${tableNum} çağrısı yanıtlandı`);
    });
    
    // 30 saniye sonra toast'u otomatik kaldır (opsiyonel)
    setTimeout(() => {
        const toast = document.getElementById('waiterCallToast');
        if (toast) {
            toast.classList.add('opacity-0');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }
    }, 30000);
}

// Siparişin detaylarını getir
async function fetchOrderDetails(orderId) {
    try {
        const { data: orderData, error: orderError } = await supabase
            .from('siparisler')
            .select(`
                *,
                siparis_kalemleri(*)
            `)
            .eq('id', orderId)
            .single();

        if (orderError) {
            console.error('Sipariş detayları alınırken hata:', orderError);
            return;
        }

        if (orderData) {
            const now = new Date(orderData.created_at);
            const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            const dateString = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();

            // Sipariş kalemlerini düzenle
            const items = orderData.siparis_kalemleri ? orderData.siparis_kalemleri.map(item => ({
                id: item.urun_id,
                name: item.urun_adi,
                price: parseFloat(item.birim_fiyat),
                quantity: item.miktar,
                category: 'mains', // Varsayılan kategori
                total: parseFloat(item.toplam_fiyat)
            })) : [];

            // Siparişi uygulama formatına dönüştür
            const updatedOrder = {
                id: orderData.id,
                tableId: orderData.masa_id,
                tableNumber: orderData.masa_no,
                status: convertStatusFromDb(orderData.durum),
                items: items,
                note: orderData.siparis_notu || '',
                waiter: orderData.waiter_name,
                time: timeString,
                date: dateString,
                total: parseFloat(orderData.toplam_fiyat)
            };

            // Siparişi uygulama durumunda güncelle
            updateOrderFromRealtime(updatedOrder);

            // UI yenile
            refreshUI();

            // Duruma göre bildirimler
            if (orderData.durum === 'beklemede' && appState.currentUser.role === 'kitchen') {
                // Yeni sipariş
                addNotification(`Yeni sipariş: Masa ${orderData.masa_no}`);
            } else if (orderData.durum === 'tamamlandi' && appState.currentUser.role === 'waiter') {
                // Sipariş hazır
                addNotification(`Sipariş hazır: Masa ${orderData.masa_no}`);
            }
        }
    } catch (err) {
        console.error('Sipariş detayları alınırken hata:', err);
    }
}

// Masa detaylarını getir
async function fetchTableDetails(tableNumber) {
    try {
        const { data: tableData, error: tableError } = await supabase
            .from('masalar')
            .select('*')
            .eq('masa_no', tableNumber)
            .single();

        if (tableError) {
            console.error('Masa detayları alınırken hata:', tableError);
            return;
        }

        if (tableData) {
            // Masayı uygulama formatına dönüştür
            const updatedTable = {
                id: tableData.id,
                number: tableData.masa_no,
                status: convertStatusFromDb(tableData.durum),
                waiterId: tableData.waiter_id,
                waiterName: tableData.waiter_name,
                orderId: tableData.siparis_id || null
            };

            // Masayı uygulama durumunda güncelle
            updateTableFromRealtime(updatedTable);

            // UI yenile
            refreshUI();
        }
    } catch (err) {
        console.error('Masa detayları alınırken hata:', err);
    }
}

// Gelen veriyi işle
function handleIncomingData(data, senderId) {
    // Eğer veri kendimizden geliyorsa işleme
    if (data.sender === `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`) {
        return;
    }

    console.log('Gelen gerçek zamanlı veri:', data);

    switch (data.type) {
        case 'initial-connect':
            // Yeni bağlanan kullanıcıya güncel durumu gönder
            if (appState.currentUser) {
                const userId = `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`;

                // Masalar ve siparişler için gerçek zamanlı veri gönder
                setTimeout(() => {
                    broadcastData({
                        type: 'app-state',
                        tables: appState.tables,
                        orders: appState.orders,
                        menuItems: MENU_ITEMS,
                        sender: userId
                    });
                }, 1000);
            }
            break;

        case 'app-state':
            // Başka bir kullanıcıdan gelen uygulama durumunu güncelle
            console.log('Güncel app-state alındı:', data);
            mergeAppState(data);
            refreshUI();
            break;

        case 'order-update':
            // Başka bir kullanıcıdan gelen sipariş güncellemesini işle
            console.log('Sipariş güncellemesi alındı:', data.order);
            updateOrderFromRealtime(data.order);

            // Yeni sipariş ise mutfak ve kasiyer rollerine bildirim ekle
            if (data.order.status === 'new' && (appState.currentUser.role === 'kitchen' || appState.currentUser.role === 'cashier')) {
                addNotification(`Yeni sipariş: Masa ${data.order.tableNumber}`);
                elements.newOrderSound.play();
                showToast(`Yeni sipariş: Masa ${data.order.tableNumber}`);
            }

            refreshUI();
            break;

        case 'table-update':
            // Başka bir kullanıcıdan gelen masa güncellemesini işle
            console.log('Masa güncellemesi alındı:', data.table);
            updateTableFromRealtime(data.table);
            refreshUI();
            break;

        case 'product-update':
            // Başka bir kullanıcıdan gelen ürün güncellemesini işle
            console.log('Ürün güncellemesi alındı:', data);

            if (data.action === 'add' || data.action === 'update') {
                // Kategori kontrol et
                const category = data.product.category;
                if (MENU_ITEMS[category]) {
                    // Varolan ürünü güncelle veya yeni ürün ekle
                    const index = MENU_ITEMS[category].findIndex(item => item.id === data.product.id);

                    if (index !== -1) {
                        MENU_ITEMS[category][index] = data.product;
                    } else {
                        MENU_ITEMS[category].push(data.product);
                    }

                    // Şu anda ürün listesi görüntüleniyorsa yenile
                    if (appState.currentUser.role === 'cashier' && !elements.productManagementScreen.classList.contains('hidden')) {
                        renderProducts(category);
                    }

                    addNotification(`Ürün ${data.action === 'add' ? 'eklendi' : 'güncellendi'}: ${data.product.name}`);
                }
            } else if (data.action === 'delete') {
                // Ürünü sil
                const category = data.product.category;
                if (MENU_ITEMS[category]) {
                    const index = MENU_ITEMS[category].findIndex(item => item.id === data.product.id);

                    if (index !== -1) {
                        MENU_ITEMS[category].splice(index, 1);

                        // Şu anda ürün listesi görüntüleniyorsa yenile
                        if (appState.currentUser.role === 'cashier' && !elements.productManagementScreen.classList.contains('hidden')) {
                            renderProducts(category);
                        }

                        addNotification(`Ürün silindi: ${data.product.name}`);
                    }
                }
            }
            break;

        case 'category-update':
            // Başka bir kullanıcıdan gelen kategori güncellemesini işle
            console.log('Kategori güncellemesi alındı:', data);

            if (data.action === 'add') {
                // Kategori kontrol et
                const categoryCode = data.category.code;
                if (!MENU_ITEMS[categoryCode]) {
                    // Yeni kategori ekle
                    MENU_ITEMS[categoryCode] = [];

                    // Kategori butonlarını güncelle
                    updateCategoryButtons();

                    addNotification(`Yeni kategori eklendi: ${data.category.name}`);
                }
            } else if (data.action === 'update') {
                // Kategori güncelleme işlemleri
                // Gerçek durumda buraya kod eklenebilir
                refreshUI();
            } else if (data.action === 'delete') {
                // Kategori silme işlemleri
                const categoryCode = data.category.code;
                if (MENU_ITEMS[categoryCode]) {
                    delete MENU_ITEMS[categoryCode];

                    // Kategori butonlarını güncelle
                    updateCategoryButtons();

                    addNotification(`Kategori silindi: ${data.category.name}`);
                }
            }
            break;

        case 'notification':
            // Başka bir kullanıcıdan gelen bildirimi işle
            addNotification(data.message);
            break;

        default:
            console.log('Bilinmeyen veri tipi:', data.type);
    }
}

// Uygulama durumunu birleştir
function mergeAppState(data) {
    if (data.tables) {
        appState.tables = data.tables;
    }

    if (data.orders) {
        appState.orders = data.orders;
    }

    if (data.menuItems) {
        // Menü öğelerini birleştir
        for (const category in data.menuItems) {
            if (MENU_ITEMS[category]) {
                MENU_ITEMS[category] = data.menuItems[category];
            }
        }
    }
}

// Siparişi gerçek zamanlı güncellemeden güncelle
function updateOrderFromRealtime(order) {
    const existingOrderIndex = appState.orders.findIndex(o => o.id === order.id);

    if (existingOrderIndex !== -1) {
        appState.orders[existingOrderIndex] = order;
    } else {
        appState.orders.push(order);
    }

    // Bildirim sesi çal
    if (order.status === 'new' && appState.currentUser.role === 'kitchen') {
        elements.newOrderSound.play();
        addNotification(`Yeni sipariş: Masa ${order.tableNumber}`);

        // Kapasitör bildirimi gönder (mobil cihazlar için)
        if (window.Capacitor && Capacitor.isPluginAvailable('LocalNotifications')) {
            sendCapacitorNotification(
                'Yeni Sipariş',
                `Masa ${order.tableNumber} için yeni sipariş`
            );
        }
    } else if (order.status === 'ready' && appState.currentUser.role === 'waiter') {
        elements.orderReadySound.play();
        addNotification(`Sipariş hazır: Masa ${order.tableNumber}`);

        // Kapasitör bildirimi gönder (mobil cihazlar için)
        if (window.Capacitor && Capacitor.isPluginAvailable('LocalNotifications')) {
            sendCapacitorNotification(
                'Sipariş Hazır',
                `Masa ${order.tableNumber} siparişi hazır`
            );
        }
    } else if (order.status === 'delivered' && (appState.currentUser.role === 'kitchen' || appState.currentUser.role === 'waiter')) {
        elements.orderDeliveredSound.play();
        addNotification(`Sipariş teslim edildi: Masa ${order.tableNumber}`);
    } else if (order.status === 'served' && appState.currentUser.role === 'cashier') {
        elements.orderServedSound.play();
        addNotification(`Sipariş servis edildi: Masa ${order.tableNumber}`);
    } else if (order.status === 'completed' && (appState.currentUser.role === 'waiter' || appState.currentUser.role === 'kitchen')) {
        elements.paymentCompleteSound.play();
        addNotification(`Ödeme tamamlandı: Masa ${order.tableNumber}`);
    }
}

// Masayı gerçek zamanlı güncellemeden güncelle
function updateTableFromRealtime(table) {
    const existingTableIndex = appState.tables.findIndex(t => t.id === table.id);

    if (existingTableIndex !== -1) {
        appState.tables[existingTableIndex] = table;
    }
}

// Veriyi yayınla
function broadcastData(data) {
    try {
        if (!channel) {
            console.error('Kanal henüz hazır değil, veri gönderilemedi');
            return;
        }

        // Gönderen kimliğini ekle (eğer yoksa)
        if (!data.sender && appState.currentUser) {
            const userId = `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`;
            data.sender = userId;
        }

        console.log('Gerçek zamanlı veri gönderiliyor:', data);

        // Veriyi Supabase Realtime üzerinden yayınla
        channel.send({
            type: 'broadcast',
            event: 'restaurant-updates',
            payload: data
        })
        .then(() => {
            console.log('Veri başarıyla gönderildi');
        })
        .catch(err => {
            console.error('Veri gönderilirken hata:', err);
            // Geçici gecikme ile yeniden dene
            setTimeout(() => {
                console.log('Veri yeniden gönderiliyor...');
                channel.send({
                    type: 'broadcast',
                    event: 'restaurant-updates',
                    payload: data
                });
            }, 2000);
        });
    } catch (err) {
        console.error('Veri yayınlanırken hata:', err);
    }
}

// Arayüzü yenile
function refreshUI() {
    // Kullanıcı rolüne göre ilgili ekranı yenile
    if (appState.currentUser.role === 'waiter') {
        renderTables();
    } else if (appState.currentUser.role === 'kitchen') {
        renderKitchenOrders();
    } else if (appState.currentUser.role === 'cashier') {
        renderCashierTables();
    }

    // Bildirim rozetini güncelle
    updateNotificationBadge();
}

// Çıkış yap
function logout() {
    // Supabase kanalı kapat
    if (channel) {
        channel.unsubscribe();
    }

    // Kullanıcı bilgilerini temizle
    localStorage.removeItem('user');
    appState.currentUser = null;

    // Giriş ekranını göster
    elements.loginScreen.classList.remove('hidden');
    elements.appContainer.classList.add('hidden');

    // Form alanlarını temizle
    elements.username.value = '';
    elements.password.value = '';
    elements.loginError.textContent = '';
    elements.loginError.classList.add('hidden');
}

// Giriş hatası göster
function showLoginError(message) {
    elements.loginError.textContent = message;
    elements.loginError.classList.remove('hidden');

    setTimeout(() => {
        elements.loginError.classList.add('hidden');
    }, 3000);
}

// Ana uygulama arayüzünü göster
function showAppInterface() {
    elements.loginScreen.classList.add('hidden');
    elements.appContainer.classList.remove('hidden');

    // Rolüne göre uygun ekranı göster
    const role = appState.currentUser.role;

    if (role === 'waiter') {
        showWaiterScreen();
    } else if (role === 'kitchen') {
        showKitchenScreen();
    } else if (role === 'cashier') {
        showCashierScreen();
    }
}

// Ekranları göster/gizle
function showWaiterScreen() {
    elements.waiterScreen.classList.remove('hidden');
    elements.kitchenScreen.classList.add('hidden');
    elements.cashierScreen.classList.add('hidden');

    // Masaları yükle
    renderTables();
}

function showKitchenScreen() {
    elements.waiterScreen.classList.add('hidden');
    elements.kitchenScreen.classList.remove('hidden');
    elements.cashierScreen.classList.add('hidden');

    // Mutfak siparişlerini yükle
    renderKitchenOrders();
}

function showCashierScreen() {
    elements.waiterScreen.classList.add('hidden');
    elements.kitchenScreen.classList.add('hidden');
    elements.cashierScreen.classList.remove('hidden');

    // Önce verileri güncelleyip sonra kasiyer masalarını yükle
    loadOrdersFromSupabase().then(() => {
        loadTablesFromSupabase().then(() => {
            // Kasiyer masalarını yükle
            renderCashierTables();
        });
    }).catch(err => {
        console.error('Veri yenileme hatası:', err);
        // Hata durumunda da masaları yüklemeyi dene
        renderCashierTables();
    });
}

// Olay dinleyicileri kurulumu
function setupEventListeners() {
    // Giriş ve çıkış
    elements.loginButton.addEventListener('click', login);
    elements.logoutButton.addEventListener('click', logout);

    // Enter ile giriş yapabilme
    elements.password.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            login();
        }
    });

    // Garson ekranı
    elements.refreshTablesButton.addEventListener('click', renderTables);

    // Mutfak ekranı
    elements.refreshKitchenButton.addEventListener('click', renderKitchenOrders);

    // Kasiyer ekranı
    elements.refreshCashierButton.addEventListener('click', renderCashierTables);

    // Sipariş ekranı
    elements.backToTablesButton.addEventListener('click', () => {
        hideOrderScreen();
        showWaiterScreen();
    });

    // Kategori butonları
    elements.categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            // Aktif kategori butonunu güncelle
            elements.categoryButtons.forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.add('bg-primary', 'text-white');
                    btn.classList.remove('bg-gray-200', 'text-gray-700');
                } else {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                }
            });

            // Menü öğelerini güncelle
            renderMenuItems(category);
        });
    });

    elements.submitOrderButton.addEventListener('click', submitOrder);

    // Sipariş detay ekranı
    elements.backFromDetailButton.addEventListener('click', () => {
        hideOrderDetailScreen();

        // Rolüne göre geri dön
        const role = appState.currentUser.role;
        if (role === 'waiter') {
            showWaiterScreen();
        } else if (role === 'kitchen') {
            showKitchenScreen();
        } else if (role === 'cashier') {
            showCashierScreen();
        }
    });

    // Ödeme ekranı
    elements.backFromPaymentButton.addEventListener('click', () => {
        hidePaymentScreen();
        showCashierScreen();
    });

    elements.cashPayment.addEventListener('click', () => {
        elements.cashPayment.classList.add('border-primary');
        elements.cardPayment.classList.remove('border-primary');

        // Nakit ödeme seçildiğinde para üstü hesaplama alanını göster
        if (elements.cashAmountContainer) {
            elements.cashAmountContainer.classList.remove('hidden');
        }
    });

    elements.cardPayment.addEventListener('click', () => {
        elements.cardPayment.classList.add('border-primary');
        elements.cashPayment.classList.remove('border-primary');

        // Kredi kartı seçildiğinde para üstü hesaplama alanını gizle
        if (elements.cashAmountContainer) {
            elements.cashAmountContainer.classList.add('hidden');
        }
    });

    elements.completePaymentButton.addEventListener('click', async () => {
        try {
            const tableNumber = parseInt(elements.paymentTitle.textContent.replace('Ödeme - Masa ', ''));

            // Masa bilgisini bul
            const table = appState.tables.find(t => t.number === tableNumber);
            if (!table) {
                showToast('Masa bilgisi bulunamadı');
                return;
            }

            // Sipariş bilgisini bul
            const order = appState.orders.find(o => o.tableNumber === tableNumber &&
                (o.status === 'served' || o.status === 'delivered'));
            if (!order) {
                showToast('Sipariş bilgisi bulunamadı');
                return;
            }

            // Ödeme yöntemi seç
            const paymentMethod = elements.cashPayment.classList.contains('border-primary') ? 'nakit' : 'kredi_karti';
            console.log('Seçilen ödeme yöntemi:', paymentMethod);

            // Nakit ödeme bilgilerini topla
            let paidAmount = 0;
            let changeAmount = 0;

            if (paymentMethod === 'nakit' && elements.cashAmount && elements.cashAmount.value) {
                paidAmount = parseFloat(elements.cashAmount.value);
                
                // Toplam tutarı doğru şekilde al
                const totalText = elements.paymentTotal.textContent;
                const totalToPay = parseFloat(totalText.replace('₺', '').trim());
                
                console.log('Ödeme tutarları:', {
                    paidAmount: paidAmount,
                    totalToPay: totalToPay,
                    totalText: totalText
                });
                
                changeAmount = Math.max(0, paidAmount - totalToPay);

                // Eğer müşteri yeterli para vermediyse kontrol et
                if (paidAmount < totalToPay) {
                    if (!confirm('Verilen tutar toplam tutardan az! Devam etmek istiyor musunuz?')) {
                        return;
                    }
                }
            }

            // Ödeme yöntemini ve nakit bilgilerini parametre olarak geçir
            const success = await completePayment(order.id, table.id, paymentMethod, paidAmount, changeAmount);

            if (success) {
                // Kasiyer ekranına geri dön
                hidePaymentScreen();
                showCashierScreen();

                showToast('Ödeme başarıyla tamamlandı');
            }
        } catch (err) {
            console.error('Ödeme işlemi hatası:', err);
            showToast('Ödeme işlemi sırasında bir hata oluştu');
        }
    });

    // Bildirimler
    elements.notificationButton.addEventListener('click', toggleNotificationPanel);

    // Ürün Yönetimi
    elements.productManagementButton.addEventListener('click', () => {
        showProductManagementScreen();
    });

    elements.backFromProductManagementButton.addEventListener('click', () => {
        hideProductManagementScreen();
        showCashierScreen();
    });

    elements.productCategoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;

            // Aktif kategori butonunu güncelle
            elements.productCategoryButtons.forEach(btn => {
                if (btn.dataset.category === category) {
                    btn.classList.add('bg-primary', 'text-white');
                    btn.classList.remove('bg-gray-200', 'text-gray-700');
                } else {
                    btn.classList.remove('bg-primary', 'text-white');
                    btn.classList.add('bg-gray-200', 'text-gray-700');
                }
            });

            // Ürünleri kategoriye göre listele
            renderProducts(category);
        });
    });

    elements.addNewProductButton.addEventListener('click', () => {
        showProductForm();
    });

    elements.cancelProductButton.addEventListener('click', () => {
        hideProductForm();
    });

    elements.saveProductButton.addEventListener('click', saveProduct);
}

// Render fonksiyonları
function renderTables() {
    const tableGrid = elements.tableGrid;
    tableGrid.innerHTML = '';

    appState.tables.forEach(table => {
        // Duruma göre arka plan rengi belirleme
        let bgColor = 'bg-white';
        let statusText = 'Bilinmiyor';

        // Duruma göre renk ve metin belirleme
        switch(table.status) {
            case 'empty':
                bgColor = 'bg-white';
                statusText = 'Boş';
                break;
            case 'active':
            case 'occupied':
            case 'dolu':
                bgColor = 'bg-blue-100';
                statusText = 'Aktif';
                break;
            case 'preparing':
            case 'hazirlaniyor':
                bgColor = 'bg-orange-100';
                statusText = 'Hazırlanıyor';
                break;
            case 'ready':
            case 'hazır':
                bgColor = 'bg-green-100';
                statusText = 'Hazır';
                break;
            case 'delivered':
            case 'teslim_edildi':
                bgColor = 'bg-yellow-100';
                statusText = 'Teslim Alındı';
                break;
            case 'served':
            case 'servis_edildi':
                bgColor = 'bg-purple-100';
                statusText = 'Servis Edildi';
                break;
            case 'payment':
                bgColor = 'bg-pink-100';
                statusText = 'Ödeme Bekliyor';
                break;
            case 'QR':
                bgColor = 'bg-gray-200';
                statusText = 'QR Sipariş';
                break;
            case 'QR_waiting':
                bgColor = 'bg-black text-white';
                statusText = 'QR Onay Bekliyor';
                break;
            case 'QR_confirmed':
                bgColor = 'bg-blue-100';
                statusText = 'QR Onaylandı';
                break;
            default:
                // Eğer sipariş ID'si varsa aktif olarak işaretle
                if (table.orderId) {
                    bgColor = 'bg-blue-100';
                    statusText = 'Aktif';
                    table.status = 'active'; // Durum güncelleniyor
                } else {
                    bgColor = 'bg-white';
                    statusText = 'Boş';
                }
                break;
        }

        const tableCard = document.createElement('div');
        tableCard.className = `table-card ${bgColor} rounded-lg border-2 p-4 flex flex-col items-center justify-center cursor-pointer table-${table.status}`;
        tableCard.innerHTML = `
            <div class="text-lg font-medium mb-1">Masa ${table.number}</div>
            <div class="text-xs text-gray-500">${statusText}</div>
        `;

        // Masa kart tıklama olayı
        tableCard.addEventListener('click', () => {
            appState.currentTable = table;

            // Masanın durumuna göre işlem yap
            if (table.status === 'empty') {
                showOrderScreen(table);
            } else {
                // İlgili siparişi bul
                const tableOrder = appState.orders.find(order =>
                    (order.tableNumber === table.number || order.id === table.orderId) &&
                    (order.status === 'new' || order.status === 'preparing' || order.status === 'ready' ||
                     order.status === 'delivered' || order.status === 'served')
                );

                if (tableOrder) {
                    showOrderDetailScreen(tableOrder);
                } else {
                    // Sipariş bulunamadıysa ve masa boş değilse durumu kontrol et
                    if (table.orderId) {
                        // Sipariş ID'si var ama sipariş bulunamadı, siparişi yükle
                        fetchOrderDetails(table.orderId);
                        showToast('Sipariş bilgileri yükleniyor...');
                } else {
                    showOrderScreen(table);
                    }
                }
            }
        });

        tableGrid.appendChild(tableCard);
    });

    // Garson rolünde ise hazır siparişleri de göster
    if (appState.currentUser && appState.currentUser.role === 'waiter') {
        renderReadyOrders();
    }
}

function renderKitchenOrders() {
    const kitchenOrdersList = elements.kitchenOrdersList;
    kitchenOrdersList.innerHTML = '';

    // Aktif siparişleri filtrele
    const pendingOrders = appState.orders.filter(order =>
        order.status === 'new'
    );

    if (pendingOrders.length === 0) {
        kitchenOrdersList.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                Aktif sipariş yok
            </div>
        `;
        return;
    }

    // Siparişleri tarihe göre sırala (en yeniler üstte)
    pendingOrders.sort((a, b) => {
        const dateA = new Date(`${a.date.split('.').reverse().join('-')}T${a.time}`);
        const dateB = new Date(`${b.date.split('.').reverse().join('-')}T${b.time}`);
        return dateB - dateA;
    });

    pendingOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'bg-white rounded-lg border border-gray-200 p-4 mb-4';

        let statusBadge = '';
        if (order.status === 'new') {
            statusBadge = '<span class="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">Yeni</span>';
        }

        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="flex justify-between py-1 border-b border-gray-100">
                    <div class="flex">
                        <span class="font-medium mr-2">${item.quantity}x</span>
                        <span>${item.name}</span>
                    </div>
                    <span class="text-gray-600">${(item.price * item.quantity).toFixed(2)} ₺</span>
                </div>
            `;
        });

        orderElement.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <div class="flex items-center gap-2">
                        <h3 class="text-lg font-medium">Masa ${order.tableNumber}</h3>
                        ${statusBadge}
                    </div>
                    <p class="text-xs text-gray-500">Sipariş #${order.id} • ${order.time} • ${order.date}</p>
                    <p class="text-xs text-gray-500">Garson: ${order.waiter}</p>
                </div>
            </div>
            <div class="border-t border-gray-200 pt-2 mt-2">
                ${itemsHtml}
            </div>
            ${order.note ? `
                <div class="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span class="font-medium">Not:</span> ${order.note}
                </div>
            ` : ''}
            <div class="mt-4 flex justify-end">
                    <button class="complete-order-button px-4 py-2 bg-green-500 text-white rounded-button" data-order-id="${order.id}">
                        Hazır
                    </button>
            </div>
        `;

        // Sipariş hazır butonu
        const completeButton = orderElement.querySelector('.complete-order-button');
        if (completeButton) {
            completeButton.addEventListener('click', () => {
                completeOrder(order.id);
            });
        }

        kitchenOrdersList.appendChild(orderElement);
    });
}

function renderCashierTables() {
    const cashierTablesList = elements.cashierTablesList;
    cashierTablesList.innerHTML = '';

    console.log('Kasiyer ekranı yenileniyor, tüm masalar:', appState.tables);

    // Ödeme bekleyen masaları göster
    const paymentTables = appState.tables.filter(table =>
        table.status === 'payment' ||
        table.status === 'served' ||
        table.status === 'servis_edildi');

    console.log('Ödeme bekleyen masalar:', paymentTables);

    if (paymentTables.length === 0) {
        cashierTablesList.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                Ödeme bekleyen masa yok
            </div>
        `;
        return;
    }

    // Siparişleri güncelleyelim
    loadOrdersFromSupabase();

    // Masaları listele
    paymentTables.forEach(table => {
        // İlgili siparişi bul
        const tableOrder = appState.orders.find(order =>
            (order.tableNumber === table.number || order.id === table.orderId) &&
            (order.status === 'served' || order.status === 'delivered' || order.status === 'ready')
        );

        if (!tableOrder) {
            console.error(`Masa ${table.number} için sipariş bulunamadı!`);
            // Sipariş bulunamadıysa veritabanından tekrar yüklemeyi deneyelim
            if (table.orderId) {
                fetchOrderDetails(table.orderId);
            }
            return;
        }

        // Toplam tutarı hesapla
        let totalAmount = 0;
        if (tableOrder.items && tableOrder.items.length > 0) {
            totalAmount = tableOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        } else if (tableOrder.total) {
            totalAmount = tableOrder.total;
        } else if (tableOrder.toplam_fiyat) {
            totalAmount = tableOrder.toplam_fiyat;
        } else if (table.toplam_tutar) {
            totalAmount = table.toplam_tutar;
        }

        const tableCard = document.createElement('div');
        tableCard.className = 'bg-white rounded-lg border border-gray-200 mb-3 overflow-hidden';
        tableCard.innerHTML = `
            <div class="p-4 border-b border-gray-200 flex justify-between items-center">
                <div>
                    <h3 class="text-lg font-medium">Masa ${table.number}</h3>
                    <p class="text-sm text-gray-500">Garson: ${tableOrder.waiter || 'Bilinmiyor'}</p>
            </div>
                <div class="bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs">
                    Ödeme Bekliyor
                </div>
            </div>
            <div class="p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-500">Toplam Tutar:</span>
                    <span class="font-medium">₺${totalAmount > 0 ? totalAmount.toFixed(2) : '0.00'}</span>
                </div>
                <div class="flex justify-between items-center mb-4">
                    <span class="text-sm text-gray-500">Sipariş Zamanı:</span>
                    <span>${tableOrder.date} ${tableOrder.time}</span>
                </div>
                <button class="w-full py-2 bg-primary text-white rounded-button view-order-button" data-order-id="${tableOrder.id}">
                    Siparişi Görüntüle
            </button>
            </div>
        `;

        const viewOrderButton = tableCard.querySelector('.view-order-button');
        if (viewOrderButton) {
            viewOrderButton.addEventListener('click', () => {
                showOrderDetailScreen(tableOrder);
        });
        }

        cashierTablesList.appendChild(tableCard);
    });
}

function renderMenuItems(category) {
    const menuItemsGrid = elements.menuItemsGrid;
    menuItemsGrid.innerHTML = '';

    const items = MENU_ITEMS[category] || [];

    items.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.className = 'bg-white rounded-lg border border-gray-200 overflow-hidden fade-in';
        // Ürün görseli için varsayılan veya ürün görseli
        const imageUrl = item.image_url || item.image || 'https://via.placeholder.com/80';
        
        // Görsel URL'sini konsola yazdır (hata ayıklama için)
        console.log(`Menü öğesi gösteriliyor: ${item.name}, Görsel URL: ${imageUrl}`);

        itemCard.innerHTML = `
            <div class="p-3">
                <div class="flex items-center mb-2">
                    <img src="${imageUrl}" alt="${item.name}" class="w-10 h-10 rounded mr-3 object-cover"
                         onerror="this.src='https://via.placeholder.com/80'; this.onerror=null;">
                    <div>
                        <div class="font-medium">${item.name}</div>
                        <div class="text-sm text-gray-500">₺${item.price.toFixed(2)}</div>
                    </div>
                </div>
                <button class="add-to-cart w-full bg-primary text-white py-1 rounded-button text-sm">
                    Ekle
                </button>
            </div>
        `;

        const addButton = itemCard.querySelector('.add-to-cart');
        addButton.addEventListener('click', () => {
            addToCart(item);
        });

        menuItemsGrid.appendChild(itemCard);
    });
}

function renderOrderCart() {
    const orderCart = elements.orderCart;

    if (appState.currentOrder.items.length === 0) {
        orderCart.innerHTML = `
            <div class="p-4 text-center text-sm text-gray-500">
                Sepet boş
            </div>
        `;
        return;
    }

    orderCart.innerHTML = '';

    let totalAmount = 0;

    appState.currentOrder.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'p-3 flex justify-between items-center';
        cartItem.innerHTML = `
            <div class="flex items-center">
                <div class="font-medium">${item.name}</div>
                <div class="text-xs text-gray-500 ml-2">₺${item.price.toFixed(2)}</div>
            </div>
            <div class="flex items-center">
                <button class="decrease-quantity w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
                    <i class="ri-subtract-line text-gray-600"></i>
                </button>
                <span class="mx-2 w-6 text-center">${item.quantity}</span>
                <button class="increase-quantity w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
                    <i class="ri-add-line text-gray-600"></i>
                </button>
                <button class="remove-item ml-2 w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer">
                    <i class="ri-delete-bin-line text-red-500"></i>
                </button>
            </div>
        `;

        const decreaseButton = cartItem.querySelector('.decrease-quantity');
        decreaseButton.addEventListener('click', () => {
            decreaseQuantity(item.id);
        });

        const increaseButton = cartItem.querySelector('.increase-quantity');
        increaseButton.addEventListener('click', () => {
            increaseQuantity(item.id);
        });

        const removeButton = cartItem.querySelector('.remove-item');
        removeButton.addEventListener('click', () => {
            removeFromCart(item.id);
        });

        orderCart.appendChild(cartItem);
    });

    // Toplam tutar
    const totalRow = document.createElement('div');
    totalRow.className = 'p-3 flex justify-between items-center font-medium border-t border-gray-200';
    totalRow.innerHTML = `
        <span>Toplam</span>
        <span>₺${totalAmount.toFixed(2)}</span>
    `;

    orderCart.appendChild(totalRow);
}

// Sepet işlemleri
function addToCart(item) {
    const existingItem = appState.currentOrder.items.find(i => i.id === item.id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        appState.currentOrder.items.push({
            ...item,
            quantity: 1
        });
    }

    renderOrderCart();
    showToast(`${item.name} sepete eklendi`);
}

function decreaseQuantity(itemId) {
    const item = appState.currentOrder.items.find(i => i.id === itemId);

    if (item && item.quantity > 1) {
        item.quantity -= 1;
        renderOrderCart();
    } else if (item && item.quantity === 1) {
        removeFromCart(itemId);
    }
}

function increaseQuantity(itemId) {
    const item = appState.currentOrder.items.find(i => i.id === itemId);

    if (item) {
        item.quantity += 1;
        renderOrderCart();
    }
}

function removeFromCart(itemId) {
    appState.currentOrder.items = appState.currentOrder.items.filter(i => i.id !== itemId);
    renderOrderCart();
}

// Ekran geçişleri
function showOrderScreen(table) {
    elements.waiterScreen.classList.add('hidden');
    elements.orderScreen.classList.remove('hidden');

    // Masa başlığını güncelle
    elements.orderTableTitle.textContent = `Masa ${table.number}`;

    // Sipariş sepetini temizle
    appState.currentOrder.items = [];
    elements.orderNote.value = '';

    // Menü öğelerini yükle
    renderMenuItems('starters');
    renderOrderCart();
}

function hideOrderScreen() {
    elements.orderScreen.classList.add('hidden');
}

function showOrderDetailScreen(order) {
    // İlgili ekranı gizle
    const role = appState.currentUser.role;
    if (role === 'waiter') {
        elements.waiterScreen.classList.add('hidden');
    } else if (role === 'kitchen') {
        elements.kitchenScreen.classList.add('hidden');
    } else if (role === 'cashier') {
        elements.cashierScreen.classList.add('hidden');
    }

    elements.orderDetailScreen.classList.remove('hidden');

    // Detay bilgilerini güncelle
    elements.detailTableTitle.textContent = `Masa ${order.tableNumber} Detayları`;
    elements.detailTableNumber.textContent = `Masa ${order.tableNumber}`;
    elements.detailTableStatus.textContent = `Durum: ${getOrderStatusText(order.status)}`;
    elements.detailTableTime.textContent = `${order.date} ${order.time}`;
    elements.detailTableWaiter.textContent = `Garson: ${order.waiter}`;

    // Sipariş öğelerini göster
    const orderDetailItems = elements.orderDetailItems;
    orderDetailItems.innerHTML = '';

    let totalAmount = 0;

    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const detailItem = document.createElement('div');
        detailItem.className = 'p-3 flex justify-between items-center';
        detailItem.innerHTML = `
            <div class="flex items-center">
                <span class="bg-primary bg-opacity-10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">${item.quantity}</span>
                <span>${item.name}</span>
            </div>
            <div class="text-sm">
                ₺${itemTotal.toFixed(2)}
            </div>
        `;

        orderDetailItems.appendChild(detailItem);
    });

    // Toplam tutar
    const totalRow = document.createElement('div');
    totalRow.className = 'p-3 flex justify-between items-center font-medium border-t border-gray-200';
    totalRow.innerHTML = `
        <span>Toplam</span>
        <span>₺${totalAmount.toFixed(2)}</span>
    `;

    orderDetailItems.appendChild(totalRow);

    // Sipariş notunu göster
    const noteContainer = elements.orderDetailNote.querySelector('p');
    noteContainer.textContent = order.note || 'Not yok';

    // Rol bazlı aksiyonları göster
    const actions = elements.orderDetailActions;
    actions.innerHTML = '';

    if (role === 'waiter') {
        if (order.status === 'QR_waiting') {
            const confirmQRButton = document.createElement('button');
            confirmQRButton.className = 'w-full py-3 bg-blue-500 text-white rounded-button';
            confirmQRButton.textContent = 'QR Siparişi Onayla';
            confirmQRButton.addEventListener('click', () => {
                confirmQROrder(order.id);
            });

            actions.appendChild(confirmQRButton);
        } else if (order.status === 'preparing') {
            const editButton = document.createElement('button');
            editButton.className = 'w-full py-3 bg-primary text-white rounded-button';
            editButton.textContent = 'Düzenle';
            editButton.addEventListener('click', () => {
                // Düzenleme fonksiyonu
            });

            actions.appendChild(editButton);
        } else if (order.status === 'ready') {
            const deliverButton = document.createElement('button');
            deliverButton.className = 'w-full py-3 bg-primary text-white rounded-button';
            deliverButton.textContent = 'Teslim Al';
            deliverButton.addEventListener('click', () => {
                deliverOrder(order.id);
            });

            actions.appendChild(deliverButton);
        } else if (order.status === 'delivered') {
            const serveButton = document.createElement('button');
            serveButton.className = 'w-full py-3 bg-purple-600 text-white rounded-button';
            serveButton.textContent = 'Servis Edildi';
            serveButton.addEventListener('click', () => {
                serveOrder(order.id);
            });

            actions.appendChild(serveButton);
        }
    } else if (role === 'kitchen' && order.status === 'preparing') {
        const completeButton = document.createElement('button');
        completeButton.className = 'w-full py-3 bg-green-500 text-white rounded-button';
        completeButton.textContent = 'Hazır';
        completeButton.addEventListener('click', () => {
            completeOrder(order.id);
        });

        actions.appendChild(completeButton);
    } else if (role === 'cashier' && order.status === 'served') {
        const paymentButton = document.createElement('button');
        paymentButton.className = 'w-full py-3 bg-green-500 text-white rounded-button';
        paymentButton.textContent = 'Ödeme Al';
        paymentButton.addEventListener('click', () => {
            const table = appState.tables.find(t => t.number === order.tableNumber);
            showPaymentScreen(table, order);
        });

        actions.appendChild(paymentButton);
    }
}

function hideOrderDetailScreen() {
    elements.orderDetailScreen.classList.add('hidden');
}

function showPaymentScreen(table, order) {
    elements.cashierScreen.classList.add('hidden');
    elements.orderDetailScreen.classList.add('hidden');
    elements.paymentScreen.classList.remove('hidden');

    // Başlığı güncelle
    elements.paymentTitle.textContent = `Ödeme - Masa ${table.number}`;

    console.log('Ödeme ekranı gösteriliyor:', table, order);

    if (!order) {
        console.error('Ödeme için sipariş bulunamadı!');
        showToast('Sipariş bilgisi bulunamadı, lütfen yeniden deneyin');
        elements.paymentItems.innerHTML = `
            <div class="p-4 text-center text-red-500">
                Sipariş bilgisi bulunamadı!
            </div>
        `;
        elements.paymentTotal.textContent = '₺0.00';
        return;
    }

    // Ödeme detaylarını göster
    const paymentItems = elements.paymentItems;
    paymentItems.innerHTML = '';

    let totalAmount = 0;

    order.items.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalAmount += itemTotal;

        const paymentItem = document.createElement('div');
        paymentItem.className = 'p-3 flex justify-between items-center';
        paymentItem.innerHTML = `
            <div class="flex items-center">
                <span class="bg-primary bg-opacity-10 text-primary rounded-full w-6 h-6 flex items-center justify-center text-xs mr-2">${item.quantity}</span>
                <span>${item.name}</span>
            </div>
            <div class="text-sm">
                ₺${itemTotal.toFixed(2)}
            </div>
        `;

        paymentItems.appendChild(paymentItem);
    });

    // Toplam tutarı güncelle
    elements.paymentTotal.textContent = `₺${totalAmount.toFixed(2)}`;

    // Para üstü hesaplama alanı ekle (eğer yoksa)
    if (!elements.cashAmountContainer) {
        const cashAmountContainer = document.createElement('div');
        cashAmountContainer.className = 'mt-4 p-3 border-t border-gray-200 cash-amount-container';
        cashAmountContainer.id = 'cashAmountContainer';
        cashAmountContainer.innerHTML = `
            <div class="mb-3">
                <label class="block text-sm text-gray-600 mb-1">Müşterinin Verdiği Tutar (₺)</label>
                <input type="number" id="cashAmount" class="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Nakit miktarı" min="0" step="0.01">
            </div>
            <div class="flex justify-between font-medium">
                <span>Para Üstü:</span>
                <span id="changeAmount" class="text-green-600">₺0.00</span>
            </div>
        `;

        // Para üstü konteynerini ödeme ekranına ekle (ödeme butonundan önce)
        const paymentButtonContainer = elements.completePaymentButton.parentElement;
        paymentButtonContainer.insertBefore(cashAmountContainer, elements.completePaymentButton);

        // Elementi kaydet
        elements.cashAmountContainer = cashAmountContainer;
        elements.cashAmount = document.getElementById('cashAmount');
        elements.changeAmount = document.getElementById('changeAmount');

        // Para üstü hesaplama fonksiyonunu ekle
        elements.cashAmount.addEventListener('input', () => {
            const amountGiven = parseFloat(elements.cashAmount.value) || 0;
            const totalText = elements.paymentTotal.textContent;
            const totalToPay = parseFloat(totalText.replace('₺', '').trim()) || 0;
            
            console.log('Para üstü hesaplanıyor:', {
                amountGiven: amountGiven,
                totalToPay: totalToPay,
                totalText: totalText
            });
            
            const change = amountGiven - totalToPay;

            elements.changeAmount.textContent = `₺${change >= 0 ? change.toFixed(2) : '0.00'}`;

            // Para üstünün gösterimini düzenle (negatif olduğunda kırmızı göster)
            if (change < 0) {
                elements.changeAmount.classList.remove('text-green-600');
                elements.changeAmount.classList.add('text-red-600');
            } else {
                elements.changeAmount.classList.remove('text-red-600');
                elements.changeAmount.classList.add('text-green-600');
            }
        });
    } else {
        // Mevcut para üstü alanını sıfırla
        elements.cashAmount.value = '';
        elements.changeAmount.textContent = '₺0.00';
        elements.changeAmount.classList.remove('text-red-600');
        elements.changeAmount.classList.add('text-green-600');
    }

    // Ödeme yöntemlerini sıfırla ve nakit ödemeyi varsayılan olarak seç
    elements.cashPayment.classList.add('border-primary');
    elements.cardPayment.classList.remove('border-primary');

    // Nakit ödeme seçili olduğu için para üstü alanını göster
    elements.cashAmountContainer.classList.remove('hidden');
}

function hidePaymentScreen() {
    elements.paymentScreen.classList.add('hidden');
}

// İşlem fonksiyonları
async function submitOrder() {
    if (appState.currentOrder.items.length === 0) {
        showToast('Sepet boş, lütfen ürün ekleyin');
        return;
    }

    try {
        // Sipariş notunu al
        const note = elements.orderNote.value.trim();

        // Toplam tutarı hesapla
        const totalAmount = appState.currentOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        console.log('Sipariş gönderiliyor:', {
            masaNo: appState.currentTable.number,
            masaId: appState.currentTable.id,
            garson: appState.currentUser.fullName,
            urunler: appState.currentOrder.items,
            toplam: totalAmount
        });

        // Masa bilgisini kontrol et
        if (!appState.currentTable || !appState.currentTable.number) {
            console.error('Masa bilgisi eksik!', appState.currentTable);
            showToast('Masa bilgisi alınamadı, lütfen yeniden deneyin');
            return;
        }

        // Önce masa durumunu güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({
                durum: 'dolu',
                waiter_name: appState.currentUser.fullName,
                waiter_id: appState.currentUser.id || null,
                toplam_tutar: totalAmount
            })
            .eq('id', appState.currentTable.id);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
            showToast('Masa durumu güncellenirken hata oluştu');
            return;
        } else {
            console.log('Masa durumu başarıyla güncellendi');
        }

        // Supabase'e sipariş ekle
        const { data: orderData, error: orderError } = await supabase
            .from('siparisler')
            .insert({
                masa_id: appState.currentTable.id,
                masa_no: appState.currentTable.number,
                waiter_id: appState.currentUser.id || null,
                waiter_name: appState.currentUser.fullName,
                durum: 'beklemede',
                siparis_notu: note,
                toplam_fiyat: totalAmount
            })
            .select('*')
            .single();

        if (orderError) {
            console.error('Sipariş kaydedilirken hata:', orderError);
            showToast(`Sipariş oluşturulurken hata: ${orderError.message}`);
            return;
        }

        console.log('Sipariş başarıyla eklendi:', orderData);

        // Sipariş ID'sini masaya ekle
        const { error: updateTableError } = await supabase
            .from('masalar')
            .update({
                siparis_id: orderData.id
            })
            .eq('id', appState.currentTable.id);

        if (updateTableError) {
            console.error('Masa-sipariş ilişkisi güncellenirken hata:', updateTableError);
        } else {
            console.log('Masa-sipariş ilişkisi başarıyla güncellendi');
        }

        // Sipariş kalemlerini ekle
        const orderItems = appState.currentOrder.items.map(item => ({
            siparis_id: orderData.id,
            urun_id: item.id,
            urun_adi: item.name,
            miktar: item.quantity,
            birim_fiyat: item.price,
            toplam_fiyat: item.price * item.quantity
        }));

        const { error: itemsError } = await supabase
            .from('siparis_kalemleri')
            .insert(orderItems);

        if (itemsError) {
            console.error('Sipariş kalemleri kaydedilirken hata:', itemsError);
        } else {
            console.log('Sipariş kalemleri başarıyla eklendi');
        }

        // Yeni sipariş oluştur (uygulama durumu için)
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const dateString = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();

        const newOrder = {
            id: orderData.id,
            tableId: appState.currentTable.id,
            tableNumber: appState.currentTable.number,
            status: 'new',
            items: [...appState.currentOrder.items],
            note: note,
            waiter: appState.currentUser.fullName,
            time: timeString,
            date: dateString,
            total: totalAmount
        };

        // Siparişi ekle
        appState.orders.push(newOrder);

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === appState.currentTable.number);
        if (table) {
            table.status = 'active'; // 'occupied' yerine 'active' kullanılıyor
            table.waiterId = appState.currentUser.id;
            table.waiterName = appState.currentUser.fullName;
            table.orderId = orderData.id;
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
        broadcastData({
            type: 'order-update',
            order: newOrder,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${appState.currentTable.number} için yeni sipariş`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Siparişi bildirimlere ekle
        addNotification(`Masa ${appState.currentTable.number} için yeni sipariş`);

        // Sepeti temizle
        appState.currentOrder.items = [];
        elements.orderNote.value = '';

        // Ekranı gizle ve garson ekranına dön
        hideOrderScreen();
        showWaiterScreen();

        showToast('Sipariş başarıyla gönderildi');
    } catch (err) {
        console.error('Sipariş oluşturma hatası:', err);
        showToast('Sipariş oluşturulurken bir hata oluştu');
    }
}

async function completeOrder(orderId) {
    try {
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Tamamlanacak sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return;
        }

        console.log('Sipariş tamamlanıyor:', order);

        // Sipariş durumunu veritabanında güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'tamamlandi' })
            .eq('id', orderId);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
            showToast('Sipariş güncellenirken hata oluştu');
            return;
        }

        console.log('Sipariş durumu veritabanında güncellendi');

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'ready';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === order.tableNumber);
        if (table) {
            table.status = 'ready';
            console.log('Masa durumu uygulamada güncellendi:', table);
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
        broadcastData({
            type: 'order-update',
            order: order,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${order.tableNumber} siparişi hazır`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Bildirimlere ekle
        addNotification(`Masa ${order.tableNumber} siparişi hazır`);
        elements.orderReadySound.play();

        // Kapasitör bildirimi gönder (mobil cihazlar için)
        if (window.Capacitor && Capacitor.isPluginAvailable('LocalNotifications')) {
            sendCapacitorNotification(
                'Sipariş Hazır',
                `Masa ${order.tableNumber} siparişi hazır`
            );
        }

        // İlgili ekranı yenile
        refreshUI();

        showToast(`Masa ${order.tableNumber} siparişi hazırlandı`);
    } catch (err) {
        console.error('Sipariş tamamlama hatası:', err);
        showToast('Sipariş tamamlanırken bir hata oluştu');
    }
}

// Garson siparişi teslim aldı
async function deliverOrder(orderId) {
    try {
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Teslim alınacak sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return;
        }

        console.log('Sipariş teslim alınıyor:', order);

        // Sipariş durumunu veritabanında güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'teslim_edildi' })
            .eq('id', orderId);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
            showToast('Sipariş durumu güncellenirken bir hata oluştu');
            return;
        }

        console.log('Sipariş teslim alındı olarak güncellendi');

        // Masa durumunu veritabanında güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: 'teslim_edildi' })
            .eq('masa_no', order.tableNumber);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
        } else {
            console.log('Masa durumu veritabanında güncellendi');
        }

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'delivered';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === order.tableNumber);
        if (table) {
            table.status = 'delivered';
            console.log('Masa durumu uygulamada güncellendi:', table);
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
        broadcastData({
            type: 'order-update',
            order: order,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${order.tableNumber} siparişi teslim alındı`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Bildirimlere ekle
        addNotification(`Masa ${order.tableNumber} siparişi teslim alındı`);
        elements.orderDeliveredSound.play();

        // Garson ekranına geri dön
        hideOrderDetailScreen();
        showWaiterScreen();

        showToast('Sipariş teslim alındı olarak işaretlendi');
    } catch (err) {
        console.error('Sipariş güncelleme hatası:', err);
        showToast('Sipariş güncellenirken bir hata oluştu');
    }
}

// Garson siparişi servis etti
async function serveOrder(orderId) {
    try {
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Servis edilecek sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return;
        }

        console.log('Sipariş servis ediliyor:', order);

        // Sipariş durumunu veritabanında güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'servis_edildi' })
            .eq('id', orderId);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
            showToast('Sipariş güncellenirken hata oluştu');
            return;
        }

        console.log('Sipariş servis edildi olarak güncellendi');

        // Masa durumunu güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: 'payment' })
            .eq('masa_no', order.tableNumber);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
            showToast('Masa durumu güncellenirken hata oluştu');
            return;
        } else {
            console.log('Masa durumu başarıyla güncellendi');
        }

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'served';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === order.tableNumber);
        if (table) {
            table.status = 'payment';
            console.log('Masa durumu uygulamada güncellendi:', table);
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
        broadcastData({
            type: 'order-update',
            order: order,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${order.tableNumber} siparişi servis edildi`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Bildirimlere ekle
        addNotification(`Masa ${order.tableNumber} siparişi servis edildi`);
        elements.orderServedSound.play();

        // Garson ekranına geri dön
        hideOrderDetailScreen();
        showWaiterScreen();

        showToast('Sipariş servis edildi olarak işaretlendi');
    } catch (err) {
        console.error('Sipariş güncelleme hatası:', err);
        showToast('Sipariş güncellenirken bir hata oluştu');
    }
}

async function completePayment() {
    try {
        const tableNumber = parseInt(elements.paymentTitle.textContent.replace('Ödeme - Masa ', ''));

        // Ödeme yöntemi seç (varsayılan: nakit)
        const paymentMethod = elements.cashPayment.checked ? 'nakit' : 'kredi_karti';

        // Sipariş bilgisini al
        const order = appState.orders.find(o => o.tableNumber === tableNumber && o.status === 'served');
        if (!order) {
            showToast('Sipariş bulunamadı');
            return;
        }

        // Supabase'e ödeme kaydı ekle
        const { error: paymentError } = await supabase
            .from('odemeler')
            .insert({
                siparis_id: order.id,
                masa_id: order.tableId,
                masa_no: tableNumber,
                tutar: order.total,
                odeme_turu: paymentMethod,
                durum: 'tamamlandi'
            });

        if (paymentError) {
            console.error('Ödeme kaydedilirken hata:', paymentError);
            showToast('Ödeme kaydedilirken hata oluştu');
            return;
        }

        // Sipariş durumunu güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'tamamlandi' })
            .eq('id', order.id);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
        }

        // Masa durumunu güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: 'bos', toplam_tutar: 0 })
            .eq('masa_no', tableNumber);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
        }

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'completed';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === tableNumber);
        if (table) {
            table.status = 'empty';
        }

        // Tüm cihazlara sipariş güncellemesini gönder
        if (order) {
            broadcastData({
                type: 'order-update',
                order: order,
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });
        }

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${tableNumber} ödemesi tamamlandı`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Bildirimlere ekle
        addNotification(`Masa ${tableNumber} ödemesi tamamlandı`);

        // Ekranı gizle ve kasiyer ekranına dön
        hidePaymentScreen();
        showCashierScreen();

        showToast('Ödeme başarıyla tamamlandı');
    } catch (err) {
        console.error('Ödeme işlemi sırasında hata:', err);
        showToast('Ödeme işlemi sırasında bir hata oluştu');
    }
}

// Bildirim fonksiyonları
function addNotification(message) {
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    appState.notifications.unshift({
        id: appState.notifications.length + 1,
        message,
        time: timeString,
        read: false
    });

    // Bildirim sayısını güncelle
    updateNotificationBadge();

    // Duruma göre doğru bildirim sesini çal
    if (message.includes('yeni sipariş')) {
        elements.newOrderSound.play();
        sendCapacitorNotification('Yeni Sipariş', message);
    } else if (message.includes('hazır')) {
        elements.orderReadySound.play();
        sendCapacitorNotification('Sipariş Hazır', message);
    } else if (message.includes('teslim alındı')) {
        elements.orderDeliveredSound.play();
        sendCapacitorNotification('Sipariş Alındı', message);
    } else if (message.includes('servis edildi')) {
        elements.orderServedSound.play();
        sendCapacitorNotification('Sipariş Servis Edildi', message);
    } else if (message.includes('tamamlandı')) {
        elements.paymentCompleteSound.play();
        sendCapacitorNotification('Ödeme Tamamlandı', message);
    } else {
        // Varsayılan ses
        elements.notificationSound.play();
        sendCapacitorNotification('Bildirim', message);
    }

    // Kullanıcı rolüne göre otomatik ekran yenileme
    const role = appState.currentUser ? appState.currentUser.role : null;
    if (role === 'waiter' && message.includes('hazır')) {
        // Garson ekranını yenile
        renderTables();
    } else if (role === 'kitchen' && message.includes('yeni sipariş')) {
        // Mutfak ekranını yenile
        renderKitchenOrders();
    } else if (role === 'cashier' && message.includes('servis edildi')) {
        // Kasiyer ekranını yenile
        renderCashierTables();
    }
}

function updateNotificationBadge() {
    const unreadCount = appState.notifications.filter(n => !n.read).length;

    if (unreadCount > 0) {
        elements.notificationBadge.textContent = unreadCount;
        elements.notificationBadge.classList.remove('hidden');
    } else {
        elements.notificationBadge.classList.add('hidden');
    }
}

function toggleNotificationPanel() {
    const panel = elements.notificationPanel;
    const button = elements.notificationButton;

    if (panel.classList.contains('hidden')) {
        // Bildirim panelini göster
        panel.classList.remove('hidden');
        
        // Bildirimleri yükle
        renderNotifications();

        // Bildirimleri okundu olarak işaretle
        appState.notifications.forEach(n => {
            n.read = true;
        });

        // Bildirim sayısını güncelle
        updateNotificationBadge();
        
        // Mobil cihazlarda ekranın ortasında, masaüstünde sağ tarafta göster
        if (window.innerWidth < 768) {
            // Mobil görünüm için
            panel.style.left = '50%';
            panel.style.right = 'auto';
            panel.style.transform = 'translateX(-50%)';
            panel.style.maxWidth = '90vw';
        } else {
            // Masaüstü görünüm için
            panel.style.left = 'auto';
            panel.style.right = '0';
            panel.style.transform = 'none';
        }
    } else {
        // Bildirim panelini gizle
        panel.classList.add('hidden');
    }
}

function renderNotifications() {
    const notificationList = elements.notificationList;
    notificationList.innerHTML = '';

    if (appState.notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="p-4 text-center text-sm text-gray-500">
                Bildirim yok
            </div>
        `;
        return;
    }

    appState.notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = `p-3 border-b border-gray-100 ${notification.read ? '' : 'bg-blue-50'}`;
        notificationItem.innerHTML = `
            <div class="text-sm font-medium">${notification.message}</div>
            <div class="text-xs text-gray-500 mt-1">${notification.time}</div>
        `;

        notificationList.appendChild(notificationItem);
    });
}

// Toast mesajı göster
function showToast(message) {
    const toast = elements.toast;
    const toastMessage = elements.toastMessage;

    toastMessage.textContent = message;
    toast.classList.remove('hidden');

    // Animasyon
    setTimeout(() => {
        toast.classList.remove('opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, 3000);
}

// Hazır siparişleri göster
function renderReadyOrders() {
    // Garson ekranının altına hazır siparişler bölümü ekle
    const waiterScreen = elements.waiterScreen;

    // Mevcut bir hazır siparişler bölümü varsa kaldır
    const existingReadyOrders = document.getElementById('readyOrdersSection');
    if (existingReadyOrders) {
        existingReadyOrders.remove();
    }

    // Hazır siparişleri bul
    const readyOrders = appState.orders.filter(order => order.status === 'ready');

    if (readyOrders.length > 0) {
        const readyOrdersSection = document.createElement('div');
        readyOrdersSection.id = 'readyOrdersSection';
        readyOrdersSection.className = 'mt-6 mb-16';

        const sectionHeader = document.createElement('div');
        sectionHeader.className = 'flex justify-between items-center mb-3';
        sectionHeader.innerHTML = `
            <h2 class="text-lg font-medium">Hazır Siparişler</h2>
            <span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full">${readyOrders.length}</span>
        `;

        const ordersList = document.createElement('div');
        ordersList.className = 'space-y-3';

        readyOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'bg-white rounded-lg border-2 border-green-500 overflow-hidden fade-in';

            const orderHeader = document.createElement('div');
            orderHeader.className = 'bg-green-500 text-white p-3';
            orderHeader.innerHTML = `
                <div class="flex justify-between items-center">
                    <h3 class="font-medium">Masa ${order.tableNumber}</h3>
                    <span class="text-xs bg-white text-green-500 px-2 py-1 rounded-full">${order.time}</span>
                </div>
            `;

            const orderBody = document.createElement('div');
            orderBody.className = 'p-3';

            // Sipariş aksiyonları
            const orderActions = document.createElement('div');
            orderActions.className = 'flex space-x-2';

            const viewButton = document.createElement('button');
            viewButton.className = 'flex-1 bg-gray-100 text-gray-700 py-2 rounded-button text-sm';
            viewButton.textContent = 'Detaylar';
            viewButton.addEventListener('click', () => {
                showOrderDetailScreen(order);
            });

            const deliverButton = document.createElement('button');
            deliverButton.className = 'flex-1 bg-primary text-white py-2 rounded-button text-sm';
            deliverButton.textContent = 'Teslim Al';
            deliverButton.addEventListener('click', () => {
                deliverOrder(order.id);
            });

            orderActions.appendChild(viewButton);
            orderActions.appendChild(deliverButton);

            orderBody.appendChild(orderActions);

            orderCard.appendChild(orderHeader);
            orderCard.appendChild(orderBody);

            ordersList.appendChild(orderCard);
        });

        readyOrdersSection.appendChild(sectionHeader);
        readyOrdersSection.appendChild(ordersList);

        waiterScreen.appendChild(readyOrdersSection);
    }
}

// Ürün yönetimi ekranını göster
function showProductManagementScreen() {
    elements.cashierScreen.classList.add('hidden');
    elements.productManagementScreen.classList.remove('hidden');

    // İlk kategorinin ürünlerini göster
    renderProducts('starters');
}

// Ürün yönetimi ekranını gizle
function hideProductManagementScreen() {
    elements.productManagementScreen.classList.add('hidden');
}

// Ürün listesini göster
function renderProducts(category) {
    if (!category) {
        category = 'starters';
    }

    // Kategori butonlarını güncelle
    elements.productCategoryButtons.forEach(button => {
        if (button.dataset.category === category) {
            button.classList.add('bg-primary', 'text-white');
            button.classList.remove('bg-gray-200', 'text-gray-700');
        } else {
            button.classList.add('bg-gray-200', 'text-gray-700');
            button.classList.remove('bg-primary', 'text-white');
        }
    });

    // Ürünleri listele
    const productsList = elements.productsList;
    productsList.innerHTML = '';

    if (!MENU_ITEMS[category] || MENU_ITEMS[category].length === 0) {
        productsList.innerHTML = `
            <div class="bg-gray-100 rounded-lg p-4 text-center text-gray-500">
                Bu kategoride ürün bulunamadı.
            </div>
        `;
        return;
    }

    MENU_ITEMS[category].forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'bg-white rounded-lg border border-gray-200 p-4 mb-3 relative';

        // Ürün görseli için varsayılan veya ürün görseli
        const imageUrl = product.image_url || product.image || 'https://via.placeholder.com/80';
        
        // Görsel URL'sini konsola yazdır (hata ayıklama için)
        console.log(`Ürün gösteriliyor: ${product.name}, Görsel URL: ${imageUrl}`);

        productElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div class="flex items-center">
                    <img src="${imageUrl}" alt="${product.name}" class="w-12 h-12 rounded-full object-cover mr-3" 
                         onerror="this.src='https://via.placeholder.com/80'; this.onerror=null;">
                <div>
                    <h3 class="font-medium">${product.name}</h3>
                    <p class="text-sm text-gray-500">${product.price.toFixed(2)} ₺</p>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="px-2 py-1 rounded-full text-xs ${product.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                        ${product.available ? 'Satışta' : 'Satış Dışı'}
                    </span>
                    <button class="edit-product p-2 rounded-full hover:bg-gray-100" data-id="${product.id}" data-category="${product.category}">
                        <i class="fas fa-pencil-alt text-gray-600"></i>
                    </button>
                    <button class="toggle-product p-2 rounded-full hover:bg-gray-100" data-id="${product.id}" data-category="${product.category}">
                        <i class="fas fa-${product.available ? 'eye-slash' : 'eye'} text-gray-600"></i>
                    </button>
                    <button class="delete-product p-2 rounded-full hover:bg-gray-100" data-id="${product.id}" data-category="${product.category}">
                        <i class="fas fa-trash text-red-500"></i>
                    </button>
                </div>
            </div>
        `;

        // Düzenleme butonu
        const editButton = productElement.querySelector('.edit-product');
        editButton.addEventListener('click', () => {
            editProduct(product);
        });

        // Görünürlük değiştirme butonu
        const toggleButton = productElement.querySelector('.toggle-product');
        toggleButton.addEventListener('click', async () => {
            try {
                // Ürün durumunu güncelle
                product.available = !product.available;

                // Supabase'de güncelle
                const { error } = await supabase
                    .from('urunler')
                    .update({ stok_durumu: product.available })
                    .eq('id', product.id);

                if (error) {
                    console.error('Ürün durumu güncellenirken hata:', error);
                    showToast('Ürün durumu güncellenirken bir hata oluştu');
                    return;
                }

                // Gerçek zamanlı bildirim gönder
                broadcastData({
                    type: 'product-update',
                    product,
                    action: 'update',
                    sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
                });

                // UI güncelle
                renderProducts(category);
                showToast(`Ürün ${product.available ? 'satışa açıldı' : 'satıştan kaldırıldı'}`);
            } catch (err) {
                console.error('Ürün durumu değiştirme hatası:', err);
                showToast('Ürün durumu değiştirilemedi');
            }
        });

        // Silme butonu
        const deleteButton = productElement.querySelector('.delete-product');
        deleteButton.addEventListener('click', () => {
            deleteProduct(product.id, category);
        });

        productsList.appendChild(productElement);
    });
}

// Ürün düzenleme
function editProduct(product) {
    showProductForm(product);
}

// Kategori ekleme
async function addCategory() {
    const categoryName = prompt('Yeni kategori adını giriniz:');
    if (!categoryName || categoryName.trim() === '') {
        return;
    }

    // Kategori kodu oluştur (küçük harfle, boşluksuz)
    const categoryCode = categoryName.trim().toLowerCase().replace(/\s+/g, '_');

    // Var olan kategorileri kontrol et
    if (MENU_ITEMS[categoryCode]) {
        showToast('Bu kategori zaten mevcut');
        return;
    }

    try {
        // Yeni kategoriyi veritabanına ekle - RPC fonksiyonu kullan
        const { data, error } = await supabase
            .rpc('add_category', {
                p_ad: categoryName.trim()
            });

        if (error) {
            console.error('Kategori eklenirken hata:', error);
            showToast('Kategori eklenirken bir hata oluştu');
            return;
        }

        // Kategori ID'sini al
        const kategoriId = data;
        console.log('Yeni kategori eklendi:', { id: kategoriId, ad: categoryName });

        // Yerel olarak kategoriyi ekle
        MENU_ITEMS[categoryCode] = [];

        // Kategori butonlarını güncelle
        updateCategoryButtons();

        // Gerçek zamanlı bildirim gönder
        broadcastData({
            type: 'category-update',
            category: {
                id: kategoriId,
                code: categoryCode,
                name: categoryName.trim()
            },
            action: 'add',
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Yeni kategori verileri için menüyü yeniden yükle
        loadMenuItemsFromSupabase();

        showToast('Yeni kategori eklendi');
    } catch (err) {
        console.error('Kategori ekleme hatası:', err);
        showToast('Kategori eklenirken bir hata oluştu');
    }
}

// Kategori butonlarını güncelle
function updateCategoryButtons() {
    // Kategori konteynerini temizle
    if (!elements.productCategoryButtonsContainer) {
        console.log('Kategori butonları konteynerı bulunamadı');
        return;
    }

    elements.productCategoryButtonsContainer.innerHTML = '';

    // Her kategori için buton oluştur
    Object.keys(MENU_ITEMS).forEach(category => {
        const categoryName = getCategoryName(category);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'product-category-button px-4 py-2 rounded-button bg-gray-200 text-gray-700 mr-2 mb-2';
        button.dataset.category = category;
        button.textContent = categoryName;

        button.addEventListener('click', () => {
            renderProducts(category);
        });

        elements.productCategoryButtonsContainer.appendChild(button);
    });

    // Kategori ekle butonu (sadece kasiyer için)
    if (appState.currentUser.role === 'cashier') {
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.className = 'add-category-button px-4 py-2 rounded-button bg-green-500 text-white mr-2 mb-2';
        addButton.innerHTML = '<i class="fas fa-plus mr-1"></i> Kategori Ekle';

        addButton.addEventListener('click', () => {
            addCategory();
        });

        elements.productCategoryButtonsContainer.appendChild(addButton);
    }
}

// Kategori adını getir
function getCategoryName(categoryCode) {
    const categoryNames = {
        'starters': 'Başlangıçlar',
        'mains': 'Ana Yemekler',
        'drinks': 'İçecekler',
        'desserts': 'Tatlılar'
    };

    return categoryNames[categoryCode] || categoryCode.charAt(0).toUpperCase() + categoryCode.slice(1);
}

// Ürün formunu göster
function showProductForm(product = null) {
    // Form başlığını güncelle
    elements.productFormTitle.textContent = product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle';

    // Form alanlarını doldur veya temizle
    if (product) {
        elements.productCategory.value = product.category;
        elements.productName.value = product.name;
        elements.productPrice.value = product.price;
        elements.productAvailable.checked = product.available !== false;
        elements.saveProductButton.dataset.id = product.id;
        elements.saveProductButton.dataset.category = product.category;

        // Ürün görseli varsa doldur
        if (elements.productImageUrl) {
            const imageUrl = product.image_url || product.image || '';
            elements.productImageUrl.value = imageUrl !== 'https://via.placeholder.com/80' ? imageUrl : '';
            
            // Görsel önizleme
            if (elements.productImagePreview) {
                elements.productImagePreview.src = imageUrl;
                elements.productImagePreview.style.display = imageUrl ? 'block' : 'none';
            }
        }
    } else {
        // Aktif kategoriyi bul
        let activeCategory = 'starters';
        elements.productCategoryButtons.forEach(btn => {
            if (btn.classList.contains('bg-primary')) {
                activeCategory = btn.dataset.category;
            }
        });

        elements.productCategory.value = activeCategory;
        elements.productName.value = '';
        elements.productPrice.value = '';
        elements.productAvailable.checked = true;
        delete elements.saveProductButton.dataset.id;

        // Görsel URL'yi temizle
        if (elements.productImageUrl) {
            elements.productImageUrl.value = '';
            
            // Görsel önizlemeyi temizle
            if (elements.productImagePreview) {
                elements.productImagePreview.src = '';
                elements.productImagePreview.style.display = 'none';
            }
        }
    }

    // Görsel URL alanı yoksa oluştur
    if (!elements.productImageUrl) {
        // Görsel URL alanını ekle
        const formGroup = document.createElement('div');
        formGroup.className = 'mb-4';
        
        const imageUrl = product && (product.image_url || product.image) ? product.image_url || product.image : '';
        const displayUrl = imageUrl !== 'https://via.placeholder.com/80' ? imageUrl : '';
        
        formGroup.innerHTML = `
            <label for="productImageUrl" class="block text-sm font-medium text-gray-700 mb-1">Ürün Görseli URL</label>
            <input type="text" id="productImageUrl" class="w-full p-2 border border-gray-300 rounded-md"
                   placeholder="https://example.com/image.jpg" value="${displayUrl}">
            <p class="text-xs text-gray-500 mt-1">Görsel URL'si ekleyin veya boş bırakın</p>
            <div class="mt-2">
                <img id="productImagePreview" src="${imageUrl}" alt="Ürün Önizleme" 
                     class="w-20 h-20 object-cover rounded border border-gray-300" 
                     style="display: ${imageUrl ? 'block' : 'none'}">
            </div>
        `;

        // Form içine ekle - product name input'unun üstüne
        const nameInput = document.getElementById('productName');
        if (nameInput && nameInput.parentElement) {
            nameInput.parentElement.parentElement.insertBefore(formGroup, nameInput.parentElement);
        }

        // elements nesnesine ekle
        elements.productImageUrl = document.getElementById('productImageUrl');
        elements.productImagePreview = document.getElementById('productImagePreview');
        
        // URL değiştiğinde önizlemeyi güncelle
        elements.productImageUrl.addEventListener('input', function() {
            const url = this.value.trim();
            if (url) {
                elements.productImagePreview.src = url;
                elements.productImagePreview.style.display = 'block';
            } else {
                elements.productImagePreview.style.display = 'none';
            }
        });
    }

    // Formu göster
    elements.productFormScreen.classList.remove('hidden');
}

// Ürün formunu gizle
function hideProductForm() {
    elements.productFormScreen.classList.add('hidden');
}

// Ürün kaydet
async function saveProduct() {
    const name = elements.productName.value.trim();
    const price = parseFloat(elements.productPrice.value);
    const category = elements.productCategory.value;
    const available = elements.productAvailable.checked;
    const imageUrl = elements.productImageUrl ? elements.productImageUrl.value.trim() : '';

    if (!name) {
        showToast('Lütfen ürün adını girin');
        return;
    }

    console.log('Ürün kaydediliyor:', { name, price, category, available, imageUrl });

    if (isNaN(price) || price <= 0) {
        showToast('Lütfen geçerli bir fiyat girin');
        return;
    }

    try {
        const productId = elements.saveProductButton.dataset.id;
        let product;

        // Kategori ID'sini al
        let kategoriId;
        try {
            const { data: kategoriData, error: kategoriError } = await supabase
                .from('kategoriler')
                .select('id')
                .eq('ad', getCategoryName(category))
                .single();

            if (kategoriError) {
                console.error('Kategori bilgisi alınırken hata:', kategoriError);

                // Kategori bulunamadıysa, yeni kategori oluştur
                if (kategoriError.code === 'PGRST116') {
                    const turkishName = getCategoryName(category);
                    const { data: newCategory, error: newCategoryError } = await supabase
                        .rpc('add_category', { p_ad: turkishName });

                    if (newCategoryError) {
                        console.error('Yeni kategori oluşturulurken hata:', newCategoryError);
                        showToast('Kategori oluşturulurken bir hata oluştu');
                        return;
                    }

                    kategoriId = newCategory;
                    console.log('Yeni kategori oluşturuldu:', kategoriId);
                } else {
                    showToast('Ürün kaydedilirken bir hata oluştu');
                    return;
                }
            } else {
                kategoriId = kategoriData.id;
            }
        } catch (err) {
            console.error('Kategori sorgusu hatası:', err);
            showToast('Ürün kaydedilirken bir hata oluştu');
            return;
        }

        if (productId) {
            // Mevcut ürünü güncelle
            const oldCategory = elements.saveProductButton.dataset.category;
            const index = MENU_ITEMS[oldCategory].findIndex(item => item.id === productId);

            if (index !== -1) {
                // Kategori değiştiyse eski kategoriden sil
                if (oldCategory !== category) {
                    MENU_ITEMS[oldCategory].splice(index, 1);

                    // Yeni kategoriye ekle
                    product = {
                        id: productId,
                        name,
                        price,
                        category,
                        available,
                        image_url: imageUrl || 'https://via.placeholder.com/80',
                        image: imageUrl || 'https://via.placeholder.com/80'
                    };

                    MENU_ITEMS[category].push(product);
                } else {
                    // Aynı kategoride güncelle
                    product = {
                        ...MENU_ITEMS[category][index],
                        name,
                        price,
                        available,
                        image_url: imageUrl || MENU_ITEMS[category][index].image_url || 'https://via.placeholder.com/80',
                        image: imageUrl || MENU_ITEMS[category][index].image || 'https://via.placeholder.com/80'
                    };

                    MENU_ITEMS[category][index] = product;
                }

                // Supabase'de güncelle
                const updateData = {
                    ad: name,
                    fiyat: price,
                    kategori_id: kategoriId,
                    stok_durumu: available
                };
                
                // Görsel URL'si varsa ekle
                if (imageUrl) {
                    updateData.image_url = imageUrl;
                }

                const { error } = await supabase
                    .from('urunler')
                    .update(updateData)
                    .eq('id', productId);

                if (error) {
                    console.error('Ürün güncellenirken hata:', error);
                    showToast('Ürün güncellenirken bir hata oluştu');
                    return;
                }

                showToast('Ürün güncellendi');

                // Gerçek zamanlı bildirim gönder
                broadcastData({
                    type: 'product-update',
                    product,
                    action: 'update',
                    sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
                });
            }
        } else {
            // Yeni ürün ekle
            const insertData = {
                ad: name,
                fiyat: price,
                kategori_id: kategoriId,
                stok_durumu: available
            };
            
            // Görsel URL'si varsa ekle
            if (imageUrl) {
                insertData.image_url = imageUrl;
            }

            const { data: insertedProduct, error } = await supabase
                .from('urunler')
                .insert(insertData)
                .select()
                .single();

            if (error) {
                console.error('Ürün eklenirken hata:', error);
                showToast('Ürün eklenirken bir hata oluştu');
                return;
            }

            if (insertedProduct) {
                product = {
                    id: insertedProduct.id,
                    name,
                    price,
                    category,
                    available,
                    image_url: imageUrl || 'https://via.placeholder.com/80',
                    image: imageUrl || 'https://via.placeholder.com/80'
                };

                // Eğer kategori dizisi yoksa oluştur
                if (!MENU_ITEMS[category]) {
                    MENU_ITEMS[category] = [];
                }

                MENU_ITEMS[category].push(product);

                showToast('Yeni ürün eklendi');

                // Gerçek zamanlı bildirim gönder
                broadcastData({
                    type: 'product-update',
                    product,
                    action: 'add',
                    sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
                });
            }
        }

        // Formu gizle ve ürünleri yeniden listele
        hideProductForm();
        renderProducts(category);

        // Yeni veriler için menüyü yeniden yükle
        loadMenuItemsFromSupabase();
    } catch (err) {
        console.error('Ürün kaydetme hatası:', err);
        showToast('Ürün kaydedilirken bir hata oluştu');
    }
}

// Ürünü sil
async function deleteProduct(id, category) {
    try {
        if (confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            // Hata ayıklama için ID'yi konsola yazdır
            console.log('Silinecek ürün ID:', id, 'Tipi:', typeof id);
            
            // Ürün ID'sini doğru formata dönüştür
            let productId = id;
            
            // Eğer string ise ve sayı içeriyorsa integer'a çevir
            if (typeof id === 'string' && /^\d+$/.test(id)) {
                productId = parseInt(id);
                console.log('ID sayıya dönüştürüldü:', productId);
            }
            
            // Önce ürünün mevcut olup olmadığını kontrol et
            const { data: existingProduct, error: checkError } = await supabase
                .from('urunler')
                .select('id')
                .eq('id', productId)
                .single();
                
            if (checkError) {
                console.error('Ürün kontrol edilirken hata:', checkError);
                
                // Eğer ürün bulunamadıysa, yerel listeden sil ve devam et
                if (checkError.code === 'PGRST116') {
                    console.log('Ürün veritabanında bulunamadı, sadece yerel listeden siliniyor');
                    removeProductFromLocalList(id, category);
                    return;
                }
                
                showToast('Ürün kontrol edilirken bir hata oluştu');
                return;
            }
            
            console.log('Ürün veritabanında bulundu, siliniyor:', existingProduct);
            
            // Önce bu ürünün herhangi bir siparişte kullanılıp kullanılmadığını kontrol et
            const { data: orderItems, error: orderItemsError } = await supabase
                .from('siparis_kalemleri')
                .select('id')
                .eq('urun_id', productId)
                .limit(1);
                
            if (orderItemsError) {
                console.error('Sipariş kalemleri kontrol edilirken hata:', orderItemsError);
                showToast('Ürün silinirken bir hata oluştu');
                return;
            }
            
            // Eğer ürün bir siparişte kullanılmışsa, kullanıcıya bilgi ver
            if (orderItems && orderItems.length > 0) {
                console.log('Ürün siparişlerde kullanılıyor, silinemez:', orderItems);
                
                // Kullanıcıya bilgi ver ve onay iste
                if (confirm('Bu ürün daha önce siparişlerde kullanılmış. Silmek yerine stok durumunu pasif yapmak ister misiniz?')) {
                    // Ürünü pasif yap
                    const { error: updateError } = await supabase
                        .from('urunler')
                        .update({ stok_durumu: false })
                        .eq('id', productId);
                        
                    if (updateError) {
                        console.error('Ürün güncellenirken hata:', updateError);
                        showToast('Ürün güncellenirken bir hata oluştu');
                        return;
                    }
                    
                    showToast('Ürün pasif duruma getirildi');
                    
                    // Menüyü yeniden yükle
                    setTimeout(() => {
                        loadMenuItemsFromSupabase();
                    }, 500);
                    
                    return;
                } else {
                    showToast('İşlem iptal edildi');
                    return;
                }
            }

            // Supabase'den sil
            const { error } = await supabase
                .from('urunler')
                .delete()
                .eq('id', productId);

            if (error) {
                console.error('Ürün silinirken hata:', error);
                
                // Foreign key hatası olabilir
                if (error.code === '23503') {
                    showToast('Bu ürün siparişlerde kullanıldığı için silinemiyor');
                    return;
                }
                
                showToast('Ürün silinirken bir hata oluştu');
                return;
            }

            // Yerel listeden sil
            removeProductFromLocalList(id, category);
        }
    } catch (err) {
        console.error('Ürün silme hatası:', err);
        showToast('Ürün silinirken bir hata oluştu');
    }
}

// Yerel listeden ürün silme yardımcı fonksiyonu
function removeProductFromLocalList(id, category) {
    // Yerel listeden sil
    const index = MENU_ITEMS[category].findIndex(item => {
        if (typeof item.id === 'string' && typeof id === 'string') {
            return item.id === id;
        } else if (typeof item.id === 'number' && typeof id === 'number') {
            return item.id === id;
        } else if (typeof item.id === 'number' && typeof id === 'string') {
            return item.id === parseInt(id);
        } else if (typeof item.id === 'string' && typeof id === 'number') {
            return parseInt(item.id) === id;
        }
        return false;
    });

    if (index !== -1) {
        const product = MENU_ITEMS[category][index];
        MENU_ITEMS[category].splice(index, 1);

        // Menüyü yeniden yükle
        setTimeout(() => {
            loadMenuItemsFromSupabase();
        }, 500);

        // Gerçek zamanlı bildirim gönder
        broadcastData({
            type: 'product-update',
            product,
            action: 'delete',
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        showToast('Ürün silindi');
        renderProducts(category);
    } else {
        console.error('Silinecek ürün bulunamadı:', id, category);
        showToast('Ürün bulunamadı');
    }
}

// Capacitor bildirim gönderme (yalnızca mobil uygulamada çalışır)
function sendCapacitorNotification(title, body) {
    // Bu fonksiyon mobil uygulamada çalışacak
    if (typeof sendMobileNotification === 'function') {
        sendMobileNotification(title, body);
    }
}

// Garson çağrısını yanıtla
async function respondToWaiterCall(tableNumber, waiterName) {
    try {
        // Çağrı durumunu güncelle
        const { data, error } = await supabase
            .from('waiter_calls')
            .update({ 
                status: 'responded', 
                responded_at: new Date().toISOString(),
                responded_by: waiterName,
                is_completed: true
            })
            .eq('table_number', tableNumber)
            .eq('status', 'waiting');
            
        if (error) {
            console.error('Garson çağrısı yanıtlama hatası:', error);
            showToast('Garson çağrısı yanıtlanırken bir hata oluştu');
            return false;
        }
        
        try {
            // Masa QR sayfasına bildirim gönder
            await supabase.channel(`table-${tableNumber}`)
                .send({
                    type: 'broadcast',
                    event: 'waiter-response',
                    payload: { 
                        tableNumber: tableNumber,
                        message: `${waiterName} masanıza geliyor.`
                    }
                });
        } catch (channelError) {
            console.warn('Bildirim gönderme hatası (önemsiz):', channelError);
        }
        
        // Masayı güncelle - çağrı durumunu kaldır
        try {
            const { error: tableError } = await supabase
                .from('masalar')
                .update({
                    durum: 'dolu' // Masa durumunu normal hale getir
                })
                .eq('masa_no', tableNumber);
                
            if (tableError) {
                console.warn('Masa güncelleme hatası (önemsiz):', tableError);
            }
        } catch (tableErr) {
            console.warn('Masa güncelleme hatası (önemsiz):', tableErr);
        }
            
        return true;
    } catch (err) {
        console.error('Garson çağrısı yanıtlama hatası:', err);
        showToast('Garson çağrısı yanıtlanırken bir hata oluştu');
        return false;
    }
}

// Sipariş oluştur
async function createOrder() {
    if (!appState.currentTable) {
        showToast('Lütfen önce bir masa seçin');
        return;
    }

    if (appState.currentOrder.items.length === 0) {
        showToast('Lütfen sipariş için en az bir ürün ekleyin');
        return;
    }

    try {
        const tableNumber = appState.currentTable.number;
        const note = elements.orderNote.value.trim();
        const items = appState.currentOrder.items;
        const waiter = appState.currentUser.fullName;

        console.log('Sipariş oluşturuluyor:', { tableNumber, items, note, waiter });

        // Toplam tutar hesapla
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Sipariş kaydını Supabase'e ekle
        const { data: orderData, error: orderError } = await supabase
            .from('siparisler')
            .insert({
                masa_id: appState.currentTable.id,
                masa_no: tableNumber,
                durum: 'beklemede',
                siparis_notu: note,
                waiter_name: waiter,
                toplam_fiyat: total
            })
            .select();

        if (orderError) {
            console.error('Sipariş oluşturulurken hata:', orderError);
            showToast('Sipariş oluşturulurken bir hata meydana geldi');
            return;
        }

        if (!orderData || orderData.length === 0) {
            console.error('Sipariş oluşturuldu ancak veri döndürülemedi');
            showToast('Sipariş oluşturulurken bir hata meydana geldi');
            return;
        }

        console.log('Sipariş başarıyla oluşturuldu:', orderData[0]);
        const orderId = orderData[0].id;

        // Sipariş kalemlerini Supabase'e ekle
        const orderItems = items.map(item => ({
            siparis_id: orderId,
            urun_id: item.id,
            urun_adi: item.name,
            birim_fiyat: item.price,
            miktar: item.quantity,
            toplam_fiyat: item.price * item.quantity,
            durum: 'beklemede'
        }));

        const { error: itemsError } = await supabase
            .from('siparis_kalemleri')
            .insert(orderItems);

        if (itemsError) {
            console.error('Sipariş kalemleri eklenirken hata:', itemsError);
            showToast('Sipariş oluşturuldu ancak kalemler eklenirken hata oluştu');

            // Siparişi sil (rollback)
            await supabase.from('siparisler').delete().eq('id', orderId);
            return;
        }

        // Masayı güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({
                durum: 'dolu',
                waiter_name: waiter,
                // waiter_id alanını kaldırdık, foreign key constraint hatası nedeniyle
                guncelleme_zamani: new Date().toISOString(),
                toplam_tutar: total
            })
            .eq('id', appState.currentTable.id);

        if (tableError) {
            console.error('Masa güncellenirken hata:', tableError);
            // Sipariş zaten oluşturuldu, sadece uyarı göster
            showToast('Sipariş oluşturuldu ancak masa durumu güncellenemedi');
        } else {
            console.log('Masa başarıyla güncellendi:', appState.currentTable.id);

            // Masayı yeniden yükle ve güncelle
            fetchTableDetails(tableNumber);

            // Diğer hizmetleri güncelle (mutfak ve kasiyer için)
            loadOrdersFromSupabase();
        }

        // Yerel uygulama durumunu güncelle
        appState.currentTable.status = 'occupied'; // 'active' yerine 'occupied' kullanılıyor
        appState.currentTable.waiterId = appState.currentUser.id;
        appState.currentTable.waiterName = appState.currentUser.fullName;

        // Şimdi sipariş ekle
        const now = new Date();
        const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
        const dateString = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();

        // Yerel sipariş nesnesini oluştur
        const newOrder = {
            id: orderId,
            tableId: appState.currentTable.id,
            tableNumber: tableNumber,
            status: 'new',
            items: [...items],
            note: note,
            waiter: waiter,
            time: timeString,
            date: dateString,
            total: total
        };

        // Siparişi yerel listeye ekle
        appState.orders.unshift(newOrder);

        // Bildirim oluştur ve gerçek zamanlı güncelleme yap
        broadcastData({
            type: 'order-update',
            order: newOrder,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'table-update',
            table: appState.currentTable,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Sipariş detaylarını yeniden yükle
        fetchOrderDetails(orderId);

        // Diğer rollerdeki ekranları güncelle (gerçek zamanlı)
        loadOrdersFromSupabase();

        // Sipariş ekranını kapat ve masalar ekranına dön
        hideOrderScreen();
        elements.orderNote.value = '';
        appState.currentOrder.items = [];

        showToast('Sipariş başarıyla oluşturuldu');
    } catch (err) {
        console.error('Sipariş oluşturma hatası:', err);
        showToast('Sipariş oluşturulurken bir hata meydana geldi');
    }
}

// Siparişi tamamla (mutfak için)
async function completeOrder(orderId) {
    try {
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Tamamlanacak sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return;
        }

        console.log('Sipariş tamamlanıyor:', order);

        // Sipariş durumunu veritabanında güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'tamamlandi' })
            .eq('id', orderId);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
            showToast('Sipariş güncellenirken hata oluştu');
            return;
        }

        console.log('Sipariş durumu veritabanında güncellendi');

        // Masa durumunu veritabanında güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: 'hazır' })
            .eq('masa_no', order.tableNumber);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
        } else {
            console.log('Masa durumu veritabanında güncellendi');
        }

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'ready';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === order.tableNumber);
        if (table) {
            table.status = 'ready';
            console.log('Masa durumu uygulamada güncellendi:', table);
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
            broadcastData({
                type: 'order-update',
            order: order,
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });

        if (table) {
            broadcastData({
                type: 'table-update',
                table: table,
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });
        }

        // Bildirimlere ekle
        addNotification(`Masa ${order.tableNumber} siparişi hazır`);
        elements.orderReadySound.play();

            // UI'ı güncelle
            renderKitchenOrders();

        showToast(`Masa ${order.tableNumber} siparişi hazırlandı`);
    } catch (err) {
        console.error('Sipariş tamamlama hatası:', err);
        showToast('Sipariş tamamlanırken bir hata oluştu');
    }
}

// Siparişi teslim al (garson için)
async function deliverOrder(orderId) {
    try {
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Teslim alınacak sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return;
        }

        console.log('Sipariş teslim alınıyor:', order);

        // Sipariş durumunu veritabanında güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'teslim_edildi' })
            .eq('id', orderId);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
            showToast('Sipariş durumu güncellenirken bir hata oluştu');
            return;
        }

        console.log('Sipariş teslim alındı olarak güncellendi');

        // Masa durumunu veritabanında güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: 'teslim_edildi' })
            .eq('masa_no', order.tableNumber);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
        } else {
            console.log('Masa durumu veritabanında güncellendi');
        }

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'delivered';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === order.tableNumber);
        if (table) {
            table.status = 'delivered';
            console.log('Masa durumu uygulamada güncellendi:', table);
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
            broadcastData({
                type: 'order-update',
            order: order,
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${order.tableNumber} siparişi teslim alındı`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Bildirimlere ekle
        addNotification(`Masa ${order.tableNumber} siparişi teslim alındı`);
        elements.orderDeliveredSound.play();

        // Garson ekranına geri dön
        hideOrderDetailScreen();
        showWaiterScreen();

            showToast('Sipariş teslim alındı olarak işaretlendi');
    } catch (err) {
        console.error('Sipariş güncelleme hatası:', err);
        showToast('Sipariş güncellenirken bir hata oluştu');
    }
}

// Garson siparişi servis etti
async function serveOrder(orderId) {
    try {
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Servis edilecek sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return;
        }

        console.log('Sipariş servis ediliyor:', order);

        // Sipariş durumunu veritabanında güncelle
        const { error: orderError } = await supabase
            .from('siparisler')
            .update({ durum: 'servis_edildi' })
            .eq('id', orderId);

        if (orderError) {
            console.error('Sipariş güncellenirken hata:', orderError);
            showToast('Sipariş güncellenirken hata oluştu');
            return;
        }

        console.log('Sipariş servis edildi olarak güncellendi');

        // Masa durumunu güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: 'payment' })
            .eq('masa_no', order.tableNumber);

        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
            showToast('Masa durumu güncellenirken hata oluştu');
            return;
        } else {
            console.log('Masa durumu başarıyla güncellendi');
        }

        // Sipariş durumunu uygulama durumunda güncelle
        order.status = 'served';

        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === order.tableNumber);
        if (table) {
            table.status = 'payment';
            console.log('Masa durumu uygulamada güncellendi:', table);
        }

        // Tüm cihazlara sipariş güncellemesini gönder (gerçek zamanlı)
            broadcastData({
                type: 'order-update',
            order: order,
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });

        broadcastData({
            type: 'table-update',
            table: table,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        broadcastData({
            type: 'notification',
            message: `Masa ${order.tableNumber} siparişi servis edildi`,
            sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
        });

        // Bildirimlere ekle
        addNotification(`Masa ${order.tableNumber} siparişi servis edildi`);
        elements.orderServedSound.play();

        // Garson ekranına geri dön
        hideOrderDetailScreen();
        showWaiterScreen();

            showToast('Sipariş servis edildi olarak işaretlendi');
    } catch (err) {
        console.error('Sipariş güncelleme hatası:', err);
        showToast('Sipariş güncellenirken bir hata oluştu');
    }
}

// Siparişi tamamla (ödeme) (kasiyer için)
async function completePayment(orderId, tableId, paymentMethod = 'nakit', paidAmount = 0, changeAmount = 0) {
    try {
        // Ödeme kaydı oluştur
        const { data: orderData, error: orderFetchError } = await supabase
            .from('siparisler')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderFetchError) {
            console.error('Sipariş bilgisi alınırken hata:', orderFetchError);
            showToast('Sipariş bilgisi alınamadı');
            return false;
        }

        const tableNumber = orderData.masa_no;
        console.log('Sipariş bilgisi alındı:', orderData);

        // 1. Önce siparişin durumunu güncelle
        const { error: orderUpdateError } = await supabase
            .from('siparisler')
            .update({ durum: 'tamamlandi' })
            .eq('id', orderId);

        if (orderUpdateError) {
            console.error('Sipariş durumu güncellenirken hata:', orderUpdateError);
            showToast('Sipariş durumu güncellenemedi');
            return false;
        }

        console.log('Sipariş durumu güncellendi: tamamlandi');

        // 2. Masanın durumunu güncelle
        const { error: tableUpdateError } = await supabase
            .from('masalar')
            .update({
                durum: 'bos',
                siparis_id: null,
                waiter_id: null,
                waiter_name: null,
                toplam_tutar: 0
            })
            .eq('id', tableId);

        if (tableUpdateError) {
            console.error('Masa durumu güncellenirken hata:', tableUpdateError);
            showToast('Masa durumu güncellenemedi');
            return false;
        }

        console.log('Masa durumu güncellendi: bos');

        // Sipariş tutarı
        const orderTotal = parseFloat(orderData.toplam_fiyat) || 0;

        // Nakit ödeme ise para üstü bilgilerini de kaydet
        let paymentData = {
            siparis_id: orderId,
            masa_id: tableId,
            masa_no: tableNumber,
            tutar: orderTotal,
            odeme_turu: paymentMethod,
            durum: 'tamamlandi'
        };

        // Nakit ödemede müşterinin verdiği tutar ve para üstünü ekle
        if (paymentMethod === 'nakit' && paidAmount > 0) {
            paymentData.odenen_miktar = paidAmount;
            paymentData.para_ustu = changeAmount;
        }

        // 3. Ödeme kaydı oluştur
        const { error: paymentError } = await supabase
            .from('odemeler')
            .insert(paymentData);

        if (paymentError) {
            console.error('Ödeme kaydı oluşturulurken hata:', paymentError);
            showToast('Ödeme kaydı oluşturulamadı');
            return false;
        }

        console.log('Ödeme kaydı oluşturuldu:', {
            yontem: paymentMethod,
            odenen: paidAmount > 0 ? paidAmount.toFixed(2) : 'N/A',
            para_ustu: changeAmount > 0 ? changeAmount.toFixed(2) : 'N/A'
        });

        // Yerel sipariş durumunu güncelle
        const orderIndex = appState.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
            appState.orders[orderIndex].status = 'completed';

            // Gerçek zamanlı güncelleme gönder
            broadcastData({
                type: 'order-update',
                order: appState.orders[orderIndex],
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });
        }

        // Yerel masa durumunu güncelle
        const tableIndex = appState.tables.findIndex(table => table.id === tableId);
        if (tableIndex !== -1) {
            appState.tables[tableIndex].status = 'empty';
            appState.tables[tableIndex].waiterId = null;
            appState.tables[tableIndex].waiterName = null;
            appState.tables[tableIndex].orderId = null;

            // Gerçek zamanlı güncelleme gönder
            broadcastData({
                type: 'table-update',
                table: appState.tables[tableIndex],
                sender: `${rolePrefix[appState.currentUser.role]}_${appState.currentUser.fullName.replace(/\s+/g, '_').toLowerCase()}`
            });
        }

        // UI'ı güncelle
        renderCashierOrders();

        // Başarılı olduğunu bildir
        return true;
    } catch (err) {
        console.error('Ödeme tamamlama hatası:', err);
        showToast('Ödeme tamamlandı Bu Sayfadan Ayrıl');
        return false;
    }
}

// Garson siparişlerini göster
function renderWaiterOrders() {
    const waiterOrdersList = elements.waiterOrdersList;
    waiterOrdersList.innerHTML = '';

    // Hazır, bekleyen ve QR onay bekleyen siparişleri filtrele
    const activeOrders = appState.orders.filter(order =>
        order.status === 'ready' || order.status === 'delivered' || order.status === 'QR_waiting'
    );

    if (activeOrders.length === 0) {
        waiterOrdersList.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                Bekleyen veya hazır sipariş yok
            </div>
        `;
        return;
    }

    // Siparişleri duruma göre sırala (önce hazır olanlar)
    activeOrders.sort((a, b) => {
        if (a.status === 'ready' && b.status !== 'ready') return -1;
        if (a.status !== 'ready' && b.status === 'ready') return 1;

        // Aynı durumdaysa tarihe göre sırala
        const dateA = new Date(`${a.date.split('.').reverse().join('-')}T${a.time}`);
        const dateB = new Date(`${b.date.split('.').reverse().join('-')}T${b.time}`);
        return dateB - dateA;
    });

    activeOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'bg-white rounded-lg border border-gray-200 p-4 mb-4';

        let statusBadge = '';
        let actionButton = '';

        if (order.status === 'QR_waiting') {
            statusBadge = '<span class="px-2 py-1 bg-black text-white rounded-full text-xs font-medium">QR Onay Bekliyor</span>';
            actionButton = `<button class="confirm-qr-order-button px-4 py-2 bg-blue-500 text-white rounded-button" data-order-id="${order.id}">Siparişi Onayla</button>`;
        } else if (order.status === 'ready') {
            statusBadge = '<span class="px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs font-medium">Hazır</span>';
            actionButton = `<button class="deliver-order-button px-4 py-2 bg-blue-500 text-white rounded-button" data-order-id="${order.id}">Teslim Al</button>`;
        } else if (order.status === 'delivered') {
            statusBadge = '<span class="px-2 py-1 bg-amber-100 text-amber-600 rounded-full text-xs font-medium">Teslim Alındı</span>';
            actionButton = `<button class="serve-order-button px-4 py-2 bg-green-500 text-white rounded-button" data-order-id="${order.id}">Servis Edildi</button>`;
        }

        let itemsHtml = '';
        order.items.forEach(item => {
            itemsHtml += `
                <div class="flex justify-between py-1 border-b border-gray-100">
                    <div class="flex">
                        <span class="font-medium mr-2">${item.quantity}x</span>
                        <span>${item.name}</span>
                    </div>
                </div>
            `;
        });

        orderElement.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <div class="flex items-center gap-2">
                        <h3 class="text-lg font-medium">Masa ${order.tableNumber}</h3>
                        ${statusBadge}
                    </div>
                    <p class="text-xs text-gray-500">Sipariş #${order.id} • ${order.time} • ${order.date}</p>
                </div>
            </div>
            <div class="border-t border-gray-200 pt-2 mt-2">
                ${itemsHtml}
            </div>
            ${order.note ? `
                <div class="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span class="font-medium">Not:</span> ${order.note}
                </div>
            ` : ''}
            <div class="mt-4 flex justify-end">
                ${actionButton}
            </div>
        `;

        // Teslim alma butonu
        const deliverButton = orderElement.querySelector('.deliver-order-button');
        if (deliverButton) {
            deliverButton.addEventListener('click', () => {
                deliverOrder(order.id);
            });
        }

        // Servis edildi butonu
        const serveButton = orderElement.querySelector('.serve-order-button');
        if (serveButton) {
            serveButton.addEventListener('click', () => {
                serveOrder(order.id);
            });
        }
        
        // QR sipariş onaylama butonu
        const confirmQrButton = orderElement.querySelector('.confirm-qr-order-button');
        if (confirmQrButton) {
            confirmQrButton.addEventListener('click', () => {
                confirmQROrder(order.id);
            });
        }

        waiterOrdersList.appendChild(orderElement);
    });
}

// Kasiyer siparişlerini göster
function renderCashierOrders() {
    const cashierOrdersList = elements.cashierOrdersList;
    cashierOrdersList.innerHTML = '';

    // Servis edilmiş siparişleri filtrele
    const servedOrders = appState.orders.filter(order =>
        order.status === 'served'
    );

    if (servedOrders.length === 0) {
        cashierOrdersList.innerHTML = `
            <div class="bg-white rounded-lg border border-gray-200 p-4 text-center text-sm text-gray-500">
                Ödenecek sipariş yok
            </div>
        `;
        return;
    }

    // Siparişleri tarihe göre sırala (en yeniler üstte)
    servedOrders.sort((a, b) => {
        const dateA = new Date(`${a.date.split('.').reverse().join('-')}T${a.time}`);
        const dateB = new Date(`${b.date.split('.').reverse().join('-')}T${b.time}`);
        return dateB - dateA;
    });

    servedOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'bg-white rounded-lg border border-gray-200 p-4 mb-4';

        let itemsHtml = '';
        let total = 0;

        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            itemsHtml += `
                <div class="flex justify-between py-1 border-b border-gray-100">
                    <div class="flex">
                        <span class="font-medium mr-2">${item.quantity}x</span>
                        <span>${item.name}</span>
                    </div>
                    <span class="text-gray-600">${itemTotal.toFixed(2)} ₺</span>
                </div>
            `;
        });

        orderElement.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <div>
                    <div class="flex items-center gap-2">
                        <h3 class="text-lg font-medium">Masa ${order.tableNumber}</h3>
                        <span class="px-2 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">Servis Edildi</span>
                    </div>
                    <p class="text-xs text-gray-500">Sipariş #${order.id} • ${order.time} • ${order.date}</p>
                    <p class="text-xs text-gray-500">Garson: ${order.waiter}</p>
                </div>
            </div>
            <div class="border-t border-gray-200 pt-2 mt-2">
                ${itemsHtml}
                <div class="flex justify-between py-2 font-medium mt-2">
                    <span>Toplam</span>
                    <span>${total.toFixed(2)} ₺</span>
                </div>
            </div>
            ${order.note ? `
                <div class="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <span class="font-medium">Not:</span> ${order.note}
                </div>
            ` : ''}
            <div class="mt-4 flex justify-end space-x-2">
                <button class="print-receipt-button px-4 py-2 bg-gray-200 text-gray-700 rounded-button" data-order-id="${order.id}">
                    <i class="fas fa-print mr-1"></i> Fiş Yazdır
                </button>
                <button class="complete-payment-button px-4 py-2 bg-green-500 text-white rounded-button" data-order-id="${order.id}" data-table-id="${order.tableId}">
                    Ödeme Tamamlandı
                </button>
            </div>
        `;

        // Fiş yazdırma butonu
        const printButton = orderElement.querySelector('.print-receipt-button');
        if (printButton) {
            printButton.addEventListener('click', () => {
                printReceipt(order);
            });
        }

        // Ödeme tamamlama butonu
        const paymentButton = orderElement.querySelector('.complete-payment-button');
        if (paymentButton) {
            paymentButton.addEventListener('click', () => {
                completePayment(order.id, order.tableId);
            });
        }

        cashierOrdersList.appendChild(orderElement);
    });
}

// Sipariş durumunu metne dönüştür
function getOrderStatusText(status) {
    const statusTexts = {
        'new': 'Yeni',
        'preparing': 'Hazırlanıyor',
        'ready': 'Hazır',
        'delivered': 'Teslim Alındı',
        'served': 'Servis Edildi',
        'completed': 'Tamamlandı',
        'cancelled': 'İptal Edildi',
        'QR': 'QR Sipariş',
        'QR_waiting': 'QR Onay Bekliyor',
        'QR_confirmed': 'QR Onaylandı'
    };

    return statusTexts[status] || status;
}

// Fiş yazdır
async function printReceipt(order) {
    try {
        // Ödeme bilgilerini getir
        const { data: payment, error } = await supabase
            .from('odemeler')
            .select('*')
            .eq('siparis_id', order.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        // Para üstü HTML'i hazırla
        let paymentInfoHtml = '';
        if (payment && payment.odeme_turu === 'nakit' && payment.odenen_miktar > 0) {
            paymentInfoHtml = `
                <div class="border-t border-gray-300 pt-2 mb-4">
                    <div class="flex justify-between">
                        <span>Ödenen Tutar:</span>
                        <span>${payment.odenen_miktar.toFixed(2)} ₺</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Para Üstü:</span>
                        <span>${payment.para_ustu.toFixed(2)} ₺</span>
                    </div>
                </div>
            `;
        }

        // Fiş içeriğini oluştur
        const receiptContent = `
            <div class="p-4">
                <div class="text-center mb-4">
                    <h2 class="text-xl font-bold">RestaurantApp</h2>
                    <p>Adisyon Fişi</p>
                </div>

                <div class="mb-4">
                    <div class="flex justify-between">
                        <span>Tarih:</span>
                        <span>${order.date}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Saat:</span>
                        <span>${order.time}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Masa:</span>
                        <span>${order.tableNumber}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Garson:</span>
                        <span>${order.waiter}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Sipariş No:</span>
                        <span>${order.id}</span>
                    </div>
                    <div class="flex justify-between">
                        <span>Ödeme Türü:</span>
                        <span>${payment ? (payment.odeme_turu === 'nakit' ? 'Nakit' : 'Kredi Kartı') : 'Nakit'}</span>
                    </div>
                </div>

                <div class="border-t border-b border-gray-300 py-2 mb-4">
                    <div class="flex justify-between font-medium">
                        <span>Ürün</span>
                        <div class="flex">
                            <span class="w-16 text-center">Adet</span>
                            <span class="w-20 text-right">Tutar</span>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    ${order.items.map(item => `
                        <div class="flex justify-between mb-1">
                            <span>${item.name}</span>
                            <div class="flex">
                                <span class="w-16 text-center">${item.quantity}</span>
                                <span class="w-20 text-right">${(item.price * item.quantity).toFixed(2)} ₺</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="border-t border-gray-300 pt-2 mb-4">
                    <div class="flex justify-between font-bold">
                        <span>TOPLAM</span>
                        <span>${order.total.toFixed(2)} ₺</span>
                    </div>
                </div>

                ${paymentInfoHtml}

                <div class="text-center text-sm mt-8">
                    <p>Bizi tercih ettiğiniz için teşekkür ederiz!</p>
                    <p>RestaurantApp</p>
                </div>
            </div>
        `;

        // Yazdırma penceresini aç
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
            <head>
                <title>Adisyon Fişi - Masa ${order.tableNumber}</title>
                <style>
                    body { font-family: Arial, sans-serif; font-size: 12px; }
                    .p-4 { padding: 16px; }
                    .mb-4 { margin-bottom: 16px; }
                    .mb-1 { margin-bottom: 4px; }
                    .mt-8 { margin-top: 32px; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .text-xl { font-size: 20px; }
                    .text-sm { font-size: 10px; }
                    .font-bold { font-weight: bold; }
                    .font-medium { font-weight: 500; }
                    .flex { display: flex; }
                    .justify-between { justify-content: space-between; }
                    .border-t { border-top: 1px solid #ccc; }
                    .border-b { border-bottom: 1px solid #ccc; }
                    .border-gray-300 { border-color: #ccc; }
                    .py-2 { padding-top: 8px; padding-bottom: 8px; }
                    .pt-2 { padding-top: 8px; }
                    .w-16 { width: 64px; }
                    .w-20 { width: 80px; }

                    @media print {
                        body { width: 80mm; margin: 0; padding: 0; }
                    }
                </style>
            </head>
            <body>
                ${receiptContent}
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </body>
            </html>
        `);

        showToast('Fiş yazdırılıyor...');
    } catch (err) {
        console.error('Fiş yazdırma hatası:', err);
        showToast('Fiş yazdırma sırasında bir hata oluştu');
    }
}

// Oturum kontrolü
function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        // Kullanıcı bilgilerini güncelle
        appState.currentUser = user;
        elements.userName.textContent = user.fullName;
        elements.userRole.textContent = user.role === 'waiter' ? 'Garson' :
                                         user.role === 'kitchen' ? 'Mutfak' : 'Kasiyer';

        // Veritabanı ile senkronizasyon yap ve gerçek zamanlı bağlantıyı başlat
        syncDatabaseWithApp().then(() => {
            console.log('Uygulama başarıyla senkronize edildi');
        }).catch(err => {
            console.error('Senkronizasyon hatası:', err);

            // Hata durumunda verileri doğrudan yükle
            loadTablesFromSupabase();
            loadOrdersFromSupabase();
            loadMenuItemsFromSupabase();

            // Gerçek zamanlı bağlantıyı başlat
            initRealtimeConnection(user.role, user.fullName);
        });

        // Ekranı kullanıcı rolüne göre göster
        showAppInterface();
    } else {
        // Giriş ekranını göster
        showLoginScreen();
    }
}

// Giriş ekranını göster
function showLoginScreen() {
    elements.loginScreen.classList.remove('hidden');
    elements.appContainer.classList.add('hidden');

    // Giriş bilgilerini temizle
    elements.username.value = '';
    elements.password.value = '';
    elements.loginError.classList.add('hidden');
    elements.loginError.textContent = '';
}

// Giriş fonksiyonu
async function login() {
    const username = elements.username.value.trim();
    const password = elements.password.value.trim();
    const role = elements.roleSelect.value;

    if (!username || !password) {
        showLoginError('Lütfen kullanıcı adı ve şifre girin');
        return;
    }
    
    try {
        console.log('Giriş isteği:', username, role);

        // Önce Supabase'den kullanıcıları kontrol et
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username);

        if (error) {
            console.error('Giriş hatası:', error);
            showLoginError('Giriş sırasında bir hata oluştu');
            return;
        }

        console.log('Bulunan kullanıcılar:', users);

        // Kullanıcıyı bul
        const user = users && users.length > 0 ? users.find(u => u.role === role) : null;

        let isValid = false;
        let fullName = '';
        let userId = null;

        // Supabase'de kullanıcı varsa
        if (user && user.password === password) {
            console.log('Supabase kullanıcısı doğrulandı:', user.name);
            isValid = true;
            fullName = user.name;
            userId = user.id;
        } else {
            // Yerel doğrulama - gerçek uygulamada kaldırılacak
            console.log('Yerel doğrulama deneniyor...');
            if ((role === 'waiter' && username === 'garson1' && password === 'garson1') ||
                (role === 'kitchen' && username === 'mutfak1' && password === 'mutfak1') ||
                (role === 'cashier' && username === 'kasiyer1' && password === 'kasiyer1')) {
                isValid = true;
                fullName = role === 'waiter' ? 'Ahmet Yılmaz' :
                           role === 'kitchen' ? 'Mehmet Şef' : 'Ayşe Kasa';
                userId = null;
            }

            // Kullanıcı veritabanında yoksa ekle
            if (isValid && (!users || users.length === 0)) {
                try {
                    const insertData = {
                            username,
                            password,
                            name: fullName,
                        role
                    };
                    const { error: insertError } = await supabase
                        .from('users')
                        .insert(insertData);

                    if (insertError) {
                        console.error('Kullanıcı kaydedilirken hata:', insertError);
                    } else {
                        console.log('Kullanıcı veritabanına kaydedildi');
                    }
                } catch (err) {
                    console.error('Kullanıcı kaydedilirken hata:', err);
                }
            }
        }

        if (isValid) {
            console.log('Giriş başarılı:', role, fullName);

            // Kullanıcı bilgilerini kaydet
            const userData = {
                username,
                role,
                fullName,
                id: userId
            };

            localStorage.setItem('user', JSON.stringify(userData));
            appState.currentUser = userData;

            // Kullanıcı bilgilerini ekrana yaz
            elements.userName.textContent = fullName;
            elements.userRole.textContent = role === 'waiter' ? 'Garson' :
                                         role === 'kitchen' ? 'Mutfak' : 'Kasiyer';

            // Veritabanı ile senkronizasyon yap ve gerçek zamanlı bağlantıyı başlat
            syncDatabaseWithApp().then(() => {
                console.log('Giriş sonrası uygulama başarıyla senkronize edildi');

                // Giriş ekranını gizle ve uygulama ekranını göster
                elements.loginScreen.classList.add('hidden');
                elements.appContainer.classList.remove('hidden');

                // Ekranı kullanıcı rolüne göre göster
                showAppInterface();
            }).catch(err => {
                console.error('Giriş sonrası senkronizasyon hatası:', err);

                // Hata durumunda verileri doğrudan yükle
                loadTablesFromSupabase();
                loadOrdersFromSupabase();
                loadMenuItemsFromSupabase();

                // Gerçek zamanlı bağlantıyı başlat
                initRealtimeConnection(role, fullName);

                // Giriş ekranını gizle ve uygulama ekranını göster
                elements.loginScreen.classList.add('hidden');
                elements.appContainer.classList.remove('hidden');

                // Ekranı kullanıcı rolüne göre göster
                showAppInterface();
            });
        } else {
            showLoginError('Kullanıcı adı, şifre veya rol yanlış');
        }
    } catch (err) {
        console.error('Giriş hatası:', err);
        showLoginError('Giriş sırasında bir hata oluştu');
    }
}

// QR siparişlerini işle
function handleQROrderChange(payload) {
    console.log('QR sipariş değişikliği:', payload);

    // Yeni sipariş eklenmesi
    if (payload.eventType === 'INSERT') {
        const newOrder = payload.new;
        
        // QR siparişi geldi - garson onayı bekliyor
        // Yeni siparişlerin durumu "QR_waiting" olarak başlatılır
        addNotification(`Masa ${newOrder.table_number} yeni QR siparişi (onay bekliyor)`);
        elements.newOrderSound.play();
        
        // Masa durumunu güncelle - QR_waiting (garson onayı bekliyor)
        updateTableStatusFromQROrder(newOrder.table_number, 'QR_waiting');
        
        // Sipariş durumunu güncelle - veritabanında
        updateQROrderStatus(newOrder.id, 'QR_waiting');
        
        // Sipariş detaylarını getir
        fetchQROrderDetails(newOrder.id);
    } 
    // Sipariş güncellenmesi
    else if (payload.eventType === 'UPDATE') {
        const updatedOrder = payload.new;
        const oldOrder = payload.old;
        
        // Durum değişikliği
        if (updatedOrder.status !== oldOrder.status) {
            console.log(`QR sipariş durumu değişti: ${oldOrder.status} -> ${updatedOrder.status}`);
            
            // Sipariş detaylarını getir
            fetchQROrderDetails(updatedOrder.id);
            
            // Masa durumunu güncelle
            updateTableStatusFromQROrder(updatedOrder.table_number, updatedOrder.status);
            
            // Durum değişikliğine göre bildirim
            if (updatedOrder.status === 'QR_confirmed') {
                addNotification(`Masa ${updatedOrder.table_number} QR siparişi onaylandı`);
            } else if (updatedOrder.status === 'ready') {
                addNotification(`Masa ${updatedOrder.table_number} siparişi hazır`);
                elements.orderReadySound.play();
            }
        }
    }
    // Yeni sipariş kalemleri eklenmesi durumunda
    else if (payload.eventType === 'INSERT_ITEMS') {
        const tableNumber = payload.table_number;
        const orderId = payload.id;
        
        // Masa durumunu kontrol et
        const table = appState.tables.find(t => t.number === parseInt(tableNumber));
        
        // Eğer masa zaten aktif bir siparişe sahipse (servis edilmiş veya teslim alınmış)
        // yeni eklenen ürünleri mevcut siparişe ekle
        if (table && (table.status === 'served' || table.status === 'delivered')) {
            addNotification(`Masa ${tableNumber} siparişine yeni ürünler eklendi`);
            elements.newOrderSound.play();
            
            // Sipariş detaylarını yeniden getir
            fetchQROrderDetails(orderId);
        }
    }
}

// QR sipariş durumunu güncelle
async function updateQROrderStatus(orderId, status) {
    try {
        const { error } = await supabase
            .from('orders')
            .update({ status: status })
            .eq('id', orderId);
            
        if (error) {
            console.error('QR sipariş durumu güncellenirken hata:', error);
        } else {
            console.log(`QR sipariş durumu güncellendi: ${orderId} -> ${status}`);
        }
    } catch (err) {
        console.error('QR sipariş durumu güncellenirken hata:', err);
    }
}

// QR sipariş kalemlerini işle
function handleQROrderItemChange(payload) {
    console.log('QR sipariş kalemi değişikliği:', payload);
    
    // Yeni sipariş kalemi eklenmesi
    if (payload.eventType === 'INSERT') {
        const orderItem = payload.new;
        
        // Sipariş detaylarını getir
        fetchQROrderDetails(orderItem.order_id);
        
        // Siparişin bilgilerini al
        supabase
            .from('orders')
            .select('*')
            .eq('id', orderItem.order_id)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    // Siparişe yeni ürün eklendiyse ve masa servis edilmiş veya teslim alınmış durumdaysa
                    // QR_waiting durumuna getir ve garson onayı gerektir
                    const tableNumber = data.table_number;
                    const table = appState.tables.find(t => t.number === parseInt(tableNumber));
                    
                    if (table && (table.status === 'served' || table.status === 'delivered')) {
                        // Sipariş durumunu güncelle
                        updateQROrderStatus(orderItem.order_id, 'QR_waiting');
                        
                        // Masa durumunu güncelle
                        updateTableStatusFromQROrder(tableNumber, 'QR_waiting');
                        
                        // Bildirim gönder
                        addNotification(`Masa ${tableNumber} siparişine yeni ürünler eklendi (onay bekliyor)`);
                        elements.newOrderSound.play();
                        
                        // Sipariş değişikliğini bildir
                        handleQROrderChange({
                            eventType: 'INSERT_ITEMS',
                            table_number: tableNumber,
                            id: orderItem.order_id
                        });
                    }
                }
            });
    }
}

// QR sipariş detaylarını getir
async function fetchQROrderDetails(orderId) {
    try {
        console.log('QR sipariş detayları getiriliyor:', orderId);
        
        // Siparişi getir
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items(*)
            `)
            .eq('id', orderId)
            .single();
            
        if (orderError) {
            console.error('Sipariş detayları alınırken hata:', orderError);
            return;
        }
        
        if (orderData) {
            const now = new Date(orderData.created_at);
            const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
            const dateString = now.getDate().toString().padStart(2, '0') + '.' + (now.getMonth() + 1).toString().padStart(2, '0') + '.' + now.getFullYear();
            
            // Sipariş kalemlerini düzenle
            const items = orderData.order_items ? orderData.order_items.map(item => ({
                id: item.menu_item_id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity,
                category: 'mains', // Varsayılan kategori
                total: parseFloat(item.price) * item.quantity
            })) : [];
            
            // Siparişi uygulama formatına dönüştür
            const updatedOrder = {
                id: orderData.id,
                tableId: orderData.table_id,
                tableNumber: orderData.table_number,
                status: convertStatusFromDb(orderData.status),
                items: items,
                note: orderData.note || '',
                waiter: 'QR Sipariş',
                time: timeString,
                date: dateString,
                total: parseFloat(orderData.total_amount || 0),
                source: 'QR'
            };
            
            // Siparişi uygulama durumunda güncelle
            updateOrderFromRealtime(updatedOrder);
            
            // UI yenile
            refreshUI();
        }
    } catch (err) {
        console.error('QR sipariş detayları alınırken hata:', err);
    }
}

// Masa durumunu QR siparişine göre güncelle
async function updateTableStatusFromQROrder(tableNumber, orderStatus) {
    try {
        console.log('Masa durumu QR siparişine göre güncelleniyor:', tableNumber, orderStatus);
        
        // Masa durumunu belirle
        let tableStatus;
        
        // Sipariş durumuna göre masa durumunu belirle
        switch(orderStatus) {
            case 'QR_waiting':
                tableStatus = 'QR_waiting'; // Garson onayı bekliyor
                break;
            case 'QR_confirmed':
                tableStatus = 'QR_confirmed'; // Garson onayladı, mutfağa gidecek
                break;
            case 'new':
                tableStatus = 'active'; // Sipariş aktif
                break;
            case 'ready':
                tableStatus = 'ready'; // Sipariş hazır
                break;
            case 'delivered':
                tableStatus = 'delivered'; // Sipariş teslim alındı
                break;
            case 'served':
                tableStatus = 'served'; // Sipariş servis edildi
                break;
            case 'payment':
                tableStatus = 'payment'; // Ödeme bekliyor
                break;
            case 'completed':
                tableStatus = 'empty'; // Sipariş tamamlandı, masa boş
                break;
            default:
                tableStatus = 'QR'; // Varsayılan QR durumu
        }
        
        // Masa durumunu veritabanında güncelle
        const { error: tableError } = await supabase
            .from('masalar')
            .update({ durum: tableStatus })
            .eq('masa_no', tableNumber);
            
        if (tableError) {
            console.error('Masa durumu güncellenirken hata:', tableError);
            return;
        }
        
        console.log('Masa durumu güncellendi:', tableNumber, tableStatus);
        
        // Masa durumunu uygulama durumunda güncelle
        const table = appState.tables.find(t => t.number === parseInt(tableNumber));
        if (table) {
            table.status = convertStatusFromDb(tableStatus);
            console.log('Masa durumu uygulamada güncellendi:', table);
        }
        
        // UI yenile
        refreshUI();
    } catch (err) {
        console.error('Masa durumu güncellenirken hata:', err);
    }
}

// QR siparişlerini göster
async function fetchQROrdersForTable(tableNumber) {
    try {
        const { data: orders, error } = await supabase
            .from('orders')
            .select(`
                *,
                order_items(*)
            `)
            .eq('table_number', tableNumber)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('QR siparişleri alınırken hata:', error);
            return [];
        }
        
        return orders.map(order => {
            const items = order.order_items ? order.order_items.map(item => ({
                id: item.menu_item_id,
                name: item.name,
                price: parseFloat(item.price),
                quantity: item.quantity,
                category: 'mains',
                total: parseFloat(item.price) * item.quantity
            })) : [];
            
            const createdAt = new Date(order.created_at);
            const timeString = createdAt.getHours().toString().padStart(2, '0') + ':' + createdAt.getMinutes().toString().padStart(2, '0');
            const dateString = createdAt.getDate().toString().padStart(2, '0') + '.' + (createdAt.getMonth() + 1).toString().padStart(2, '0') + '.' + createdAt.getFullYear();
            
            return {
                id: order.id,
                tableId: order.table_id,
                tableNumber: order.table_number,
                status: convertStatusFromDb(order.status),
                items: items,
                note: order.note || '',
                waiter: 'QR Sipariş',
                time: timeString,
                date: dateString,
                total: parseFloat(order.total_amount || 0),
                source: 'QR'
            };
        });
    } catch (err) {
        console.error('QR siparişleri alınırken hata:', err);
        return [];
    }
}

// QR siparişini onayla - garsondan mutfağa
async function confirmQROrder(orderId) {
    try {
        console.log('QR siparişi onaylanıyor:', orderId);
        
        // Siparişi bul
        const order = appState.orders.find(o => o.id === orderId);
        if (!order) {
            console.error('Sipariş bulunamadı:', orderId);
            showToast('Sipariş bulunamadı');
            return false;
        }
        
        // Sipariş durumunu güncelle - QR_confirmed (garson onayladı, mutfağa gidecek)
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                status: 'new',  // Mutfak paneli için 'new' olarak işaretlenir
                waiter_name: appState.currentUser.fullName, // Onaylayan garson adı
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId);
            
        if (updateError) {
            console.error('Sipariş onaylanırken hata:', updateError);
            showToast('Sipariş onaylanamadı');
            return false;
        }
        
        // Masa durumunu güncelle - QR_confirmed (garson onayladı)
        await updateTableStatusFromQROrder(order.tableNumber, 'QR_confirmed');
        
        // Bildirim gönder
        addNotification(`Masa ${order.tableNumber} QR siparişi onaylandı ve mutfağa gönderildi`);
        
        // Sipariş nesnesini güncelle
        order.status = 'new';
        
        // UI'ı güncelle
        refreshUI();
        
        // Başarılı olduğunu bildir
        showToast('Sipariş onaylandı ve mutfağa gönderildi');
        return true;
    } catch (err) {
        console.error('QR sipariş onaylama hatası:', err);
        showToast('Sipariş onaylanırken bir hata oluştu');
        return false;
    }
}