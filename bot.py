import os
import json
import asyncio
import logging
import asyncpg
from datetime import datetime
from dotenv import load_dotenv
from aiohttp import web, ClientSession
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart, Command, ChatMemberUpdatedFilter, KICKED, MEMBER
from aiogram.exceptions import TelegramBadRequest, TelegramForbiddenError, TelegramRetryAfter
from aiogram.types import (
    WebAppInfo, 
    InlineKeyboardMarkup, 
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    FSInputFile,
    ChatMemberUpdated
)
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

# Configuration
ADMIN_ID = 5466728043
BASE_DIR = os.path.dirname(__file__)
USERS_FILE = os.path.join(BASE_DIR, "users.json")
BANNER_PATH = os.path.join(BASE_DIR, "welcome_banner.jpg")

# Load environment variables
load_dotenv(os.path.join(BASE_DIR, ".env"))

def get_bot_token():
    env_token = os.getenv("BOT_TOKEN", "")
    if env_token:
        return env_token
    env_path = os.path.join(BASE_DIR, ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("BOT_TOKEN="):
                    return line.strip().split("=", 1)[1]
    return ""

BOT_TOKEN = get_bot_token()
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://todo-mini-app-eight.vercel.app")
DATABASE_URL = os.getenv("DATABASE_URL")
RENDER_EXTERNAL_URL = os.getenv("RENDER_EXTERNAL_URL")
WEBHOOK_URL = os.getenv("WEBHOOK_URL") or RENDER_EXTERNAL_URL
PORT = int(os.getenv("PORT", 8000))

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
db_pool = None

# Admin menu
admin_kb = ReplyKeyboardMarkup(
    keyboard=[[KeyboardButton(text="📊 Hisobot")]],
    resize_keyboard=True
)

# ----------------- DATABASE ABSTRACTION -----------------
async def init_db():
    global db_pool
    if DATABASE_URL:
        db_pool = await asyncpg.create_pool(DATABASE_URL, statement_cache_size=0)
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id BIGINT PRIMARY KEY,
                    first_name TEXT,
                    username TEXT,
                    status TEXT,
                    joined_at TIMESTAMP,
                    last_active TIMESTAMP,
                    referred_by TEXT,
                    likes INT DEFAULT 0,
                    dislikes INT DEFAULT 0,
                    is_unblocked BOOLEAN DEFAULT FALSE
                );
                ALTER TABLE users ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS dislikes INT DEFAULT 0;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS is_unblocked BOOLEAN DEFAULT FALSE;
                ALTER TABLE users ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE;
            """)
        logging.info("Connected to PostgreSQL Database.")
    else:
        logging.info("No DATABASE_URL found. Falling back to users.json.")

users_file_lock = asyncio.Lock()

async def read_users_file():
    async with users_file_lock:
        if os.path.exists(USERS_FILE):
            try:
                with open(USERS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

async def write_users_file(users: dict):
    async with users_file_lock:
        try:
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(users, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logging.error(f"Faylga yozishda xatolik: {e}")

async def load_users():
    if db_pool:
        users_dict = {}
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("SELECT * FROM users")
            for row in rows:
                users_dict[str(row['user_id'])] = { 'is_accepted': row.get('is_accepted', False),
                    "first_name": row['first_name'],
                    "username": row['username'],
                    "status": row['status'],
                    "joined_at": row['joined_at'].strftime("%Y-%m-%d %H:%M:%S") if row['joined_at'] else "",
                    "last_active": row['last_active'].strftime("%Y-%m-%d %H:%M:%S") if row['last_active'] else "",
                    "referred_by": row['referred_by'],
                    "likes": row['likes'] if 'likes' in row else 0,
                    "dislikes": row['dislikes'],
                    "is_unblocked": row['is_unblocked']
                }
        return users_dict
    else:
        return await read_users_file()

async def save_user(user_id: int, user_info: dict):
    user_str_id = str(user_id)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    now_dt = datetime.now()

    if db_pool:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM users WHERE user_id = $1", user_id)
            is_new = row is None
            if is_new:
                await conn.execute("""
                    INSERT INTO users (user_id, first_name, username, status, joined_at, last_active, referred_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                """, user_id, user_info.get("first_name", ""), user_info.get("username", ""), "active", now_dt, now_dt, user_info.get("referred_by"))
            else:
                await conn.execute("""
                    UPDATE users SET first_name=$1, username=$2, status=$3, last_active=$4 WHERE user_id=$5
                """, user_info.get("first_name", row['first_name']), user_info.get("username", row['username']), "active", now_dt, user_id)
            
            total_visitors = await conn.fetchval("SELECT COUNT(*) FROM users")
            return is_new, total_visitors
    else:
        users = await load_users()
        is_new = user_str_id not in users
        
        current_data = users.get(user_str_id, {})
        new_data = {**current_data}
        new_data.update({
            "first_name": user_info.get("first_name", current_data.get("first_name", "")),
            "username": user_info.get("username", current_data.get("username", "")),
            "status": "active",
            "joined_at": current_data.get("joined_at", now_str),
            "last_active": now_str
        })
        if "referred_by" in user_info and user_info["referred_by"]:
            new_data["referred_by"] = user_info["referred_by"]
            
        users[user_str_id] = new_data
        
        await write_users_file(users)
            
        return is_new, len(users)

async def set_user_status(user_id: int, status: str):
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("UPDATE users SET status = $1, last_active = $2 WHERE user_id = $3", status, datetime.now(), user_id)
    else:
        users = await load_users()
        user_str_id = str(user_id)
        if user_str_id in users:
            users[user_str_id]["status"] = status
            await write_users_file(users)

async def unblock_user_db(user_id: int):
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("UPDATE users SET dislikes = 0, is_unblocked = TRUE WHERE user_id = $1", user_id)
    else:
        users = await load_users()
        user_str_id = str(user_id)
        if user_str_id in users:
            users[user_str_id]["dislikes"] = 0
            users[user_str_id]["is_unblocked"] = True
            await write_users_file(users)

# ----------------- HANDLERS -----------------
@dp.my_chat_member(ChatMemberUpdatedFilter(member_status_changed=KICKED))
async def user_blocked_bot(event: ChatMemberUpdated):
    user_id = event.from_user.id
    await set_user_status(user_id, "left")
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
    await set_user_status(user_id, "active")

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    user_id = message.from_user.id
    user_info = {
        "first_name": message.from_user.first_name,
        "username": message.from_user.username or ""
    }
    
    parts = (message.text or "").split()

    if len(parts) > 1 and parts[1].startswith("unlock"):
        await save_user(user_id, user_info)
        user_reply = (
            f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 👋\n\n"
            "✅ <b>Sizning hisobingiz to'liq faol!</b>\n\n"
            "Barcha bo'limlar, jumladan Jonli Speaking Hamkori bo'limi hech qanday to'lovlarsiz ochiq."
        )
        await message.answer(user_reply, parse_mode="HTML")

    referrer_id = None
    if len(parts) > 1 and parts[1].startswith("ref_"):
        raw_ref = parts[1].replace("ref_", "").strip()
        if raw_ref.isdigit():
            referrer_id = raw_ref
        
    is_new, total_visitors = await save_user(user_id, user_info)
    
    if referrer_id and db_pool:
        try:
            async with db_pool.acquire() as conn:
                inviter = await conn.fetchrow("SELECT first_name FROM users WHERE user_id = $1", int(referrer_id))
                inviter_name = inviter['first_name'] if inviter else "Do'stingiz"
            
            kb = InlineKeyboardMarkup(inline_keyboard=[
                [InlineKeyboardButton(text="✅ Ha, qabul qilaman", callback_data=f"accept_ref:{referrer_id}")],
                [InlineKeyboardButton(text="❌ Yo'q", callback_data="decline_ref")]
            ])
            await message.answer(f"{inviter_name} sizni do'stlar qatoriga va musobaqalashishga chaqiryapti. Qabul qilasizmi?", reply_markup=kb)
        except Exception as e:
            logging.error(f"Referrer tekshirishda xatolik: {e}")

    app_url = f"{WEB_APP_URL}?ref={referrer_id}" if referrer_id else WEB_APP_URL

    inline_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🚀 Ilovani ochish (Mini App)", web_app=WebAppInfo(url=app_url))]]
    )
    
    caption_text = (
        f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 👋\n\n"
        "🌟 <b>StudyMate</b> — IELTS, Multilevel (CEFR) va Smart To-Do platformasiga xush kelibsiz!\n\n"
        "Bitta ilovada barcha imkoniyatlar:\n"
        "📋 <b>Smart To-Do & Odatlar</b> — kunlik vazifalar, streak va tangalar\n"
        "🎙️ <b>Jonli Speaking Hamkori</b> — real vaqtda audio muloqot va mavzular (Part 1, 2, 3)\n"
        "🎓 <b>IELTS & Milliy Multilevel (CEFR)</b> — to'liq mock testlar, reading va writing\n"
        "🏆 <b>Do'stlar Musobaqasi</b> — do'stlaringiz bilan duel va reyting\n\n"
        "👇 <i>Boshlash uchun quyidagi tugmani bosing:</i>"
    )
    
    if os.path.exists(BANNER_PATH):
        try:
            await message.answer_photo(photo=FSInputFile(BANNER_PATH), caption=caption_text, parse_mode="HTML", reply_markup=inline_kb)
        except Exception:
            await message.answer(caption_text, parse_mode="HTML", reply_markup=inline_kb)
    else:
        await message.answer(caption_text, parse_mode="HTML", reply_markup=inline_kb)
        
    if user_id == ADMIN_ID:
        await message.answer("Siz bot adminsiz. Pastdagi tugma orqali hisobotni ko'rishingiz mumkin:", reply_markup=admin_kb)
    
    if is_new and referrer_id and referrer_id.isdigit():
        try:
            inviter_text = f"🎉 <b>Ajoyib yangilik! {message.from_user.first_name}</b> sizning havolangiz orqali qo'shildi!"
            await bot.send_message(chat_id=int(referrer_id), text=inviter_text, parse_mode="HTML")
        except Exception:
            pass

    if is_new and user_id != ADMIN_ID:
        try:
            users = await load_users()
            active_count = sum(1 for u in users.values() if u.get("status", "active") == "active")
            alert_text = (
                "🔔 <b>Yangi foydalanuvchi!</b>\n"
                f"👤 {message.from_user.first_name}\n🆔 <code>{user_id}</code>\n"
                f"👥 Faol: {active_count}\n📈 Jami: {total_visitors}"
            )
            await bot.send_message(chat_id=ADMIN_ID, text=alert_text, parse_mode="HTML")
        except Exception:
            pass

@dp.message(F.text == "📊 Hisobot")
@dp.message(Command("stats"))
async def show_stats(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        await message.answer("📊 Ushbu hisobot faqat bot administratori uchun mo'ljallangan.")
        return
    users = await load_users()
    total_visitors = len(users)
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_new = sum(1 for u in users.values() if str(u.get("joined_at", "")).startswith(today_str))
    active_users = sum(1 for u in users.values() if u.get("status", "active") == "active")
    left_users = sum(1 for u in users.values() if u.get("status") == "left")
    
    report_text = (
        "📊 <b>BOT HISOBOTI</b>\n\n"
        f"🆕 <b>Bugun:</b> {today_new}\n"
        f"👥 <b>Faol:</b> {active_users}\n"
        f"🚪 <b>Chiqib ketganlar:</b> {left_users}\n"
        f"📈 <b>Jami:</b> {total_visitors}"
    )
    await message.answer(report_text, parse_mode="HTML")

@dp.message(F.chat.id == ADMIN_ID, Command("unblock"))
async def cmd_manual_unblock(message: types.Message):
    parts = (message.text or "").split()
    if len(parts) < 2 or not parts[1].isdigit():
        await message.answer("Format: <code>/unblock 123456789</code>", parse_mode="HTML")
        return
    target = int(parts[1])
    await unblock_user_db(target)
    app_url = f"{WEB_APP_URL}?unblocked=1"
    user_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🚀 Ilovaga kirish", web_app=WebAppInfo(url=app_url))]])
    try:
        await bot.send_message(chat_id=target, text="🎉 <b>Qulfingiz ochildi!</b>", parse_mode="HTML", reply_markup=user_kb)
    except Exception:
        pass
    await message.answer(f"✅ {target} qulfdan chiqarildi!")

# ----------------- ADMIN XABARLARNI TOZALASH FUNKSIYALARI -----------------
async def delete_message_for_all(message_ids: list[int]):
    """Barcha ma'lumotlar bazasidagi foydalanuvchilar chatidan berilgan xabarlarni o'chiradi."""
    users = await load_users()
    deleted_count = 0
    
    all_chat_ids = set([int(uid) for uid in users.keys() if str(uid).isdigit()] + [ADMIN_ID])
    
    for chat_id in all_chat_ids:
        for msg_id in message_ids:
            try:
                await bot.delete_message(chat_id=chat_id, message_id=msg_id)
                deleted_count += 1
            except TelegramRetryAfter as e:
                await asyncio.sleep(e.retry_after + 0.1)
                try:
                    await bot.delete_message(chat_id=chat_id, message_id=msg_id)
                    deleted_count += 1
                except Exception:
                    pass
            except (TelegramBadRequest, TelegramForbiddenError):
                pass
            except Exception as e:
                logging.debug(f"Xabar o'chirishda xatolik ({chat_id}, {msg_id}): {e}")
            await asyncio.sleep(0.02)
            
    return deleted_count, len(all_chat_ids)

@dp.message(F.chat.id == ADMIN_ID, Command("del", "delete"))
async def cmd_admin_delete(message: types.Message):
    target_ids = []
    
    # 1. Agar xabarga javob (reply) qilib yozilgan bo'lsa
    if message.reply_to_message:
        target_ids.append(message.reply_to_message.message_id)
        
    # 2. Agar parametr sifatida ID berilgan bo'lsa: /del 1234
    parts = (message.text or "").split()[1:]
    for p in parts:
        if p.isdigit():
            target_ids.append(int(p))
            
    if not target_ids:
        help_text = (
            "🗑 <b>XABARLARNI BARCHA CHATLARDAN O'CHIRISH:</b>\n\n"
            "1️⃣ <b>Reply orqali:</b> O'chirmoqchi bo'lgan xabarga <b>Javob (Reply)</b> qilib <code>/del</code> deb yozing.\n"
            "2️⃣ <b>ID orqali:</b> <code>/del 1234</code>\n"
            "3️⃣ <b>Oraliq bo'yicha:</b> <code>/del_range 1000 1020</code>\n"
            "4️⃣ <b>Oxirgi N ta xabarni tozalash:</b> <code>/del_last 3</code>"
        )
        await message.answer(help_text, parse_mode="HTML")
        return
        
    status_msg = await message.answer(f"⏳ {len(target_ids)} ta xabar barcha chatlardan o'chirilmoqda...")
    deleted_count, chats_count = await delete_message_for_all(target_ids)
    
    try:
        await bot.delete_message(chat_id=ADMIN_ID, message_id=status_msg.message_id)
        await bot.delete_message(chat_id=ADMIN_ID, message_id=message.message_id)
    except Exception:
        pass
        
    report = (
        "✅ <b>XABARLAR TOZALANDI!</b>\n\n"
        f"🗑 <b>O'chirilgan xabarlar:</b> {deleted_count} ta\n"
        f"👥 <b>Tekshirilgan foydalanuvchilar:</b> {chats_count} ta chat"
    )
    await bot.send_message(chat_id=ADMIN_ID, text=report, parse_mode="HTML")

@dp.message(F.chat.id == ADMIN_ID, Command("del_range"))
async def cmd_admin_delete_range(message: types.Message):
    parts = (message.text or "").split()
    if len(parts) < 3 or not parts[1].isdigit() or not parts[2].isdigit():
        await message.answer("Format: <code>/del_range 1050 1070</code>", parse_mode="HTML")
        return
        
    start_id = int(parts[1])
    end_id = int(parts[2])
    if start_id > end_id:
        start_id, end_id = end_id, start_id
        
    if end_id - start_id > 100:
        await message.answer("⚠️ Bir vaqtning o'zida maksimal 100 ta xabarni tozalash mumkin.")
        return
        
    msg_ids = list(range(start_id, end_id + 1))
    status_msg = await message.answer(f"⏳ {start_id} dan {end_id} gacha bo'lgan {len(msg_ids)} ta xabar barcha chatlardan o'chirilmoqda...")
    deleted_count, chats_count = await delete_message_for_all(msg_ids)
    
    try:
        await bot.delete_message(chat_id=ADMIN_ID, message_id=status_msg.message_id)
    except Exception:
        pass
        
    report = (
        "✅ <b>Oraliqdagi xabarlar tozalandi!</b>\n\n"
        f"🔢 <b>Oraliq:</b> {start_id} — {end_id}\n"
        f"🗑 <b>O'chirildi:</b> {deleted_count} ta\n"
        f"👥 <b>Chatlar:</b> {chats_count} ta"
    )
    await message.answer(report, parse_mode="HTML")

@dp.message(F.chat.id == ADMIN_ID, Command("del_last"))
async def cmd_admin_delete_last(message: types.Message):
    parts = (message.text or "").split()
    count = 1
    if len(parts) > 1 and parts[1].isdigit():
        count = min(int(parts[1]), 20)
        
    current_id = message.message_id
    msg_ids = [current_id - i for i in range(1, count + 1)]
    status_msg = await message.answer(f"⏳ Oxirgi {count} ta xabar barcha chatlardan o'chirilmoqda...")
    deleted_count, chats_count = await delete_message_for_all(msg_ids)
    
    try:
        await bot.delete_message(chat_id=ADMIN_ID, message_id=status_msg.message_id)
        await bot.delete_message(chat_id=ADMIN_ID, message_id=message.message_id)
    except Exception:
        pass
        
    report = (
        f"✅ <b>Oxirgi {count} ta xabar tozalandi!</b>\n\n"
        f"🗑 <b>O'chirildi:</b> {deleted_count} ta\n"
        f"👥 <b>Chatlar:</b> {chats_count} ta"
    )
    await bot.send_message(chat_id=ADMIN_ID, text=report, parse_mode="HTML")


@dp.message(F.chat.id == ADMIN_ID, F.reply_to_message)
async def handle_admin_reply(message: types.Message):
    if not message.text or message.text.startswith("/"):
        return
    replied_text = message.reply_to_message.text or message.reply_to_message.caption or ""
    if "BLOKLANGAN FOYDALANUVCHI" not in replied_text:
        return
    import re
    match = re.search(r"ID:\s*(?:<code>)?(\d+)(?:</code>)?", replied_text)
    if not match:
        return
    target = int(match.group(1))
    user_text = (
        "💳 <b>To'lov ma'lumotlari:</b>\n\n"
        f"<b>{message.text}</b>\n\n"
        "💰 Summa: <b>6,700 so'm</b>\n"
        "📸 <i>To'lov chekini rasm qilib shu yerga tashlang.</i>"
    )
    try:
        await bot.send_message(chat_id=target, text=user_text, parse_mode="HTML")
        await message.reply(f"✅ Ma'lumotlar foydalanuvchiga ketdi! (ID: {target})", parse_mode="HTML")
    except Exception as e:
        await message.reply(f"❌ Xatolik: {e}")

@dp.message(F.photo, F.chat.id != ADMIN_ID)
async def handle_user_check_photo(message: types.Message):
    user_id = message.from_user.id
    caption = (
        "🧾 <b>YANGI TO'LOV CHEKI!</b>\n"
        f"👤 <b>{message.from_user.first_name}</b>\n"
        f"🆔 <code>{user_id}</code>\n"
        "<i>Chekni tekshirib qulfni ochishingiz mumkin:</i>"
    )
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="✅ Qulfni ochish", callback_data=f"unblock:{user_id}")]])
    try:
        await bot.send_photo(chat_id=ADMIN_ID, photo=message.photo[-1].file_id, caption=caption, parse_mode="HTML", reply_markup=kb)
        await message.answer("✅ <b>Chekingiz adminga yetkazildi!</b>", parse_mode="HTML")
    except Exception:
        pass

@dp.callback_query(F.data.startswith("unblock:"))
async def handle_unblock_callback(callback: types.CallbackQuery):
    if callback.from_user.id != ADMIN_ID:
        return
    target = int(callback.data.split(":")[1])
    await unblock_user_db(target)
    app_url = f"{WEB_APP_URL}?unblocked=1"
    user_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🚀 Ilovaga kirish", web_app=WebAppInfo(url=app_url))]])
    try:
        await bot.send_message(chat_id=target, text="🎉 <b>To'lov tasdiqlandi va qulf ochildi!</b>", parse_mode="HTML", reply_markup=user_kb)
    except Exception:
        pass
    await callback.message.edit_reply_markup(reply_markup=None)
    await callback.message.reply(f"✅ <b>Foydalanuvchi qulfdan chiqarildi!</b>", parse_mode="HTML")
    await callback.answer("Qulf ochildi!")

@dp.callback_query(F.data.startswith("accept_ref:"))
async def handle_accept_ref(callback: types.CallbackQuery):
    user_id = callback.from_user.id
    ref_parts = callback.data.split(":")
    if len(ref_parts) < 2 or not ref_parts[1].isdigit():
        await callback.answer("Taklif topilmadi.", show_alert=True)
        return
        
    inviter_id = int(ref_parts[1])
    
    # 1. Update DB or users.json
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("UPDATE users SET referred_by = $1, is_accepted = TRUE WHERE user_id = $2", str(inviter_id), user_id)
    else:
        users = await load_users()
        user_str = str(user_id)
        if user_str in users:
            users[user_str]["referred_by"] = str(inviter_id)
            users[user_str]["is_accepted"] = True
            await write_users_file(users)
                
    # 2. Xabar berish: taklif qilganga
    try:
        inviter_text = f"🎉 <b>{callback.from_user.first_name}</b> sizning do'stlik taklifingizni qabul qildi va do'stlaringiz safiga qo'shildi!"
        await bot.send_message(chat_id=inviter_id, text=inviter_text, parse_mode="HTML")
    except Exception:
        pass
        
    app_url = f"{WEB_APP_URL}?ref={inviter_id}"
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🚀 Ilovaga kirish", web_app=WebAppInfo(url=app_url))]])
    
    await callback.message.edit_text("✅ <b>Do'stlik taklifi qabul qilindi!</b>\n\nEndi siz do'stingiz bilan musobaqalashishingiz va uning natijalarini ko'rishingiz mumkin.", parse_mode="HTML", reply_markup=kb)
    await callback.answer("Taklif qabul qilindi!")

@dp.callback_query(F.data == "decline_ref")
async def handle_decline_ref(callback: types.CallbackQuery):
    app_url = WEB_APP_URL
    kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="🚀 Ilovani ochish", web_app=WebAppInfo(url=app_url))]])
    await callback.message.edit_text("❌ Do'stlik taklifi rad etildi.", parse_mode="HTML", reply_markup=kb)
    await callback.answer("Rad etildi.")

# ----------------- MAIN RUNNER -----------------

async def api_unfriend(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
    user_id = data.get("user_id")
    friend_id = data.get("friend_id")
    if not user_id or not friend_id:
        return web.json_response({"error": "user_id and friend_id required"}, status=400)
        
    try:
        uid_int = int(user_id)
        fid_int = int(friend_id)
    except (ValueError, TypeError):
        return web.json_response({"error": "invalid id format"}, status=400)

    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("UPDATE users SET referred_by = NULL, is_accepted = FALSE WHERE (user_id = $1 AND referred_by = $2) OR (user_id = $3 AND referred_by = $4)", uid_int, str(fid_int), fid_int, str(uid_int))
    else:
        users = await load_users()
        u1, u2 = str(user_id), str(friend_id)
        changed = False
        if u1 in users and str(users[u1].get("referred_by")) == u2:
            users[u1]["referred_by"] = None
            users[u1]["is_accepted"] = False
            changed = True
        if u2 in users and str(users[u2].get("referred_by")) == u1:
            users[u2]["referred_by"] = None
            users[u2]["is_accepted"] = False
            changed = True
        if changed:
            await write_users_file(users)

    resp = web.json_response({"success": True})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

import time
recent_ratings = {}

async def api_rate_partner(request):
    if request.method == 'OPTIONS':
        resp = web.Response()
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return resp
        
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
        
    target_id_raw = data.get("partner_id")
    rater_id_raw = data.get("rater_id") or "anon"
    action = data.get("action")
    
    if not target_id_raw or action not in ["like", "dislike"]:
        resp = web.json_response({"error": "partner_id and action required"}, status=400)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
        
    try:
        target_id = int(target_id_raw)
    except (ValueError, TypeError):
        resp = web.json_response({"error": "invalid partner_id"}, status=400)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
        
    # Rate limit: 5 daqiqa ichida qayta baholash cheklanadi (soxta spam dislikes ning oldini oladi)
    rate_key = f"{rater_id_raw}:{target_id}"
    now_ts = time.time()
    last_ts = recent_ratings.get(rate_key, 0)
    if now_ts - last_ts < 300:
        resp = web.json_response({"success": False, "message": "Allaqachon baholangan"}, status=200)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
        
    recent_ratings[rate_key] = now_ts
    if len(recent_ratings) > 1000:
        recent_ratings.clear()
        recent_ratings[rate_key] = now_ts
        
    if db_pool:
        async with db_pool.acquire() as conn:
            if action == "like":
                await conn.execute("UPDATE users SET likes = COALESCE(likes, 0) + 1 WHERE user_id = $1", target_id)
            elif action == "dislike":
                await conn.execute("UPDATE users SET dislikes = COALESCE(dislikes, 0) + 1 WHERE user_id = $1", target_id)
    else:
        users = await load_users()
        target_str = str(target_id)
        if target_str in users:
            cur_likes = users[target_str].get("likes", 0) or 0
            cur_dislikes = users[target_str].get("dislikes", 0) or 0
            if action == "like":
                users[target_str]["likes"] = cur_likes + 1
            elif action == "dislike":
                users[target_str]["dislikes"] = cur_dislikes + 1
            await write_users_file(users)
                        
    resp = web.json_response({"success": True})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

async def api_ai_analyze(request):
    if request.method == 'OPTIONS':
        resp = web.Response()
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return resp
        
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "invalid json"}, status=400)
        
    system_prompt = data.get("systemPrompt", "")
    user_message = data.get("userMessage", "")
    history = data.get("history", [])
    
    gemini_key = os.getenv("ENGLISH_GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY", "")
    if not gemini_key:
        resp = web.json_response({"error": "No server API key"}, status=503)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        return resp
        
    contents = []
    for m in history[-6:]:
        contents.append({
            "role": "model" if m.get("role") == "assistant" else "user",
            "parts": [{"text": m.get("content", "")}]
        })
    contents.append({
        "role": "user",
        "parts": [{"text": user_message}]
    })
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key.strip()}"
    async with ClientSession() as session:
        try:
            async with session.post(url, json={
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": contents,
                "generationConfig": {"temperature": 0.7, "maxOutputTokens": 500}
            }, timeout=15) as response:
                if response.status == 200:
                    resp_json = await response.json()
                    reply = resp_json.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    resp = web.json_response({"reply": reply})
                    resp.headers["Access-Control-Allow-Origin"] = "*"
                    return resp
                else:
                    resp = web.json_response({"error": f"Gemini error {response.status}"}, status=502)
                    resp.headers["Access-Control-Allow-Origin"] = "*"
                    return resp
        except Exception as e:
            resp = web.json_response({"error": str(e)}, status=500)
            resp.headers["Access-Control-Allow-Origin"] = "*"
            return resp


import uuid
waiting_pool = []
active_rooms = {}

async def ws_matchmake(request):
    ws = web.WebSocketResponse(max_msg_size=16 * 1024 * 1024)
    await ws.prepare(request)
    
    user_id = request.query.get("user_id") or "guest"
    user_name = request.query.get("user_name") or "Foydalanuvchi"
    gender = request.query.get("gender") or "male"
    filter_gender = request.query.get("filter_gender") or "any"
    room_id = request.query.get("room_id") or ""
    
    user_data = {"name": user_name, "username": "", "likes": 0, "dislikes": 0, "gender": gender}
    is_unblocked = True
    
    if db_pool:
        try:
            user_id_int = int(user_id)
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("SELECT first_name, username, likes, dislikes, is_unblocked FROM users WHERE user_id = $1", user_id_int)
                if row:
                    user_data["likes"] = row['likes'] or 0
                    user_data["dislikes"] = row['dislikes'] or 0
                    if not user_name or user_name == "Foydalanuvchi" or user_name == "Siz":
                        user_data["name"] = row['first_name'] or user_name
        except Exception as e:
            logging.error(f"Error fetching user info for WS: {e}")
    else:
        try:
            users = await load_users()
            udata = users.get(str(user_id), {})
            user_data["likes"] = udata.get('likes', 0) or 0
            user_data["dislikes"] = udata.get('dislikes', 0) or 0
            if not user_name or user_name == "Foydalanuvchi" or user_name == "Siz":
                user_data["name"] = udata.get('first_name') or user_name
        except Exception as e:
            logging.error(f"Error fetching user info from JSON for WS: {e}")
            
    me = {
        'ws': ws,
        'user_id': user_id,
        'data': user_data,
        'gender': gender,
        'filter_gender': filter_gender,
        'room_id': room_id,
        'active_room': None
    }
    
    # Filter out dead/closed sockets
    clean_pool = [p for p in waiting_pool if not p['ws'].closed and p['ws'] != ws]
    waiting_pool.clear()
    waiting_pool.extend(clean_pool)
    
    matched = False
    for p in waiting_pool:
        if p['ws'].closed or p['ws'] == ws:
            continue
            
        is_compatible = False
        
        # 1. Agar ikkalasi ham bir xil taklif xonasiga (room_id) ulangan bo'lsa
        if room_id and p.get('room_id'):
            if room_id == p['room_id']:
                is_compatible = True
        # 2. Agar umumiy qidiruv bo'lsa (ikkalasi ham taklif xonasisiz)
        elif not room_id and not p.get('room_id'):
            me_wants = me['filter_gender']
            p_wants = p.get('filter_gender', 'any')
            
            # Jins filtri mosligi
            me_ok = (me_wants == 'any' or me_wants == p.get('gender'))
            p_ok = (p_wants == 'any' or p_wants == me.get('gender'))
            if me_ok and p_ok:
                is_compatible = True
                
        if is_compatible:
            waiting_pool.remove(p)
            session_room_id = str(uuid.uuid4())
            me['active_room'] = session_room_id
            p['active_room'] = session_room_id
            active_rooms[session_room_id] = [me, p]
            
            p_partner = {"id": p['user_id'], "name": p['data']['name'], "likes": p['data']['likes'], "dislikes": p['data']['dislikes']}
            me_partner = {"id": me['user_id'], "name": me['data']['name'], "likes": me['data']['likes'], "dislikes": me['data']['dislikes']}
            
            try:
                await me['ws'].send_json({"type": "match_found", "partner": p_partner})
                await p['ws'].send_json({"type": "match_found", "partner": me_partner})
                matched = True
                logging.info(f"MATCHED: {me['data']['name']} with {p['data']['name']} in room {session_room_id}")
                break
            except Exception as e:
                logging.error(f"Error sending match notifications: {e}")
            
    if not matched:
        waiting_pool.append(me)
        try:
            await ws.send_json({"type": "waiting"})
        except Exception:
            pass
        
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = msg.json()
                except Exception:
                    continue
                active_room_id = me['active_room']
                if active_room_id and active_room_id in active_rooms:
                    for p in active_rooms[active_room_id]:
                        if p['ws'] != ws and not p['ws'].closed:
                            try:
                                await p['ws'].send_json(data)
                            except Exception:
                                pass
    except Exception:
        pass
    finally:
        if me in waiting_pool:
            waiting_pool.remove(me)
        active_room_id = me['active_room']
        if active_room_id and active_room_id in active_rooms:
            partners = active_rooms[active_room_id]
            for p in partners:
                if p['ws'] != ws and not p['ws'].closed:
                    try:
                        await p['ws'].send_json({"type": "partner_left"})
                    except Exception:
                        pass
            if active_room_id in active_rooms:
                del active_rooms[active_room_id]
            
    return ws

async def api_get_friends(request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id required"}, status=400)
    
    users = await load_users()
    friends = []
    added_ids = set()
    user_id_str = str(user_id)

    # 1. user_id taklif qilgan va taklifni qabul qilgan do'stlar
    for uid, udata in users.items():
        if str(uid) != user_id_str and str(udata.get("referred_by")) == user_id_str and udata.get("is_accepted"):
            added_ids.add(str(uid))
            friends.append({
                "id": str(uid),
                "name": udata.get("first_name", "Foydalanuvchi"),
                "avatar": udata.get("first_name", "U")[0].upper() if udata.get("first_name") else "U",
                "points": 15,
                "streak": 1,
                "joinedAt": str(udata.get("joined_at", ""))[:10]
            })

    # 2. user_id ni taklif qilgan shaxs (o'zaro do'stlik)
    my_data = users.get(user_id_str)
    if my_data and my_data.get("is_accepted"):
        inviter_id = str(my_data.get("referred_by") or "")
        if inviter_id and inviter_id in users and inviter_id not in added_ids and inviter_id != user_id_str:
            inviter_data = users[inviter_id]
            friends.append({
                "id": inviter_id,
                "name": inviter_data.get("first_name", "Foydalanuvchi"),
                "avatar": inviter_data.get("first_name", "U")[0].upper() if inviter_data.get("first_name") else "U",
                "points": 15,
                "streak": 1,
                "joinedAt": str(inviter_data.get("joined_at", ""))[:10]
            })
    
    resp = web.json_response({"friends": friends})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

async def api_user_status(request):
    if request.method == "OPTIONS":
        resp = web.Response()
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "*"
        return resp

    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id required"}, status=400)
    
    cur_likes = 0
    cur_dislikes = 0
    if db_pool:
        try:
            async with db_pool.acquire() as conn:
                row = await conn.fetchrow("SELECT likes, dislikes FROM users WHERE user_id = $1", int(user_id))
                if row:
                    cur_likes = row['likes'] or 0
                    cur_dislikes = row['dislikes'] or 0
        except Exception as e:
            logging.error(f"DB error in api_user_status: {e}")
    else:
        users = await load_users()
        udata = users.get(str(user_id), {})
        cur_likes = udata.get("likes", 0) or 0
        cur_dislikes = udata.get("dislikes", 0) or 0
        
    resp = web.json_response({
        "user_id": str(user_id),
        "likes": cur_likes,
        "dislikes": cur_dislikes,
        "net_likes": cur_likes,
        "net_dislikes": cur_dislikes,
        "is_unblocked": True,
        "is_locked": False
    })
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

import edge_tts
import urllib.parse
import urllib.request

tts_cache = {}

async def api_tts(request):
    if request.method == "OPTIONS":
        resp = web.Response()
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "*"
        return resp

    text = request.query.get("text", "").strip()[:500]
    voice = request.query.get("voice", "en-GB-RyanNeural").strip()
    if not text:
        return web.json_response({"error": "text required"}, status=400)

    cache_key = f"{voice}:{text}"
    if cache_key in tts_cache:
        resp = web.Response(body=tts_cache[cache_key], content_type="audio/mpeg")
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Cache-Control"] = "public, max-age=86400"
        return resp

    # 1. Official British Council examiner neural voice (Band 9.0)
    try:
        comm = edge_tts.Communicate(text, voice)
        chunks = []
        async for chunk in comm.stream():
            if chunk["type"] == "audio":
                chunks.append(chunk["data"])
        audio_bytes = b"".join(chunks)
        if audio_bytes:
            if len(tts_cache) < 250:
                tts_cache[cache_key] = audio_bytes
            resp = web.Response(body=audio_bytes, content_type="audio/mpeg")
            resp.headers["Access-Control-Allow-Origin"] = "*"
            resp.headers["Cache-Control"] = "public, max-age=86400"
            return resp
    except Exception as e:
        logging.warning(f"edge_tts failed: {e}")

    # 2. Server-side Google TTS fallback (no referer header blocking)
    try:
        url = f"https://translate.google.com/translate_tts?ie=UTF-8&tl=en-GB&client=tw-ob&q={urllib.parse.quote(text[:200])}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            audio_bytes = r.read()
            resp = web.Response(body=audio_bytes, content_type="audio/mpeg")
            resp.headers["Access-Control-Allow-Origin"] = "*"
            return resp
    except Exception as e:
        logging.error(f"TTS fallback failed: {e}")
        return web.json_response({"error": "TTS failed"}, status=500)

@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        resp = web.Response()
    else:
        try:
            resp = await handler(request)
        except Exception as e:
            logging.error(f"Error handling request {request.path}: {e}")
            resp = web.json_response({"error": str(e)}, status=500)
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS, PUT, DELETE"
    resp.headers["Access-Control-Allow-Headers"] = "*"
    return resp

async def on_app_startup(app: web.Application):
    await init_db()
    if WEBHOOK_URL:
        await bot.set_webhook(f"{WEBHOOK_URL}/webhook", drop_pending_updates=False)
        logging.info(f"Webhook set to {WEBHOOK_URL}/webhook")
    else:
        await bot.delete_webhook(drop_pending_updates=False)
        app['polling_task'] = asyncio.create_task(
            dp.start_polling(bot, allowed_updates=["message", "chat_member", "my_chat_member", "callback_query"])
        )
        logging.info("Aiogram polling started in background task.")

async def on_app_cleanup(app: web.Application):
    if 'polling_task' in app:
        app['polling_task'].cancel()
        try:
            await app['polling_task']
        except asyncio.CancelledError:
            pass
    if db_pool:
        await db_pool.close()
    await bot.session.close()

async def api_health(request):
    return web.Response(text="OK", status=200)

def main():
    logging.basicConfig(level=logging.INFO)
    
    app = web.Application(middlewares=[cors_middleware])
    app.router.add_get("/", api_health)
    app.router.add_get("/health", api_health)
    app.router.add_get("/api/friends", api_get_friends)
    app.router.add_post("/api/unfriend", api_unfriend)
    app.router.add_options("/api/unfriend", api_unfriend)
    app.router.add_post("/api/rate_partner", api_rate_partner)
    app.router.add_options("/api/rate_partner", api_rate_partner)
    app.router.add_post("/api/ai_analyze", api_ai_analyze)
    app.router.add_get("/api/user_status", api_user_status)
    app.router.add_options("/api/user_status", api_user_status)
    app.router.add_get("/api/tts", api_tts)
    app.router.add_options("/api/tts", api_tts)
    app.router.add_get("/ws/matchmake", ws_matchmake)
    
    app.on_startup.append(on_app_startup)
    app.on_cleanup.append(on_app_cleanup)

    if WEBHOOK_URL:
        webhook_requests_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
        webhook_requests_handler.register(app, path="/webhook")
        setup_application(app, dp, bot=bot)

    logging.info(f"Starting server on port {PORT} (webhook={bool(WEBHOOK_URL)})...")
    web.run_app(app, host="0.0.0.0", port=PORT)

if __name__ == "__main__":
    main()
