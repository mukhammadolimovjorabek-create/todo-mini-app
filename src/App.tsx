import { useState, useEffect } from 'react';
import type { ScreenType, TelegramUser } from './types';
import { getTelegramWebApp, getTelegramUser, getTelegramStartParam, getTelegramInitData } from './utils/telegram';
import { API_BASE_URL } from './config';
import { saveDuoState } from './utils/shop';
import { CoinShopModal } from './components/CoinShopModal';
import { getActiveTasks, getCustomProfile, restoreFromCloud } from './utils/storage';
import { ScreenHome } from './components/ScreenHome';
import { ScreenAI } from './components/ScreenAI';
import { ScreenAnalytics } from './components/ScreenAnalytics';
import { ScreenProfile } from './components/ScreenProfile';
import { ScreenHub } from './components/ScreenHub';
import { BottomNav } from './components/BottomNav';
import { EnglishPracticeModule } from './english';

export function App() {
  const [screen, setScreen] = useState<ScreenType>(() =>
    getTelegramStartParam().startsWith('duo_') ? 'analytics' : 'home'
  );
  const [appMode, setAppMode] = useState<'hub' | 'todo' | 'english'>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const sp = getTelegramStartParam();
      if (
        params.get('module') === 'english' ||
        Boolean(params.get('room')) ||
        sp.startsWith('room_') ||
        sp.startsWith('quiz_') ||
        ['ielts', 'multilevel', 'listening', 'otm', 'placement'].includes(sp)
      ) {
        return 'english';
      }
      if (params.get('module') === 'todo' || sp.startsWith('duo_')) {
        return 'todo';
      }
    } catch {
      // ignore
    }
    return 'hub';
  });
  const [user, setUser] = useState<TelegramUser>({
    id: 1,
    first_name: 'Siz',
    username: 'user',
  });
  const [customProfile, setCustomProfile] = useState(() => getCustomProfile());
  const [taskStats, setTaskStats] = useState({ pending: 0, pct: 0 });
  const [englishInitialExam, setEnglishInitialExam] = useState<'ielts' | 'multilevel' | null>(null);
  const [englishDeepAction, setEnglishDeepAction] = useState<string | null>(() => {
    const sp = getTelegramStartParam();
    if (['ielts', 'multilevel', 'listening', 'otm', 'placement'].includes(sp) || sp.startsWith('quiz_')) {
      return sp;
    }
    return null;
  });
  const [showShop, setShowShop] = useState<boolean>(() => getTelegramStartParam() === 'shop');
  const [englishReturnMode, setEnglishReturnMode] = useState<'hub' | 'todo'>('hub');

  const handleOpenEnglish = (exam?: 'ielts' | 'multilevel' | null) => {
    setEnglishInitialExam(exam ?? null);
    setEnglishReturnMode(appMode === 'todo' ? 'todo' : 'hub');
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

    const sp = getTelegramStartParam();
    if (sp.startsWith('duo_')) {
      const partnerId = sp.slice(4).trim();
      const initData = getTelegramInitData();
      const me = getTelegramUser();
      if (partnerId && initData && String(me?.id || '') !== partnerId) {
        fetch(`${API_BASE_URL}/api/duo`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': initData,
          },
          body: JSON.stringify({ action: 'pair', partnerId }),
        })
          .then((r) => (r.ok ? r.json() : null))
          .then((data) => {
            if (data?.success) {
              saveDuoState({
                active: true,
                partnerId: Number(data.partnerId) || Number(partnerId),
                partnerName: String(data.partnerName || 'Sherik'),
                sharedStreak: Number(data.mutualStreak) || 1,
                partnerActiveToday: true,
              });
              setAppMode('todo');
              setScreen('analytics');
            }
          })
          .catch(() => { /* offline ignore */ });
      }
    }

    const openShopHandler = () => setShowShop(true);
    window.addEventListener('studylab:openShop', openShopHandler);
    return () => window.removeEventListener('studylab:openShop', openShopHandler);
  }, []);

  // Ism va bosh harf (Custom profile ustun turadi)
  const currentName = customProfile.displayName || user.first_name || 'Siz';
  const userInitial = currentName[0]?.toUpperCase() || 'J';

  return (
    <div className="min-h-screen w-full bg-slate-300 flex flex-col items-center justify-start py-0 md:py-8">
      {/* Phone frame on desktop */}
      <div className="w-full max-w-md min-h-screen md:min-h-[820px] md:max-h-[900px] bg-[#f6f7fb] md:rounded-[2.8rem] shadow-2xl overflow-y-auto overflow-x-hidden relative flex flex-col border-0 md:border-8 md:border-slate-800">
        <CoinShopModal
          isOpen={showShop}
          onClose={() => setShowShop(false)}
          onInventoryChange={updateStatsFromStorage}
        />
        {appMode === 'hub' ? (
          <ScreenHub
            userName={currentName}
            userAvatar={customProfile.avatarUrl}
            userInitial={userInitial}
            pendingTasks={taskStats.pending}
            progressPct={taskStats.pct}
            onSelectEnglish={() => {
              setEnglishReturnMode('hub');
              setAppMode('english');
            }}
            onOpenShop={() => setShowShop(true)}
            onOpenEnglishAction={(action) => {
              setEnglishDeepAction(action);
              setEnglishReturnMode('hub');
              setAppMode('english');
            }}
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
            initialAction={englishDeepAction}
            onClearInitialAction={() => setEnglishDeepAction(null)}
            onExit={() => {
              setEnglishInitialExam(null);
              setEnglishDeepAction(null);
              setAppMode(englishReturnMode);
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
                  onOpenShop={() => setShowShop(true)}
                />
              )}
              {screen === 'ai'        && <ScreenAI onTaskCreated={updateStatsFromStorage} />}
              {screen === 'analytics' && <ScreenAnalytics />}
              {screen === 'profile'   && <ScreenProfile user={user} onProfileUpdate={reloadProfile} onOpenShop={() => setShowShop(true)} />}
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
