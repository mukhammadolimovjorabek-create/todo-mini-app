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
    KeyboardButton
)

ADMIN_ID = 5466728043
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")

# .env faylidan tokenni o'qish
def get_bot_token():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("BOT_TOKEN="):
                    return line.strip().split("=", 1)[1]
    return os.getenv("BOT_TOKEN", "")

BOT_TOKEN = get_bot_token()
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://todo-mini-app-mu.vercel.app")

# Foydalanuvchilar bazasini yuklash / saqlash (oddiy va xavfsiz JSON fayl)
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

# Admin uchun maxsus Reply Keyboard (pastdagi tugma)
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
    
    # Inline Web App ochish tugmasi
    inline_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 To-Do & AI Appni ochish",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ]
    )
    
    # Foydalanuvchiga xush kelibsiz xabari
    # Agar admin bo'lsa, unga "📊 Hisobot" tugmasi ham beriladi
    reply_markup = admin_kb if user_id == ADMIN_ID else None
    
    await message.answer(
        f"Salom, {message.from_user.first_name}! 👋\n\n"
        "Shaxsiy rejalashtiruvchi va AI tahlilchi ilovangiz tayyor.\n"
        "Quyidagi tugmani bosib ochishingiz mumkin:",
        reply_markup=inline_kb
    )
    
    # Agar admin bo'lsa, pastki menyu tugmasini ham chiqarish
    if user_id == ADMIN_ID and reply_markup:
        await message.answer("Siz bot adminsiz. Quyidagi menyu orqali hisobotni ko'rishingiz mumkin:", reply_markup=reply_markup)
    
    # Agar yangi foydalanuvchi bo'lsa va bu siz bo'lmasangiz, faqat sizga (ADMIN) xabar boradi
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
    # Faqat sizga (ADMIN) ruxsat beriladi
    if message.from_user.id != ADMIN_ID:
        return
        
    users = load_users()
    total_users = len(users)
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Bugun qo'shilganlarni hisoblash
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
    print("Bot muvaffaqiyatli ishga tushdi! Admin ID:", ADMIN_ID)
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
