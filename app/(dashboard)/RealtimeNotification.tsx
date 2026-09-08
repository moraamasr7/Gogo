'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Volume2, VolumeX, ShoppingBag, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/types/database';
import toast from 'react-hot-toast';

export function RealtimeOrderNotification() {
  const router = useRouter();
  const supabase = createClient();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [latestOrder, setLatestOrder] = useState<Order | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play a gentle chime using Web Audio API (no external asset needed)
  const playNotificationSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Dual tone pleasant chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.15);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.35); // D6

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.15);
      osc1.stop(now + 0.15);
      osc2.stop(now + 0.6);
    } catch {
      // Audio context might be restricted before first user interaction
    }
  };

  useEffect(() => {
    // Subscribe to INSERT changes on orders table
    const channel = supabase
      .channel('realtime_admin_orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setLatestOrder(newOrder);
          playNotificationSound();

          // Refresh current route data smoothly
          router.refresh();

          // Display rich toast notification
          toast.custom(
            (t) => (
              <div
                className={`${
                  t.visible ? 'animate-enter' : 'animate-leave'
                } max-w-md w-full bg-stone-900 text-sand-50 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-brass-500/30 p-4`}
              >
                <div className="flex-1 w-0">
                  <div className="flex items-start">
                    <div className="shrink-0 pt-0.5">
                      <div className="w-10 h-10 rounded-xl bg-brass-500 text-stone-950 flex items-center justify-center font-bold">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mr-3 flex-1 text-right">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-brass-400">طلب جديد الآن! 🔔</p>
                        <span className="text-[10px] font-mono text-stone-400">
                          {newOrder.order_number}
                        </span>
                      </div>
                      <p className="text-sm font-extrabold text-white mt-1">
                        {newOrder.customer_name}
                      </p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        القيمة: <span className="text-sand-100 font-bold font-mono">{formatPrice(newOrder.total_amount)}</span> — العربون: <span className="text-brass-300 font-bold font-mono">{formatPrice(newOrder.deposit_amount)}</span>
                      </p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <button
                          onClick={() => {
                            toast.dismiss(t.id);
                            router.push(`/orders/${newOrder.id}`);
                          }}
                          className="px-3 py-1 rounded-lg bg-brass-500 text-stone-950 text-xs font-bold hover:bg-brass-400 transition-colors"
                        >
                          معاينة الطلب والإيصال
                        </button>
                        <button
                          onClick={() => toast.dismiss(t.id)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 text-stone-300 text-xs hover:bg-stone-700"
                        >
                          إغلاق
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ),
            { duration: 8000, position: 'top-left' }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router, soundEnabled]);

  return (
    <div className="flex items-center gap-2">
      {/* Sound Toggle Button */}
      <button
        type="button"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? 'صوت الإشعارات مفعّل' : 'صوت الإشعارات مكتوم'}
        className={`p-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
          soundEnabled
            ? 'bg-stone-800 border-stone-700 text-brass-400 hover:bg-stone-700'
            : 'bg-stone-900 border-stone-800 text-stone-500 hover:text-stone-300'
        }`}
      >
        {soundEnabled ? (
          <>
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px] font-bold">الصوت مفعّل</span>
          </>
        ) : (
          <>
            <VolumeX className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">مكتوم</span>
          </>
        )}
      </button>

      {/* Realtime Live Pulse Indicator */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-semibold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px]">مباشر Realtime</span>
      </div>
    </div>
  );
}
