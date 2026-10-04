with open("bot.py", "r", encoding="utf-8") as f:
    content = f.read()

old_query = 'await conn.fetchrow("SELECT first_name, likes, dislikes FROM users WHERE user_id = $1", int(user_id))'
new_query = 'await conn.fetchrow("SELECT first_name, username, likes, dislikes FROM users WHERE user_id = $1", int(user_id))'
content = content.replace(old_query, new_query)

old_user_data = '{"name": row[\'first_name\'] if row else "Foydalanuvchi", "likes": row[\'likes\'] if row else 0, "dislikes": row[\'dislikes\'] if row else 0}'
new_user_data = '{"name": row[\'first_name\'] if row else "Foydalanuvchi", "username": row[\'username\'] if row else "", "likes": row[\'likes\'] if row else 0, "dislikes": row[\'dislikes\'] if row else 0}'
content = content.replace(old_user_data, new_user_data)

old_match_p = '"name": p[\'data\'][\'name\'], "likes": p[\'data\'][\'likes\'], "dislikes": p[\'data\'][\'dislikes\']'
new_match_p = '"name": p[\'data\'][\'name\'], "username": p[\'data\'][\'username\'], "likes": p[\'data\'][\'likes\'], "dislikes": p[\'data\'][\'dislikes\']'
content = content.replace(old_match_p, new_match_p)

old_match_me = '"name": me[\'data\'][\'name\'], "likes": me[\'data\'][\'likes\'], "dislikes": me[\'data\'][\'dislikes\']'
new_match_me = '"name": me[\'data\'][\'name\'], "username": me[\'data\'][\'username\'], "likes": me[\'data\'][\'likes\'], "dislikes": me[\'data\'][\'dislikes\']'
content = content.replace(old_match_me, new_match_me)

with open("bot.py", "w", encoding="utf-8") as f:
    f.write(content)
