"""
Telegram Mini App Boti & To'liq Admin Statistikasi
Admin ID: 5466728043
"""

import os
import json
import asyncio
import logging
from datetime import datetime
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command, ChatMemberUpdatedFilter, KICKED, MEMBER
from aiogram.types import (
    WebAppInfo, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    FSInputFile,
    ChatMemberUpdated
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
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://todo-mini-app-eight.vercel.app")

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
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    current_data = users.get(user_str_id, {})
    
    users[user_str_id] = {
        "first_name": user_info.get("first_name", current_data.get("first_name", "")),
        "username": user_info.get("username", current_data.get("username", "")),
        "status": "active",  # active yoki left
        "joined_at": current_data.get("joined_at", now_str),
        "last_active": now_str
    }
    
    with open(USERS_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)
        
    return is_new, len(users)

def set_user_status(user_id: int, status: str):
    users = load_users()
    user_str_id = str(user_id)
    if user_str_id in users:
        users[user_str_id]["status"] = status
        users[user_str_id]["last_status_change"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# Admin uchun maxsus menyu tugmasi
admin_kb = ReplyKeyboardMarkup(
    keyboard=[
        [KeyboardButton(text="📊 Hisobot")]
    ],
    resize_keyboard=True
)

# 1. Foydalanuvchi botni bloklaganida yoki blokdan chiqarganida ushlaydigan handler
@dp.my_chat_member(ChatMemberUpdatedFilter(member_status_changed=KICKED))
async def user_blocked_bot(event: ChatMemberUpdated):
    user_id = event.from_user.id
    set_user_status(user_id, "left")
    
    # Adminga xabar berish
    try:
        username_txt = f"(@{event.from_user.username})" if event.from_user.username else ""
        text = (
            "🚪 <b>Foydalanuvchi botni to'xtatdi (blokladi):</b>\n"
            f"👤 Ismi: {event.from_user.first_name} {username_txt}\n"
            f"🆔 ID: <code>{user_id}</code>"
        )
        await bot.send_message(chat_id=ADMIN_ID, text=text, parse_mode="HTML")
    except Exception as e:
        logging.error(f"Adminga blok xabarini yuborishda xatolik: {e}")

@dp.my_chat_member(ChatMemberUpdatedFilter(member_status_changed=MEMBER))
async def user_unblocked_bot(event: ChatMemberUpdated):
    user_id = event.from_user.id
    set_user_status(user_id, "active")

# 2. /start bosilganda
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    user_info = {
        "first_name": message.from_user.first_name,
        "username": message.from_user.username or ""
    }
    
    # Bazaga yozish va yangi foydalanuvchini aniqlash
    is_new, total_visitors = save_user(user_id, user_info)
    
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
    
    # Rasm bilan yoki rasmsiz xabar yuborish
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
            await message.answer(caption_text, parse_mode="HTML", reply_markup=inline_kb)
    else:
        await message.answer(caption_text, parse_mode="HTML", reply_markup=inline_kb)
        
    # Agar admin bo'lsa, hisobot tugmasi chiqariladi
    if user_id == ADMIN_ID:
        await message.answer("Siz bot adminsiz. Pastdagi tugma orqali hisobotni ko'rishingiz mumkin:", reply_markup=admin_kb)
    
    # Agar yangi foydalanuvchi bo'lsa va bu admin bo'lmasa, adminga bildirishnoma boradi
    if is_new and user_id != ADMIN_ID:
        try:
            users = load_users()
            active_count = sum(1 for u in users.values() if u.get("status", "active") == "active")
            username_txt = f"(@{message.from_user.username})" if message.from_user.username else ""
            alert_text = (
                "🔔 <b>Yangi foydalanuvchi qo'shildi!</b>\n\n"
                f"👤 Ismi: {message.from_user.first_name} {username_txt}\n"
                f"🆔 ID: <code>{user_id}</code>\n\n"
                f"👥 <b>Hozirda foydalanuvchilar:</b> {active_count} ta\n"
                f"📈 <b>Jami tashrif buyurganlar:</b> {total_visitors} ta"
            )
            await bot.send_message(chat_id=ADMIN_ID, text=alert_text, parse_mode="HTML")
        except Exception as e:
            logging.error(f"Adminga xabar yuborishda xatolik: {e}")

# 3. Admin uchun "📊 Hisobot" tugmasi bosilganda
@dp.message(F.text == "📊 Hisobot")
@dp.message(Command("stats"))
async def show_stats(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        return
        
    users = load_users()
    total_visitors = len(users)
    today_str = datetime.now().strftime("%Y-%m-%d")
    
    # Hisob-kitoblar:
    # 1. Bugun qo'shilganlar
    today_new = sum(1 for u in users.values() if u.get("joined_at", "").startswith(today_str))
    
    # 2. Hozirda faol foydalanayotganlar
    active_users = sum(1 for u in users.values() if u.get("status", "active") == "active")
    
    # 3. Chiqib ketganlar (bloklaganlar)
    left_users = sum(1 for u in users.values() if u.get("status") == "left")
    
    report_text = (
        "📊 <b>BOTNING TO'LIQ HISOBOTI</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🆕 <b>Bugun qo'shilganlar:</b> {today_new} ta\n"
        f"👥 <b>Hozirda foydalanayotganlar:</b> {active_users} ta\n"
        f"🚪 <b>Chiqib ketganlar (bloklaganlar):</b> {left_users} ta\n"
        f"📈 <b>Shu paytgacha jami tashrif buyurganlar:</b> {total_visitors} ta\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"🕒 <i>Yangilangan vaqt: {datetime.now().strftime('%d.%m.%Y %H:%M')}</i>"
    )
    await message.answer(report_text, parse_mode="HTML")

async def main():
    print("=" * 50)
    print("Bot muvaffaqiyatli yangilandi va ishga tushdi!")
    print(f"Admin ID: {ADMIN_ID}")
    print("Admin menyusi: Hisobot")
    print("=" * 50)
    # my_chat_member hodisalarini qabul qilish uchun allowed_updates
    await dp.start_polling(bot, allowed_updates=["message", "chat_member", "my_chat_member"])

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
