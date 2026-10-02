import { ServiceCategory, Counter, Ticket, QueueSettings, CallEvent } from '../types/queue';

export const DEFAULT_CATEGORIES: ServiceCategory[] = [
  {
    id: 'cat-sp',
    code: 'SP',
    name: 'Atendimento Prioritário',
    description: 'Lei nº 10.048: Idosos 60+, Gestantes, PCD, Autistas (TEA) e Lactantes',
    badge: 'Prioritário',
    color: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-600/40',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-900/30',
      accent: 'emerald',
    },
    priorityWeight: 10,
    targetWaitMinutes: 15,
    iconName: 'heart-pulse',
  },
  {
    id: 'cat-sg',
    code: 'SG',
    name: 'Atendimento Geral',
    description: 'Consultas gerais, serviços cadastrais, informações e solicitações regulares',
    badge: 'Convencional',
    color: {
      bg: 'bg-blue-950/40',
      border: 'border-blue-600/40',
      text: 'text-blue-400',
      glow: 'shadow-blue-900/30',
      accent: 'blue',
    },
    priorityWeight: 1,
    targetWaitMinutes: 30,
    iconName: 'users',
  },
  {
    id: 'cat-se',
    code: 'SE',
    name: 'Atendimento Expresso',
    description: 'Retirada rápida de exames, documentos prontos, assinaturas e pagamentos simples',
    badge: 'Rápido',
    color: {
      bg: 'bg-amber-950/40',
      border: 'border-amber-600/40',
      text: 'text-amber-400',
      glow: 'shadow-amber-900/30',
      accent: 'amber',
    },
    priorityWeight: 5,
    targetWaitMinutes: 10,
    iconName: 'zap',
  },
  {
    id: 'cat-sc',
    code: 'SC',
    name: 'Comercial & Especializado',
    description: 'Negociações, contratos, abertura de cadastro e orientações especializadas',
    badge: 'Comercial',
    color: {
      bg: 'bg-violet-950/40',
      border: 'border-violet-600/40',
      text: 'text-violet-400',
      glow: 'shadow-violet-900/30',
      accent: 'violet',
    },
    priorityWeight: 3,
    targetWaitMinutes: 20,
    iconName: 'briefcase',
  },
];

export const DEFAULT_COUNTERS: Counter[] = [
  {
    id: 'cnt-1',
    number: 1,
    name: 'Guichê 01',
    room: 'Térreo - Setor A',
    attendantName: 'Fernanda Oliveira',
    status: 'available',
    currentTicketId: null,
    allowedCategories: ['SP', 'SG', 'SE', 'SC'],
  },
  {
    id: 'cnt-2',
    number: 2,
    name: 'Guichê 02',
    room: 'Térreo - Setor A',
    attendantName: 'Carlos Eduardo',
    status: 'available',
    currentTicketId: null,
    allowedCategories: ['SP', 'SG'],
  },
  {
    id: 'cnt-3',
    number: 3,
    name: 'Guichê 03',
    room: 'Térreo - Setor B',
    attendantName: 'Mariana Duarte',
    status: 'available',
    currentTicketId: null,
    allowedCategories: ['SE', 'SG'],
  },
  {
    id: 'cnt-4',
    number: 4,
    name: 'Mesa 04',
    room: '1º Andar - Negócios',
    attendantName: 'Rodrigo Guimarães',
    status: 'available',
    currentTicketId: null,
    allowedCategories: ['SC', 'SP'],
  },
];

export const DEFAULT_SETTINGS: QueueSettings = {
  businessName: 'Centro de Atendimento Integrado',
  unitName: 'Unidade Central - Atendimento ao Cidadão',
  soundEnabled: true,
  voiceEnabled: true,
  speechRate: 0.95,
  speechPitch: 1.0,
  chimeVolume: 0.85,
  priorityStrategy: 'ratio_2_1',
  tvBannerMessage: 'Atenção aos painéis de chamada • Tenha em mãos documento oficial com foto e comprovante',
  autoCallEnabled: false,
};

const STORAGE_KEYS = {
  TICKETS: 'fila_express_tickets_v1',
  COUNTERS: 'fila_express_counters_v1',
  CATEGORIES: 'fila_express_categories_v1',
  SETTINGS: 'fila_express_settings_v1',
  CALL_HISTORY: 'fila_express_calls_v1',
  ACTIVE_CALL: 'fila_express_active_call_v1',
};

