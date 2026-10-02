export type TicketStatus = 'waiting' | 'called' | 'in_service' | 'completed' | 'no_show' | 'cancelled';

export type PriorityType = 'preferential' | 'general' | 'express' | 'commercial';

export interface ServiceCategory {
  id: string;
  code: string; // e.g. 'SP', 'SG', 'SE', 'SC'
  name: string;
  description: string;
  badge: string;
  color: {
    bg: string;
    border: string;
    text: string;
    glow: string;
    accent: string;
  };
  priorityWeight: number; // Higher numbers get priority
  targetWaitMinutes: number;
  iconName: 'heart-pulse' | 'users' | 'zap' | 'briefcase';
}

export interface Counter {
  id: string;
  number: number;
  name: string; // e.g. "Guichê 01"
  room?: string; // e.g. "Sala de Triagem", "Mesa 02"
  attendantName: string;
  status: 'available' | 'busy' | 'paused' | 'offline';
  currentTicketId?: string | null;
  allowedCategories: string[]; // Category codes handled by this counter, e.g. ['SP', 'SG']
}

export interface Ticket {
  id: string;
  number: number;
  displayNumber: string; // e.g. 'SP-001'
  categoryCode: string;
  categoryName: string;
  customerName?: string;
  customerDoc?: string;
  priorityType: PriorityType;
  status: TicketStatus;
  createdAt: number;
  calledAt?: number;
  serviceStartedAt?: number;
  completedAt?: number;
  counterId?: string;
  counterName?: string;
  attendantName?: string;
  callCount: number;
  notes?: string;
}

export interface CallEvent {
  id: string;
  ticket: Ticket;
  counterName: string;
  room?: string;
  timestamp: number;
  recalled?: boolean;
}

export type PriorityStrategy = 'preferential_first' | 'ratio_2_1' | 'ratio_3_1' | 'fifo';

export interface QueueSettings {
  businessName: string;
  unitName: string;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  speechRate: number;
  speechPitch: number;
  chimeVolume: number;
  priorityStrategy: PriorityStrategy;
  tvBannerMessage: string;
  autoCallEnabled: boolean;
}
