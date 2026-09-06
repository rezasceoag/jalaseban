# انتشار جلسه‌بان روی Vercel

## وضعیت آماده‌سازی

- جدول و فضای فایل Supabase ساخته شده است.
- اتصال Supabase آزمایش شده است.
- کلید AvalAI و مدل‌های موردنیاز آزمایش شده‌اند.
- پروژه بدون خطای TypeScript و ESLint بیلد می‌شود.

## متغیرهای لازم در Vercel

در Vercel وارد مسیر **Project Settings → Environment Variables** شوید و متغیرهای زیر را اضافه کنید:

| نام | مقدار |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | آدرس پروژه Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable Key پروژه Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Key پروژه Supabase |
| `OPENAI_API_KEY` | کلید API سرویس AvalAI |
| `OPENAI_BASE_URL` | `https://api.avalai.ir/v1` |
| `OPENAI_TEXT_MODEL` | `gpt-5.6-luna` |
| `APP_PASSWORD` | رمز مشترک ورود به وب‌اپ |

هر متغیر را برای هر سه محیط **Production، Preview و Development** فعال کنید. سپس روی **Deploy** یا **Redeploy** بزنید.

## اولین آزمایش

1. آدرس وب‌اپ را باز کنید.
2. با رمز تعریف‌شده در `APP_PASSWORD` وارد شوید.
3. گزینه «جلسه جدید» را بزنید.
4. یک فایل صوتی فارسی ۳۰ تا ۶۰ ثانیه‌ای و کمتر از ۲۴ مگابایت انتخاب کنید.
5. موضوع و نام افراد حاضر را بنویسید و «ثبت و پردازش» را بزنید.
6. خلاصه، تصمیم‌ها، کارهای بعدی، متن کامل و تفکیک گویندگان را بررسی کنید.

بعد از موفقیت آزمایش کوتاه، یک فایل ۵ دقیقه‌ای و سپس جلسه طولانی‌تر را آزمایش کنید.
