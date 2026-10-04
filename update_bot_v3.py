import os
import re

with open("bot.py", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update init_db to add likes and is_accepted columns
init_db_old = """        db_pool = await asyncpg.create_pool(DATABASE_URL, statement_cache_size=0)
        async with db_pool.acquire() as conn:
            await conn.execute(\"\"\"
                CREATE TABLE IF NOT EXISTS users (
                    user_id BIGINT PRIMARY KEY,
                    first_name TEXT,
                    username TEXT,
                    status TEXT,
                    joined_at TIMESTAMP,
                    last_active TIMESTAMP,
                    referred_by TEXT,
                    dislikes INT DEFAULT 0,
                    is_unblocked BOOLEAN DEFAULT TRUE
                )
            \"\"\")"""

init_db_new = """        db_pool = await asyncpg.create_pool(DATABASE_URL, statement_cache_size=0)
        async with db_pool.acquire() as conn:
            await conn.execute(\"\"\"
                CREATE TABLE IF NOT EXISTS users (
                    user_id BIGINT PRIMARY KEY,
                    first_name TEXT,
                    username TEXT,
                    status TEXT,
                    joined_at TIMESTAMP,
                    last_active TIMESTAMP,
                    referred_by TEXT,
                    dislikes INT DEFAULT 0,
                    is_unblocked BOOLEAN DEFAULT TRUE
                )
            \"\"\")
            try:
                await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0")
                await conn.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_accepted BOOLEAN DEFAULT FALSE")
            except Exception:
                pass"""

content = content.replace(init_db_old, init_db_new)

# 2. Add /api/unfriend and /api/rate_partner and /ws/matchmake
api_code = """
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
        row = await conn.fetchrow("SELECT first_name, likes, dislikes FROM users WHERE user_id = $1", int(user_id))
        user_data = {"name": row['first_name'] if row else "Foydalanuvchi", "likes": row['likes'] if row else 0, "dislikes": row['dislikes'] if row else 0}
            
    me = {'ws': ws, 'user_id': user_id, 'data': user_data, 'room_id': None}
    
    matched = False
    for p in waiting_pool:
        if p['user_id'] != user_id:
            waiting_pool.remove(p)
            room_id = str(uuid.uuid4())
            me['room_id'] = room_id
            p['room_id'] = room_id
            active_rooms[room_id] = [me, p]
            
            await me['ws'].send_json({"type": "match_found", "partner": {"id": p['user_id'], "name": p['data']['name'], "likes": p['data']['likes'], "dislikes": p['data']['dislikes']}})
            await p['ws'].send_json({"type": "match_found", "partner": {"id": me['user_id'], "name": me['data']['name'], "likes": me['data']['likes'], "dislikes": me['data']['dislikes']}})
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
"""

content = content.replace("async def api_get_friends(request):", api_code + "\nasync def api_get_friends(request):")

# Update api_get_friends to ONLY show if is_accepted = TRUE
old_api_friends = """        if str(udata.get("referred_by")) == str(user_id):
            friends.append({"""
new_api_friends = """        if str(udata.get("referred_by")) == str(user_id) and udata.get("is_accepted"):
            friends.append({"""
content = content.replace(old_api_friends, new_api_friends)
content = content.replace("users_dict[str(row['user_id'])] = {", "users_dict[str(row['user_id'])] = { 'is_accepted': row.get('is_accepted', False),")

# Register routes
old_main = """    app = web.Application()
    app.router.add_get("/api/friends", api_get_friends)"""
new_main = """    import aiohttp_cors
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
    app.router.add_get("/ws/matchmake", ws_matchmake)"""
content = content.replace(old_main, new_main)

# Update /start command in bot.py
start_logic_old = """    referrer_id = None
    if len(parts) > 1 and parts[1].startswith("ref_"):
        referrer_id = parts[1].replace("ref_", "").strip()
        user_info["referred_by"] = referrer_id

    is_new, total_visitors = await save_user(user_id, user_info)"""

start_logic_new = """    referrer_id = None
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
"""
content = content.replace(start_logic_old, start_logic_new)

# Add callback handlers for accept_ref and decline_ref
callbacks = """
@dp.callback_query(F.data.startswith("accept_ref:"))
async def handle_accept_ref(callback: types.CallbackQuery):
    referrer_id = int(callback.data.split(":")[1])
    if db_pool:
        async with db_pool.acquire() as conn:
            await conn.execute("UPDATE users SET referred_by = $1, is_accepted = TRUE WHERE user_id = $2", str(referrer_id), callback.from_user.id)
    await callback.message.edit_text("✅ Siz do'stingiz bilan bog'landingiz! Endi ilovaga kirishingiz mumkin.")
    await callback.answer()

@dp.callback_query(F.data == "decline_ref")
async def handle_decline_ref(callback: types.CallbackQuery):
    await callback.message.edit_text("❌ Ulanish bekor qilindi. Ilovadan mustaqil foydalanishingiz mumkin.")
    await callback.answer()

@dp.my_chat_member()
async def on_bot_blocked(update: types.ChatMemberUpdated):
    if update.new_chat_member.status == "kicked":
        user_id = update.from_user.id
        if db_pool:
            async with db_pool.acquire() as conn:
                await conn.execute("UPDATE users SET status = 'left', referred_by = NULL, is_accepted = FALSE WHERE user_id = $1", user_id)
                await conn.execute("UPDATE users SET referred_by = NULL, is_accepted = FALSE WHERE referred_by = $1", str(user_id))
"""
content = content.replace("@dp.message(F.text == \"📝 Hisobot\")", callbacks + "\n@dp.message(F.text == \"📝 Hisobot\")")

with open("bot.py", "w", encoding="utf-8") as f:
    f.write(content)
