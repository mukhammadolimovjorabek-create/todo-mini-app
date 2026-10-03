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
    new_data = {**current_data}
    new_data.update({
        "first_name": user_info.get("first_name", current_data.get("first_name", "")),
        "username": user_info.get("username", current_data.get("username", "")),
        "status": "active",  # active yoki left
        "joined_at": current_data.get("joined_at", now_str),
        "last_active": now_str
    })
    if "referred_by" in user_info and user_info["referred_by"]:
        new_data["referred_by"] = user_info["referred_by"]
        
    users[user_str_id] = new_data
    
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
    
    parts = (message.text or "").split()

    # ── Unlock / To'lov so'rovi (masalan: /start unlock) ──
    if len(parts) > 1 and parts[1].startswith("unlock"):
        save_user(user_id, user_info)
        username_txt = f"(@{message.from_user.username})" if message.from_user.username else "(username ko'rsatilmagan)"
        
        user_reply = (
            f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 👋\n\n"
            "🔒 <b>Sherik bilan suhbat bo'limi qulfini ochish</b>\n\n"
            "⚠️ Siz 10 ta shikoyat/dislike olganingiz sababli speaking bo'limi cheklangan.\n"
            "💰 Qulfni ochish to'lovi: <b>6,700 so'm</b>\n\n"
            "Admin tez orada sizga karta yoki telefon raqamini yuboradi. "
            "To'lov qilgach, to'lov chekini (skrinshot) shu yerga <b>rasm ko'rinishida</b> yuboring."
        )
        await message.answer(user_reply, parse_mode="HTML")

        admin_alert = (
            f"🚨 <b>BLOKLANGAN FOYDALANUVCHI TO'LOV QILMOQCHI!</b>\n\n"
            f"👤 <b>Ismi:</b> {message.from_user.first_name} {username_txt}\n"
            f"🆔 <b>ID:</b> <code>{user_id}</code>\n"
            f"⚠️ <b>Sabab:</b> 10 ta shikoyat/dislike to'plangan\n"
            f"💰 <b>To'lov summasi:</b> <b>6,700 so'm</b>\n\n"
            f"👇 <i>Ushbu xabarga <b>Javob (Reply)</b> qilib karta yoki telefon raqamingizni yuboring. Bot uni avtomatik tarzda ushbu foydalanuvchiga yetkazadi.</i>"
        )
        try:
            await bot.send_message(chat_id=ADMIN_ID, text=admin_alert, parse_mode="HTML")
        except Exception as e:
            logging.error(f"Adminga to'lov so'rovi yuborishda xatolik: {e}")
        return

    # Referral parametrini tekshirish (masalan: /start ref_5466728043)
    referrer_id = None
    if len(parts) > 1 and parts[1].startswith("ref_"):
        referrer_id = parts[1].replace("ref_", "").strip()
        user_info["referred_by"] = referrer_id

    # Bazaga yozish va yangi foydalanuvchini aniqlash
    is_new, total_visitors = save_user(user_id, user_info)
    
    app_url = f"{WEB_APP_URL}?ref={referrer_id}" if referrer_id else WEB_APP_URL

    # Katta qulay "Ilovani ochish" tugmasi
    inline_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Ilovani ochish (To-Do & AI)",
                    web_app=WebAppInfo(url=app_url)
                )
            ]
        ]
    )
    
    if referrer_id and is_new:
        caption_text = (
            f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 👋\n\n"
            "🎯 Sizni do'stingiz <b>Smart To-Do & AI</b> duel musobaqasiga taklif qildi!\n\n"
            "✨ <b>Musobaqa qoidalari:</b>\n"
            "• Kunlik rejalaringizni tuzing va bajaring\n"
            "• Har bir to'g'ri bajarilgan vazifa uchun ball oling\n"
            "• Do'stingiz bilan real vaqtda reytingda bellashing!\n\n"
            "👇 <i>Do'stingizga qarshi bellashish uchun ilovani oching:</i>"
        )
    else:
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
    
    # Agar taklif qiluvchi bo'lsa va bu yangi user bo'lsa, taklif qiluvchiga xushxabar yuboramiz
    if is_new and referrer_id and referrer_id.isdigit():
        try:
            ref_chat_id = int(referrer_id)
            inviter_text = (
                "🎉 <b>Ajoyib yangilik! 1-do'stingiz qo'shildi!</b>\n\n"
                f"👤 <b>{message.from_user.first_name}</b> sizning havolangiz orqali To-Do ilovasiga kirdi.\n"
                "🎁 Sizga musobaqa balingizga <b>+3 ball</b> berildi!\n"
                "Ilovadagi <b>Reyting</b> bo'limida do'stingiz bilan jonli duelni ko'rishingiz mumkin ⚔️"
            )
            await bot.send_message(chat_id=ref_chat_id, text=inviter_text, parse_mode="HTML")
        except Exception as e:
            logging.error(f"Referrerga xabar yuborishda xatolik: {e}")

    # Agar yangi foydalanuvchi bo'lsa va bu admin bo'lmasa, adminga bildirishnoma boradi
    if is_new and user_id != ADMIN_ID:
        try:
            users = load_users()
            active_count = sum(1 for u in users.values() if u.get("status", "active") == "active")
            username_txt = f"(@{message.from_user.username})" if message.from_user.username else ""
            alert_text = (
                "🔔 <b>Yangi foydalanuvchi qo'shildi!</b>\n\n"
                f"👤 Ismi: {message.from_user.first_name} {username_txt}\n"
                f"🆔 ID: <code>{user_id}</code>\n"
                f"🔗 Taklif qilgan: <code>{referrer_id or 'Organik'}</code>\n\n"
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

# 4. Admin buyrug'i: /unblock <user_id>
@dp.message(F.chat.id == ADMIN_ID, Command("unblock"))
async def cmd_manual_unblock(message: types.Message):
    parts = (message.text or "").split()
    if len(parts) < 2 or not parts[1].isdigit():
        await message.answer("Format: <code>/unblock 123456789</code>", parse_mode="HTML")
        return

    target_user_id = int(parts[1])
    users = load_users()
    if str(target_user_id) in users:
        users[str(target_user_id)]["dislikes"] = 0
        users[str(target_user_id)]["is_unblocked"] = True
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

    app_url = f"{WEB_APP_URL}?unblocked=1"
    user_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🚀 Ilovaga kirish", web_app=WebAppInfo(url=app_url))
            ]
        ]
    )

    try:
        await bot.send_message(
            chat_id=target_user_id,
            text=(
                "🎉 <b>Ajoyib yangilik! Qulfingiz admin tomonidan ochildi!</b>\n\n"
                "Sherik bilan suhbat bo'limidagi barcha cheklovlar olib tashlandi. "
                "Endi bemalol speaking mashqlarini davom ettirishingiz mumkin! 🚀"
            ),
            parse_mode="HTML",
            reply_markup=user_kb
        )
    except Exception as e:
        logging.error(f"Foydalanuvchiga ochilish xabarini yuborishda xatolik: {e}")

    await message.answer(f"✅ Foydalanuvchi {target_user_id} muvaffaqiyatli qulfdan chiqarildi!")

