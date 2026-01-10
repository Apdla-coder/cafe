# 🚀 إعدادات السيرفر لرفع الصور

## مشكلة رفع الصور على السيرفر

لما بترفع المشروع على السيرفر، رفع الصور بتاع الفئات والمنتجات مش شغلان بسبب إعدادات Supabase Storage.

## 🛠️ الحلول المتاحة

### الحل 1: إعدادات Supabase Storage (موصى به)

#### 1. إنشاء Storage Bucket
اذهب إلى لوحة تحكم Supabase:
1. افتح مشروعك
2. اذهب إلى **Storage**
3. اضغط **Create a new bucket**
4. اسمه `restaurant`
5. اجعله **Public**

#### 2. إعدادات الـ Policies
اذهب إلى **Authentication > Policies**:
```sql
-- للسماح برفع الصور
CREATE POLICY "Allow image uploads" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'restaurant' AND 
  auth.role() = 'anon'
);

-- للسماح بقراءة الصور
CREATE POLICY "Allow public image access" ON storage.objects
FOR SELECT USING (
  bucket_id = 'restaurant'
);

-- للسماح بتحديث الصور
CREATE POLICY "Allow image updates" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'restaurant' AND 
  auth.role() = 'anon'
);
```

#### 3. إعدادات CORS
اذهب إلى **Settings > CORS** وأضف:
```json
[
  {
    "origin": ["*"],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "headers": ["*"],
    "credentials": true
  }
]
```

### الحل 2: استخدام Base64 (يعمل بدون إعدادات)

الكود الحالي بيستخدم Base64 كـ backup تلقائي لو Supabase Storage مش شغال.

**مميزات:**
- ✅ يعمل بدون إعدادات السيرفر
- ✅ لا يحتاج إعدادات إضافية
- ✅ يعمل على أي hosting

**عيوب:**
- ❌ حجم الصور أكبر في الداتابيز
- ❌ أبطأ في التحميل

### الحل 3: استخدام خدمة خارجية (Cloudinary)

لو عايز خدمة احترافية:
```javascript
// استبدل دالة uploadProductImage بـ Cloudinary
const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/image/upload';
const formData = new FormData();
formData.append('file', file);
formData.append('upload_preset', 'YOUR_UPLOAD_PRESET');

const response = await fetch(cloudinaryUrl, {
  method: 'POST',
  body: formData
});
```

## 📋 خطوات التشغيل

### 1. اختبار الوضع الحالي
افتح لوحة التحكم وحاول رفع صورة. شوف الـ Console في المتصفح:
- لو شايف `✅ Image uploaded to Supabase Storage` → كل شيء تمام
- لو شايف `📎 Image converted to Base64` → بيشتغل بـ Base64

### 2. إعدادات Supabase (اختياري)
لو عايز تستخدم Supabase Storage:
1. طبق الخطوات في الحل 1
2. جرب رفع صورة تاني
3. تأكد إن الكود بيستخدم Storage مش Base64

### 3. التأكد من العمل
افحص:
- [ ] رفع صورة منتج جديدة
- [ ] رفع صورة فئة جديدة  
- [ ] تعديل صورة موجودة
- [ ] عرض الصور في المنيو

## 🔧 Debugging

لو فيه مشاكل:

### 1. شوف الـ Console
```javascript
// افتح Console في المتصفح وابحث عن:
// ✅ Image uploaded to Supabase Storage
// 📎 Image converted to Base64
// ❌ Error messages
```

### 2. اختبر الاتصال
```javascript
// في Console المتصفح:
fetch('https://YOUR_PROJECT.supabase.co/storage/v1/bucket/restaurant', {
  headers: { 'authorization': 'Bearer YOUR_KEY' }
})
.then(r => console.log('Storage status:', r.status))
.catch(e => console.error('Storage error:', e))
```

### 3. حجم الصور
تأكد إن الصور أقل من 5MB:
```javascript
// الكود بيحقق ده تلقائياً
if (file.size > 5 * 1024 * 1024) {
  throw new Error('حجم الصورة كبير جداً (الحد الأقصى: 5MB)');
}
```

## 📞 المساعدة

لو فيه مشاكل:
1. شوف رسائل الخطأ في Console
2. تأكد من إعدادات Supabase
3. جرب الحل Base64 (شغال تلقائياً)
4. اتصل بـ Supabase Support لو فيه مشاكل في Storage

---

**ملاحظة:** الكود الحالي شغال في كل الأحوال - لو Supabase Storage شغال بيستخدمه، ولو لا بيستخدم Base64 backup.
