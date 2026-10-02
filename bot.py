"""
Telegram Mini App Boti & Admin Statistikasi
Admin ID: 5466728043
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command
from aiogram.types import (
    WebAppInfo, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    FSInputFile
)

ADMIN_ID = 5466728043
BASE_DIR = os.path.dirname(__file__)
USERS_FILE = os.path.join(BASE_DIR, "users.json")
BANNER_PATH = os.path.join(BASE_DIR, "welcome_banner.jpg")

# .env faylidan tokenni o'qish
def get_bot_token():
    env_path = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("BOT_TOKEN="):
                    return line.strip().split("=", 1)[1]
    return os.getenv("BOT_TOKEN", "")

BOT_TOKEN = get_bot_token()
# Vercel'dagi domeningiz
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://todo-mini-app-mu.vercel.app")

# Foydalanuvchilar bazasini yuklash / saqlash
def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def save_user(user_id: int, user_info: dict):
    users = load_users()
    user_str_id = str(user_id)
    is_new = user_str_id not in users
    
    users[user_str_id] = {
        "first_name": user_info.get("first_name", ""),
        "username": user_info.get("username", ""),
        "joined_at": users.get(user_str_id, {}).get("joined_at", datetime.now().strftime("%Y-%m-%d %H:%M:%S")),
        "last_active": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
        
    return is_new, len(users)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Admin uchun maxsus menyu tugmasi
admin_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="📊 Hisobot")]
    ],
    resize_keyboard=True
)

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    user_info = {
        "first_name": message.from_user.first_name,
        "username": message.from_user.username or ""
    }
    
    # Bazaga yozish va yangi foydalanuvchini aniqlash
    is_new, total_users = save_user(user_id, user_info)
    
    # Katta qulay "Ilovani ochish" tugmasi
    inline_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Ilovani ochish (To-Do & AI)",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ]
    )
    
    caption_text = (
        f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 👋\n\n"
        "🎯 <b>Smart To-Do & AI</b> — kuningizni samarali rejalashtirish va "
        "sun'iy intellekt orqali tahlil qilish platformasiga xush kelibsiz!\n\n"
        "✨ <b>Asosiy imkoniyatlar:</b>\n"
        "• Kunlik vazifalar va vaqt (taymer) belgilash\n"
        "• Sun'iy intellekt (AI) murabbiy tahlili va motivatsiya\n"
        "• Kunlik seriya (streak) va o'sish statistikasi\n\n"
        "👇 <i>Boshlash uchun quyidagi tugmani bosing:</i>"
    )
    
    # Agar rasm mavjud bo'lsa, rasm bilan yuboramiz
    if os.path.exists(BANNER_PATH):
        try:
            photo = FSInputFile(BANNER_PATH)
            await message.answer_photo(
                photo=photo,
                caption=caption_text,
                parse_mode="HTML",
                reply_markup=inline_kb
            )
        except Exception:
            # Rasm yuborishda xatolik bo'lsa, oddiy matn qilib yuboriladi
            await message.answer(caption_text, parse_mode="HTML", reply_markup=inline_kb)
    else:
        await message.answer(caption_text, parse_mode="HTML", reply_markup=inline_kb)
        
    # Agar admin bo'lsa, pastdagi hisobot menyusini ham chiqarish
    if user_id == ADMIN_ID:
        await message.answer("Siz bot adminsiz. Pastdagi tugma orqali hisobotni ko'rishingiz mumkin:", reply_markup=admin_kb)
    
    # Agar yangi foydalanuvchi bo'lsa va bu admin bo'lmasa, adminga xabar boradi
    if is_new and user_id != ADMIN_ID:
        try:
            username_txt = f"(@{message.from_user.username})" if message.from_user.username else ""
            alert_text = (
                "🔔 <b>Yangi foydalanuvchi qo'shildi!</b>\n\n"
                f"👤 Ismi: {message.from_user.first_name} {username_txt}\n"
                f"🆔 ID: <code>{user_id}</code>\n\n"
                f"📈 <b>Jami foydalanuvchilar soni: {total_users} ta</b>"
            )
            await bot.send_message(chat_id=ADMIN_ID, text=alert_text, parse_mode="HTML")
        except Exception as e:
            logging.error(f"Adminga xabar yuborishda xatolik: {e}")

# Admin uchun "📊 Hisobot" tugmasi bosilganda
@dp.message(F.text == "📊 Hisobot")
@dp.message(Command("stats"))
async def show_stats(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        return
        
    users = load_users()
    total_users = len(users)
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_users = sum(1 for u in users.values() if u.get("joined_at", "").startswith(today_str))
    
    report_text = (
        "📊 <b>BOTNING UMUMIY HISOBOTI</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👥 <b>Jami foydalanuvchilar:</b> {total_users} ta\n"
        f"🆕 <b>Bugun qo'shilganlar:</b> {today_users} ta\n"
        f"🕒 <b>Sana:</b> {datetime.now().strftime('%d.%m.%Y %H:%M')}\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "<i>Har bir yangi odam kirganida sizga avtomatik bildirishnoma keladi.</i>"
    )
    await message.answer(report_text, parse_mode="HTML")

async def main():
    print("=" * 50)
    print("Bot muvaffaqiyatli ishga tushdi!")
    print(f"Admin ID: {ADMIN_ID}")
    print("Telegramda /start bosib tekshirishingiz mumkin.")
    print("=" * 50)
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
