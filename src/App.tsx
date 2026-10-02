import { useState, useEffect } from 'react';
import type { ScreenType, TelegramUser } from './types';
import { getTelegramWebApp, getTelegramUser } from './utils/telegram';
import { loadTasks, today } from './utils/storage';
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
  const [taskStats, setTaskStats] = useState({ pending: 0, pct: 0 });

  const updateStatsFromStorage = () => {
    const allToday = loadTasks().filter((t) => t.createdAt === today());
    const done = allToday.filter((t) => t.done).length;
    const total = allToday.length;
    setTaskStats({
      pending: total - done,
      pct: total ? Math.round((done / total) * 100) : 0,
    });
  };

  useEffect(() => {
    // Init Telegram WebApp
    const tg = getTelegramWebApp();
    if (tg) {
      tg.ready();
      tg.expand();
      try {
        tg.setBackgroundColor('#f6f7fb');
      } catch { /* ignore */ }
    }
    const u = getTelegramUser();
    if (u) setUser(u);

    updateStatsFromStorage();
  }, [screen]);

  const userInitial = user.first_name ? user.first_name[0] : 'J';

  return (
    <div className="min-h-screen w-full bg-slate-300 flex flex-col items-center justify-start py-0 md:py-8">
      {/* Phone frame on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:max-h-[900px] bg-[#f6f7fb] md:rounded-[2.8rem] shadow-2xl overflow-y-auto overflow-x-hidden relative flex flex-col border-0 md:border-8 md:border-slate-800">
        <div className="flex-1">
          {screen === 'home'      && <ScreenHome userName={user.first_name} onTasksChange={updateStatsFromStorage} />}
          {screen === 'ai'        && <ScreenAI onTaskCreated={updateStatsFromStorage} />}
          {screen === 'analytics' && <ScreenAnalytics />}
          {screen === 'profile'   && <ScreenProfile user={user} />}
        </div>

        <BottomNav
          activeScreen={screen}
          onChangeScreen={setScreen}
          pendingCount={taskStats.pending}
          userInitial={userInitial}
          progressPct={taskStats.pct}
        />
      </div>
    </div>
  );
}

export default App;
