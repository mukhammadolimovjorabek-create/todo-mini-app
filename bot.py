"""
Telegram Mini App Boti
Ushbu skript .env faylidagi tokenni xavfsiz o'qiydi.
"""

import os
import asyncio
import logging
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

# .env faylini o'qish (alohida kutubxonasiz xavfsiz usul)
def get_bot_token():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("BOT_TOKEN="):
                    return line.strip().split("=", 1)[1]
    return os.getenv("BOT_TOKEN", "")

BOT_TOKEN = get_bot_token()

# Vercel havolangiz (Vercel'dan havola olganingizda shu yerga yozasiz)
WEB_APP_URL = os.getenv("WEB_APP_URL", "https://sizning-app.vercel.app")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 To-Do & AI Appni ochish",
                    web_app=WebAppInfo(url=WEB_APP_URL)
                )
            ]
        ]
    )
    await message.answer(
        f"Salom, {message.from_user.first_name}! 👋\n\n"
        "Shaxsiy rejalashtiruvchi va AI tahlilchi ilovangiz tayyor.\n"
        "Quyidagi tugmani bosib ochishingiz mumkin:",
        reply_markup=kb
    )

async def main():
    print("Bot muvaffaqiyatli ishga tushdi! Telegram orqali /start yozib tekshirishingiz mumkin...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
