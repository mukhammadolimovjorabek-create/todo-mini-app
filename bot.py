"""
Telegram Mini App Botini ishga tushirish uchun oddiy va 100% bepul skript.
Kutubxona: pip install aiogram
"""

import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

# BotFather'dan olingan bepul bot tokeningizni bu yerga qo'ying:
BOT_TOKEN = "SIZNING_BOT_TOKENINGIZ"

# Vercel yoki ngrok orqali chiqqan Mini App havolangiz:
# (Lokal test uchun: ngrok http 5173 orqali olingan https:// havola)
WEB_APP_URL = "https://sizning-app.vercel.app"

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 O'quv platformasini ochish",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ]
    )
    await message.answer(
        f"Salom, {message.from_user.first_name}!\n\n"
        "O'quv platformasi va AI murabbiyingiz tayyor. Quyidagi tugmani bosing:",
        reply_markup=kb
    )

async def main():
    print("Bot ishga tushdi...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
