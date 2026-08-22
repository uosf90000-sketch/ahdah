# دليل الإشعارات والمراقبة - عهدتك

## 🔔 نظام الإشعارات (Push Notifications)

### المكونات:

#### 1. Firebase Admin SDK (`src/lib/firebase-admin.ts`)
```typescript
- sendPushNotification()      // إرسال لجهاز واحد
- sendMulticastNotification() // إرسال لعدة أجهزة
- subscribeToTopic()          // الاشتراك في موضوع
- unsubscribeFromTopic()      // إلغاء الاشتراك
```

#### 2. Notifications Service (`src/lib/notifications.ts`)
```typescript
notifyShipmentCreated()       // عند إنشاء عُهدة
notifyOfferReceived()          // عند استقبال عرض
notifyOfferAccepted()          // عند قبول عرض
notifyMessageReceived()        // عند استقبال رسالة
notifyDeliveryReady()          // عند جاهزية التسليم
notifyDeliveryCompleted()      // عند إكمال التسليم
notifyRatingReceived()         // عند استقبال تقييم
```

### الاستخدام:

```typescript
import { notifyOfferAccepted } from "@/lib/notifications";

// في server action
export async function acceptOfferAction(shipmentId: string, travelerId: string) {
  // ... قبول العرض
  await notifyOfferAccepted(shipmentId, travelerId);
}
```

### متطلبات Firebase:

```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_key_id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
```

**الحصول عليها:**
1. اذهب إلى [Firebase Console](https://console.firebase.google.com)
2. اختر المشروع
3. Project Settings → Service Accounts
4. اضغط "Generate New Private Key"
5. انسخ البيانات

---

## 📊 نظام المراقبة (Monitoring)

### المكونات:

#### 1. Sentry Init (`src/lib/sentry-init.ts`)
```typescript
initSentry()              // تهيئة Sentry
captureException()        // تسجيل الأخطاء
captureMessage()          // تسجيل رسائل
```

#### 2. Session Replay
- تسجيل تلقائي لـ 10% من الجلسات
- تسجيل 100% من الجلسات التي تحتوي على خطأ
- تشفير البيانات الحساسة

#### 3. Performance Monitoring
- تتبع صفحات الويب البطيئة
- تتبع API calls
- تتبع استهلاك الذاكرة

### الاستخدام:

```typescript
import { captureException, captureMessage } from "@/lib/sentry-init";

// تسجيل خطأ
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    context: "operation_name",
    userId: user.id,
  });
}

// تسجيل رسالة
captureMessage("User initiated payment", "info");
captureMessage("Payment processing slow", "warning");
```

### متطلبات Sentry:

```env
SENTRY_DSN=https://your-key@sentry.io/your-project
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=ahdah
```

**الحصول عليها:**
1. اذهب إلى [Sentry.io](https://sentry.io)
2. أنشئ حساب مجاني
3. أنشئ project جديد (Next.js)
4. انسخ DSN من الإعدادات

---

## 🚀 خطوات التفعيل على Railway

### 1. Firebase Setup:

```bash
# اذهب إلى Railway Dashboard
# اختر الـ project
# اضغط Variables
# أضف:
```

```
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=xxx
```

### 2. Sentry Setup:

```
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=ahdah
```

### 3. تثبيت Dependencies:

```bash
npm install firebase-admin @sentry/nextjs
```

### 4. تفعيل في التطبيق:

```typescript
// src/app/layout.tsx
import { initSentry } from "@/lib/sentry-init";

// في server component
if (typeof window === "undefined") {
  initSentry();
}
```

---

## 📈 لوحة التحكم

### Sentry Dashboard:
```
https://sentry.io/organizations/your-org/issues/
```

**تشوف:**
- عدد الأخطاء
- المستخدمين المتأثرين
- Stack trace (وين الخطأ)
- Session replay (إعادة الجلسة)
- Performance metrics

### Firebase Console:
```
https://console.firebase.google.com/project/your-project/messaging
```

**تشوف:**
- عدد الإشعارات المرسلة
- معدل الإيصال
- الأجهزة المنسوبة

---

## 🔍 أمثلة عملية

### مثال 1: تسجيل خطأ في قاعدة البيانات

```typescript
// src/app/api/shipments/route.ts
import { captureException } from "@/lib/sentry-init";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const shipment = await db.shipment.create({ data });
    return Response.json(shipment);
  } catch (error) {
    captureException(error, {
      endpoint: "/api/shipments",
      method: "POST",
    });
    return Response.json({ error: "Failed to create shipment" }, { status: 500 });
  }
}
```

### مثال 2: إرسال إشعار عند قبول عرض

```typescript
// src/app/actions.ts
import { notifyOfferAccepted } from "@/lib/notifications";

export async function acceptOfferAction(formData: FormData) {
  const shipmentId = formData.get("shipmentId") as string;
  const travelerId = (await getCurrentUser()).id;

  try {
    await db.shipment.update({
      where: { id: shipmentId },
      data: { status: "TRAVELER_ACCEPTED" },
    });

    // ✅ إرسال إشعار تلقائي
    await notifyOfferAccepted(shipmentId, travelerId);

    revalidatePath(`/shipments/${shipmentId}`);
  } catch (error) {
    captureException(error);
    throw error;
  }
}
```

### مثال 3: تسجيل أحداث مهمة

```typescript
// عند تسجيل مستخدم جديد
import { captureMessage } from "@/lib/sentry-init";

export async function registerAction(formData: FormData) {
  // ... إنشاء المستخدم
  
  captureMessage(`New user registered: ${email}`, "info");
}

// عند دفع ناجح
captureMessage(`Payment successful: ${amount} SAR`, "info");

// عند مشكلة أداء
captureMessage("Database query slow: 5s+", "warning");
```

---

## ⚙️ Configuration متقدمة

### تصفية الأخطاء غير المهمة:

```typescript
// في Sentry init
beforeSend(event) {
  // تجاهل أخطاء معينة
  if (event.exception?.values?.[0]?.type === "NetworkError") {
    return null;
  }
  return event;
}
```

### تحديد جودة البيانات:

```typescript
// إرسال 10% من الأخطاء في production
// و100% في development
tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
```

### حماية الخصوصية:

```typescript
// إخفاء النصوص في Session Replay
maskAllText: true,

// إخفاء الصور
blockAllMedia: true,
```

---

## ✅ قائمة الفحص

- [ ] Firebase project أنشئ
- [ ] Firebase credentials على Railway
- [ ] Sentry account أنشئ
- [ ] Sentry DSN على Railway
- [ ] `npm install firebase-admin @sentry/nextjs`
- [ ] initSentry() في layout.tsx
- [ ] اختبر الإشعارات
- [ ] اختبر تسجيل الأخطاء
- [ ] تفعيل Alerts في Sentry

---

## 🐛 استكشاف الأخطاء

| المشكلة | الحل |
|--------|------|
| الإشعارات لا تصل | تحقق من Firebase credentials |
| Sentry لا يسجل الأخطاء | تحقق من SENTRY_DSN |
| أخطاء كثيرة في Sentry | قلل tracesSampleRate |

---

## 📚 موارد إضافية

- [Firebase Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Session Replay Guide](https://docs.sentry.io/product/session-replay/)

