# خطوات إعداد Railway - الإشعارات والمراقبة

## 🚀 الخطوة 1: Firebase Setup

### اذهب إلى Firebase Console:
```
https://console.firebase.google.com
```

### في Dashboard:
1. **اختر أو أنشئ project**
2. اذهب إلى **Project Settings** (⚙️)
3. اختر tab **Service Accounts**
4. اختر اللغة **Node.js**
5. اضغط **Generate New Private Key**
6. سيحمل ملف `.json`

### افتح الملف وانسخ البيانات:

```json
{
  "type": "service_account",
  "project_id": "ahdatuk-firebase-xxx",           // ← انسخ هذا
  "private_key_id": "abc123...",                  // ← انسخ هذا
  "private_key": "-----BEGIN PRIVATE KEY-----...", // ← انسخ هذا كامل
  "client_email": "firebase-adminsdk-xxx@...",    // ← انسخ هذا
  "client_id": "123456789..."                     // ← انسخ هذا
}
```

---

## 🔐 الخطوة 2: أضفها على Railway

### اذهب إلى Railway:
```
https://railway.app
```

### في قائمة الـ services:
1. اختر **your-ahdah-app**
2. اختر **Variables** (من الـ sidebar)
3. اضغط **Add Variable**

### أضف هذه المتغيرات (واحدة واحدة):

```
الاسم: FIREBASE_PROJECT_ID
القيمة: ahdatuk-firebase-xxx
```

```
الاسم: FIREBASE_PRIVATE_KEY_ID
القيمة: abc123...
```

```
الاسم: FIREBASE_PRIVATE_KEY
القيمة: -----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----\n
```
⚠️ **تنبيه:** ضع `\n` بدل الـ newlines

```
الاسم: FIREBASE_CLIENT_EMAIL
القيمة: firebase-adminsdk-xxx@ahdatuk-firebase-xxx.iam.gserviceaccount.com
```

```
الاسم: FIREBASE_CLIENT_ID
القيمة: 123456789...
```

---

## 📊 الخطوة 3: Sentry Setup

### اذهب إلى Sentry:
```
https://sentry.io
```

### أنشئ حساب مجاني:
1. اضغط **Sign Up**
2. ادخل البريد الإلكتروني
3. تحقق من البريد

### أنشئ Organization:
1. بعد تسجيل الدخول، اضغط **Create Organization**
2. اختر اسم: `ahdatuk`
3. اختر الـ plan: **Free** ✅

### أنشئ Project:
1. اضغط **Create Project**
2. اختر platform: **Next.js**
3. اختر alert frequency: **As often as possible**
4. اضغط **Create Project**

### احصل على الـ DSN:
1. بعد الإنشاء، اذهب إلى **Project Settings**
2. اختر **Client Keys (DSN)**
3. انسخ الـ DSN (يبدأ بـ `https://`)

### احصل على الـ Auth Token:
1. اذهب إلى [account settings](https://sentry.io/settings/account)
2. اختر **Auth Tokens**
3. اضغط **Create New Token**
4. اختر scopes: `project:read`, `project:write`, `project:admin`
5. انسخ الـ token

---

## 🔐 الخطوة 4: أضفها على Railway

### في Railway Variables:

```
الاسم: SENTRY_DSN
القيمة: https://xxx@sentry.io/xxx
```

```
الاسم: SENTRY_AUTH_TOKEN
القيمة: sntrys_xxx_xxxxxxx
```

```
الاسم: SENTRY_ORG
القيمة: your-org-name
```

```
الاسم: SENTRY_PROJECT
القيمة: ahdah
```

---

## ✅ الخطوة 5: تثبيت المكتبات

### في الـ terminal على جهازك:

```bash
cd /home/user/ahdah

npm install firebase-admin @sentry/nextjs
```

### أضف الملفات التي أنشأتها:
- `src/lib/firebase-admin.ts`
- `src/lib/sentry-init.ts`
- `src/lib/notifications.ts`

### في `src/app/layout.tsx`:
```typescript
import { initSentry } from "@/lib/sentry-init";

// Server-side only
if (typeof window === "undefined") {
  initSentry();
}

export default function RootLayout() {
  // ... your layout
}
```

---

## 🔄 الخطوة 6: Redeploy على Railway

```bash
# من جهازك:
git add .
git commit -m "Add Firebase notifications and Sentry monitoring"
git push origin main
```

### اذهب إلى Railway:
1. اختر project
2. سيبدأ الـ deploy تلقائياً
3. انتظر حتى يكمل ✅

---

## 🧪 الخطوة 7: اختبر

### اختبر الإشعارات:
```bash
# في الـ terminal:
npm run dev

# افتح التطبيق واختبر أي عملية تُرسل إشعار
```

### اختبر الأخطاء في Sentry:
```typescript
// أضف هذا في أي route للاختبار:
import { captureException } from "@/lib/sentry-init";

export async function GET() {
  try {
    throw new Error("Test error for Sentry");
  } catch (error) {
    captureException(error);
  }
  return Response.json({ test: "ok" });
}
```

### اذهب إلى Sentry Dashboard:
```
https://sentry.io/organizations/your-org/issues/
```
يجب تشوف الـ error اللي أنشأته 🎯

---

## 📋 Checklist نهائي

### Firebase:
- [ ] Firebase project أنشئ
- [ ] Service Account key حملت
- [ ] كل الـ 5 متغيرات على Railway

### Sentry:
- [ ] Sentry account أنشئ
- [ ] Project أنشئ (Next.js)
- [ ] DSN و Token على Railway

### الكود:
- [ ] `firebase-admin` و `@sentry/nextjs` مثبتة
- [ ] الملفات الثلاثة موجودة
- [ ] `initSentry()` في layout.tsx
- [ ] Deployed على Railway

### الاختبار:
- [ ] Deploy كمل بدون أخطاء
- [ ] الإشعارات تصل
- [ ] الأخطاء تظهر في Sentry

---

## 🆘 Troubleshooting

### الإشعارات لا تصل:
```
✓ تحقق من Firebase credentials على Railway
✓ اختبر الاتصال: npm run dev
✓ افتح browser console وشوف الأخطاء
```

### Sentry لا يسجل:
```
✓ تحقق من SENTRY_DSN على Railway
✓ تأكد من initSentry() في layout.tsx
✓ جرب خطأ تعمدي عشان تختبر
```

### Deploy يفشل:
```
✓ شوف الـ logs على Railway
✓ تأكد من كل المتغيرات موضوع
✓ اعادة deploy من الـ dashboard
```

---

## 🎉 خلاص!

كل شي جاهز الآن! 
- ✅ Firebase notifications
- ✅ Sentry error tracking
- ✅ Session replay
- ✅ Performance monitoring

**النتيجة:**
- تشوف الأخطاء فوراً
- تعرف متى حصلت مشكلة
- تتابع أداء التطبيق
- المستخدمين يستقبلون إشعارات فوراً