export function seedInitialTickets(): Ticket[] {
  const now = Date.now();
  const sampleTickets: Ticket[] = [
    {
      id: 't-101',
      number: 1,
      displayNumber: 'SP-001',
      categoryCode: 'SP',
      categoryName: 'Atendimento Prioritário',
      customerName: 'Dona Maria de Lourdes',
      customerDoc: '***.482.910-**',
      priorityType: 'preferential',
      status: 'completed',
      createdAt: now - 45 * 60 * 1000,
      calledAt: now - 35 * 60 * 1000,
      serviceStartedAt: now - 34 * 60 * 1000,
      completedAt: now - 22 * 60 * 1000,
      counterId: 'cnt-1',
      counterName: 'Guichê 01',
      attendantName: 'Fernanda Oliveira',
      callCount: 1,
      notes: 'Atendimento prioritário concluído com emissão de certidão.',
    },
    {
      id: 't-102',
      number: 1,
      displayNumber: 'SG-001',
      categoryCode: 'SG',
      categoryName: 'Atendimento Geral',
      customerName: 'Roberto Alves',
      customerDoc: '***.193.882-**',
      priorityType: 'general',
      status: 'completed',
      createdAt: now - 40 * 60 * 1000,
      calledAt: now - 25 * 60 * 1000,
      serviceStartedAt: now - 24 * 60 * 1000,
      completedAt: now - 12 * 60 * 1000,
      counterId: 'cnt-2',
      counterName: 'Guichê 02',
      attendantName: 'Carlos Eduardo',
      callCount: 1,
    },
    {
      id: 't-103',
      number: 2,
      displayNumber: 'SP-002',
      categoryCode: 'SP',
      categoryName: 'Atendimento Prioritário',
      customerName: 'Antônio Ferreira (PCD)',
      customerDoc: '***.331.028-**',
      priorityType: 'preferential',
      status: 'called',
      createdAt: now - 18 * 60 * 1000,
      calledAt: now - 2 * 60 * 1000,
      counterId: 'cnt-1',
      counterName: 'Guichê 01',
      attendantName: 'Fernanda Oliveira',
      callCount: 1,
    },
    {
      id: 't-104',
      number: 2,
      displayNumber: 'SG-002',
      categoryCode: 'SG',
      categoryName: 'Atendimento Geral',
      customerName: 'Juliana Costa',
      customerDoc: '***.729.110-**',
      priorityType: 'general',
      status: 'waiting',
      createdAt: now - 15 * 60 * 1000,
      callCount: 0,
    },
    {
      id: 't-105',
      number: 1,
      displayNumber: 'SE-001',
      categoryCode: 'SE',
      categoryName: 'Atendimento Expresso',
      customerName: 'Marcos Vinicius',
      priorityType: 'express',
      status: 'waiting',
      createdAt: now - 11 * 60 * 1000,
      callCount: 0,
    },
    {
      id: 't-106',
      number: 3,
      displayNumber: 'SP-003',
      categoryCode: 'SP',
      categoryName: 'Atendimento Prioritário',
      customerName: 'Beatriz Vasconcelos (Gestante)',
      priorityType: 'preferential',
      status: 'waiting',
      createdAt: now - 8 * 60 * 1000,
      callCount: 0,
    },
    {
      id: 't-107',
      number: 3,
      displayNumber: 'SG-003',
      categoryCode: 'SG',
      categoryName: 'Atendimento Geral',
      priorityType: 'general',
      status: 'waiting',
      createdAt: now - 5 * 60 * 1000,
      callCount: 0,
    },
    {
      id: 't-108',
      number: 1,
      displayNumber: 'SC-001',
      categoryCode: 'SC',
      categoryName: 'Comercial & Especializado',
      customerName: 'Luciano Prado (Empresarial)',
      priorityType: 'commercial',
      status: 'waiting',
      createdAt: now - 3 * 60 * 1000,
      callCount: 0,
    },
  ];
  return sampleTickets;
}

export function loadStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (!raw) {
      const initial = seedInitialTickets();
      saveStoredTickets(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return seedInitialTickets();
  }
}

export function saveStoredTickets(tickets: Ticket[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  } catch (e) {
    console.error('Failed saving tickets to localStorage', e);
  }
}

export function loadStoredCounters(): Counter[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COUNTERS);
    if (!raw) {
      saveStoredCounters(DEFAULT_COUNTERS);
      return DEFAULT_COUNTERS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_COUNTERS;
  }
}

export function saveStoredCounters(counters: Counter[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));
  } catch (e) {
    console.error('Failed saving counters to localStorage', e);
  }
}

export function loadStoredSettings(): QueueSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      saveStoredSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: QueueSettings) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed saving settings to localStorage', e);
  }
}

export function loadStoredCallHistory(): CallEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_HISTORY);
    if (!raw) {
      const tickets = loadStoredTickets();
      const called = tickets.filter(t => t.calledAt).sort((a, b) => (b.calledAt || 0) - (a.calledAt || 0));
      const initialHistory: CallEvent[] = called.map(t => ({
        id: `call-${t.id}-${t.calledAt}`,
        ticket: t,
        counterName: t.counterName || 'Guichê 01',
        room: 'Térreo',
        timestamp: t.calledAt || Date.now(),
      }));
      saveStoredCallHistory(initialHistory);
      return initialHistory;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveStoredCallHistory(history: CallEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.CALL_HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch (e) {
    console.error('Failed saving call history', e);
  }
}

export function loadActiveCall(): CallEvent | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_CALL);
    if (!raw) {
      const history = loadStoredCallHistory();
      return history.length > 0 ? history[0] : null;
    }
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveActiveCall(call: CallEvent | null) {
  try {
    if (call) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CALL, JSON.stringify(call));
    } else {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CALL);
    }
  } catch (e) {
    console.error('Failed saving active call', e);
  }
}
