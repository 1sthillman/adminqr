# QR Sipariş Sistemi

Bu proje, restoran yönetim sistemine entegre QR kod sipariş sistemini içerir. Müşteriler QR kod ile sipariş verebilir ve siparişler garson onayından sonra mutfağa iletilir.

## Özellikler

1. **Garson Onay Mekanizması**
   - Müşteri QR kod ile sipariş verdiğinde, sipariş önce garson onayına gider
   - Garson siparişi onayladıktan sonra mutfağa iletilir
   - Masa durumu "QR_waiting" (QR Onay Bekliyor) olarak işaretlenir

2. **Masa Durumları**
   - QR_waiting: Garson onayı bekleyen QR siparişi (Siyah renk)
   - QR_confirmed: Garson onaylı QR siparişi (Mavi renk)
   - Diğer standart durumlar (hazır, teslim alındı, servis edildi, vb.)

3. **Ek Sipariş Desteği**
   - Müşteri aynı masaya ek sipariş verebilir
   - Ek siparişler de garson onayına gider
   - Mutfak sadece yeni eklenen ürünleri görür

4. **Gerçek Zamanlı Bildirimler**
   - Yeni QR siparişleri için bildirim ve ses uyarısı
   - Sipariş durumu değişikliklerinde bildirim

## Kurulum

1. app.js dosyasını projenize entegre edin
2. Supabase veritabanında orders tablosuna is_confirmed alanı ekleyin
3. QR kod sistemini test edin

## Kullanım Akışı

1. Müşteri QR kod ile sipariş verir
2. Garson siparişi onaylar
3. Mutfak siparişi hazırlar
4. Garson siparişi teslim alır ve servis eder
5. Kasiyer ödeme alır
6. Masa boşalır

## Geliştirici

Bu sistem, RestaurantApp projesi için özel olarak geliştirilmiştir. 

<div id="viewCartButton"
     class="fixed bottom-6 right-6 z-[9999] bg-primary text-white flex items-center justify-center rounded-full p-4 shadow-lg cursor-pointer transition-transform">
    <i class="ri-shopping-cart-2-line text-2xl"></i>
    <span id="cartItemCount"
          class="absolute -top-2 -right-2 w-6 h-6 bg-white text-primary text-sm rounded-full flex items-center justify-center font-bold border-2 border-primary">0</span>
</div> 