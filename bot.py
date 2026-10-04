import os
import json
import asyncio
import logging
import asyncpg
from datetime import datetime
from aiohttp import web
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
from aiogram.webhook.aiohttp_server import SimpleRequestHandler, setup_application

# Configuration
ADMIN_ID = 5466728043
BASE_DIR = os.path.dirname(__file__)
USERS_FILE = os.path.join(BASE_DIR, "users.json")
BANNER_PATH = os.path.join(BASE_DIR, "welcome_banner.jpg")

# Load environment variables
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
DATABASE_URL = os.getenv("DATABASE_URL")
WEBHOOK_URL = os.getenv("WEBHOOK_URL")
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
                    dislikes INT DEFAULT 0,
                    is_unblocked BOOLEAN DEFAULT FALSE
                )
            """)
        logging.info("Connected to PostgreSQL Database.")
    else:
        logging.info("No DATABASE_URL found. Falling back to users.json.")

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
                    "dislikes": row['dislikes'],
                    "is_unblocked": row['is_unblocked']
                }
        return users_dict
    else:
        if os.path.exists(USERS_FILE):
            try:
                with open(USERS_FILE, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                return {}
        return {}

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
        
        with open(USERS_FILE, "w", encoding="utf-8") as f:
            json.dump(users, f, ensure_ascii=False, indent=2)
            
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
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(users, f, ensure_ascii=False, indent=2)

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
            with open(USERS_FILE, "w", encoding="utf-8") as f:
                json.dump(users, f, ensure_ascii=False, indent=2)

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
        username_txt = f"(@{message.from_user.username})" if message.from_user.username else ""
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
            f"👇 <i>Ushbu xabarga <b>Javob (Reply)</b> qilib karta yoki raqam yuboring.</i>"
        )
        try:
            await bot.send_message(chat_id=ADMIN_ID, text=admin_alert, parse_mode="HTML")
        except Exception:
            pass
        return

    referrer_id = None
    if len(parts) > 1 and parts[1].startswith("ref_"):
        referrer_id = parts[1].replace("ref_", "").strip()
        
    is_new, total_visitors = await save_user(user_id, user_info)
    
    if referrer_id and db_pool:
        async with db_pool.acquire() as conn:
            inviter = await conn.fetchrow("SELECT first_name FROM users WHERE user_id = $1", int(referrer_id))
            inviter_name = inviter['first_name'] if inviter else "Do'stingiz"
        
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(text="✅ Ha, qabul qilaman", callback_data=f"accept_ref:{referrer_id}")],
            [InlineKeyboardButton(text="❌ Yo'q", callback_data="decline_ref")]
        ])
        await message.answer(f"{inviter_name} sizni do'stlar qatoriga va musobaqalashishga chaqiryapti. Qabul qilasizmi?", reply_markup=kb)

    app_url = f"{WEB_APP_URL}?ref={referrer_id}" if referrer_id else WEB_APP_URL

    inline_kb = InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="🚀 Ilovani ochish", web_app=WebAppInfo(url=app_url))]]
    )
    
    caption_text = (
        f"Assalomu alaykum, <b>{message.from_user.first_name}</b>! 👋\n\n"
        "🎯 <b>Smart To-Do & AI</b> platformasiga xush kelibsiz!\n"
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
        return
    users = await load_users()
    total_visitors = len(users)
    today_str = datetime.now().strftime("%Y-%m-%d")
    today_new = sum(1 for u in users.values() if str(u.get("joined_at", "")).startswith(today_str))
    active_users = sum(1 for u in users.values() if u.get("status", "active") == "active")
    left_users = sum(1 for u in users.values() if u.get("status") == "left")
    
    report_text = (
        "📊 <b>BOT HISOBOTI</b>\n"
        f"🆕 Bugun: {today_new}\n"
        f"👥 Faol: {active_users}\n"
        f"🚪 Chiqib ketganlar: {left_users}\n"
        f"📈 Jami: {total_visitors}"
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

# ----------------- MAIN RUNNER -----------------


async def api_unfriend(request):
    data = await request.json()
    user_id = data.get("user_id")
    friend_id = data.get("friend_id")
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("UPDATE users SET referred_by = NULL, is_accepted = FALSE WHERE (user_id = $1 AND referred_by = $2) OR (user_id = $3 AND referred_by = $4)", int(user_id), str(friend_id), int(friend_id), str(user_id))
    resp = web.json_response({"success": True})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

async def api_rate_partner(request):
    # Enable CORS for preflight options
    if request.method == 'OPTIONS':
        resp = web.Response()
        resp.headers['Access-Control-Allow-Origin'] = '*'
        resp.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        resp.headers['Access-Control-Allow-Headers'] = 'Content-Type'
        return resp
        
    data = await request.json()
    target_id = data.get("partner_id")
    action = data.get("action")
    if db_pool:
        async with db_pool.acquire() as conn:
            if action == "like":
                await conn.execute("UPDATE users SET likes = likes + 1 WHERE user_id = $1", int(target_id))
            elif action == "dislike":
                await conn.execute("UPDATE users SET dislikes = dislikes + 1 WHERE user_id = $1", int(target_id))
                row = await conn.fetchrow("SELECT dislikes FROM users WHERE user_id = $1", int(target_id))
                if row and row['dislikes'] >= 10:
                    await conn.execute("UPDATE users SET is_unblocked = FALSE WHERE user_id = $1", int(target_id))
                    try:
                        await bot.send_message(chat_id=int(target_id), text="⚠️ Siz juda ko'p 'dislike' oldingiz. Ilova siz uchun pullik bo'ldi. Qulfni ochish uchun adminga murojaat qiling.")
                    except:
                        pass
    resp = web.json_response({"success": True})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

import uuid
waiting_pool = []
active_rooms = {}

async def ws_matchmake(request):
    ws = web.WebSocketResponse()
    await ws.prepare(request)
    
    user_id = request.query.get("user_id")
    if not user_id or not db_pool:
        await ws.close()
        return ws
        
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT first_name, username, likes, dislikes FROM users WHERE user_id = $1", int(user_id))
        user_data = {"name": row['first_name'] if row else "Foydalanuvchi", "username": row['username'] if row else "", "likes": row['likes'] if row else 0, "dislikes": row['dislikes'] if row else 0}
            
    me = {'ws': ws, 'user_id': user_id, 'data': user_data, 'room_id': None}
    
    matched = False
    for p in waiting_pool:
        if p['user_id'] != user_id:
            waiting_pool.remove(p)
            room_id = str(uuid.uuid4())
            me['room_id'] = room_id
            p['room_id'] = room_id
            active_rooms[room_id] = [me, p]
            
            await me['ws'].send_json({"type": "match_found", "partner": {"id": p['user_id'], "name": p['data']['name'], "username": p['data']['username'], "likes": p['data']['likes'], "dislikes": p['data']['dislikes']}})
            await p['ws'].send_json({"type": "match_found", "partner": {"id": me['user_id'], "name": me['data']['name'], "username": me['data']['username'], "likes": me['data']['likes'], "dislikes": me['data']['dislikes']}})
            matched = True
            break
            
    if not matched:
        waiting_pool.append(me)
        await ws.send_json({"type": "waiting"})
        
    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                data = msg.json()
                if data.get("type") == "chat_message":
                    room_id = me['room_id']
                    if room_id and room_id in active_rooms:
                        for p in active_rooms[room_id]:
                            if p['ws'] != ws:
                                await p['ws'].send_json({"type": "chat_message", "text": data.get("text")})
    except Exception:
        pass
    finally:
        if me in waiting_pool:
            waiting_pool.remove(me)
        room_id = me['room_id']
        if room_id and room_id in active_rooms:
            partners = active_rooms[room_id]
            for p in partners:
                if p['ws'] != ws:
                    try:
                        await p['ws'].send_json({"type": "partner_left"})
                    except:
                        pass
            del active_rooms[room_id]
            
    return ws

async def api_get_friends(request):
    user_id = request.query.get("user_id")
    if not user_id:
        return web.json_response({"error": "user_id required"}, status=400)
    
    users = await load_users()
    friends = []
    for uid, udata in users.items():
        if str(udata.get("referred_by")) == str(user_id) and udata.get("is_accepted"):
            friends.append({
                "id": str(uid),
                "name": udata.get("first_name", "Foydalanuvchi"),
                "avatar": udata.get("first_name", "U")[0].upper() if udata.get("first_name") else "U",
                "points": 15,
                "streak": 1,
                "joinedAt": str(udata.get("joined_at", ""))[:10]
            })
    
    resp = web.json_response({"friends": friends})
    resp.headers["Access-Control-Allow-Origin"] = "*"
    return resp

async def on_startup(bot: Bot):
    await init_db()
    if WEBHOOK_URL:
        await bot.set_webhook(f"{WEBHOOK_URL}/webhook")
        logging.info(f"Webhook set to {WEBHOOK_URL}/webhook")
    else:
        await bot.delete_webhook()

async def start_bot():
    await on_startup(bot)
    if not WEBHOOK_URL:
        await dp.start_polling(bot, allowed_updates=["message", "chat_member", "my_chat_member", "callback_query"])

def main():
    logging.basicConfig(level=logging.INFO)
    
    import aiohttp_cors
    app = web.Application()
    cors = aiohttp_cors.setup(app, defaults={
        "*": aiohttp_cors.ResourceOptions(
            allow_credentials=True,
            expose_headers="*",
            allow_headers="*",
        )
    })
    cors.add(app.router.add_get("/api/friends", api_get_friends))
    cors.add(app.router.add_post("/api/unfriend", api_unfriend))
    cors.add(app.router.add_post("/api/rate_partner", api_rate_partner))
    cors.add(app.router.add_options("/api/rate_partner", api_rate_partner))
    app.router.add_get("/ws/matchmake", ws_matchmake)
    
    if WEBHOOK_URL:
        dp.startup.register(on_startup)
        webhook_requests_handler = SimpleRequestHandler(dispatcher=dp, bot=bot)
        webhook_requests_handler.register(app, path="/webhook")
        setup_application(app, dp, bot=bot)
        web.run_app(app, host="0.0.0.0", port=PORT)
    else:
        import threading
        def run_polling():
            asyncio.run(start_bot())
            
        t = threading.Thread(target=run_polling, daemon=True)
        t.start()
        
        logging.info("Starting local API server on port 8000...")
        web.run_app(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()
