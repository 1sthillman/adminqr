# QR Sipariş Sistemi Fonksiyonları

QR sipariş sisteminin çalışması için aşağıdaki fonksiyonlar gereklidir. Bu fonksiyonları kendi projenize entegre etmek için kullanabilirsiniz.

## Temel Fonksiyonlar

1. **handleQROrderChange(payload)**
   - QR siparişlerindeki değişiklikleri izler
   - Yeni siparişleri garson onayına gönderir
   - Sipariş durumunu günceller

2. **updateQROrderStatus(orderId, status)**
   - QR sipariş durumunu veritabanında günceller
   - Sipariş durumunu belirtilen değere ayarlar

3. **handleQROrderItemChange(payload)**
   - QR sipariş kalemlerindeki değişiklikleri izler
   - Yeni eklenen ürünleri tespit eder
   - Mevcut siparişe ekleme yapıldığında garson onayına gönderir

4. **fetchQROrderDetails(orderId)**
   - QR sipariş detaylarını veritabanından getirir
   - Sipariş kalemlerini düzenler ve uygulama formatına dönüştürür

5. **updateTableStatusFromQROrder(tableNumber, orderStatus)**
   - Masa durumunu QR siparişine göre günceller
   - Sipariş durumuna göre masa durumunu belirler

6. **fetchQROrdersForTable(tableNumber)**
   - Belirli bir masa için tüm QR siparişlerini getirir
   - Siparişleri tarih sırasına göre düzenler

7. **confirmQROrder(orderId)**
   - Garsonun QR siparişini onaylamasını sağlar
   - Siparişi mutfağa iletir
   - Masa durumunu günceller

## Durum Kodları

QR sipariş sistemi için eklenen yeni durum kodları:

- **QR_waiting**: Garson onayı bekleyen QR siparişi
- **QR_confirmed**: Garson onaylı, mutfağa iletilen QR siparişi

## Veritabanı Değişiklikleri

QR sipariş sistemi için veritabanında yapılması gereken değişiklikler:

1. **orders** tablosuna **is_confirmed** alanı eklenmesi:
   ```sql
   ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT false;
   ```

## Arayüz Güncellemeleri

QR sipariş sistemi için arayüzde yapılan değişiklikler:

1. Masa durumları için yeni renkler:
   - QR_waiting: Siyah arka plan, beyaz yazı
   - QR_confirmed: Mavi arka plan

2. Garson panelinde QR sipariş onay butonu

3. Sipariş detay ekranında QR onay seçeneği 