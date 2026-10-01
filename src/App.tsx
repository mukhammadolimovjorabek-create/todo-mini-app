import { useState, useEffect } from 'react';
import type { ScreenType, TelegramUser } from './types';
import { getTelegramWebApp, getTelegramUser } from './utils/telegram';
import { seedDemoData } from './utils/storage';
import { ScreenHome } from './components/ScreenHome';
import { ScreenAI } from './components/ScreenAI';
import { ScreenAnalytics } from './components/ScreenAnalytics';
import { ScreenProfile } from './components/ScreenProfile';
import { BottomNav } from './components/BottomNav';

export function App() {
  const [screen, setScreen] = useState<ScreenType>('home');
  const [user, setUser] = useState<TelegramUser>({
    id: 1,
    first_name: 'Siz',
    username: 'user',
  });

  useEffect(() => {
    // Seed demo tasks on first launch
    seedDemoData();

    // Init Telegram WebApp
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setBackgroundColor('#f0f2ff');
      } catch { /* ignore */ }
    }
    const u = getTelegramUser();
    if (u) setUser(u);
  }, []);

  return (
    <div className="min-h-screen w-full bg-slate-300 flex flex-col items-center justify-start py-0 md:py-8">
      {/* Phone frame on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:max-h-[900px] bg-[#f0f2ff] md:rounded-[2.8rem] shadow-2xl overflow-y-auto overflow-x-hidden relative flex flex-col border-0 md:border-8 md:border-slate-800">
        <div className="flex-1">
          {screen === 'home'      && <ScreenHome userName={user.first_name} />}
          {screen === 'ai'        && <ScreenAI />}
          {screen === 'analytics' && <ScreenAnalytics />}
          {screen === 'profile'   && <ScreenProfile user={user} />}
        </div>

        <BottomNav activeScreen={screen} onChangeScreen={setScreen} />
      </div>
    </div>
  );
}

export default App;
