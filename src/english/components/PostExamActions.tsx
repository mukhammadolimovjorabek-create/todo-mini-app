import React, { useEffect, useState } from 'react';
import { Award, Coins, ListTodo, Check, AlertCircle } from 'lucide-react';
import { ScoreCardModal, type ScoreCriterionBar } from './ScoreCardModal';
import { createAutoTaskFromExam, type WeakSkillKey } from '../utils/autoTask';
import { addMistakes, type MistakeEntry } from '../../utils/shop';
import { COINS_PER_ENGLISH_TEST, checkAndUnlockBadges, recalculateCoins } from '../../utils/gamification';
import { getCustomProfile } from '../../utils/storage';
import { getTelegramUser, triggerHaptic } from '../../utils/telegram';

interface PostExamActionsProps {
  resultId: string;
  examType: 'ielts' | 'multilevel';
  moduleName: string;
  headlineScore: string;
  subtitle: string;
  criteria: ScoreCriterionBar[];
  weakSkill: WeakSkillKey;
  weakDetail?: string;
  mistakesToSave?: Omit<MistakeEntry, 'id' | 'date' | 'reviewedCount'>[];
}

export const PostExamActions: React.FC<PostExamActionsProps> = ({
  resultId,
  examType,
  moduleName,
  headlineScore,
  subtitle,
  criteria,
  weakSkill,
  weakDetail,
  mistakesToSave = [],
}) => {
  const [showCard, setShowCard] = useState(false);
  const [taskAdded, setTaskAdded] = useState(false);
  const [savedMistakesCount, setSavedMistakesCount] = useState(0);

  useEffect(() => {
    if (!resultId) return;
    if (mistakesToSave.length > 0) {
      addMistakes(mistakesToSave);
      setSavedMistakesCount(mistakesToSave.length);
    }
    checkAndUnlockBadges();
    recalculateCoins();
  }, [resultId]);

  const tgUser = getTelegramUser();
  const custom = getCustomProfile();
  const candidateName = custom.displayName || tgUser?.first_name || 'Study Lab Nomzodi';
  const dateStr = new Date().toLocaleDateString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handleAddAutoTask = () => {
    if (taskAdded) return;
    createAutoTaskFromExam(examType, moduleName, weakSkill, weakDetail);
    setTaskAdded(true);
    triggerHaptic('medium');
  };

  return (
    <>
      <div className="bg-gradient-to-br from-indigo-50 via-white to-emerald-50 border border-indigo-100 rounded-3xl p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex items-center space-x-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black">
            <Coins size={14} className="text-amber-600" />
            <span>+{COINS_PER_ENGLISH_TEST} 🪙 Coin hisobingizga qo'shildi!</span>
          </div>

          {savedMistakesCount > 0 && (
            <div className="inline-flex items-center space-x-1 bg-rose-50 border border-rose-200 text-rose-700 px-2.5 py-1 rounded-full text-[11px] font-bold">
              <AlertCircle size={13} />
              <span>{savedMistakesCount} ta xato Konspektga saqlandi</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowCard(true);
            }}
            className="w-full py-3 px-4 rounded-2xl bg-[#0e0d1d] hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center space-x-2 shadow-md active:scale-95 transition-all"
          >
            <Award size={16} className="text-[#c4f82a]" />
            <span>Natija Kartasini Ulashish (PNG)</span>
          </button>

          <button
            type="button"
            onClick={handleAddAutoTask}
            disabled={taskAdded}
            className={`w-full py-3 px-4 rounded-2xl text-xs font-black flex items-center justify-center space-x-2 transition-all active:scale-95 ${
              taskAdded
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                : 'bg-[#7052ff] hover:bg-indigo-600 text-white shadow-md'
            }`}
          >
            {taskAdded ? <Check size={16} /> : <ListTodo size={16} />}
            <span>{taskAdded ? "Bugungi To-Do ga qo'shildi!" : "Zaif joyni To-Do ga qo'shish"}</span>
          </button>
        </div>
      </div>

      <ScoreCardModal
        isOpen={showCard}
        onClose={() => setShowCard(false)}
        examType={examType}
        moduleName={moduleName}
        headlineScore={headlineScore}
        subtitle={subtitle}
        dateStr={dateStr}
        candidateName={candidateName}
        criteria={criteria}
      />
    </>
  );
};
