import { useState, useEffect } from 'react';
import type { ScreenType, TelegramUser } from './types';
import { getTelegramWebApp, getTelegramUser } from './utils/telegram';
import { getActiveTasks, getCustomProfile, restoreFromCloud } from './utils/storage';
import { ScreenHome } from './components/ScreenHome';
import { ScreenAI } from './components/ScreenAI';
import { ScreenAnalytics } from './components/ScreenAnalytics';
import { ScreenProfile } from './components/ScreenProfile';
import { ScreenHub } from './components/ScreenHub';
import { BottomNav } from './components/BottomNav';
import { EnglishPracticeModule } from './english';

export function App() {
  const [screen, setScreen] = useState<ScreenType>('home');
  const [appMode, setAppMode] = useState<'hub' | 'todo' | 'english'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('module') === 'english' || Boolean(params.get('room'))) {
        return 'english';
      }
    } catch {
      // ignore
    }
    return 'todo';
  });
  const [user, setUser] = useState<TelegramUser>({
    id: 1,
    first_name: 'Siz',
    username: 'user',
  });
  const [customProfile, setCustomProfile] = useState(() => getCustomProfile());
  const [taskStats, setTaskStats] = useState({ pending: 0, pct: 0 });
  const [englishInitialExam, setEnglishInitialExam] = useState<'ielts' | 'multilevel' | null>(null);

  const handleOpenEnglish = (exam?: 'ielts' | 'multilevel' | null) => {
    setEnglishInitialExam(exam ?? null);
    setAppMode('english');
  };

  const updateStatsFromStorage = () => {
    const allActive = getActiveTasks();
    const done = allActive.filter((t) => t.done).length;
    const total = allActive.length;
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
  }, [screen, appMode]);

  useEffect(() => {
    restoreFromCloud().then((restored) => {
      if (restored) {
        updateStatsFromStorage();
      }
    });
  }, []);

  // Ism va bosh harf (Custom profile ustun turadi)
  const currentName = customProfile.displayName || user.first_name || 'Siz';
  const userInitial = currentName[0]?.toUpperCase() || 'J';

  return (
    <div className="min-h-screen w-full bg-slate-300 flex flex-col items-center justify-start py-0 md:py-8">
      {/* Phone frame on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:max-h-[900px] bg-[#f6f7fb] md:rounded-[2.8rem] shadow-2xl overflow-y-auto overflow-x-hidden relative flex flex-col border-0 md:border-8 md:border-slate-800">
        {appMode === 'hub' ? (
          <ScreenHub
            userName={currentName}
            userAvatar={customProfile.avatarUrl}
            userInitial={userInitial}
            pendingTasks={taskStats.pending}
            progressPct={taskStats.pct}
            onSelectEnglish={() => setAppMode('english')}
            onSelectTodo={() => {
              setScreen('home');
              setAppMode('todo');
            }}
            onOpenAiCoach={() => {
              setScreen('ai');
              setAppMode('todo');
            }}
            onOpenLeaderboard={() => {
              setScreen('analytics');
              setAppMode('todo');
            }}
          />
        ) : appMode === 'english' ? (
          <EnglishPracticeModule
            telegramUser={{
              id: user.id,
              first_name: currentName,
              username: user.username,
            }}
            initialExam={englishInitialExam}
            onExit={() => {
              setEnglishInitialExam(null);
              setAppMode('todo');
            }}
          />
        ) : (
          <>
            <div className="flex-1">
              {screen === 'home' && (
                <ScreenHome
                  userName={currentName}
                  onTasksChange={updateStatsFromStorage}
                  onOpenEnglish={handleOpenEnglish}
                  onBackToHub={() => setAppMode('hub')}
                />
              )}
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
              onOpenEnglish={handleOpenEnglish}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