# 5. Admin qulflangan foydalanuvchi haqidagi xabarga javob (reply) yozganda karta/raqam yuborish
@dp.message(F.chat.id == ADMIN_ID, F.reply_to_message)
async def handle_admin_reply(message: types.Message):
    # Buyruqlarni e'tiborsiz qoldiramiz
    if not message.text or message.text.startswith("/"):
        return

    replied_text = message.reply_to_message.text or message.reply_to_message.caption or ""
    # Faqat bloklangan foydalanuvchi xabarlariga javob berilgandagina ishlaydi
    if "BLOKLANGAN FOYDALANUVCHI" not in replied_text:
        return

    import re
    match = re.search(r"ID:\s*(?:<code>)?(\d+)(?:</code>)?", replied_text)
    if not match:
        return

    target_user_id = int(match.group(1))
    payment_info = message.text

    user_text = (
        "💳 <b>Sherik bilan suhbat qulfini ochish uchun to'lov ma'lumotlari:</b>\n\n"
        f"<b>{payment_info}</b>\n\n"
        "💰 To'lov summasi: <b>6,700 so'm</b>\n"
        "📸 <i>Iltimos, to'lovni amalga oshirgach, to'lov chekini (skrinshot) shu botga rasm ko'rinishida yuboring.</i>"
    )

    try:
        await bot.send_message(chat_id=target_user_id, text=user_text, parse_mode="HTML")
        await message.reply(
            f"✅ <b>Karta/telefon ma'lumotlari foydalanuvchiga yuborildi!</b>\n"
            f"🆔 Foydalanuvchi ID: <code>{target_user_id}</code>\n"
            "Chek yuborilgach, darhol sizga ko'rsatiladi.",
            parse_mode="HTML"
        )
    except Exception as e:
        await message.reply(f"❌ Foydalanuvchiga xabar yetkazishda xatolik: {e}")

