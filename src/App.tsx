import { useState, useEffect } from 'react';
import type { ScreenType, TelegramUser } from './types';
import { getTelegramWebApp, getTelegramUser } from './utils/telegram';
import { loadTasks, today, getCustomProfile } from './utils/storage';
import { ScreenHome } from './components/ScreenHome';
import { ScreenAI } from './components/ScreenAI';
import { ScreenAnalytics } from './components/ScreenAnalytics';
import { ScreenProfile } from './components/ScreenProfile';
import { BottomNav } from './components/BottomNav';
import { EnglishPracticeModule } from './english';

export function App() {
  const [screen, setScreen] = useState<ScreenType>('home');
  const [isEnglishModule, setIsEnglishModule] = useState(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('module') === 'english';
    } catch {
      return false;
    }
  });
  const [user, setUser] = useState<TelegramUser>({
    id: 1,
    first_name: 'Siz',
    username: 'user',
  });
  const [customProfile, setCustomProfile] = useState(() => getCustomProfile());
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

  const reloadProfile = () => {
    setCustomProfile(getCustomProfile());
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

  // Ism va bosh harf (Custom profile ustun turadi)
  const currentName = customProfile.displayName || user.first_name || 'Siz';
  const userInitial = currentName[0]?.toUpperCase() || 'J';

  return (
    <div className="min-h-screen w-full bg-slate-300 flex flex-col items-center justify-start py-0 md:py-8">
      {/* Phone frame on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:max-h-[900px] bg-[#f6f7fb] md:rounded-[2.8rem] shadow-2xl overflow-y-auto overflow-x-hidden relative flex flex-col border-0 md:border-8 md:border-slate-800">
        {isEnglishModule ? (
          <EnglishPracticeModule
            telegramUser={{
              id: user.id,
              first_name: currentName,
              username: user.username,
            }}
            onExit={() => setIsEnglishModule(false)}
          />
        ) : (
          <>
            <div className="flex-1">
              {screen === 'home'      && <ScreenHome userName={currentName} onTasksChange={updateStatsFromStorage} onOpenEnglish={() => setIsEnglishModule(true)} />}
              {screen === 'ai'        && <ScreenAI onTaskCreated={updateStatsFromStorage} />}
              {screen === 'analytics' && <ScreenAnalytics />}
              {screen === 'profile'   && <ScreenProfile user={user} onProfileUpdate={reloadProfile} />}
            </div>

            <BottomNav
              activeScreen={screen}
              onChangeScreen={setScreen}
              pendingCount={taskStats.pending}
              userInitial={userInitial}
              userAvatar={customProfile.avatarUrl}
              progressPct={taskStats.pct}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
