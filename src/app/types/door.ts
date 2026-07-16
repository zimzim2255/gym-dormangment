// ─── SenseFace 3A/3B Terminal Types ────────────────────────────────────────
// Based on ZKTeco SenseFace 3 Series specification:
// - Visible Light Facial Authentication
// - In-glass Fingerprint Authentication (Z-ID)
// - RFID (125kHz ID / 13.56MHz IC)
// - Password (Virtual Keypad)
// - SIP Video Intercom (Version 2.0)
// - ONVIF Protocol Support
// - Wiegand Input/Output, RS485, TCP/IP, Wi-Fi

export type AuthMethod = "fingerprint" | "face" | "qr" | "rfid" | "password";

export type AccessDecision = "GRANTED" | "DENIED" | "PENDING_PAYMENT" | "ERROR";

export type SessionStatus = "pending" | "approved" | "denied" | "error" | "expired";

export type TerminalModel = "SenseFace_3A" | "SenseFace_3B";

export type CommunicationProtocol = "REST" | "WEBSOCKET" | "PUSH" | "BEST";

export interface TerminalConfig {
  id: string;                    // Unique terminal ID (e.g., "TERMINAL_001")
  model: TerminalModel;          // SenseFace 3A or 3B
  ipAddress: string;             // e.g. "192.168.1.100"
  port: number;                  // Default: 4370
  protocol: CommunicationProtocol;
  firmwareVersion: string;
  location: string;              // e.g. "Main Entrance", "Side Door"
  isOnline: boolean;
  lastHeartbeat: Date | null;
  wifiEnabled: boolean;
  rs485Enabled: boolean;
  wiegandMode: "input" | "output" | "disabled";
  sipEnabled: boolean;
  onvifEnabled: boolean;
}

export interface AccessAttempt {
  memberId: string;
  accessTime: string;            // ISO DateTime
  method: AuthMethod;
  deviceId: string;              // Terminal ID
  signal?: string;               // Encrypted biometric data
  qrCode?: string;               // QR data if method is "qr"
  rfidCard?: string;             // RFID UID if method is "rfid"
  confidence?: number;           // Face/fingerprint matching confidence %
}

export interface AccessSession {
  sessionId: string;             // Unique session ID (e.g., "sess_1721147445_door1_adh001")
  memberId: string;
  timestamp: Date;
  method: AuthMethod;
  deviceId: string;
  status: SessionStatus;
  decision?: AccessDecision;
  decisionMessage?: string;
  remainingAmount?: number;      // Remaining DH to pay
  executionTimeMs?: number;
  retryCount: number;
  loggedAt?: Date;
}

export interface AccessDecisionResponse {
  sessionId: string;
  decision: AccessDecision;
  memberId: string;
  message: string;
  remaining: number;             // Remaining amount to pay
  executionTime: string;         // e.g. "245ms"
}

export interface OfflineQueueItem {
  sessionId: string;
  attempt: AccessAttempt;
  timestamp: Date;
  synced: boolean;
  retryCount: number;
}

export interface AccessLogEntry {
  id: string;                    // Auto-increment ID
  sessionId: string;
  memberId: string;
  memberName: string;
  phone: string;
  subscriptionType: string;
  date: string;
  time: string;
  status: "Autorisé" | "Expiré" | "Paiement restant" | "Refusé";
  remaining: number;
  device: string;
  method: AuthMethod;
  deviceId: string;
  confidence?: number;
}

export interface DashboardStats {
  totalToday: number;
  authorizedToday: number;
  deniedToday: number;
  pendingPaymentsToday: number;
  activeTerminals: number;
  offlineTerminals: number;
  peakHour: string;
  averageEntryTime: string;
}

// ZKTeco SenseFace 3 Series specific data
export const SENSEFACE_SPECS = {
  "SenseFace_3A": {
    display: "2.8\" TFT Color Touch LED Screen (240x320)",
    camera: "WDR Binocular Camera @ 1MP",
    cpu: "Dual Core@1GHz",
    ram: "512MB",
    storage: "8GB",
    fingerprintSensor: "In-Glass Fingerprint (Z-ID)",
    fingerprintCapacity: 6000,
    faceCapacity: 3000,
    cardCapacity: 6000,
    userCapacity: 6000,
    transactionCapacity: 150000,
    faceAuthSpeed: "< 0.35 sec",
    fingerprintAuthSpeed: "< 0.5 sec",
    faceAuthDistance: "30cm to 200cm",
    far: "≤ 0.01% (Face), ≤ 0.0001% (Fingerprint)",
    frr: "≤ 0.02% (Face), ≤ 0.01% (Fingerprint)",
    algorithm: "ZKFace V4.0 / ZKFingerprint V13.0",
    ipRating: "IP65",
    operatingTemp: "-5°C to 45°C",
    dimensions: "166mm × 63mm × 25mm",
    weight: "0.185 Kg",
    powerSupply: "DC 12V 3A",
    authMethods: ["fingerprint", "face", "rfid", "password"] as AuthMethod[],
    communication: ["TCP/IP", "Wi-Fi", "Wiegand", "RS485", "USB"] as string[],
  },
  "SenseFace_3B": {
    display: "2.8\" TFT Color Touch LED Screen (240x320)",
    camera: "WDR Binocular Camera @ 1MP",
    cpu: "Dual Core@1GHz",
    ram: "512MB",
    storage: "8GB",
    fingerprintSensor: "None",
    faceCapacity: 3000,
    cardCapacity: 6000,
    userCapacity: 6000,
    transactionCapacity: 150000,
    faceAuthSpeed: "< 0.35 sec",
    faceAuthDistance: "30cm to 200cm",
    far: "≤ 0.01% (Face)",
    frr: "≤ 0.02% (Face)",
    algorithm: "ZKFace V4.0",
    ipRating: "IP65",
    operatingTemp: "-5°C to 45°C",
    dimensions: "166mm × 63mm × 25mm",
    weight: "0.185 Kg",
    powerSupply: "DC 12V 3A",
    authMethods: ["face", "rfid", "password"] as AuthMethod[],
    communication: ["TCP/IP", "Wi-Fi", "Wiegand", "RS485", "USB"] as string[],
  },
};