# 6. Foydalanuvchi to'lov chekini (rasm) yuborganida
@dp.message(F.photo, F.chat.id != ADMIN_ID)
async def handle_user_check_photo(message: types.Message):
    user_id = message.from_user.id
    user_name = message.from_user.first_name
    username = f"(@{message.from_user.username})" if message.from_user.username else ""

    caption = (
        "🧾 <b>YANGI TO'LOV CHEKI KELDI!</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        f"👤 Foydalanuvchi: <b>{user_name}</b> {username}\n"
        f"🆔 ID: <code>{user_id}</code>\n"
        "💰 Kutilgan summa: <b>6,700 so'm</b>\n"
        "━━━━━━━━━━━━━━━━━━━━━━\n"
        "<i>Chekni tekshirib, quyidagi tugma orqali qulfni ochishingiz mumkin:</i>"
    )

    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Qulfni ochish (Dostup berish)",
                    callback_data=f"unblock:{user_id}"
                )
            ]
        ]
    )

    try:
        await bot.send_photo(
            chat_id=ADMIN_ID,
            photo=message.photo[-1].file_id,
            caption=caption,
            parse_mode="HTML",
            reply_markup=kb
        )
        await message.answer(
            "✅ <b>Chekingiz adminga yetkazildi!</b>\n\n"
            "To'lov tekshirilib tasdiqlangach, bot darhol sizga xabar beradi va ilovadagi qulf ochiladi.",
            parse_mode="HTML"
        )
    except Exception as e:
        logging.error(f"Chekni adminga yuborishda xatolik: {e}")

# 7. Admin «✅ Qulfni ochish» tugmasini bosganda
@dp.callback_query(F.data.startswith("unblock:"))
async def handle_unblock_callback(callback: types.CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        await callback.answer("Faqat admin uchun!", show_alert=True)
        return

    target_user_id = int(callback.data.split(":")[1])

    users = load_users()
    if str(target_user_id) in users:
        users[str(target_user_id)]["dislikes"] = 0
        users[str(target_user_id)]["is_unblocked"] = True
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)

    success_text = (
        "🎉 <b>Ajoyib yangilik! To'lovingiz tasdiqlandi!</b>\n\n"
        "Sherik bilan suhbat bo'limidagi barcha cheklovlar olib tashlandi va qulf ochildi. "
        "Endi bemalol speaking mashqlarini davom ettirishingiz mumkin! 🚀"
    )
    app_url = f"{WEB_APP_URL}?unblocked=1"
    user_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🚀 Ilovaga kirish", web_app=WebAppInfo(url=app_url))
            ]
        ]
    )

    try:
        await bot.send_message(chat_id=target_user_id, text=success_text, parse_mode="HTML", reply_markup=user_kb)
    except Exception as e:
        logging.error(f"Foydalanuvchiga ochilish xabarini yuborishda xatolik: {e}")

    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.reply(f"✅ <b>Foydalanuvchi (ID: {target_user_id}) qulfdan chiqarildi va dostup berildi!</b>", parse_mode="HTML")
    await callback.answer("Qulf muvaffaqiyatli ochildi!")

async def main():
    print("=" * 50)
    print("Bot muvaffaqiyatli yangilandi va ishga tushdi!")
    print(f"Admin ID: {ADMIN_ID}")
    print("Admin menyusi: Hisobot")
    print("=" * 50)
    # my_chat_member va callback_query hodisalarini qabul qilish uchun allowed_updates
    await dp.start_polling(bot, allowed_updates=["message", "chat_member", "my_chat_member", "callback_query"])

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
