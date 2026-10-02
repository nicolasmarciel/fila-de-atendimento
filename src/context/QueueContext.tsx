import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Ticket, Counter, ServiceCategory, QueueSettings, CallEvent } from '../types/queue';
import { DEFAULT_CATEGORIES, DEFAULT_COUNTERS, DEFAULT_SETTINGS } from '../utils/storage';
import { playCallAlert, playQueueChime } from '../utils/audio';

interface QueueContextType {
  tickets: Ticket[];
  counters: Counter[];
  categories: ServiceCategory[];
  settings: QueueSettings;
  activeCall: CallEvent | null;
  callHistory: CallEvent[];
  isCallFlashing: boolean;
  selectedCounterId: string;
  setSelectedCounterId: (id: string) => void;
  createTicket: (categoryCode: string, customerName?: string, customerDoc?: string) => Promise<Ticket>;
  callNextTicket: (counterId: string) => Promise<Ticket | null>;
  callSpecificTicket: (ticketId: string, counterId: string) => Promise<void>;
  recallTicket: (ticketId: string) => Promise<void>;
  startService: (ticketId: string) => Promise<void>;
  finishService: (ticketId: string, notes?: string) => Promise<void>;
  markNoShow: (ticketId: string) => Promise<void>;
  transferTicket: (ticketId: string, targetCategoryCode: string, targetCounterId?: string) => Promise<void>;
  updateSettings: (newSettings: Partial<QueueSettings>) => Promise<void>;
  updateCounter: (counterId: string, updates: Partial<Counter>) => Promise<void>;
  resetQueueDay: () => Promise<void>;
  loadScenario: (preset: 'clinica' | 'banco' | 'cartorio' | 'poupatempo') => Promise<void>;
  playTestChime: () => Promise<void>;
  isBackendConnected: boolean;
  metrics: {
    waitingTotal: number;
    waitingByCategory: Record<string, number>;
    inServiceCount: number;
    completedToday: number;
    noShowCount: number;
    avgWaitMinutes: number;
    avgServiceMinutes: number;
  };
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

const SYNC_CHANNEL_NAME = 'fila_express_broadcast_sync';

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [counters, setCounters] = useState<Counter[]>(DEFAULT_COUNTERS);
  const [categories, setCategories] = useState<ServiceCategory[]>(DEFAULT_CATEGORIES);
  const [settings, setSettings] = useState<QueueSettings>(DEFAULT_SETTINGS);
  const [activeCall, setActiveCall] = useState<CallEvent | null>(null);
  const [callHistory, setCallHistory] = useState<CallEvent[]>([]);
  const [isCallFlashing, setIsCallFlashing] = useState<boolean>(false);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('cnt-1');
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Sync across open browser tabs
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STATE_REFRESH') {
          fetchInitialData();
        } else if (type === 'NEW_CALL') {
          setActiveCall(payload.call);
          setCallHistory((prev) => [payload.call, ...prev.filter((c) => c.id !== payload.call.id)].slice(0, 30));
          setIsCallFlashing(true);
          setTimeout(() => setIsCallFlashing(false), 4500);

          playCallAlert(
            payload.call.ticket.displayNumber,
            payload.call.ticket.categoryName,
            payload.call.counterName,
            payload.call.room,
            payload.settings
          );
        }
      };

      return () => {
        channel.close();
      };
    }
  }, []);

  const notifyOtherTabs = useCallback((type: 'STATE_REFRESH' | 'NEW_CALL', payload?: unknown) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type, payload });
    }
  }, []);

  // Fetch initial state from Python Flask + SQLite backend
  const fetchInitialData = useCallback(async () => {
    try {
      const [ticketsRes, countersRes, catsRes, settingsRes, activeCallRes, historyRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/counters'),
        fetch('/api/categories'),
        fetch('/api/settings'),
        fetch('/api/calls/active'),
        fetch('/api/calls/history?limit=15'),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data);
      }
      if (countersRes.ok) {
        const data = await countersRes.json();
        setCounters(data);
      }
      if (catsRes.ok) {
        const data = await catsRes.json();
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      }
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
      if (activeCallRes.ok) {
        const data = await activeCallRes.json();
        if (data.call) setActiveCall(data.call);
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        if (Array.isArray(data)) setCallHistory(data);
      }
      setIsBackendConnected(true);
    } catch (err) {
      console.warn('Backend Python Flask indisponível momentaneamente:', err);
      setIsBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    // Poll updates every 4 seconds in case multiple attendants are acting concurrently
    const interval = setInterval(fetchInitialData, 4000);
    return () => clearInterval(interval);
  }, [fetchInitialData]);

  // Create new ticket (persisted in SQLite via Flask)
  const createTicket = useCallback(
    async (categoryCode: string, customerName?: string, customerDoc?: string): Promise<Ticket> => {
      try {
        const res = await fetch('/api/tickets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categoryCode, customerName, customerDoc }),
        });
        if (res.ok) {
          const newTicket = await res.json();
          setTickets((prev) => [...prev, newTicket]);
          notifyOtherTabs('STATE_REFRESH');
          return newTicket;
        }
      } catch (err) {
        console.error('Erro ao emitir senha no Flask:', err);
      }

      // Fallback
      const category = categories.find((c) => c.code === categoryCode) || categories[0];
      const nextNumber = tickets.filter((t) => t.categoryCode === categoryCode).length + 1;
      const fallbackTicket: Ticket = {
        id: `t-${Date.now()}`,
        number: nextNumber,
        displayNumber: `${categoryCode}-${String(nextNumber).padStart(3, '0')}`,
        categoryCode,
        categoryName: category.name,
        customerName,
        customerDoc,
        priorityType: categoryCode === 'SP' ? 'preferential' : 'general',
        status: 'waiting',
        createdAt: Date.now(),
        callCount: 0,
      };
      setTickets((prev) => [...prev, fallbackTicket]);
      return fallbackTicket;
    },
    [categories, tickets, notifyOtherTabs]
  );

  // Call Next Ticket (computed in Python Flask with SQLite)
  const callNextTicket = useCallback(
    async (counterId: string): Promise<Ticket | null> => {
      try {
        const counter = counters.find((c) => c.id === counterId);
        const res = await fetch('/api/call-next', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ counterId }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.ticket) {
            const calledTicket: Ticket = data.ticket;
            const callEvent: CallEvent = {
              id: data.call?.id || `call-${calledTicket.id}-${Date.now()}`,
              ticket: calledTicket,
              counterName: counter?.name || calledTicket.counterName || 'Guichê',
              room: counter?.room,
              timestamp: Date.now(),
              recalled: false,
            };

            setActiveCall(callEvent);
            setCallHistory((prev) => [callEvent, ...prev.filter((c) => c.ticket.id !== calledTicket.id)].slice(0, 30));
            setIsCallFlashing(true);
            setTimeout(() => setIsCallFlashing(false), 4500);

            // Update local ticket list & counter
            setTickets((prev) => prev.map((t) => (t.id === calledTicket.id ? calledTicket : t)));
            setCounters((prev) =>
              prev.map((c) => (c.id === counterId ? { ...c, status: 'busy', currentTicketId: calledTicket.id } : c))
            );

            // Audio & broadcast
            notifyOtherTabs('NEW_CALL', { call: callEvent, settings });
            await playCallAlert(
              calledTicket.displayNumber,
              calledTicket.categoryName,
              callEvent.counterName,
              callEvent.room,
              settings
            );

            return calledTicket;
          }
        }
      } catch (err) {
        console.error('Erro ao chamar próximo no backend Flask:', err);
      }
      return null;
    },
    [counters, settings, notifyOtherTabs]
  );

  // Call specific ticket directly
  const callSpecificTicket = useCallback(
    async (ticketId: string, counterId: string): Promise<void> => {
      try {
        const target = tickets.find((t) => t.id === ticketId);
        const counter = counters.find((c) => c.id === counterId);
        if (!target) return;

        const res = await fetch('/api/call-specific', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, counterId }),
        });

        if (res.ok) {
          const now = Date.now();
          const updatedTicket: Ticket = {
            ...target,
            status: 'called',
            calledAt: now,
            counterId: counter?.id,
            counterName: counter?.name,
            attendantName: counter?.attendantName,
            callCount: (target.callCount || 0) + 1,
          };

          const callEvent: CallEvent = {
            id: `call-${target.id}-${now}`,
            ticket: updatedTicket,
            counterName: counter?.name || 'Guichê',
            room: counter?.room,
            timestamp: now,
            recalled: target.callCount > 0,
          };

          setActiveCall(callEvent);
          setCallHistory((prev) => [callEvent, ...prev.filter((c) => c.ticket.id !== target.id)].slice(0, 30));
          setIsCallFlashing(true);
          setTimeout(() => setIsCallFlashing(false), 4500);

          setTickets((prev) => prev.map((t) => (t.id === target.id ? updatedTicket : t)));
          setCounters((prev) =>
            prev.map((c) => (c.id === counterId ? { ...c, status: 'busy', currentTicketId: target.id } : c))
          );

          notifyOtherTabs('NEW_CALL', { call: callEvent, settings });
          await playCallAlert(
            updatedTicket.displayNumber,
            updatedTicket.categoryName,
            callEvent.counterName,
            callEvent.room,
            settings
          );
        }
      } catch (err) {
        console.error('Erro em callSpecificTicket:', err);
      }
    },
    [tickets, counters, settings, notifyOtherTabs]
  );

  // Recall ticket
  const recallTicket = useCallback(
    async (ticketId: string): Promise<void> => {
      try {
        const target = tickets.find((t) => t.id === ticketId);
        if (!target) return;

        await fetch('/api/recall', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId }),
        });

        const now = Date.now();
        const callEvent: CallEvent = {
          id: `recall-${target.id}-${now}`,
          ticket: { ...target, callCount: target.callCount + 1, calledAt: now },
          counterName: target.counterName || 'Guichê',
          timestamp: now,
          recalled: true,
        };

        setActiveCall(callEvent);
        setCallHistory((prev) => [callEvent, ...prev.filter((c) => c.ticket.id !== target.id)].slice(0, 30));
        setIsCallFlashing(true);
        setTimeout(() => setIsCallFlashing(false), 4500);

        setTickets((prev) =>
          prev.map((t) => (t.id === target.id ? { ...t, callCount: t.callCount + 1, calledAt: now } : t))
        );

        notifyOtherTabs('NEW_CALL', { call: callEvent, settings });
        await playCallAlert(
          target.displayNumber,
          target.categoryName,
          target.counterName || 'Guichê',
          undefined,
          settings
        );
      } catch (err) {
        console.error('Erro ao rechamar:', err);
      }
    },
    [tickets, settings, notifyOtherTabs]
  );

  // Start service
  const startService = useCallback(
    async (ticketId: string) => {
      try {
        await fetch('/api/service/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId }),
        });
        const now = Date.now();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: 'in_service', serviceStartedAt: now } : t))
        );
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao iniciar atendimento:', err);
      }
    },
    [notifyOtherTabs]
  );

  // Finish service
  const finishService = useCallback(
    async (ticketId: string, notes?: string) => {
      try {
        await fetch('/api/service/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, notes }),
        });
        const now = Date.now();
        setTickets((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, status: 'completed', completedAt: now, notes } : t))
        );
        setCounters((prev) =>
          prev.map((c) => (c.currentTicketId === ticketId ? { ...c, status: 'available', currentTicketId: null } : c))
        );
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao finalizar atendimento:', err);
      }
    },
    [notifyOtherTabs]
  );

  // Mark No-show
  const markNoShow = useCallback(
    async (ticketId: string) => {
      try {
        await fetch('/api/service/no-show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId }),
        });
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: 'no_show' } : t)));
        setCounters((prev) =>
          prev.map((c) => (c.currentTicketId === ticketId ? { ...c, status: 'available', currentTicketId: null } : c))
        );
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao registrar ausência:', err);
      }
    },
    [notifyOtherTabs]
  );

  // Transfer ticket
  const transferTicket = useCallback(
    async (ticketId: string, targetCategoryCode: string, targetCounterId?: string) => {
      try {
        await fetch('/api/transfer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId, targetCategoryCode, targetCounterId }),
        });
        fetchInitialData();
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao transferir senha:', err);
      }
    },
    [fetchInitialData, notifyOtherTabs]
  );

  // Update Settings
  const updateSettings = useCallback(
    async (newSettings: Partial<QueueSettings>) => {
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });
        setSettings((prev) => ({ ...prev, ...newSettings }));
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao salvar configurações no Flask:', err);
      }
    },
    [notifyOtherTabs]
  );

  // Update Counter
  const updateCounter = useCallback(
    async (counterId: string, updates: Partial<Counter>) => {
      try {
        await fetch(`/api/counters/${counterId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        setCounters((prev) => prev.map((c) => (c.id === counterId ? { ...c, ...updates } : c)));
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao atualizar guichê no Flask:', err);
      }
    },
    [notifyOtherTabs]
  );

  // Reset Queue Day
  const resetQueueDay = useCallback(async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
      setTickets([]);
      setCallHistory([]);
      setActiveCall(null);
      setCounters((prev) => prev.map((c) => ({ ...c, status: 'available', currentTicketId: null })));
      notifyOtherTabs('STATE_REFRESH');
    } catch (err) {
      console.error('Erro ao reiniciar fila:', err);
    }
  }, [notifyOtherTabs]);

  // Load Scenario
  const loadScenario = useCallback(
    async (preset: 'clinica' | 'banco' | 'cartorio' | 'poupatempo') => {
      try {
        await fetch('/api/scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset }),
        });
        await fetchInitialData();
        notifyOtherTabs('STATE_REFRESH');
      } catch (err) {
        console.error('Erro ao carregar cenário:', err);
      }
    },
    [fetchInitialData, notifyOtherTabs]
  );

  const playTestChime = useCallback(async () => {
    await playQueueChime(settings.chimeVolume);
  }, [settings.chimeVolume]);

  // Live Metrics
  const metrics = useMemo(() => {
    const waitingTickets = tickets.filter((t) => t.status === 'waiting');
    const waitingTotal = waitingTickets.length;
    const waitingByCategory: Record<string, number> = {};

    categories.forEach((cat) => {
      waitingByCategory[cat.code] = waitingTickets.filter((t) => t.categoryCode === cat.code).length;
    });

    const inServiceCount = tickets.filter((t) => t.status === 'in_service' || t.status === 'called').length;
    const completedToday = tickets.filter((t) => t.status === 'completed').length;
    const noShowCount = tickets.filter((t) => t.status === 'no_show').length;

    const ticketsWithWait = tickets.filter((t) => t.calledAt && t.createdAt);
    const avgWaitMinutes =
      ticketsWithWait.length > 0
        ? Math.round(
            ticketsWithWait.reduce((acc, t) => acc + ((t.calledAt || 0) - t.createdAt) / 60000, 0) /
              ticketsWithWait.length
          )
        : 12;

    const ticketsWithService = tickets.filter((t) => t.completedAt && t.serviceStartedAt);
    const avgServiceMinutes =
      ticketsWithService.length > 0
        ? Math.round(
            ticketsWithService.reduce((acc, t) => acc + ((t.completedAt || 0) - (t.serviceStartedAt || 0)) / 60000, 0) /
              ticketsWithService.length
          )
        : 8;

    return {
      waitingTotal,
      waitingByCategory,
      inServiceCount,
      completedToday,
      noShowCount,
      avgWaitMinutes,
      avgServiceMinutes,
    };
  }, [tickets, categories]);

  return (
    <QueueContext.Provider
      value={{
        tickets,
        counters,
        categories,
        settings,
        activeCall,
        callHistory,
        isCallFlashing,
        selectedCounterId,
        setSelectedCounterId,
        createTicket,
        callNextTicket,
        callSpecificTicket,
        recallTicket,
        startService,
        finishService,
        markNoShow,
        transferTicket,
        updateSettings,
        updateCounter,
        resetQueueDay,
        loadScenario,
        playTestChime,
        isBackendConnected,
        metrics,
      }}
    >
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = (): QueueContextType => {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
