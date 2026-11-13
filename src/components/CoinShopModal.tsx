import React, { useEffect, useState } from 'react';
import { Coins, X, Snowflake, Ticket, Sparkles, Check, Gift } from 'lucide-react';
import {
  SHOP_ITEMS,
  loadInventory,
  hasClaimedDailyBonusToday,
  claimDailyBonus,
  buyOrEquipShopItem,
  getFrameClasses,
  getFrameBadge,
  type UserInventory,
} from '../utils/shop';
import { getUserCoins, recalculateCoins } from '../utils/gamification';
import { getTelegramUser, triggerHaptic } from '../utils/telegram';

interface CoinShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryChange?: () => void;
}

export const CoinShopModal: React.FC<CoinShopModalProps> = ({
  isOpen,
  onClose,
  onInventoryChange,
}) => {
  const [inventory, setInventory] = useState<UserInventory>(() => loadInventory());
  const [coins, setCoins] = useState<number>(() => getUserCoins());
  const [claimedToday, setClaimedToday] = useState<boolean>(() => hasClaimedDailyBonusToday());
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const refreshState = () => {
    const updatedCoins = recalculateCoins();
    setCoins(updatedCoins);
    setInventory(loadInventory());
    setClaimedToday(hasClaimedDailyBonusToday());
  };

  useEffect(() => {
    if (isOpen) {
      refreshState();
      setToast(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tgUser = getTelegramUser();
  const initials = (tgUser?.first_name || 'U').charAt(0).toUpperCase();

  const handleClaimDaily = () => {
    const res = claimDailyBonus();
    if (!res.claimed) {
      triggerHaptic('light');
      setToast({ text: 'Bugungi bonusni allaqachon olgansiz ✅', ok: false });
      return;
    }
    triggerHaptic('heavy');
    refreshState();
    onInventoryChange?.();
    setToast({ text: `Kunlik bonus: +${res.bonus} 🪙 hisobingizga qo‘shildi!`, ok: true });
  };

  const handleItemAction = (itemId: string) => {
    const result = buyOrEquipShopItem(itemId, coins);
    if (result.ok) {
      triggerHaptic('heavy');
      refreshState();
      onInventoryChange?.();
    } else {
      triggerHaptic('light');
    }
    setToast({ text: result.message, ok: result.ok });
  };

  const perkItems = SHOP_ITEMS.filter((i) => i.category === 'perk');
  const frameItems = SHOP_ITEMS.filter((i) => i.category === 'frame');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#121124] border border-white/15 text-white w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[2rem] p-5 sm:p-6 space-y-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Coins size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">Coin Do‘koni</h3>
              <p className="text-[11px] text-slate-400 font-medium">Himoya, chipta va profil ramkalari</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-black flex items-center gap-1">
              <span>🪙</span>
              <span>{coins}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Toast feedback */}
        {toast && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold border ${
              toast.ok
                ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                : 'bg-rose-500/15 border-rose-400/35 text-rose-300'
            }`}
          >
            {toast.text}
          </div>
        )}

        {/* Daily Check-in Bonus Banner */}
        <div className="rounded-2xl p-4 bg-gradient-to-r from-[#1e1a4a] to-[#15283a] border border-indigo-400/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#c4f82a]/15 border border-[#c4f82a]/30 flex items-center justify-center text-[#c4f82a] shrink-0">
              <Gift size={20} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-black text-white">Kunlik Check-in Bonus</h4>
              <p className="text-[10px] text-slate-300 truncate">
                Har kuni ilovaga kirganingiz uchun +2 🪙 sovg‘a
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClaimDaily}
            disabled={claimedToday}
            className={`shrink-0 px-3.5 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
              claimedToday
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 cursor-default'
                : 'bg-[#c4f82a] text-[#0e0d1d] hover:brightness-110 shadow-[0_0_16px_rgba(196,248,42,0.3)]'
            }`}
          >
            {claimedToday ? 'Olingan ✓' : '+2 🪙 Olish'}
          </button>
        </div>

        {/* Inventory Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-sky-400 text-xs font-black">
              <Snowflake size={13} />
              <span>{inventory.streakFreezes}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Freeze
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-purple-400 text-xs font-black">
              <Ticket size={13} />
              <span>{inventory.mockTickets}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              VIP Chipta
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 border border-white/10 p-2.5 text-center">
            <div className="flex items-center justify-center gap-1 text-[#c4f82a] text-xs font-black">
              <Sparkles size={13} />
              <span>{getFrameBadge(inventory.activeFrame) || 'Oddiy'}</span>
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
              Ramka
            </p>
          </div>
        </div>

        {/* Perks section */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Foydali imkoniyatlar
          </h4>
          {perkItems.map((item) => {
            const affordable = coins >= item.price;
            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white truncate">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{item.desc}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleItemAction(item.id)}
                  className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                    affordable
                      ? 'bg-[#7052ff] hover:bg-[#5e3df5] text-white'
                      : 'bg-white/10 text-slate-400'
                  }`}
                >
                  {item.price} 🪙
                </button>
              </div>
            );
          })}
        </div>

        {/* Avatar Frames section */}
        <div className="space-y-2.5">
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Profil ramkalari
          </h4>
          {frameItems.map((item) => {
            const unlocked = item.frameId ? inventory.unlockedFrames.includes(item.frameId) : false;
            const equipped = item.frameId ? inventory.activeFrame === item.frameId : false;
            const affordable = coins >= item.price;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-white/5 border border-white/10 p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full bg-indigo-950 flex items-center justify-center text-sm font-black text-white shrink-0 ${getFrameClasses(
                      item.frameId
                    )}`}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-black text-white flex items-center gap-1">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.title}</span>
                    </h5>
                    <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">{item.desc}</p>
                  </div>
                </div>

                {equipped ? (
                  <span className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/35 text-emerald-300 text-[10px] font-black flex items-center gap-1">
                    <Check size={12} />
                    <span>Faol</span>
                  </span>
                ) : unlocked ? (
                  <button
                    type="button"
                    onClick={() => handleItemAction(item.id)}
                    className="shrink-0 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-black transition-all active:scale-95"
                  >
                    Taqish
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleItemAction(item.id)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-black transition-all active:scale-95 ${
                      affordable
                        ? 'bg-[#c4f82a] text-[#0e0d1d] hover:brightness-110'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {item.price} 🪙
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
