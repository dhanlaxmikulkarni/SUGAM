import { useEffect, useMemo, useRef, useState } from "react";
import {
  Sprout, Factory, ArrowRight, ArrowLeft, CheckCircle2, MapPin, Users,
  Package, Truck, IndianRupee, Award, Star, MessageSquare, Leaf, BarChart3,
  Recycle, Zap, ShieldCheck, Search, Bell, ChevronRight, ChevronDown, ChevronUp, Clock, TrendingUp,
  Globe2, CircleHelp, Plus, X, Phone, CalendarDays, Gauge, Handshake,
  Wheat, FileText, Activity, Route, Sparkles, Menu, Home as HomeIcon, UserRound,
  Building2, CircleDollarSign, Boxes, Info, SlidersHorizontal,
  Navigation, RadioTower, Milestone, CircleDot, PlayCircle, PauseCircle, RotateCcw, Signal,
  QrCode, ScanLine, BadgeCheck, XCircle, ClipboardList, Fingerprint, Copy,
  LogOut, Download, KeyRound
} from "lucide-react";

const C = {
  green: "#174A35",
  green2: "#2F7D4A",
  green3: "#5E9F6B",
  gold: "#C89B4A",
  goldSoft: "#F3E8CF",
  cream: "#F7F4EC",
  paper: "#FFFDF8",
  ink: "#17231D",
  muted: "#6D786F",
  line: "#E3E0D5",
  blue: "#2F6078",
  blueSoft: "#EAF2F5",
  red: "#A94E35",
  redSoft: "#F9E9E3",
  shadow: "0 16px 40px rgba(23,74,53,.08)",
};

const WASTE_TYPES = ["Bagasse", "Sugarcane Leaves", "Press Mud", "Cane Trash"];

const STEPS = [
  { n: "01", label: "Residue Details", icon: Sprout },
  { n: "02", label: "Analysis", icon: Sparkles },
  { n: "03", label: "Utilization", icon: Handshake },
  { n: "04", label: "Industry Match", icon: Factory },
];

const METHODS = {
  Bagasse: [
    { method: "Paper & Pulp", score: 92, co2: .72, value: "High", icon: FileText, reason: "Bagasse fibre can replace part of virgin wood pulp in paper and board production." },
    { method: "Cogeneration Power", score: 84, co2: .65, value: "Medium", icon: Zap, reason: "Dry bagasse can support steam and electricity generation at suitable facilities." },
    { method: "Biomaterial Products", score: 78, co2: .52, value: "Medium", icon: Recycle, reason: "Fibre can be processed into packaging and other bio-based products." },
  ],
  "Sugarcane Leaves": [
    { method: "Biogas & Energy", score: 88, co2: .63, value: "Medium", icon: Zap, reason: "Organic residue can become a feedstock for anaerobic digestion." },
    { method: "Paper & Pulp", score: 81, co2: .50, value: "Medium", icon: FileText, reason: "Leaf fibre can be blended into suitable pulp applications." },
    { method: "Biomaterial Products", score: 76, co2: .46, value: "Medium", icon: Recycle, reason: "Processed fibre can be used in boards and bio-based packaging." },
  ],
  "Press Mud": [
    { method: "Bio-fertilizer", score: 94, co2: .66, value: "High", icon: Sprout, reason: "Press mud can be composted or processed into a nutrient-rich soil amendment." },
    { method: "Biogas & Energy", score: 85, co2: .58, value: "Medium", icon: Zap, reason: "Its moisture and organic content can support anaerobic digestion." },
  ],
  "Cane Trash": [
    { method: "Biofuel Briquetting", score: 83, co2: .48, value: "Medium", icon: Recycle, reason: "Dry cane trash can be densified into fuel briquettes for suitable users." },
    { method: "Industrial Kiln Fuel", score: 70, co2: .35, value: "Medium", icon: Factory, reason: "Prepared biomass can be used as an alternative industrial fuel where permitted." },
  ],
};

const DEMO_INDUSTRIES = [
  { id: "demo-paper", name: "Sahyadri Paper Works", type: "Paper & Pulp", wasteType: "Bagasse", location: "Pune", distance: 18, demand: 30, rate: 1650, contact: "Aniket Joshi", verified: true },
  { id: "demo-power", name: "GreenGrid Energy", type: "Cogeneration Power", wasteType: "Bagasse", location: "Baramati", distance: 27, demand: 80, rate: 1250, contact: "Neha Patil", verified: true },
  { id: "demo-bio", name: "Krishi BioInputs", type: "Bio-fertilizer", wasteType: "Press Mud", location: "Satara", distance: 32, demand: 40, rate: 1100, contact: "Rahul More", verified: true },
];

// Demo farmer supply listings shown to Industry users in Supply Discovery /
// Matches — illustrative, clearly-labelled demo data, exactly analogous to
// DEMO_INDUSTRIES on the farmer side. The signed-in farmer's own live surplus
// (if any) is merged in alongside these at render time, not stored here.
const DEMO_FARMER_SUPPLY = [
  { id: "demo-farmer-1", name: "Vitthal Shinde", location: "Baramati, Maharashtra", wasteType: "Bagasse", quantity: 14, distance: 22, rate: 1300, verified: true, availableFrom: "Within a week", qualitySummary: "Low moisture • Clean" },
  { id: "demo-farmer-2", name: "Sunita Jadhav", location: "Karad, Maharashtra", wasteType: "Press Mud", quantity: 9, distance: 34, rate: 1050, verified: true, availableFrom: "Available now", qualitySummary: "Medium moisture • Some soil mixed in" },
  { id: "demo-farmer-3", name: "Ramesh More", location: "Satara, Maharashtra", wasteType: "Sugarcane Leaves", quantity: 11, distance: 29, rate: 950, verified: false, availableFrom: "Within 2 weeks", qualitySummary: "Covered & dry storage" },
  { id: "demo-farmer-4", name: "Anil Kadam", location: "Kolhapur, Maharashtra", wasteType: "Cane Trash", quantity: 8, distance: 41, rate: 850, verified: true, availableFrom: "Available now", qualitySummary: "Open field storage" },
  { id: "demo-farmer-5", name: "Prakash Pawar", location: "Pune, Maharashtra", wasteType: "Bagasse", quantity: 19, distance: 15, rate: 1300, verified: true, availableFrom: "Available now", qualitySummary: "Low moisture • Clean" },
];

// Builds the supply list shown to Industry users: the demo farmer network
// plus the signed-in farmer's own live transferable surplus (if any),
// computed with the exact same retention rule used on the Farmer side.
function buildFarmerSupplyList(farmer, farmerReg) {
  const retention = computeRetention(farmer.wasteType, farmer.quantity, farmer.retainedOverride);
  const list = [...DEMO_FARMER_SUPPLY];
  if (retention.surplus > 0) {
    list.unshift({
      id: "live-farmer",
      name: farmerReg?.personal?.fullName || farmer.name || "SUGAM Farmer",
      location: farmer.location || "Not specified",
      wasteType: farmer.wasteType,
      quantity: retention.surplus,
      distance: 20,
      rate: MARKET_RATE_PER_TON[farmer.wasteType] || 1000,
      verified: !!(farmerReg?.kyc?.docNumber?.length > 3 && farmerReg?.bank?.accountNumber),
      availableFrom: farmer.availableFrom || "Not specified",
      qualitySummary: summarizeQuality(farmer),
      isLive: true,
    });
  }
  return list;
}

// ---------------------------------------------------------------------------
// DEMO LOGIN + DEMO DATA — used to instantly populate a presentation-ready
// account (farmer or industry) via the "Demo Login" option on the sign-in
// gate. Everything below is illustrative, clearly-labelled demo data built
// on the exact same shapes (`shipment`, `demand`, `registration`) the rest
// of SUGAM already uses — no separate/parallel data model.
// ---------------------------------------------------------------------------

// Fixed demo requirements published by the demo Industry account. Shipment
// records below reference these ids so Industry Transactions / Finance /
// Traceability / Tracker all show a populated, consistent picture.
const DEMO_INDUSTRY_DEMANDS = [
  { id: "demo-demand-1", residueType: "Bagasse", application: "Paper & Pulp", quantity: 60, rate: 1650, location: "Pune, Maharashtra", requiredDate: "Ongoing / monthly", qualityRequirements: "Moisture below 15%, clean loads only", recurring: true, status: "active", createdAt: Date.now() - 40 * 86400000, updatedAt: Date.now() - 2 * 86400000 },
  { id: "demo-demand-2", residueType: "Press Mud", application: "Bio-fertilizer", quantity: 35, rate: 1100, location: "Satara, Maharashtra", requiredDate: "Within 2 weeks", qualityRequirements: "Free from plastic/foreign contamination", recurring: true, status: "active", createdAt: Date.now() - 25 * 86400000, updatedAt: Date.now() - 5 * 86400000 },
  { id: "demo-demand-3", residueType: "Sugarcane Leaves", application: "Biogas & Energy", quantity: 20, rate: 950, location: "Kolhapur, Maharashtra", requiredDate: "Flexible", qualityRequirements: "Covered/dry storage preferred", recurring: false, status: "active", createdAt: Date.now() - 12 * 86400000, updatedAt: Date.now() - 1 * 86400000 },
];

// Helper to fill in a full shipment record (same shape as buildShipment's
// output) from a short set of demo-specific overrides, so every demo
// shipment is a complete, realistic record — nothing partially filled.
function demoShipment(seed, overrides) {
  const base = {
    id: `demo-shp-${seed}`,
    industryId: "demo-demand-1",
    industryName: "Sahyadri Paper Works",
    farmerName: "Demo Farmer",
    vehicleId: generateVehicleId(seed),
    driverName: generateDriverName(seed),
    residueType: "Bagasse",
    quantity: 10,
    origin: "Farm location",
    destination: "Industry site",
    distanceKm: 20,
    estTravelHours: 20 / AVG_TRUCK_SPEED_KMH,
    progress: 0,
    status: TRACKING_STAGES[0].key,
    createdAt: Date.now() - 6 * 86400000,
    industryAccepted: true,
    industryAcceptedAt: Date.now() - 5 * 86400000,
    passportId: generatePassportId("Bagasse", seed, Date.now()),
    transactionId: generateTransactionId(seed),
    qualitySummary: "Low moisture • Clean",
    qualityVerified: false,
    qualityVerifiedAt: null,
    paymentStatus: "pending",
    paymentAt: null,
    utilizationConfirmed: false,
    utilizationConfirmedAt: null,
    cancelled: false,
    cancelledAt: null,
    events: [makeShipmentEvent("REQUEST_SENT", "Connection request sent to industry", "Farmer", Date.now() - 6 * 86400000)],
    rate: 1650,
    grossAmount: 16500,
    transportCost: 1200,
    handlingCost: 400,
    netAmount: 14900,
  };
  const record = { ...base, ...overrides, isDemo: true };
  const events = [
    makeShipmentEvent("REQUEST_SENT", "Connection request sent to industry", "Farmer", record.createdAt),
  ];
  if (record.industryAccepted && record.industryAcceptedAt) events.push(makeShipmentEvent("INDUSTRY_ACCEPTED", "Industry accepted the request", "Industry", record.industryAcceptedAt));
  const currentStage = statusForProgress(record.progress || 0).key;
  if (record.industryAccepted && currentStage !== "SCHEDULED") events.push(makeShipmentEvent("TRACKING_STAGE", stageEventLabel(currentStage), "System", record.createdAt, "Demo shipment seeded at this stage"));
  if (record.qualityVerified && record.qualityVerifiedAt) events.push(makeShipmentEvent("QUALITY_VERIFIED", "Quality verified", "Industry", record.qualityVerifiedAt));
  if (record.paymentStatus === "completed" && record.paymentAt) events.push(makeShipmentEvent("PAYMENT_COMPLETED", "Payment completed", "Industry", record.paymentAt));
  if (record.utilizationConfirmed && record.utilizationConfirmedAt) events.push(makeShipmentEvent("UTILIZATION_CONFIRMED", "Utilization confirmed", "Industry", record.utilizationConfirmedAt));
  if (record.cancelled && record.cancelledAt) events.push(makeShipmentEvent("CANCELLED", "Transaction cancelled", "User", record.cancelledAt));
  return { ...record, events };
}

// A realistic, varied fleet covering every stage of the lifecycle so the
// Industry Goods/Shipment Tracker (and every other transaction-driven
// screen) looks populated the moment a demo account signs in.
function getDemoGoodsShipments() {
  return [
  demoShipment("1001", {
    industryId: "demo-demand-1", industryName: "Sahyadri Paper Works", farmerName: "Vitthal Shinde",
    residueType: "Bagasse", quantity: 14, origin: "Baramati, Maharashtra", destination: "Sahyadri Paper Works, Pune",
    distanceKm: 22, createdAt: Date.now() - 1 * 86400000, industryAccepted: false, industryAcceptedAt: null,
    progress: 0, rate: 1650, grossAmount: 23100, transportCost: 1320, handlingCost: 560, netAmount: 21220,
  }),
  demoShipment("1002", {
    industryId: "demo-demand-2", industryName: "Krishi BioInputs", farmerName: "Sunita Jadhav",
    residueType: "Press Mud", quantity: 9, origin: "Karad, Maharashtra", destination: "Krishi BioInputs, Satara",
    distanceKm: 34, createdAt: Date.now() - 3 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 2 * 86400000,
    progress: 0, rate: 1100, grossAmount: 9900, transportCost: 2040, handlingCost: 360, netAmount: 7500,
  }),
  demoShipment("1003", {
    industryId: "demo-demand-1", industryName: "Sahyadri Paper Works", farmerName: "Prakash Pawar",
    residueType: "Bagasse", quantity: 19, origin: "Pune, Maharashtra", destination: "Sahyadri Paper Works, Pune",
    distanceKm: 15, createdAt: Date.now() - 4 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 4 * 86400000,
    progress: 14, status: "ASSIGNED", rate: 1650, grossAmount: 31350, transportCost: 900, handlingCost: 760, netAmount: 29690,
  }),
  demoShipment("1004", {
    industryId: "demo-demand-3", industryName: "GreenGrid Energy", farmerName: "Ramesh More",
    residueType: "Sugarcane Leaves", quantity: 11, origin: "Satara, Maharashtra", destination: "GreenGrid Energy, Baramati",
    distanceKm: 29, createdAt: Date.now() - 6 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 6 * 86400000,
    progress: 64, status: "IN_TRANSIT", rate: 950, grossAmount: 10450, transportCost: 1740, handlingCost: 440, netAmount: 8270,
  }),
  demoShipment("1005", {
    industryId: "demo-demand-1", industryName: "Sahyadri Paper Works", farmerName: "Anil Kadam",
    residueType: "Bagasse", quantity: 8, origin: "Kolhapur, Maharashtra", destination: "Sahyadri Paper Works, Pune",
    distanceKm: 41, createdAt: Date.now() - 8 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 8 * 86400000,
    progress: 100, status: "DELIVERED", qualityVerified: false,
    rate: 1650, grossAmount: 13200, transportCost: 2460, handlingCost: 320, netAmount: 10420,
  }),
  demoShipment("1006", {
    industryId: "demo-demand-2", industryName: "Krishi BioInputs", farmerName: "Sunita Jadhav",
    residueType: "Press Mud", quantity: 12, origin: "Karad, Maharashtra", destination: "Krishi BioInputs, Satara",
    distanceKm: 34, createdAt: Date.now() - 12 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 12 * 86400000,
    progress: 100, status: "DELIVERED", qualityVerified: true, qualityVerifiedAt: Date.now() - 9 * 86400000,
    paymentStatus: "completed", paymentAt: Date.now() - 8 * 86400000,
    rate: 1100, grossAmount: 13200, transportCost: 2040, handlingCost: 480, netAmount: 10680,
  }),
  demoShipment("1007", {
    industryId: "demo-demand-1", industryName: "Sahyadri Paper Works", farmerName: "Vitthal Shinde",
    residueType: "Bagasse", quantity: 16, origin: "Baramati, Maharashtra", destination: "Sahyadri Paper Works, Pune",
    distanceKm: 22, createdAt: Date.now() - 20 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 20 * 86400000,
    progress: 100, status: "DELIVERED", qualityVerified: true, qualityVerifiedAt: Date.now() - 18 * 86400000,
    paymentStatus: "completed", paymentAt: Date.now() - 17 * 86400000,
    utilizationConfirmed: true, utilizationConfirmedAt: Date.now() - 15 * 86400000,
    rate: 1650, grossAmount: 26400, transportCost: 1320, handlingCost: 640, netAmount: 24440,
  }),
  demoShipment("1008", {
    industryId: "demo-demand-3", industryName: "GreenGrid Energy", farmerName: "Ramesh More",
    residueType: "Sugarcane Leaves", quantity: 7, origin: "Satara, Maharashtra", destination: "GreenGrid Energy, Baramati",
    distanceKm: 29, createdAt: Date.now() - 15 * 86400000, industryAccepted: true, industryAcceptedAt: Date.now() - 15 * 86400000,
    progress: 38, status: "PICKED_UP", cancelled: true, cancelledAt: Date.now() - 10 * 86400000,
    rate: 950, grossAmount: 6650, transportCost: 1740, handlingCost: 280, netAmount: 4630,
  }),  ];
}

// Seeded notification feed shown once a demo account signs in — mirrors the
// exact wording style of the real notify() call-sites elsewhere in SUGAM.
function buildDemoNotifications() {
  const mk = (message, tone, hoursAgo) => ({ id: "demo-n-" + hoursAgo + "-" + Math.round(Math.random() * 999), message, tone, read: hoursAgo > 24, at: Date.now() - hoursAgo * 3600000 });
  return [
    mk("Demo payment completed for SGM-BGS demo shipment", "success", 2),
    mk("Quality verified by industry (demo action)", "success", 6),
    mk("Vehicle assigned for your scheduled pickup", "success", 20),
    mk("Interest sent to Krishi BioInputs for 9 T Press Mud", "success", 30),
    mk("Utilization confirmed — lifecycle complete", "success", 50),
    mk("Transaction cancelled", "error", 70),
  ];
}

// Full, realistic Farmer registration used by the Demo Login button.
function demoFarmerRegistration() {
  return {
    step: REG_STEPS.length - 1,
    mobile: { number: "9876543210", otp: "", sentOtp: "", verified: true, resendIn: 0 },
    personal: { fullName: "Vitthal Shinde", dob: "1985-04-12", gender: "Male", farmerType: "Individual Farmer", email: "vitthal.shinde@example.com" },
    address: { state: "Maharashtra", district: "Pune", taluka: "Baramati", village: "Malegaon", pin: "413102" },
    farm: { landStatus: "Owned", landArea: "6.5", landUnit: "Acre", mainCrops: "Sugarcane", residueTypes: ["Bagasse", "Sugarcane Leaves"], availability: "Available now" },
    kyc: { docType: "Aadhaar", docNumber: "234567890123", status: "Submitted (Demo)" },
    bank: { accountHolder: "Vitthal Shinde", accountNumber: "50100234567890", confirmAccountNumber: "50100234567890", ifsc: "HDFC0001234", bankName: "HDFC Bank", branch: "Baramati", accountType: "Savings", status: "Submitted (Demo)" },
    documents: REG_DOC_LIST.map((d) => ({ ...d, status: "Uploaded" })),
    consent: true,
    submitted: true,
    registrationId: "SUGAM-FARMER-2026-1042",
    submittedAt: Date.now() - 40 * 86400000,
  };
}

// Full, realistic Industry registration used by the Demo Login button.
function demoIndustryRegistration() {
  return {
    orgName: "Sahyadri Paper Works",
    sector: "Paper & Pulp",
    location: "Pune, Maharashtra",
    contactName: "Aniket Joshi",
    contactPhone: "9822011223",
    contactEmail: "procurement@sahyadripaper.example",
    regNumber: "27ABCDE1234F1Z5",
    submitted: true,
    registrationId: "SUGAM-IND-2026-2007",
    submittedAt: Date.now() - 60 * 86400000,
    demandId: "demo-demand-1",
    verified: true,
  };
}

// Explainable match score between one farmer-supply listing and one
// industry demand — a transparent, disclosed demo heuristic (not a
// predictive model), broken into the named factors SUGAM shows on-screen.
function scoreSupplyDemandMatch(supply, demand) {
  const factors = [];
  let score = 30;

  const residueMatch = supply.wasteType === demand.residueType;
  factors.push({ label: "Residue compatibility", positive: residueMatch, detail: residueMatch ? `${supply.wasteType} matches your requirement` : `${supply.wasteType} does not match ${demand.residueType}` });
  score += residueMatch ? 25 : 0;

  const qtyRatio = supply.quantity / Math.max(1, Number(demand.quantity) || 1);
  const qtyGood = qtyRatio >= 0.6;
  factors.push({ label: "Quantity fit", positive: qtyGood, detail: `${supply.quantity} T available vs ${demand.quantity} T/mo required (${Math.round(qtyRatio * 100)}%)` });
  score += qtyGood ? 15 : qtyRatio >= 0.3 ? 7 : 0;

  const distGood = supply.distance <= 25;
  factors.push({ label: "Distance", positive: distGood, detail: `${supply.distance} km away` });
  score += distGood ? 15 : supply.distance <= 45 ? 8 : 2;

  factors.push({ label: "Quality signal", positive: supply.verified, detail: supply.qualitySummary || "Not specified" });
  score += supply.verified ? 8 : 3;

  const demandRate = Number(demand.rate) || supply.rate;
  const rateDiff = Math.abs(supply.rate - demandRate) / Math.max(1, demandRate);
  const rateGood = rateDiff <= 0.15;
  factors.push({ label: "Rate alignment", positive: rateGood, detail: `Indicative ₹${supply.rate}/T vs your ₹${demandRate}/T budget` });
  score += rateGood ? 10 : 4;

  factors.push({ label: "Utilization compatibility", positive: true, detail: `Suited to ${demand.application}` });
  score += 5;

  return { score: Math.min(98, Math.round(score)), factors };
}

// Optional quality-information choices on the Residue Profile form. Stored
// for context only — nothing here feeds a hidden model.
const MOISTURE_LEVELS = ["Low (<15%)", "Medium (15–30%)", "High (>30%)"];
const CONTAMINATION_LEVELS = ["Clean", "Some soil / trash mixed in", "Heavily mixed"];
const STORAGE_CONDITIONS = ["Covered & dry", "Open field", "Partially covered"];

// ---------------------------------------------------------------------------
// SMART ON-FARM RETENTION
// A fixed, disclosed rule per residue type — an agronomic rule of thumb for
// how much residue commonly stays on the field for mulching / soil organic
// matter, NOT a prediction. Farmers can override it below.
// ---------------------------------------------------------------------------
const RETENTION_RULES = {
  Bagasse: {
    rate: 0.1,
    rationale: "Bagasse is a mill by-product, not field residue — only a small share is typically kept on-site for composting, so most of it is transferable.",
  },
  "Sugarcane Leaves": {
    rate: 0.4,
    rationale: "Leaf trash is commonly left as surface mulch to retain soil moisture and suppress weeds between rows.",
  },
  "Press Mud": {
    rate: 0.3,
    rationale: "A portion of press mud is conventionally returned to the field as organic manure before the rest is sold on.",
  },
  "Cane Trash": {
    rate: 0.45,
    rationale: "Cane trash retained as ground cover reduces irrigation needs and rebuilds organic matter, so a larger share stays on-farm.",
  },
};

function computeRetention(wasteType, qtyTons, overrideRetained) {
  const qty = Math.max(0, Number(qtyTons) || 0);
  const rule = RETENTION_RULES[wasteType] || RETENTION_RULES.Bagasse;
  const recommendedRetained = Math.round(qty * rule.rate * 10) / 10;
  const retained =
    overrideRetained === null || overrideRetained === undefined || overrideRetained === ""
      ? recommendedRetained
      : Math.min(qty, Math.max(0, Number(overrideRetained) || 0));
  const surplus = Math.max(0, Math.round((qty - retained) * 10) / 10);
  return {
    total: qty,
    recommendedRetained,
    retained: Math.round(retained * 10) / 10,
    surplus,
    ratePct: Math.round(rule.rate * 100),
    rationale: rule.rationale,
  };
}

// ---------------------------------------------------------------------------
// PATHWAY DECISION ENGINE
// Three fixed, transparent pathways for the transferable surplus, each priced
// with disclosed rule-based arithmetic (fixed ₹/ton reference rates, fixed
// ₹/km transport rates, fixed handling-fee assumptions) — the same style of
// calculation as the existing match-score heuristic, not a predictive model.
// ---------------------------------------------------------------------------
const MARKET_RATE_PER_TON = { Bagasse: 1300, "Sugarcane Leaves": 950, "Press Mud": 1050, "Cane Trash": 850 };

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function scoreIndustryMatch(ind, qty) {
  return Math.min(98, Math.round(62 + (ind.demand >= qty ? 16 : 7) + (ind.distance <= 20 ? 12 : 5) + (ind.rate >= 1500 ? 7 : 0)));
}

function bestMatchingIndustry(wasteType, qty, industries) {
  const candidates = industries
    .filter((i) => i.wasteType === wasteType)
    .map((i) => ({ ...i, match: scoreIndustryMatch(i, qty) }))
    .sort((a, b) => b.match - a.match);
  return candidates[0] || null;
}

function computePathways({ wasteType, surplusQty, seed, industries }) {
  const qty = Math.max(0, Number(surplusQty) || 0);
  const marketRate = MARKET_RATE_PER_TON[wasteType] || 1000;
  const methods = [...(METHODS[wasteType] || METHODS.Bagasse)].sort((a, b) => b.score - a.score);
  const bestMethod = methods[0];

  // 1. Local Processing — on-farm retention is already handled above in Step 01.
  const localDistance = 5 + (hashSeed(seed + "local") % 11); // 5–15 km
  const localCapacity = 12;
  const localUsable = Math.min(qty, localCapacity);
  const localGross = Math.round(localUsable * marketRate * 0.8);
  const localTransport = Math.round(localDistance * 45);
  const localHandling = Math.round(localUsable * 90);

  // 3. Direct Industry Sale
  const matched = bestMatchingIndustry(wasteType, qty, industries);
  const industryDistance = matched ? matched.distance : 20 + (hashSeed(seed + "industry") % 16);
  const industryRate = matched ? matched.rate : Math.round(marketRate * 1.05);
  const industryGross = Math.round(qty * industryRate);
  const industryTransport = Math.round(industryDistance * 60);
  const industryHandling = Math.round(qty * 40);

  // 4. Aggregation
  const aggDistance = 8 + (hashSeed(seed + "agg") % 8); // 8–15 km to a shared collection point
  const aggGross = Math.round(qty * marketRate * 0.9);
  const aggTransport = Math.round(aggDistance * 60 * 0.5); // shared across pooled farmers
  const aggHandling = Math.round(qty * 110);

  const pathways = [
    {
      id: "local",
      title: "Local Processing",
      blurb: "A small nearby processor (briquetting / local biogas unit).",
      icon: Factory,
      distanceKm: localDistance,
      grossValue: localGross,
      transportCost: localTransport,
      handlingCost: localHandling,
      envBenefit: { level: "Medium–High", text: "Displaces fossil fuel locally; short haul keeps transport emissions low." },
      quantity: {
        usable: localUsable,
        capacity: localCapacity,
        status: localUsable >= qty ? "Full match" : `Partial — handles ${localUsable}T of ${qty}T`,
      },
      why: `Short ${localDistance} km haul keeps transport cost low while paying a processed-goods rate, but the local unit is assumed to take at most ${localCapacity}T.`,
    },
    {
      id: "industry",
      title: "Direct Industry Sale",
      blurb: matched ? `Best current match: ${matched.name} (${matched.type}).` : "Sell to a registered industry buyer — demo rate used, none registered yet.",
      icon: Building2,
      distanceKm: industryDistance,
      grossValue: industryGross,
      transportCost: industryTransport,
      handlingCost: industryHandling,
      envBenefit: {
        level: bestMethod && bestMethod.score >= 85 ? "High" : "Medium",
        text: bestMethod ? bestMethod.reason : "Displacement benefit depends on the industry's process.",
      },
      quantity: {
        usable: qty,
        capacity: matched ? matched.demand : null,
        status: matched
          ? matched.demand >= qty
            ? "Full match"
            : `Partial — buyer demand is ${matched.demand}T/mo`
          : "Demo estimate — no industry registered for this waste type yet",
      },
      matched,
      why: matched
        ? `Highest disclosed rate (₹${industryRate.toLocaleString("en-IN")}/T) from ${matched.name}, ${industryDistance} km away — best gross value if the distance is workable.`
        : `Typically the highest per-ton rate once a buyer is registered, but nobody has registered demand for ${wasteType} yet — figures shown are a demo estimate.`,
    },
    {
      id: "aggregation",
      title: "Aggregation",
      blurb: "Pool with nearby farmers at a shared collection point.",
      icon: Boxes,
      distanceKm: aggDistance,
      grossValue: aggGross,
      transportCost: aggTransport,
      handlingCost: aggHandling,
      envBenefit: { level: "Medium", text: "Enables reliable large-scale utilization and reduces field burning across several farms." },
      quantity: { usable: qty, capacity: null, status: "Full match — pooled with other farmers regardless of size" },
      why: `Transport cost is shared across pooled farmers (≈50% of a solo trip), making this the most reliable route for small or awkward surplus quantities.`,
    },
  ];

  return pathways.map((p) => ({ ...p, netRealization: p.grossValue - p.transportCost - p.handlingCost }));
}

// ---------------------------------------------------------------------------
// LOGISTICS LAYER
// Everything below powers pickup navigation + demo transport tracking once a
// farmer accepts (connects with) an industry/collection destination. It is
// intentionally isolated from the matching/analysis logic above so a future
// integration (real routing API, live GPS feed) only has to swap the helpers
// in this block — the screens below just render whatever shape they return.
// ---------------------------------------------------------------------------

// Fixed demo assumption: average loaded-truck speed on mixed rural/highway
// roads. Disclosed in the UI — not a live traffic estimate.
const AVG_TRUCK_SPEED_KMH = 36;

// Ordered lifecycle a shipment moves through. `at` is the route-progress
// percentage at which this status becomes active — used to derive a status
// label from a single continuous progress number (see statusForProgress).
const TRACKING_STAGES = [
  { key: "SCHEDULED", label: "Pickup Scheduled", at: 0, icon: CalendarDays },
  { key: "ASSIGNED", label: "Vehicle Assigned", at: 10, icon: Truck },
  { key: "PICKUP_EN_ROUTE", label: "Pickup En Route", at: 25, icon: Navigation },
  { key: "PICKED_UP", label: "Material Picked Up", at: 42, icon: Package },
  { key: "IN_TRANSIT", label: "In Transit", at: 58, icon: Route },
  { key: "NEAR_DESTINATION", label: "Near Destination", at: 85, icon: MapPin },
  { key: "DELIVERED", label: "Delivered", at: 100, icon: CheckCircle2 },
];

function statusForProgress(progress) {
  let current = TRACKING_STAGES[0];
  for (const stage of TRACKING_STAGES) if (progress >= stage.at) current = stage;
  return current;
}

// Builds a Google Maps "Directions" deep link. This uses Google's public
// URL scheme (maps.google.com /dir/?api=1) which geocodes plain place names
// on Google's end — no API key, no client-side geocoding required.
function buildGoogleMapsDirectionsUrl(origin, destination) {
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function formatDurationHours(hours) {
  const totalMinutes = Math.max(1, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}

// Deterministic demo vehicle ID / driver so it stays stable for a given
// shipment across re-renders instead of re-rolling on every render.
const VEHICLE_PREFIXES = ["MH-12", "MH-14", "MH-42", "MH-09"];
const DRIVER_NAMES = ["Suresh Kadam", "Ganesh Pawar", "Vikram Shinde", "Ramesh Gaikwad", "Santosh Bhosale"];
function generateVehicleId(seed) {
  const h = hashSeed(String(seed));
  const prefix = VEHICLE_PREFIXES[h % VEHICLE_PREFIXES.length];
  const num = 1000 + (h % 8999);
  const letters = String.fromCharCode(65 + (h % 26), 65 + ((h >> 3) % 26));
  return `${prefix} ${letters} ${num}`;
}
function generateDriverName(seed) {
  const h = hashSeed(String(seed) + "driver");
  return DRIVER_NAMES[h % DRIVER_NAMES.length];
}

// ---------------------------------------------------------------------------
// RESIDUE PASSPORT + TRANSACTION LIFECYCLE
// A unique, human-readable ID plus an 11-stage transaction lifecycle for every
// accepted shipment. QR payload and status are computed live from shipment
// state — nothing here is a placeholder image. Fully isolated from the
// matching/pathway logic above; a production build would swap the ID/QR
// generation for a backend-issued record without touching the UI below.
// ---------------------------------------------------------------------------
const RESIDUE_TYPE_CODE = { Bagasse: "BGS", "Sugarcane Leaves": "LVS", "Press Mud": "PMD", "Cane Trash": "CNT" };

function generatePassportId(wasteType, seed, createdAt) {
  const code = RESIDUE_TYPE_CODE[wasteType] || "GEN";
  const year = new Date(createdAt || Date.now()).getFullYear();
  const num = 1 + (hashSeed(String(seed) + "passport") % 99998);
  return `SGM-${code}-${year}-${String(num).padStart(5, "0")}`;
}

function generateTransactionId(seed) {
  const h = hashSeed(String(seed) + "txn");
  return `TXN-${h.toString(36).toUpperCase().padStart(8, "0").slice(0, 8)}`;
}

// Ordered transaction lifecycle. Stages 0-7 are derived automatically from
// the shipment's tracking progress; stages 8-10 (post-delivery) are advanced
// with explicit demo actions on the Passport screen, since quality checks,
// payment and utilization confirmation happen after physical delivery.
const TRANSACTION_STAGES = [
  { key: "LISTED", label: "Listed", icon: Sprout, blurb: "Residue registered by the farmer on SUGAM." },
  { key: "MATCHED", label: "Matched", icon: Handshake, blurb: "A compatible industry buyer was identified." },
  { key: "OFFER_ACCEPTED", label: "Offer Accepted", icon: CheckCircle2, blurb: "Farmer accepted the connection and an offer was made." },
  { key: "PICKUP_SCHEDULED", label: "Pickup Scheduled", icon: CalendarDays, blurb: "A collection date has been set for this lot." },
  { key: "VEHICLE_ASSIGNED", label: "Vehicle Assigned", icon: Truck, blurb: "A transport vehicle and driver were assigned." },
  { key: "PICKED_UP", label: "Picked Up", icon: Package, blurb: "Material collected from the farm location." },
  { key: "IN_TRANSIT", label: "In Transit", icon: Route, blurb: "Shipment is moving toward the destination." },
  { key: "DELIVERED", label: "Delivered", icon: MapPin, blurb: "Material has reached the industry site." },
  { key: "QUALITY_VERIFIED", label: "Quality Verified", icon: ShieldCheck, blurb: "Industry inspected and accepted the material quality." },
  { key: "PAYMENT_COMPLETED", label: "Payment Completed", icon: IndianRupee, blurb: "Demo payment recorded for this transaction." },
  { key: "UTILIZATION_CONFIRMED", label: "Utilization Confirmed", icon: Recycle, blurb: "Residue confirmed as processed into its intended use." },
];

function trackingKeyToTransactionKey(trackingKey) {
  switch (trackingKey) {
    case "SCHEDULED": return "PICKUP_SCHEDULED";
    case "ASSIGNED": return "VEHICLE_ASSIGNED";
    case "PICKUP_EN_ROUTE": return "VEHICLE_ASSIGNED";
    case "PICKED_UP": return "PICKED_UP";
    case "IN_TRANSIT": return "IN_TRANSIT";
    case "NEAR_DESTINATION": return "IN_TRANSIT";
    case "DELIVERED": return "DELIVERED";
    default: return "PICKUP_SCHEDULED";
  }
}

// Returns the index (0-10) of the current stage in TRANSACTION_STAGES for a
// given shipment, taking cancellation and the manual post-delivery flags
// into account.
function transactionIndexForShipment(shipment) {
  if (!shipment) return -1;
  if (shipment.utilizationConfirmed) return 10;
  if (shipment.paymentStatus === "completed") return 9;
  if (shipment.qualityVerified) return 8;
  // Sits at MATCHED until the industry explicitly accepts the farmer's
  // request — pickup cannot be "scheduled" for a request nobody accepted yet.
  if (!shipment.industryAccepted) return 1;
  const trackingStage = statusForProgress(shipment.progress || 0);
  const txKey = trackingKeyToTransactionKey(trackingStage.key);
  const idx = TRANSACTION_STAGES.findIndex((s) => s.key === txKey);
  return idx === -1 ? 2 : idx;
}

function summarizeQuality(farmer) {
  const parts = [farmer.moisture, farmer.contamination, farmer.storage].filter(Boolean);
  return parts.length ? parts.join(" • ") : "Not specified by farmer";
}

// Builds the plain-text payload encoded into the QR image — everything a
// scan should reveal about this batch, in one readable block.
function buildPassportQrPayload(shipment) {
  const idx = transactionIndexForShipment(shipment);
  const statusLabel = shipment.cancelled ? "Cancelled" : (TRANSACTION_STAGES[Math.max(0, idx)] || TRANSACTION_STAGES[0]).label;
  return [
    "SUGAM RESIDUE PASSPORT",
    `Passport ID: ${shipment.passportId}`,
    `Transaction ID: ${shipment.transactionId}`,
    `Residue Type: ${shipment.residueType}`,
    `Quantity: ${shipment.quantity} T`,
    `Origin: ${shipment.origin}`,
    `Listed On: ${new Date(shipment.createdAt).toLocaleDateString("en-IN")}`,
    `Quality: ${shipment.qualitySummary || "Not specified"}`,
    `Current Status: ${statusLabel}`,
    `Destination: ${shipment.destination}`,
  ].join("\n");
}

// Public QR image endpoint, no API key required — same tier of integration
// as the Google Maps deep link used elsewhere in this prototype.
function buildQrCodeUrl(data, size = 210) {
  const params = new URLSearchParams({ size: `${size}x${size}`, data, margin: "8", qzone: "1", format: "png" });
  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function shipmentEventId(type, at = Date.now()) {
  return `evt-${type}-${at}-${Math.round(Math.random() * 999)}`;
}

function makeShipmentEvent(type, label, actor = "System", at = Date.now(), detail = "") {
  return { id: shipmentEventId(type, at), type, label, actor, at, detail };
}

function stageEventLabel(stageKey) {
  const stage = TRACKING_STAGES.find((s) => s.key === stageKey);
  return stage ? stage.label : stageKey;
}

// Creates a new shipment/tracking record for an accepted industry match.
// `origin` / `destination` are the plain-text place names shown to the user
// and fed straight into the Google Maps link above.
function buildShipment({ item, farmer, qty }) {
  const distanceKm = item.distance;
  const travelHours = distanceKm / AVG_TRUCK_SPEED_KMH;
  const id = `${item.id}-${Date.now()}`;
  const createdAt = Date.now();
  // Financial snapshot, frozen at the moment of connection — same transparent
  // rule-based arithmetic used throughout SUGAM (rate × qty, distance-based
  // transport, flat handling), not a live quotation.
  const rate = Number(item.rate) || 0;
  const grossAmount = item.materialValue != null ? item.materialValue : Math.round(rate * qty);
  const transportCost = item.transport != null ? item.transport : Math.round(distanceKm * 60);
  const handlingCost = Math.round(qty * 40);
  const netAmount = grossAmount - transportCost - handlingCost;
  return {
    id,
    industryId: item.id,
    industryName: item.name,
    farmerName: farmer.name || "SUGAM Farmer",
    vehicleId: generateVehicleId(id),
    driverName: generateDriverName(id),
    residueType: farmer.wasteType,
    quantity: qty,
    origin: farmer.location || "Farm location",
    destination: `${item.name}, ${item.location}`,
    distanceKm,
    estTravelHours: travelHours,
    progress: 0,
    status: TRACKING_STAGES[0].key,
    createdAt,
    // Acceptance gate — the farmer's connection is an outgoing REQUEST to the
    // industry; the industry must explicitly Accept it (from its Incoming
    // Requests screen) before pickup/logistics proceed. Nothing below this
    // point in the lifecycle should be reachable until industryAccepted is
    // true.
    industryAccepted: false,
    industryAcceptedAt: null,
    // Traceability & transaction layer
    passportId: generatePassportId(farmer.wasteType, id, createdAt),
    transactionId: generateTransactionId(id),
    qualitySummary: summarizeQuality(farmer),
    qualityVerified: false,
    qualityVerifiedAt: null,
    paymentStatus: "pending", // demo-only status: "pending" | "completed"
    paymentAt: null,
    utilizationConfirmed: false,
    utilizationConfirmedAt: null,
    cancelled: false,
    cancelledAt: null,
    events: [
      makeShipmentEvent("REQUEST_SENT", "Connection request sent to industry", "Farmer", createdAt, `${qty} T ${farmer.wasteType} from ${farmer.location || "farm"}`),
    ],
    // Payment & receipt snapshot (Phase 3+)
    rate,
    grossAmount,
    transportCost,
    handlingCost,
    netAmount,
  };
}

// ---------------------------------------------------------------------------
// INDUSTRY GOODS/SHIPMENT TRACKER — a simplified 5-stage view of the same
// 11-stage TRANSACTION_STAGES lifecycle used everywhere else, purpose-built
// for a compact tracker list (Registered → Matched → Pickup Scheduled →
// In Transit → Delivered). Derived live from shipment state — not a second
// status field to keep in sync.
// ---------------------------------------------------------------------------
function simplifiedGoodsStatus(shipment) {
  if (shipment.cancelled) return { label: "Cancelled", tone: "danger", progress: shipment.progress || 0 };
  const idx = transactionIndexForShipment(shipment);
  if (idx <= 0) return { label: "Registered", tone: "neutral", progress: 5 };
  if (idx === 1) return { label: "Matched", tone: "info", progress: 15 };
  if (idx >= 2 && idx <= 4) return { label: "Pickup Scheduled", tone: "warning", progress: Math.max(30, shipment.progress || 30) };
  if (idx >= 5 && idx <= 6) return { label: "In Transit", tone: "info", progress: Math.max(60, shipment.progress || 60) };
  return { label: "Delivered", tone: "success", progress: 100 };
}

// ---------------------------------------------------------------------------
// PAYMENT RECEIPT — builds a self-contained, printable/downloadable HTML
// receipt from a shipment's existing transaction/payment fields. No backend
// or external dependency: the browser downloads this as a standalone .html
// file the user can open, print or forward.
// ---------------------------------------------------------------------------
function buildReceiptHtml(shipment) {
  const paidOn = shipment.paymentAt ? new Date(shipment.paymentAt).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }) : "—";
  const issuedOn = new Date().toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" });
  const row = (label, value) => `<tr><td class="l">${label}</td><td class="v">${value}</td></tr>`;
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>SUGAM Receipt ${shipment.transactionId}</title>
<style>
  body{font-family:Georgia,'Times New Roman',serif;background:#F7F4EC;color:#17231D;margin:0;padding:40px;}
  .sheet{max-width:640px;margin:0 auto;background:#FFFDF8;border:1px solid #E3E0D5;border-radius:14px;padding:36px 40px;box-shadow:0 16px 40px rgba(23,74,53,.08);}
  .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #174A35;padding-bottom:16px;margin-bottom:20px;}
  .brand{font-size:22px;font-weight:700;color:#174A35;}
  .brand small{display:block;font-size:11px;color:#6D786F;font-weight:400;letter-spacing:.04em;}
  .statusTag{display:inline-block;background:#DCEBE0;color:#2F7D4A;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;text-transform:uppercase;letter-spacing:.05em;}
  h1{font-size:16px;margin:18px 0 10px;color:#174A35;}
  table{width:100%;border-collapse:collapse;margin-bottom:18px;}
  td{padding:7px 0;font-size:13px;border-bottom:1px dashed #E3E0D5;}
  td.l{color:#6D786F;width:48%;}
  td.v{font-weight:600;text-align:right;}
  .amountBox{background:#F3E8CF;border-radius:10px;padding:16px 20px;margin:18px 0;display:flex;justify-content:space-between;align-items:center;}
  .amountBox b{font-size:22px;color:#174A35;}
  .footNote{font-size:11px;color:#6D786F;margin-top:24px;border-top:1px solid #E3E0D5;padding-top:14px;}
  @media print{body{background:#fff;padding:0;}.sheet{box-shadow:none;border:none;}}
</style>
</head>
<body>
  <div class="sheet">
    <div class="head">
      <div class="brand">SUGAM<small>Sustainable Resource Exchange</small></div>
      <span class="statusTag">${shipment.paymentStatus === "completed" ? "Payment Completed" : "Payment Pending"}</span>
    </div>
    <h1>Payment Receipt</h1>
    <table>
      ${row("Transaction ID", shipment.transactionId)}
      ${row("Residue Passport ID", shipment.passportId)}
      ${row("Receipt Issued On", issuedOn)}
      ${row("Payment Date", paidOn)}
    </table>
    <h1>Parties</h1>
    <table>
      ${row("Farmer / Supplier", shipment.farmerName || "SUGAM Farmer")}
      ${row("Origin", shipment.origin)}
      ${row("Industry / Buyer", shipment.industryName)}
      ${row("Destination", shipment.destination)}
    </table>
    <h1>Material Details</h1>
    <table>
      ${row("Residue Type", shipment.residueType)}
      ${row("Quantity", `${shipment.quantity} tonnes`)}
      ${row("Rate", `₹${(shipment.rate || 0).toLocaleString("en-IN")} / tonne`)}
      ${row("Quality Summary", shipment.qualitySummary || "Not specified")}
    </table>
    <h1>Amount Breakdown</h1>
    <table>
      ${row("Gross Amount", `₹${(shipment.grossAmount || 0).toLocaleString("en-IN")}`)}
      ${row("Transport Cost", `− ₹${(shipment.transportCost || 0).toLocaleString("en-IN")}`)}
      ${row("Handling Cost", `− ₹${(shipment.handlingCost || 0).toLocaleString("en-IN")}`)}
    </table>
    <div class="amountBox"><span>Net Amount ${shipment.paymentStatus === "completed" ? "Paid" : "Payable"}</span><b>₹${(shipment.netAmount || 0).toLocaleString("en-IN")}</b></div>
    <div class="footNote">This is a system-generated demo receipt from the SUGAM prototype. No real payment gateway is integrated — Payment Completed reflects a simulated status for demonstration purposes only.</div>
  </div>
</body></html>`;
}

function triggerReceiptDownload(shipment, notify) {
  try {
    const html = buildReceiptHtml(shipment);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `SUGAM-Receipt-${shipment.transactionId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    if (notify) notify("Receipt downloaded");
  } catch {
    if (notify) notify("Could not generate receipt", "error");
  }
}


/* ============================================================
   SUGAM LANGUAGE LAYER
   - Keeps the original English UI/content untouched.
   - Uses one shared Google webpage-translation engine for the whole app.
   - The visible language controls are only lightweight selectors; they do
     NOT create/recreate the Google engine when navigating between screens.
   - No translation overlay/fade is used, so Google can rewrite text without
     producing the large white flash seen during language changes.
   ============================================================ */
const SUGAM_LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "mr", label: "Marathi", native: "मराठी" },
];

function cleanGoogleTranslateUi() {
  try {
    document.documentElement.style.setProperty("top", "0", "important");
    document.body?.style.setProperty("top", "0", "important");
    document.body?.style.setProperty("margin-top", "0", "important");
    document.body?.style.setProperty("position", "static", "important");

    document.querySelectorAll(
      ".goog-te-banner-frame, iframe.goog-te-banner-frame, body > .skiptranslate"
    ).forEach((el) => {
      el.style.setProperty("display", "none", "important");
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("height", "0", "important");
      el.style.setProperty("min-height", "0", "important");
      el.style.setProperty("width", "0", "important");
      el.style.setProperty("overflow", "hidden", "important");
    });
  } catch {}
}

function scheduleGoogleUiCleanup() {
  cleanGoogleTranslateUi();
  // Google may recreate the banner/inline body offset a few times while a
  // translation is being applied. Clean only for a short bounded window;
  // do not observe every DOM mutation because that itself causes flicker.
  [80, 250, 600, 1100].forEach((ms) => {
    window.setTimeout(cleanGoogleTranslateUi, ms);
  });
}

function GoogleTranslateEngine() {
  const initialLanguageRef = useRef((() => {
    try { return localStorage.getItem("sugam_language") || "en"; } catch { return "en"; }
  })());

  useEffect(() => {
    let disposed = false;
    let initTimer = null;
    let applyTimer = null;

    const broadcastLanguage = (code) => {
      window.dispatchEvent(new CustomEvent("sugam-language-change", { detail: code }));
    };

    const setStoredLanguage = (code) => {
      try { localStorage.setItem("sugam_language", code); } catch {}
      broadcastLanguage(code);
    };

    const applyLanguage = (code) => {
      if (disposed) return;

      setStoredLanguage(code);
      scheduleGoogleUiCleanup();

      const savedScrollY = window.scrollY;
      const start = Date.now();

      const tryApply = () => {
        if (disposed) return;
        const combo = document.querySelector(".goog-te-combo");
        if (combo) {
          combo.value = code;
          combo.dispatchEvent(new Event("change", { bubbles: true }));
          scheduleGoogleUiCleanup();
          // Google can temporarily adjust the page position while replacing
          // text nodes. Restore the user's exact scroll position afterwards.
          window.setTimeout(() => {
            if (disposed) return;
            window.scrollTo(0, savedScrollY);
            scheduleGoogleUiCleanup();
          }, 120);
          window.setTimeout(() => {
            if (disposed) return;
            window.scrollTo(0, savedScrollY);
            scheduleGoogleUiCleanup();
          }, 700);
          return;
        }

        if (Date.now() - start < 5000) {
          applyTimer = window.setTimeout(tryApply, 80);
        }
      };

      window.clearTimeout(applyTimer);
      tryApply();
    };

    window.sugamSetLanguage = applyLanguage;

    window.googleTranslateElementInit = () => {
      try {
        const host = document.getElementById("sugam-google-translate");
        if (!host || !window.google?.translate?.TranslateElement) return;
        if (!host.dataset.initialized) {
          new window.google.translate.TranslateElement({
            pageLanguage: "en",
            includedLanguages: "en,hi,mr",
            autoDisplay: false,
            multilanguagePage: true,
          }, "sugam-google-translate");
          host.dataset.initialized = "1";
        }
        scheduleGoogleUiCleanup();
        initTimer = window.setTimeout(() => applyLanguage(initialLanguageRef.current), 250);
      } catch (err) {
        console.warn("SUGAM translation engine could not initialise.", err);
      }
    };

    const existing = document.querySelector('script[data-sugam-google-translate="1"]');
    if (!existing) {
      const script = document.createElement("script");
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.dataset.sugamGoogleTranslate = "1";
      document.body.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      window.googleTranslateElementInit();
    }

    scheduleGoogleUiCleanup();

    return () => {
      disposed = true;
      window.clearTimeout(initTimer);
      window.clearTimeout(applyTimer);
      if (window.sugamSetLanguage === applyLanguage) delete window.sugamSetLanguage;
      if (window.googleTranslateElementInit) delete window.googleTranslateElementInit;
    };
  }, []);

  return null;
}

function GoogleLanguageSelector() {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem("sugam_language") || "en"; } catch { return "en"; }
  });

  useEffect(() => {
    const sync = (event) => {
      if (event.detail) setLanguage(event.detail);
    };
    window.addEventListener("sugam-language-change", sync);
    return () => window.removeEventListener("sugam-language-change", sync);
  }, []);

  const onChange = (event) => {
    const code = event.target.value;
    setLanguage(code);
    if (typeof window.sugamSetLanguage === "function") {
      window.sugamSetLanguage(code);
    }
  };

  return (
    <label className="sugamLanguage" title="Choose language">
      <Globe2 size={15}/>
      <span className="sugamLanguageLabel">Language</span>
      <select value={language} onChange={onChange} aria-label="Choose language">
        {SUGAM_LANGUAGES.map((item) => <option key={item.code} value={item.code}>{item.native}</option>)}
      </select>
    </label>
  );
}


/* ============================================================
   BACKEND CONNECTION LAYER
   - Flask + SQLite API lives in /backend.
   - Falls back to the existing local prototype state if the API
     is temporarily unavailable.
   ============================================================ */
const SUGAM_API_BASE = String((import.meta.env && import.meta.env.VITE_API_BASE) || "http://127.0.0.1:5000/api").replace(/\/$/, "");

function readSugamApiToken() {
  try { return localStorage.getItem("sugam_api_token") || ""; } catch { return ""; }
}

function writeSugamApiToken(token) {
  try {
    if (token) localStorage.setItem("sugam_api_token", token);
    else localStorage.removeItem("sugam_api_token");
  } catch {}
  try { window.dispatchEvent(new CustomEvent("sugam-auth-token", { detail: token || "" })); } catch {}
}

async function sugamApi(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && typeof options.body !== "string") {
    headers["Content-Type"] = "application/json";
    options = { ...options, body: JSON.stringify(options.body) };
  }
  const token = readSugamApiToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${SUGAM_API_BASE}${path}`, { ...options, headers });
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const err = new Error(payload.error || `Backend request failed (${response.status})`);
    err.status = response.status;
    throw err;
  }
  return payload;
}

/* ============================================================
   BACKEND SIGN-IN MODAL
   The existing Sign In / Sign Up gate remains visually the same;
   Sign In now asks for the registered mobile number + prototype OTP.
   Demo Login remains the only path that loads demo identities.
   ============================================================ */
function BackendSignInModal({ role, onClose, onSubmit, busy, error }) {
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const isFarmer = role === "farmer";
  return (
    <div className="modalBackdrop" style={{ zIndex: 3000 }}>
      <div className="modalCard" style={{ maxWidth: 440 }}>
        <div className="modalHead">
          <div>
            <span className="sectionTag">{isFarmer ? "FARMER SIGN IN" : "INDUSTRY SIGN IN"}</span>
            <h2>Sign in to SUGAM</h2>
          </div>
          <button className="iconBtn" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.55, marginBottom: 16 }}>
          {isFarmer
            ? "Enter the mobile number used during farmer registration."
            : "Enter the contact mobile number used during industry registration."}
        </p>
        <Field label="Mobile number" required>
          <input
            inputMode="numeric"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit mobile number"
          />
        </Field>
        <Field label="OTP" required>
          <input
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="Prototype OTP: 1234"
          />
        </Field>
        {error && <div className="notice warning" style={{ marginTop: 12 }}><Info size={17}/><div>{error}</div></div>}
        <div className="modalActions" style={{ marginTop: 18 }}>
          <button className="secondaryBtn" onClick={onClose} disabled={busy}>Cancel</button>
          <button
            className={isFarmer ? "primaryBtn" : "primaryBlue"}
            onClick={() => onSubmit({ identifier, otp })}
            disabled={busy || identifier.length !== 10 || !otp}
          >
            {busy ? "Signing in..." : "Sign In"} <ArrowRight size={16}/>
          </button>
        </div>
        <p className="formHint" style={{ marginTop: 12 }}>
          <KeyRound size={13}/> Prototype backend OTP: <b>1234</b>. Replace with a real SMS/OTP provider later.
        </p>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("home");
  const [toast, setToast] = useState(null);
  const [menu, setMenu] = useState(false);
  const [industries, setIndustries] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sugam_industries") || "[]"); } catch { return []; }
  });
  const [connected, setConnected] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sugam_connected") || "[]"); } catch { return []; }
  });
  const [farmer, setFarmer] = useState(() => {
    const fallback = { name: "", location: "Pune, Maharashtra", wasteType: "Bagasse", quantity: "6", availableFrom: "", moisture: "", contamination: "", storage: "", qualityNotes: "", retainedOverride: "" };
    try { return { ...fallback, ...(JSON.parse(localStorage.getItem("sugam_farmer") || 'null') || {}) }; }
    catch { return fallback; }
  });
  const [shipments, setShipments] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sugam_shipments") || "[]"); } catch { return []; }
  });
  const [farmerReg, setFarmerReg] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sugam_farmer_registration") || "null");
      return saved ? { ...emptyRegistration(), ...saved } : emptyRegistration();
    } catch { return emptyRegistration(); }
  });
  const [notifications, setNotifications] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sugam_notifications") || "[]"); } catch { return []; }
  });
  const [activeShipmentId, setActiveShipmentId] = useState(null);
  const [industryReg, setIndustryReg] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sugam_industry_registration") || "null");
      return saved ? { ...emptyIndustryRegistration(), ...saved } : emptyIndustryRegistration();
    } catch { return emptyIndustryRegistration(); }
  });
  const [industryDemands, setIndustryDemands] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sugam_industry_demands") || "[]"); } catch { return []; }
  });
  const [authToken, setAuthToken] = useState(() => readSugamApiToken());
  const [signInRole, setSignInRole] = useState(null);
  const [signInBusy, setSignInBusy] = useState(false);
  const [signInError, setSignInError] = useState("");
  const backendHydratedRef = useRef(false);
  const previousIndustryDemandsRef = useRef([]);
  const lastBackendProfileSyncRef = useRef({ farmer: "", industry: "", profile: "" });

  useEffect(() => { try { localStorage.setItem("sugam_farmer_registration", JSON.stringify(farmerReg)); } catch {} }, [farmerReg]);
  useEffect(() => { try { localStorage.setItem("sugam_notifications", JSON.stringify(notifications)); } catch {} }, [notifications]);
  useEffect(() => { try { localStorage.setItem("sugam_industry_registration", JSON.stringify(industryReg)); } catch {} }, [industryReg]);
  useEffect(() => { try { localStorage.setItem("sugam_industry_demands", JSON.stringify(industryDemands)); } catch {} }, [industryDemands]);

  const applyBackendBootstrap = (payload) => {
    const b = payload?.bootstrap || payload;
    if (!b) return;
    if (Array.isArray(b.industries)) setIndustries(b.industries);
    if (Array.isArray(b.shipments)) setShipments(b.shipments);
    if (Array.isArray(b.notifications)) setNotifications(b.notifications);
    if (Array.isArray(b.connected)) setConnected(b.connected);
    if (b.farmer) setFarmer((prev) => ({ ...prev, ...b.farmer }));
    if (b.farmerReg) setFarmerReg((prev) => ({ ...prev, ...b.farmerReg }));
    if (b.industryReg) setIndustryReg((prev) => ({ ...prev, ...b.industryReg }));
    if (Array.isArray(b.industryDemands)) setIndustryDemands(b.industryDemands);
    backendHydratedRef.current = true;
  };

  const refreshBackend = async () => {
    if (!authToken) return false;
    try {
      const result = await sugamApi("/bootstrap");
      applyBackendBootstrap(result.bootstrap || result);
      return true;
    } catch (err) {
      if (err?.status === 401) {
        writeSugamApiToken("");
        setAuthToken("");
      }
      return false;
    }
  };

  // Restore a backend session on reload and keep both sides of a transaction
  // synchronized while a dashboard is open.
  useEffect(() => {
    let cancelled = false;
    if (!authToken) return undefined;
    refreshBackend().then((ok) => {
      if (!cancelled && ok) backendHydratedRef.current = true;
    });
    const timer = window.setInterval(() => { refreshBackend(); }, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [authToken, screen]);

  // Registration/profile changes are mirrored to the backend after the first
  // backend hydration, while localStorage remains a safe offline fallback.
  useEffect(() => {
    if (!authToken || !backendHydratedRef.current || !farmerReg?.submitted) return;
    const key = JSON.stringify(farmerReg);
    if (lastBackendProfileSyncRef.current.farmer === key) return;
    lastBackendProfileSyncRef.current.farmer = key;
    sugamApi("/profile/farmer", { method: "PATCH", body: { registration: farmerReg } }).catch(() => {});
  }, [authToken, farmerReg]);

  useEffect(() => {
    if (!authToken || !backendHydratedRef.current) return;
    const key = JSON.stringify(farmer);
    if (lastBackendProfileSyncRef.current.profile === key) return;
    lastBackendProfileSyncRef.current.profile = key;
    sugamApi("/profile/farmer", { method: "PATCH", body: { profile: farmer } }).catch(() => {});
  }, [authToken, farmer]);

  useEffect(() => {
    if (!authToken || !backendHydratedRef.current || !industryReg?.submitted) return;
    const key = JSON.stringify(industryReg);
    if (lastBackendProfileSyncRef.current.industry === key) return;
    lastBackendProfileSyncRef.current.industry = key;
    sugamApi("/profile/industry", { method: "PATCH", body: { registration: industryReg } }).catch(() => {});
  }, [authToken, industryReg]);

  // Persist industry demand CRUD to the shared database. Removed demand IDs
  // are deleted on the server so farmer-side matching cannot keep stale offers.
  useEffect(() => {
    if (!authToken || !backendHydratedRef.current) return;
    const previous = previousIndustryDemandsRef.current;
    industryDemands.forEach((d) => {
      if (d?.id) sugamApi(`/demands/${encodeURIComponent(d.id)}`, { method: "PUT", body: { demand: d } }).catch(() => {});
    });
    const currentIds = new Set(industryDemands.map((d) => d.id));
    previous.forEach((d) => {
      if (d?.id && !currentIds.has(d.id)) {
        sugamApi(`/demands/${encodeURIComponent(d.id)}`, { method: "DELETE" }).catch(() => {});
      }
    });
    previousIndustryDemandsRef.current = industryDemands;
  }, [authToken, industryDemands]);

  useEffect(() => {
    const handler = (event) => {
      setAuthToken(event.detail || "");
      if (event.detail) refreshBackend();
      else backendHydratedRef.current = false;
    };
    window.addEventListener("sugam-auth-token", handler);
    return () => window.removeEventListener("sugam-auth-token", handler);
  }, [authToken]);

  // Mirror this industry account's ACTIVE demand entries into the shared
  // `industries` list so the existing, unmodified Farmer matching logic
  // (Matches / computePathways) keeps working exactly as before — Farmer
  // code never needs to know these entries came from the new Demand CRUD
  // instead of the old single-profile form.
  useEffect(() => {
    setIndustries((prev) => {
      // Industry-owned demand mirrors should never wipe the marketplace list
      // while a farmer account is signed in.
      if (!industryReg?.orgName) return prev;
      const mineIds = new Set(industryDemands.map((d) => d.id));
      const others = prev.filter((i) => !mineIds.has(i.id));
      const mirrors = industryDemands
        .filter((d) => d.status === "active")
        .map((d) => ({
          id: d.id,
          name: industryReg.orgName || "Your industry",
          type: d.application,
          wasteType: d.residueType,
          location: d.location || industryReg.location || "—",
          distance: 24,
          demand: Number(d.quantity) || 0,
          rate: Number(d.rate) || 0,
          contact: industryReg.contactName || "Industry representative",
          verified: !!industryReg.verified,
        }));
      return [...others, ...mirrors];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industryDemands, industryReg.orgName, industryReg.location, industryReg.contactName, industryReg.verified]);

  useEffect(() => { try { localStorage.setItem("sugam_industries", JSON.stringify(industries)); } catch {} }, [industries]);
  useEffect(() => { try { localStorage.setItem("sugam_connected", JSON.stringify(connected)); } catch {} }, [connected]);
  useEffect(() => { try { localStorage.setItem("sugam_farmer", JSON.stringify(farmer)); } catch {} }, [farmer]);
  useEffect(() => { try { localStorage.setItem("sugam_shipments", JSON.stringify(shipments)); } catch {} }, [shipments]);

  const notify = (message, tone = "success") => {
    setToast({ message, tone });
    setTimeout(() => setToast(null), 2600);
    // Every notify() call is a real state-change event in SUGAM (residue
    // analysed, connection sent, quality verified, payment completed, etc.)
    // so the same call doubles as the source for the Notifications screen —
    // nothing here is a fabricated/unrelated notification.
    setNotifications((prev) => [{ id: "n-" + Date.now() + "-" + Math.round(Math.random() * 999), message, tone, read: false, at: Date.now() }, ...prev].slice(0, 60));
  };
  const markNotificationRead = (id) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (authToken) sugamApi(`/notifications/read/${encodeURIComponent(id)}`, { method: "POST" }).catch(() => {});
  };
  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (authToken) sugamApi("/notifications/read-all", { method: "POST" }).catch(() => {});
  };
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Called when a farmer accepts (connects with) an industry/collection
  // destination — spins up the logistics record used by the Navigate and
  // Tracking screens below.
  const createShipment = (item, qty) => {
    const existing = shipments.find((s) => s.industryId === item.id && !s.cancelled);
    if (existing) { setActiveShipmentId(existing.id); return existing; }
    const shipment = buildShipment({ item, farmer, qty });
    setShipments((prev) => [...prev, shipment]);
    setActiveShipmentId(shipment.id);

    if (authToken) {
      sugamApi("/shipments", { method: "POST", body: { shipment } })
        .then((result) => {
          if (result?.shipment) setShipments((prev) => prev.map((s) => s.id === shipment.id ? result.shipment : s));
          refreshBackend();
        })
        .catch((err) => notify(err?.message || "Could not sync the request to the backend.", "error"));
    }
    return shipment;
  };

  const updateShipment = (id, patch, actor = "System") => {
    const current = shipments.find((s) => s.id === id);
    if (!current) return;
    const patchValue = typeof patch === "function" ? patch(current) : patch;
    const next = { ...current, ...(patchValue || {}) };

    // Guard the lifecycle so impossible states cannot be created accidentally.
    if (!current.industryAccepted && (Number(next.progress) || 0) > (Number(current.progress) || 0)) {
      notify("Tracking starts after the industry accepts the request.", "error");
      return;
    }
    if (!current.qualityVerified && next.paymentStatus === "completed") {
      notify("Quality must be verified before payment can be completed.", "error");
      return;
    }
    if (next.utilizationConfirmed && next.paymentStatus !== "completed") {
      notify("Utilization can be confirmed only after payment is completed.", "error");
      return;
    }

    const prevStage = statusForProgress(current.progress || 0).key;
    const nextStage = statusForProgress(next.progress || 0).key;
    const events = [...(current.events || [])];
    const addEvent = (type, label, eventActor = actor, detail = "") => {
      const at = Date.now();
      events.push(makeShipmentEvent(type, label, eventActor, at, detail));
    };

    if (!current.industryAccepted && next.industryAccepted) {
      addEvent("INDUSTRY_ACCEPTED", "Industry accepted the connection request", "Industry");
    }
    if (prevStage !== nextStage && next.industryAccepted) {
      addEvent("TRACKING_STAGE", stageEventLabel(nextStage), "System");
    }
    if (!current.qualityVerified && next.qualityVerified) {
      addEvent("QUALITY_VERIFIED", "Quality verified", "Industry");
    }
    if (current.paymentStatus !== "completed" && next.paymentStatus === "completed") {
      addEvent("PAYMENT_COMPLETED", "Payment completed", "Industry");
    }
    if (!current.utilizationConfirmed && next.utilizationConfirmed) {
      addEvent("UTILIZATION_CONFIRMED", "Utilization confirmed", "Industry");
    }
    if (!current.cancelled && next.cancelled) {
      addEvent("CANCELLED", "Transaction cancelled", actor);
    }

    setShipments((prev) => prev.map((s) => (s.id === id ? { ...next, events } : s)));

    // Do not send every 260ms tracking tick to the server. Persist lifecycle
    // milestones immediately and persist the final progress position.
    const progressOnly = Object.prototype.hasOwnProperty.call(patchValue || {}, "progress") &&
      Object.keys(patchValue || {}).length <= 2;
    const stageChanged = prevStage !== nextStage;
    const shouldSync = !progressOnly || stageChanged || Number(next.progress) >= 100;

    if (authToken && shouldSync) {
      sugamApi(`/shipments/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: { patch: patchValue || {}, actor },
      }).then((result) => {
        if (result?.shipment) {
          setShipments((prev) => prev.map((s) => s.id === id ? result.shipment : s));
        }
      }).catch((err) => notify(err?.message || "Could not sync the transaction update.", "error"));
    }
  };

  // Called when an industry accepts an incoming farmer request. This is the
  // ONLY direction a request/accept action should flow in the Direct
  // Industry Sale pathway — the farmer sends the request (createShipment,
  // above), the industry accepts it here. Industries never send a request
  // to a farmer.
  const acceptShipment = (id) => {
    const s = shipments.find((sh) => sh.id === id);
    if (!s || s.cancelled) {
      notify("This request is no longer available for acceptance.", "error");
      return;
    }
    if (s.industryAccepted) {
      notify("This request has already been accepted.", "error");
      return;
    }
    updateShipment(id, { industryAccepted: true, industryAcceptedAt: Date.now() }, "Industry");
    notify(`Accepted request from ${s.origin} — pickup can now be scheduled.`);
  };

  const go = (next) => {
    setMenu(false);
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Main-site Farmer entry always opens the Farmer sign-in/sign-up gate.
  // A Demo Farmer session is entered only by explicitly clicking Demo Login
  // inside that gate.
  const goFarmerArea = () => {
    go("farmerGate");
  };

  const activeShipment = shipments.find((s) => s.id === activeShipmentId) || shipments[shipments.length - 1];

  // Merges an array of new records into existing state by id, keeping any
  // record already present untouched (used by both demo-login seeders below
  // so re-running Demo Login never duplicates or resets progress).
  const mergeById = (prev, incoming) => {
    const ids = new Set(prev.map((x) => x.id));
    return [...prev, ...incoming.filter((x) => !ids.has(x.id))];
  };

  // Clears the active demo/login session for a role and returns to that
  // role's existing sign-in/sign-up landing page (RoleGate). Prototype-only:
  // there is no real backend session, so "signing out" clears the local
  // session marker used by Demo Login and leaves saved profile data intact,
  // exactly like signing out of a real account would.
  const signOut = (role) => {
    const doLocal = () => {
      writeSugamApiToken("");
      backendHydratedRef.current = false;
      try { localStorage.removeItem("sugam_active_session"); } catch {}
      notify("Signed out successfully.");
      go(role === "industry" ? "industryGate" : "farmerGate");
    };
    sugamApi("/auth/logout", { method: "POST" }).catch(() => {}).finally(doLocal);
  };

  const signInWithBackend = async ({ identifier, otp }) => {
    setSignInBusy(true);
    setSignInError("");
    try {
      const result = await sugamApi("/auth/login", {
        method: "POST",
        body: { role: signInRole, identifier, otp },
      });
      writeSugamApiToken(result.token);
      applyBackendBootstrap(result.bootstrap);
      try { localStorage.setItem("sugam_active_session", JSON.stringify({ role: signInRole, mode: "real" })); } catch {}
      setSignInRole(null);
      go(signInRole === "farmer" ? "farmerHome" : "industryHome");
      notify("Signed in successfully.");
    } catch (err) {
      setSignInError(err?.message || "Could not sign in. Check the mobile number and OTP.");
    } finally {
      setSignInBusy(false);
    }
  };

  // Start a genuinely fresh Farmer registration. This deliberately resets the
  // in-memory/persisted demo profile so the demo farmer can only appear after
  // the explicit Demo Login button is clicked.
  const startNewFarmerRegistration = () => {
    let wasFarmerDemo = false;
    try {
      const session = JSON.parse(localStorage.getItem("sugam_active_session") || "null");
      wasFarmerDemo = session?.role === "farmer" && session?.mode === "demo";
    } catch {}
    setFarmerReg(emptyRegistration());
    setFarmer({
      name: "",
      location: "Pune, Maharashtra",
      wasteType: "Bagasse",
      quantity: "",
      availableFrom: "",
      moisture: "",
      contamination: "",
      storage: "",
      qualityNotes: "",
      retainedOverride: "",
    });
    if (wasFarmerDemo) {
      setShipments([]);
      setConnected([]);
      setNotifications([]);
    }
    writeSugamApiToken("");
    backendHydratedRef.current = false;
    try {
      localStorage.removeItem("sugam_farmer_registration");
      localStorage.removeItem("sugam_active_session");
      localStorage.removeItem("sugam_farmer_registered");
      localStorage.removeItem("sugam_farmer_account_exists");
      localStorage.removeItem("sugam_farmer_real_account_exists");
    } catch {}
    go("farmerRegister");
  };

  // Start a genuinely fresh Industry registration. Demo Industry profile and
  // its seeded demand data are only restored through Demo Login.
  const startNewIndustryRegistration = () => {
    let wasIndustryDemo = false;
    try {
      const session = JSON.parse(localStorage.getItem("sugam_active_session") || "null");
      wasIndustryDemo = session?.role === "industry" && session?.mode === "demo";
    } catch {}
    setIndustryReg(emptyIndustryRegistration());
    setIndustryDemands([]);
    if (wasIndustryDemo) {
      setShipments([]);
      setNotifications([]);
    }
    writeSugamApiToken("");
    backendHydratedRef.current = false;
    try {
      localStorage.removeItem("sugam_industry_registration");
      localStorage.removeItem("sugam_industry_demands");
      localStorage.removeItem("sugam_active_session");
      localStorage.removeItem("sugam_industry_account_exists");
      localStorage.removeItem("sugam_industry_real_account_exists");
    } catch {}
    go("industryRegister");
  };

  // Demo Login (Farmer) — the ONLY route that loads the seeded Vitthal demo
  // identity and shared demo transactions. Backend seed data is preferred;
  // the old local demo dataset remains as an offline fallback.
  const demoFarmerLogin = async () => {
    try {
      const result = await sugamApi("/auth/demo/farmer", { method: "POST" });
      writeSugamApiToken(result.token);
      applyBackendBootstrap(result.bootstrap);
    } catch {
      setFarmerReg(demoFarmerRegistration());
      setFarmer((prev) => ({ ...prev, name: "Vitthal Shinde", location: "Baramati, Maharashtra", wasteType: "Bagasse", quantity: "22", availableFrom: "Available now", moisture: "Low", contamination: "None", storage: "Covered shed" }));
      setIndustries((prev) => (prev.length ? prev : DEMO_INDUSTRIES));
      setShipments((prev) => mergeById(prev, getDemoGoodsShipments()));
      setNotifications((prev) => mergeById(prev, buildDemoNotifications()));
      try { localStorage.setItem("sugam_farmer_account_exists", "1"); } catch {}
    }
    try { localStorage.setItem("sugam_active_session", JSON.stringify({ role: "farmer", mode: "demo" })); } catch {}
    notify("Signed in as Demo Farmer — explore the populated dashboard!");
    go("farmerHome");
  };

  // Demo Login (Industry) — the ONLY route that loads the seeded industry
  // identity and shared demo transactions. Backend seed data is preferred.
  const demoIndustryLogin = async () => {
    try {
      const result = await sugamApi("/auth/demo/industry", { method: "POST" });
      writeSugamApiToken(result.token);
      applyBackendBootstrap(result.bootstrap);
    } catch {
      setIndustryReg(demoIndustryRegistration());
      setIndustryDemands((prev) => mergeById(prev, DEMO_INDUSTRY_DEMANDS));
      setShipments((prev) => mergeById(prev, getDemoGoodsShipments()));
      setNotifications((prev) => mergeById(prev, buildDemoNotifications()));
      try { localStorage.setItem("sugam_industry_account_exists", "1"); } catch {}
    }
    try { localStorage.setItem("sugam_active_session", JSON.stringify({ role: "industry", mode: "demo" })); } catch {}
    notify("Signed in as Demo Industry — explore the populated dashboard!");
    go("industryHome");
  };

  const dashboardMode = INDUSTRY_SHELL_SCREENS.includes(screen) || FARMER_SHELL_SCREENS.includes(screen);

  return (
    <div className={dashboardMode ? "app dashboardMode" : "app"}>
      <GoogleTranslateEngine />
      <div id="sugam-google-translate" aria-hidden="true" />
      <style>{CSS}</style>
      {!INDUSTRY_SHELL_SCREENS.includes(screen) && !FARMER_SHELL_SCREENS.includes(screen) && (
        <Navbar screen={screen} go={go} goFarmerArea={goFarmerArea} menu={menu} setMenu={setMenu} />
      )}
      {screen === "home" && <Home go={go} goFarmerArea={goFarmerArea} />}
      {screen === "farmerGate" && (
        <RoleGate
          role="farmer"
          onSignIn={() => {
            setSignInError("");
            setSignInRole("farmer");
          }}
          onSignUp={() => startNewFarmerRegistration()}
          onSwitchRole={() => go("industryGate")}
          onHelp={() => go("about")}
          onDemoLogin={demoFarmerLogin}
        />
      )}
      {screen === "farmerRegister" && (
        <FarmerRegistration
          data={farmerReg}
          setData={setFarmerReg}
          go={go}
          notify={notify}
        />
      )}
      {screen === "industryGate" && (
        <RoleGate
          role="industry"
          onSignIn={() => {
            setSignInError("");
            setSignInRole("industry");
          }}
          onSignUp={() => startNewIndustryRegistration()}
          onSwitchRole={() => go("farmerGate")}
          onHelp={() => go("about")}
          onDemoLogin={demoIndustryLogin}
        />
      )}
      {screen === "industryRegister" && (
        <IndustryRegistration data={industryReg} setData={setIndustryReg} go={go} notify={notify} />
      )}
      {INDUSTRY_SHELL_SCREENS.includes(screen) && (
        <IndustryShell screen={screen} go={go} industryReg={industryReg} unreadCount={unreadCount} onSignOut={() => signOut("industry")}>
          {screen === "industryHome" && <IndustryHome go={go} industryReg={industryReg} industryDemands={industryDemands} shipments={shipments} />}
          {screen === "industryDemand" && <IndustryDemand demands={industryDemands} setDemands={setIndustryDemands} industryReg={industryReg} notify={notify} go={go} />}
          {screen === "industrySupply" && <IndustrySupply shipments={shipments} industryDemands={industryDemands} acceptShipment={acceptShipment} notify={notify} go={go} />}
          {screen === "industryMatches" && <IndustryMatches farmer={farmer} farmerReg={farmerReg} industryDemands={industryDemands} shipments={shipments} acceptShipment={acceptShipment} notify={notify} go={go} />}
          {screen === "industryTransactions" && <IndustryTransactions shipments={shipments} industryDemands={industryDemands} updateShipment={updateShipment} notify={notify} go={go} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "industryTracker" && <IndustryTracker shipments={shipments} industryDemands={industryDemands} go={go} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "industryTraceability" && <IndustryTraceability shipments={shipments} industryDemands={industryDemands} go={go} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "industryFinance" && <IndustryFinance shipments={shipments} industryDemands={industryDemands} updateShipment={updateShipment} notify={notify} go={go} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "industryProfile" && <IndustryProfile industryReg={industryReg} go={go} />}
          {screen === "industryNotifications" && <NotificationsScreen notifications={notifications} markRead={markNotificationRead} markAllRead={markAllNotificationsRead} />}
          {screen === "industryPassport" && (
            <Passport
              shipment={activeShipment}
              updateShipment={updateShipment}
              go={go}
              notify={notify}
              actor="industry"
              backTo="industryTraceability"
              backLabel="Back to traceability"
              emptyTitle="No passport to show yet"
              emptyText="A Residue Passport is issued automatically once a farmer connects to one of your published demands."
              emptyActionLabel="Manage demand"
              emptyGo="industryDemand"
            />
          )}
        </IndustryShell>
      )}
      {FARMER_SHELL_SCREENS.includes(screen) && (
        <FarmerShell screen={screen} go={go} farmer={farmer} farmerReg={farmerReg} unreadCount={unreadCount} onSignOut={() => signOut("farmer")}>
          {screen === "farmerHome" && <FarmerHome go={go} farmer={farmer} farmerReg={farmerReg} shipments={shipments} />}
          {screen === "farmer" && <Farmer farmer={farmer} setFarmer={setFarmer} go={go} notify={notify} />}
          {screen === "myResidue" && <MyResidue farmer={farmer} go={go} />}
          {screen === "analysis" && <Analysis farmer={farmer} setFarmer={setFarmer} industries={industries} go={go} notify={notify} />}
          {screen === "matches" && <Matches farmer={farmer} industries={industries} connected={connected} setConnected={setConnected} notify={notify} go={go} createShipment={createShipment} shipments={shipments} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "transactionHistory" && <TransactionHistory shipments={shipments} go={go} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "logistics" && <Logistics shipment={activeShipment} go={go} notify={notify} />}
          {screen === "tracking" && <Tracking shipment={activeShipment} updateShipment={updateShipment} go={go} />}
          {screen === "passport" && <Passport shipment={activeShipment} updateShipment={updateShipment} go={go} notify={notify} actor="farmer" />}
          {screen === "payments" && <PaymentsReceipts shipments={shipments} go={go} setActiveShipmentId={setActiveShipmentId} />}
          {screen === "profileKyc" && <ProfileKyc farmerReg={farmerReg} setFarmerReg={setFarmerReg} go={go} />}
          {screen === "notifications" && <NotificationsScreen notifications={notifications} markRead={markNotificationRead} markAllRead={markAllNotificationsRead} />}
        </FarmerShell>
      )}
      {screen === "industry" && <Industry industries={industries} setIndustries={setIndustries} notify={notify} go={go} />}
      {screen === "about" && <About go={go} />}
      {signInRole && (
        <BackendSignInModal
          role={signInRole}
          onClose={() => { if (!signInBusy) setSignInRole(null); }}
          onSubmit={signInWithBackend}
          busy={signInBusy}
          error={signInError}
        />
      )}
      {toast && <Toast {...toast} />}
    </div>
  );
}

function Navbar({ screen, go, goFarmerArea, menu, setMenu }) {
  const farmerScreens = ["farmerGate","farmerRegister","farmerHome","farmer","myResidue","analysis","matches","transactionHistory","logistics","tracking","passport","payments","profileKyc","notifications"];
  return (
    <header className="nav">
      <button className="brand" onClick={() => go("home")}>
        <span className="brandMark"><Sprout size={21}/></span>
        <span><b>SUGAM</b><small>Sustainable Resource Exchange</small></span>
      </button>
      <nav className={menu ? "navLinks open" : "navLinks"}>
        <button className={screen === "home" ? "navActive" : ""} onClick={() => go("home")}><HomeIcon size={15}/> Home</button>
        <button className={farmerScreens.includes(screen) ? "navActive" : ""} onClick={() => (goFarmerArea ? goFarmerArea() : go("farmerGate"))}><Sprout size={15}/> Farmer</button>
        <button className={INDUSTRY_ALL_SCREENS.includes(screen) ? "navActive" : ""} onClick={() => go("industryGate")}><Factory size={15}/> Industry</button>
        <button onClick={() => go("about")}><CircleHelp size={15}/> How it works</button>
      </nav>
      <div className="navRight">
        <GoogleLanguageSelector />
        <span className="live"><i/> Prototype Live</span>
        <button className="iconBtn" onClick={() => setMenu(!menu)}><Menu size={19}/></button>
      </div>
    </header>
  );
}

function Home({ go, goFarmerArea }) {
  const startFarmer = goFarmerArea || (() => go("farmerGate"));
  return (
    <>
      <section className="hero">
        <div className="heroGlow"/>
        <div className="heroContent">
          <div className="eyebrow"><span>SIH PROTOTYPE</span> • AGRICULTURAL CIRCULARITY</div>
          <h1>Turn sugarcane residue into <em>value.</em></h1>
          <p className="heroText">
            SUGAM connects farmers with industries that can use agricultural residue —
            helping convert waste into income, materials and energy.
          </p>
          <div className="heroActions">
            <button className="primaryBtn" onClick={startFarmer}><Sprout size={18}/> Start as Farmer <ArrowRight size={17}/></button>
            <button className="secondaryBtn" onClick={() => go("industryGate")}><Factory size={18}/> Explore Industry</button>
          </div>
          <div className="trustRow">
            <span><CheckCircle2 size={15}/> Resource matching</span>
            <span><CheckCircle2 size={15}/> Sustainability insights</span>
            <span><CheckCircle2 size={15}/> Local connections</span><span><ShieldCheck size={15}/> Transparent demo logic</span>
          </div>
        </div>
        <div className="heroVisual">
          <div className="orbitCard cardA"><Sprout/><div><b>6.0 T</b><small>Bagasse listed</small></div></div>
          <div className="plantCircle"><div className="plantInner"><Leaf size={58}/><span>WASTE</span><strong>→ VALUE</strong></div></div>
          <div className="orbitCard cardB"><Factory/><div><b>92%</b><small>Potential match</small></div></div>
          <div className="impactPill"><TrendingUp size={16}/><span><b>4.3 T</b> potential CO₂ impact avoided</span></div>
        </div>
      </section>

      <section className="statsStrip">
        <Metric value="1,250+" label="Tons of residue in demo region" icon={<Package/>}/>
        <Metric value="85" label="Industry connections" icon={<Factory/>}/>
        <Metric value="320" label="Farmers represented" icon={<Users/>}/>
        <Metric value="4" label="Residue pathways" icon={<Recycle/>}/>
      </section>
      <div className="statsDisclaimer"><ShieldCheck size={13}/> Figures above are illustrative demo numbers for this SIH prototype, not live production data.</div>

      <section className="section">
        <div className="sectionHeading">
          <div><span className="sectionTag">THE PROBLEM</span><h2>Waste is a resource waiting for a route.</h2></div>
          <p>Farm residue often has value beyond disposal. SUGAM creates a simple bridge between the source and the next useful destination.</p>
        </div>
        <div className="problemGrid">
          <InfoCard icon={<Wheat/>} title="At the farm" text="Residue is generated after harvest, but farmers may not know who can use it or what it is worth."/>
          <InfoCard icon={<Route/>} title="The missing link" text="Information about suitable utilization pathways, demand, distance and value is fragmented."/>
          <InfoCard icon={<Factory/>} title="At the industry" text="Industries need consistent biomass supply but spend time discovering suitable local sources."/>
        </div>
      </section>

      <section className="journey">
        <div className="sectionHeading light">
          <div><span className="sectionTag gold">HOW SUGAM CONNECTS</span><h2>From residue to resource in four steps.</h2></div>
        </div>
        <div className="journeyGrid">
          {[
            ["01","LIST","Farmer registers residue","Sprout"],
            ["02","ANALYSE","SUGAM maps possible uses","Sparkles"],
            ["03","MATCH","Industries are matched","Handshake"],
            ["04","CONNECT","Both sides can proceed","CheckCircle2"],
          ].map(([n,k,t,ic]) => {
            const I = {Sprout, Sparkles, Handshake, CheckCircle2}[ic];
            return <div className="journeyItem" key={n}><span>{n}</span><I size={24}/><small>{k}</small><b>{t}</b></div>
          })}
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div><span className="sectionTag">WHY IT MATTERS</span><h2>Designed around measurable value.</h2></div>
        </div>
        <div className="valueGrid">
          <ValueCard icon={<IndianRupee/>} title="Economic value" text="Surface indicative material value and transport considerations before a connection is made."/>
          <ValueCard icon={<Leaf/>} title="Environmental value" text="Show a transparent sustainability signal for each utilization pathway."/>
          <ValueCard icon={<Users/>} title="Network value" text="Create a two-sided marketplace where farmer supply meets industry demand."/>
        </div>
      </section>

      <section className="loop">
        <div className="loopHead"><span className="sectionTag gold">CIRCULAR ECONOMY</span><h2>Waste doesn't have to be an endpoint.</h2></div>
        <div className="loopRow">
          <LoopNode icon={<Wheat size={20}/>} label="Residue"/>
          <LoopArrow/>
          <LoopNode icon={<Sparkles size={20}/>} label="Utilization"/>
          <LoopArrow/>
          <LoopNode icon={<Factory size={20}/>} label="Industry"/>
          <LoopArrow/>
          <LoopNode icon={<Recycle size={20}/>} label="Resource"/>
          <LoopArrow loop/>
        </div>
        <p className="loopCaption">Each cycle keeps material in use on a farm or in an industry, instead of it going to waste.</p>
      </section>

      <section className="cta">
        <div><span className="sectionTag gold">READY FOR A DEMO?</span><h2>Show the journey. Not just the screens.</h2><p>Take a farmer from listing residue to discovering a real utilization pathway in a few clicks.</p></div>
        <button className="goldBtn" onClick={startFarmer}>Launch Farmer Journey <ArrowRight size={18}/></button>
      </section>
      <Footer/>
    </>
  );
}

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((s, i) => {
        const I = s.icon;
        const state = i < current ? "done" : i === current ? "active" : "";
        return (
          <div className={state ? `step ${state}` : "step"} key={s.n}>
            <span className="stepIcon">{state === "done" ? <CheckCircle2 size={14}/> : <I size={14}/>}</span>
            <div className="stepText"><b>{s.n}</b><small>{s.label}</small></div>
            {i < STEPS.length - 1 && <span className="stepLine"/>}
          </div>
        );
      })}
    </div>
  );
}

function Farmer({ farmer, setFarmer, go, notify }) {
  const [errors, setErrors] = useState({});
  const [showQuality, setShowQuality] = useState(false);
  const update = (key, value) => { setFarmer({...farmer, [key]: value}); if (errors[key]) setErrors({...errors, [key]: null}); };
  const toggleChip = (key, value) => update(key, farmer[key] === value ? "" : value);
  const submit = () => {
    const errs = {};
    if (!farmer.name.trim()) errs.name = "Please enter the farmer name.";
    if (!farmer.quantity || Number(farmer.quantity) <= 0) errs.quantity = "Enter a valid quantity greater than 0.";
    setErrors(errs);
    if (Object.keys(errs).length) return notify(errs.name || errs.quantity, "error");
    go("analysis");
  };
  return (
    <Page>
      <Stepper current={0}/>
      <div className="pageTop">
        <div><span className="sectionTag">FARMER JOURNEY</span><h1>Register your residue</h1><p>Tell SUGAM what you have. We'll map the possible utilization pathways.</p></div>
      </div>
      <div className="workspace twoCol">
        <div className="formCard">
          <div className="cardTitle"><span className="roundIcon green"><Sprout size={20}/></span><div><h3>Residue profile</h3><p>Simple inputs for a quick prototype assessment.</p></div></div>
          <Field label="Farmer name" required error={errors.name}><input value={farmer.name} onChange={e=>update("name",e.target.value)} placeholder="e.g. Ramesh Patil"/></Field>
          <Field label="Location"><div className="inputIcon"><MapPin size={17}/><input value={farmer.location} onChange={e=>update("location",e.target.value)} placeholder="District / village"/></div></Field>
          <Field label="What residue do you have?">
            <div className="choiceGrid">{WASTE_TYPES.map(w=><button key={w} className={farmer.wasteType===w?"choice active":"choice"} onClick={()=>update("wasteType",w)}><span>{w==="Bagasse"?"🌿":w==="Sugarcane Leaves"?"🍃":w==="Press Mud"?"🟤":"🌾"}</span>{w}<CheckCircle2 size={15}/></button>)}</div>
          </Field>
          <div className="formRow">
            <Field label="Quantity (tons)" required error={errors.quantity}><div className="inputSuffix"><input type="number" min="0.1" step="0.1" value={farmer.quantity} onChange={e=>update("quantity",e.target.value)}/><span>TONS</span></div></Field>
            <Field label="Available from"><div className="inputIcon"><CalendarDays size={17}/><input type="date" value={farmer.availableFrom} onChange={e=>update("availableFrom",e.target.value)}/></div></Field>
          </div>

          <button type="button" className="qualityToggle" onClick={()=>setShowQuality(v=>!v)}>
            {showQuality ? <ChevronUp size={14}/> : <ChevronDown size={14}/>} Quality information <small>(optional)</small>
          </button>
          {showQuality && (
            <div className="qualityPanel">
              <Field label="Moisture level"><div className="choiceGrid">{MOISTURE_LEVELS.map(m=><button type="button" key={m} className={farmer.moisture===m?"choice blueActive":"choice"} onClick={()=>toggleChip("moisture",m)}>{m}<CheckCircle2 size={15}/></button>)}</div></Field>
              <Field label="Contamination"><div className="choiceGrid">{CONTAMINATION_LEVELS.map(c=><button type="button" key={c} className={farmer.contamination===c?"choice blueActive":"choice"} onClick={()=>toggleChip("contamination",c)}>{c}<CheckCircle2 size={15}/></button>)}</div></Field>
              <Field label="Storage condition"><div className="choiceGrid">{STORAGE_CONDITIONS.map(s=><button type="button" key={s} className={farmer.storage===s?"choice blueActive":"choice"} onClick={()=>toggleChip("storage",s)}>{s}<CheckCircle2 size={15}/></button>)}</div></Field>
              <Field label="Notes"><textarea className="qualityNotes" rows={3} value={farmer.qualityNotes} onChange={e=>update("qualityNotes",e.target.value)} placeholder="e.g. baled and stacked under shed roof"/></Field>
            </div>
          )}

          <button className="primaryBtn full" onClick={submit}>Analyse my residue <ArrowRight size={18}/></button>
          <p className="formHint"><ShieldCheck size={14}/> Demo data stays within this prototype session.</p>
        </div>
        <div className="sidePanel greenPanel">
          <div className="panelOrb"><Leaf size={36}/></div>
          <span className="miniLabel">WHAT HAPPENS NEXT</span>
          <h2>Your residue gets a utilization map.</h2>
          <p>SUGAM doesn't simply give one answer. It presents multiple possible pathways so the user can understand the trade-offs.</p>
          <div className="bullet"><CheckCircle2/><div><b>On-farm retention</b><small>See what can stay on the farm.</small></div></div>
          <div className="bullet"><CheckCircle2/><div><b>Pathway comparison</b><small>Compare value, cost and impact.</small></div></div>
          <div className="bullet"><CheckCircle2/><div><b>Industry demand</b><small>See who may need it.</small></div></div>
        </div>
      </div>
    </Page>
  );
}

function Analysis({ farmer, setFarmer, industries, go, notify }) {
  const methods = METHODS[farmer.wasteType] || METHODS.Bagasse;
  const qty = Number(farmer.quantity) || 0;

  const retention = computeRetention(farmer.wasteType, farmer.quantity, farmer.retainedOverride);
  const surplus = retention.surplus;
  const burn = surplus * 1.5;

  const seed = `${farmer.wasteType}|${farmer.location}|${farmer.quantity}`;
  const pathways = useMemo(
    () => computePathways({ wasteType: farmer.wasteType, surplusQty: surplus, seed, industries }),
    [farmer.wasteType, surplus, seed, industries]
  );
  const bestNetId = pathways.length
    ? pathways.reduce((best, p) => (p.netRealization > best.netRealization ? p : best), pathways[0]).id
    : null;
  const [pathwayId, setPathwayId] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const activePathway = pathways.find((p) => p.id === pathwayId) || null;

  const selectPathway = (id) => { setPathwayId(id); setConfirmed(null); };
  const confirmPathway = () => {
    setConfirmed(pathwayId);
    notify(`${activePathway.title} confirmed for ${surplus} T`);
  };

  return (
    <Page>
      <Stepper current={1}/>
      <div className="pageTop">
        <div><span className="sectionTag">SUGAM ANALYSIS</span><h1>Residue utilization map</h1><p>{farmer.wasteType} • {qty} tons • {farmer.location}</p></div>
        <div className="analysisBadge"><Sparkles size={16}/> Decision support</div>
      </div>
      <div className="analysisSummary">
        <div><span>RESIDUE</span><b>{farmer.wasteType}</b></div>
        <div><span>QUANTITY</span><b>{qty} T</b></div>
        <div><span>LOCATION</span><b>{farmer.location}</b></div>
        <div><span>PATHWAYS</span><b>{methods.length} identified</b></div>
      </div>

      <RetentionCard totalQty={qty} retention={retention} farmer={farmer} setFarmer={setFarmer} />

      <div className="notice warning"><Leaf size={19}/><div><b>Reference scenario</b><p>If the {surplus} T transferable surplus is burned instead, the illustrative comparison baseline is {burn.toFixed(1)} T CO₂e, ₹0 recovered and no soil benefit. Every pathway below is scored against this.</p></div></div>

      <div className="sectionMini"><div><span className="sectionTag">STEP 01</span><h2>Utilization methods</h2></div><span>Sorted by sustainability signal</span></div>
      <div className="methodGrid">
        {methods.map((m,i)=><MethodCard key={m.method} method={m} index={i} qty={surplus}/>)}
      </div>

      <div className="sectionMini"><div><span className="sectionTag">STEP 02</span><h2>Compare pathways for your {surplus} T surplus</h2></div><span>Fixed, disclosed arithmetic — no prediction</span></div>
      {surplus <= 0 ? (
        <div className="empty"><Sprout size={30}/><h3>No transferable surplus</h3><p>The whole {qty} T is estimated to stay on the farm at the current retention level. Lower it above to see pathway options.</p></div>
      ) : (
        <div className="pathwayGrid">
          {pathways.map((p) => (
            <PathwayCard key={p.id} p={p} isBest={p.id === bestNetId} isSelected={pathwayId === p.id} onSelect={() => selectPathway(p.id)} />
          ))}
        </div>
      )}

      {activePathway && activePathway.id !== "industry" && (
        <div className={confirmed === activePathway.id ? "confirmBox confirmed" : "confirmBox"}>
          {confirmed === activePathway.id ? (
            <div className="confirmedRow"><CheckCircle2 size={18}/> {activePathway.title} confirmed for {surplus} T.</div>
          ) : (
            <>
              <p>
                {activePathway.id === "local" && "Confirming flags this lot for pickup by a local processor — you'll coordinate handoff directly."}
                {activePathway.id === "aggregation" && "Confirming adds this lot to the nearest aggregation point's pooled batch with other farmers."}
              </p>
              <button className="primaryBtn" onClick={confirmPathway}>Confirm {activePathway.title} <ArrowRight size={17}/></button>
            </>
          )}
        </div>
      )}

      <div className="bottomAction">
        <button className="secondaryBtn" onClick={()=>go("farmer")}><ArrowLeft size={17}/> Edit residue</button>
        <button className="primaryBtn" onClick={()=>go("matches")}>Explore industry matches <ArrowRight size={17}/></button>
      </div>
    </Page>
  );
}

/* ---- Smart On-Farm Retention card ---- */
function RetentionCard({ totalQty, retention, farmer, setFarmer }) {
  const isCustom = farmer.retainedOverride !== "";
  return (
    <div className="retentionCard">
      <div className="retentionHead">
        <div className="retentionTitle"><SlidersHorizontal size={17}/> Smart On-Farm Retention</div>
        <span className="estimateBadge"><Info size={11}/> Estimate — demo assumption</span>
      </div>
      <p className="retentionText">{retention.rationale} Rule of thumb: keep ~{retention.ratePct}% of {totalQty} T on-farm. Adjust the slider if your situation differs.</p>
      <div className="retentionFlow">
        <div className="flowFigure"><span>Available</span><b>{totalQty} T</b></div>
        <ArrowRight size={16}/>
        <div className="flowFigure retain"><span>On-Farm Retention</span><b>{retention.retained} T</b></div>
        <ArrowRight size={16}/>
        <div className="flowFigure surplus"><span>Transferable Surplus</span><b>{retention.surplus} T</b></div>
      </div>
      <div className="retentionSliderRow">
        <span>Retained on-farm: {retention.retained} T</span>
        {isCustom && <button className="tinyAction" onClick={()=>setFarmer({...farmer, retainedOverride:""})}>Reset to recommended ({retention.recommendedRetained} T)</button>}
      </div>
      <input type="range" min={0} max={totalQty} step={0.1} value={retention.retained} onChange={e=>setFarmer({...farmer, retainedOverride: e.target.value})} className="retentionSlider"/>
    </div>
  );
}

/* ---- Pathway Decision Engine card ---- */
function PathwayCard({ p, isBest, isSelected, onSelect }) {
  const [showWhy, setShowWhy] = useState(false);
  const I = p.icon;
  return (
    <div className={`pathwayCard${isBest ? " best" : ""}${isSelected ? " selected" : ""}`}>
      <div className="pathwayTop" onClick={onSelect}>
        <div className="pathwayIcon"><I size={18}/></div>
        <div className="pathwayHeadText"><b>{p.title}</b><small>{p.blurb}</small></div>
        {isBest && <span className="pathwayBadge"><Award size={12}/> Highest net value</span>}
      </div>
      <div className="pathwayMetrics" onClick={onSelect}>
        <div className="pathwayMetric"><small>GROSS VALUE</small><b>₹{p.grossValue.toLocaleString("en-IN")}</b></div>
        <div className="pathwayMetric"><small>TRANSPORT</small><b>₹{p.transportCost.toLocaleString("en-IN")}</b></div>
        <div className="pathwayMetric"><small>HANDLING</small><b>₹{p.handlingCost.toLocaleString("en-IN")}</b></div>
        <div className="pathwayMetric net"><small>NET REALIZATION</small><b>₹{p.netRealization.toLocaleString("en-IN")}</b></div>
        <div className="pathwayMetric"><small>DISTANCE</small><b>{p.distanceKm === 0 ? "On-site" : `${p.distanceKm} km`}</b></div>
        <div className="pathwayMetric accent"><small>SOIL / ENV. BENEFIT</small><b>{p.envBenefit.level}</b></div>
      </div>
      <div className="pathwayCompat"><b>Quantity compatibility:</b> {p.quantity.status}</div>
      <button type="button" className="whyToggle" onClick={(e)=>{e.stopPropagation(); setShowWhy(v=>!v);}}>
        <CircleHelp size={13}/> Why this option? {showWhy ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      </button>
      {showWhy && <p className="whyText">{p.why}</p>}
      {isSelected && <div className="pathwaySelected" onClick={onSelect}><CheckCircle2 size={13}/> Selected</div>}
    </div>
  );
}

function MethodCard({ method:m, index, qty }) {
  const I = m.icon;
  const co2 = (qty*m.co2).toFixed(1);
  return <div className={index===0?"methodCard featured":"methodCard"}>
    <div className="methodTop"><div className="methodIcon"><I size={20}/></div><span className="score">{m.score}/100</span></div>
    <div className="rank">{index===0?"RECOMMENDED PATHWAY":`PATHWAY 0${index+1}`}</div>
    <h3>{m.method}</h3><p>{m.reason}</p>
    <div className="progress"><i style={{width:`${m.score}%`}}/></div>
    <div className="methodStats"><div><small>SUSTAINABILITY</small><b>{m.score}%</b></div><div><small>CO₂ SIGNAL</small><b>{co2} T</b></div><div><small>VALUE POTENTIAL</small><b>{m.value}</b></div></div>
  </div>;
}

function Matches({ farmer, industries, connected, setConnected, notify, go, createShipment, shipments, setActiveShipmentId }) {
  const methods = METHODS[farmer.wasteType] || METHODS.Bagasse;
  const [activeMethod, setActiveMethod] = useState(methods[0]);
  const retention = computeRetention(farmer.wasteType, farmer.quantity, farmer.retainedOverride);
  const qty = retention.surplus;
  const options = industries
    .filter(x => x.wasteType === farmer.wasteType && x.type === activeMethod.method)
    .map(x => {
      const match = Math.min(98, Math.round(62 + (x.demand >= qty ? 16 : 7) + (x.distance <= 20 ? 12 : 5) + (x.rate >= 1500 ? 7 : 0)));
      return { ...x, match, materialValue: Math.round(x.rate * qty), transport: Math.round(x.distance * 60), co2: (qty * activeMethod.co2).toFixed(1) };
    })
    .sort((a, b) => b.match - a.match);

  return (
    <Page>
      <Stepper current={3}/>
      <div className="pageTop">
        <div><span className="sectionTag">STEP 03-04 • MATCH</span><h1>Find the right industry</h1><p>Matching your <b>{qty} T</b> transferable surplus. Choose a utilization pathway first, then inspect industries whose demand matches that pathway.</p></div>
        <button className="secondaryBtn" onClick={() => go("analysis")}><ArrowLeft size={17}/> Back to analysis</button>
      </div>

      <div className="pathwayChooser">
        <div className="chooserHead"><div><span className="sectionTag">DECISION SUPPORT</span><h2>Which route do you want to explore?</h2></div><span>{methods.length} pathways identified</span></div>
        <div className="chooserGrid">
          {methods.map((m, i) => {
            const I = m.icon;
            const selected = activeMethod.method === m.method;
            return <button key={m.method} className={selected ? "pathChoice selected" : "pathChoice"} onClick={() => setActiveMethod(m)}>
              <span className="pathChoiceIcon"><I size={18}/></span><span className="pathChoiceText"><b>{m.method}</b><small>{m.score}/100 sustainability signal</small></span>{selected && <CheckCircle2 size={18}/>} 
            </button>;
          })}
        </div>
      </div>

      <div className="matchHero">
        <div><span className="miniLabel">ACTIVE PATHWAY</span><h2>{activeMethod.method}</h2><p>{activeMethod.reason}</p></div>
        <div className="matchHeroScore"><span>Potential impact</span><b>{(qty * activeMethod.co2).toFixed(1)} T</b><small>CO₂ signal for this lot</small></div>
      </div>
      <div className="sectionMini"><div><span className="sectionTag">MATCH NETWORK</span><h2>{options.length} potential connection{options.length !== 1 ? "s" : ""}</h2></div><div className="sortPill"><Gauge size={15}/> Ranked by compatibility</div></div>
      {options.length === 0 ? <div className="empty"><Factory size={30}/><h3>No matching industry yet</h3><p>No registered industry currently demands <b>{farmer.wasteType}</b> for <b>{activeMethod.method}</b>. Add a demand profile or switch pathways.</p><button className="primaryBtn" onClick={() => go("industry")}><Plus size={17}/> Publish / view industry demand</button></div> :
        <div className="matchGrid">{options.map((x, i) => {
          const existingShipment = shipments.find((s) => s.industryId === x.id);
          return <MatchCard key={x.id} item={x} rank={i + 1} connected={connected.includes(x.id)} hasShipment={!!existingShipment}
            industryAccepted={!!existingShipment?.industryAccepted}
            onConnect={() => {
              if (!connected.includes(x.id)) { setConnected([...connected, x.id]); notify(`Connection request sent to ${x.name}`); }
              createShipment(x, qty);
            }}
            onOpenLogistics={() => {
              if (!existingShipment?.industryAccepted) { notify("Waiting for the industry to accept your request.", "error"); return; }
              createShipment(x, qty);
              go("logistics");
            }}
            onOpenPassport={() => {
              if (!existingShipment?.industryAccepted) { notify("The Residue Passport becomes available after industry acceptance.", "error"); return; }
              createShipment(x, qty);
              go("passport");
            }}
          />;
        })}</div>}
      <div className="demoNote"><ShieldCheck size={18}/><div><b>How the match is calculated in this prototype</b><p>Compatibility combines demand capacity, indicative rate and proximity. It is a transparent demo heuristic — not a production AI prediction.</p></div></div>
    </Page>
  );
}

function MatchCard({item,rank,connected,onConnect,hasShipment,industryAccepted,onOpenLogistics,onOpenPassport}) {
  return <div className={rank===1?"matchCard top":"matchCard"}>
    <div className="matchHead">
      <div className="companyLogo"><Factory size={20}/></div>
      <div className="companyName"><h3>{item.name}</h3><span>{item.type} {item.verified && <span className="chip verified"><ShieldCheck size={11}/> Verified</span>}</span></div>
      <div className="matchScore" style={{"--pct": item.match}}><div className="ring"><b>{item.match}%</b><small>MATCH</small></div></div>
    </div>
    {rank===1&&<div className="bestRibbon"><Award size={14}/> Strongest demo match</div>}
    <div className="companyMeta"><span><MapPin size={14}/>{item.distance} km</span><span><Package size={14}/>{item.demand} T/mo demand</span><span><IndianRupee size={14}/>₹{item.rate.toLocaleString("en-IN")}/T</span></div>
    <div className="matchMetrics"><MetricSmall label="Lot value" value={`₹${item.materialValue.toLocaleString("en-IN")}`}/><MetricSmall label="Transport*" value={`₹${item.transport.toLocaleString("en-IN")}`}/><MetricSmall label="CO₂ signal" value={`${item.co2} T`}/></div>
    <div className="contact"><UserRound size={14}/><span>Contact: <b>{item.contact}</b></span><span className="location">{item.location}</span></div>
    <button className={connected?"connectedBtn":"connectBtn"} disabled={connected} onClick={onConnect}>
      {connected ? <><CheckCircle2 size={17}/> {industryAccepted ? "Industry accepted" : "Request sent — awaiting acceptance"}</> : <><Handshake size={17}/> Connect with industry</>}
    </button>
    {connected && hasShipment && !industryAccepted && <div className="matchWaiting"><Clock size={14}/> Waiting for industry acceptance before pickup can begin.</div>}
    {connected && hasShipment && industryAccepted && <button className="logisticsBtn" onClick={onOpenLogistics}><Navigation size={16}/> View pickup &amp; logistics</button>}
    {connected && hasShipment && industryAccepted && <button className="logisticsBtn passportBtn" onClick={onOpenPassport}><QrCode size={16}/> View Residue Passport</button>}
    <small className="disclaimer">*Transport estimate is a prototype assumption, not a live quotation.</small>
  </div>;
}

// ---------------------------------------------------------------------------
// LOGISTICS — shown once a farmer has accepted an industry/collection
// destination. Pickup + destination + distance + ETA + route info, plus a
// one-tap Google Maps Directions deep link (no API key required).
// ---------------------------------------------------------------------------
function Logistics({ shipment, go, notify }) {
  if (!shipment) {
    return (
      <Page>
        <div className="empty"><Truck size={30}/><h3>No pickup scheduled yet</h3><p>Connect with an industry from your matches to generate a pickup and logistics plan.</p>
          <button className="primaryBtn" onClick={() => go("matches")}><ArrowLeft size={17}/> Back to matches</button>
        </div>
      </Page>
    );
  }

  if (!shipment.industryAccepted) {
    return (
      <Page>
        <div className="empty"><Handshake size={30}/><h3>Awaiting industry acceptance</h3><p>Your request has been sent. Pickup planning and navigation unlock after the industry accepts this connection.</p>
          <button className="primaryBtn" onClick={() => go("matches")}><ArrowLeft size={17}/> Back to matches</button>
        </div>
      </Page>
    );
  }

  const mapsUrl = buildGoogleMapsDirectionsUrl(shipment.origin, shipment.destination);
  const eta = formatDurationHours(shipment.estTravelHours);

  const openMaps = () => {
    window.open(mapsUrl, "_blank", "noopener,noreferrer");
    notify("Opening Google Maps directions…");
  };

  return (
    <Page>
      <div className="pageTop">
        <div><span className="sectionTag blue">LOGISTICS</span><h1>Pickup &amp; route</h1><p>Destination accepted with <b>{shipment.industryName}</b>. Here's how the collection will move.</p></div>
        <button className="secondaryBtn" onClick={() => go("matches")}><ArrowLeft size={17}/> Back to matches</button>
      </div>

      <div className="routeCard">
        <div className="routePoints">
          <div className="routePoint">
            <span className="routeDot origin"><Sprout size={15}/></span>
            <div><span className="miniLabel">PICKUP LOCATION</span><b>{shipment.origin}</b></div>
          </div>
          <div className="routeConnector">
            <div className="routeLine"/>
            <div className="routeConnectorMeta"><span><Milestone size={14}/> {shipment.distanceKm} km</span><span><Clock size={14}/> ~{eta}</span></div>
          </div>
          <div className="routePoint">
            <span className="routeDot dest"><Factory size={15}/></span>
            <div><span className="miniLabel">DESTINATION</span><b>{shipment.destination}</b></div>
          </div>
        </div>
        <button className="primaryBlue full" onClick={openMaps}><Navigation size={17}/> Navigate with Google Maps</button>
        <small className="disclaimer">Opens turn-by-turn driving directions in Google Maps using the pickup and destination names above — no map key needed on our side.</small>
      </div>

      <div className="workspace twoCol">
        <div className="formCard">
          <div className="cardTitle"><span className="roundIcon blue"><Route size={20}/></span><div><h3>Route information</h3><p>Prototype estimate — not a live traffic feed.</p></div></div>
          <div className="routeInfoGrid">
            <div><span>Distance</span><b>{shipment.distanceKm} km</b></div>
            <div><span>Est. travel time</span><b>{eta}</b></div>
            <div><span>Assumed avg. speed</span><b>{AVG_TRUCK_SPEED_KMH} km/h</b></div>
            <div><span>Residue &amp; load</span><b>{shipment.quantity} T {shipment.residueType}</b></div>
          </div>
          <p className="routeNote"><Info size={13}/> Travel time uses a fixed disclosed speed assumption for a loaded transport vehicle on mixed rural/highway roads. Actual time will vary with real traffic — Google Maps will account for that once you tap Navigate.</p>
        </div>
        <div className="greenPanel">
          <div className="panelOrb"><Truck size={26}/></div>
          <h2>Ready to track the collection?</h2>
          <p>Follow the vehicle through every stage — from pickup scheduling to delivery — on the demo tracking screen.</p>
          <button className="secondaryBtn onDark" onClick={() => go("tracking")}><RadioTower size={17}/> Open live tracking</button>
          <button className="secondaryBtn onDark" onClick={() => go("passport")}><QrCode size={17}/> View Residue Passport</button>
        </div>
      </div>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// TRACKING — demo transport tracking. Progress is simulated client-side on
// an interval; swap `useDemoTrackingSimulation` for a real GPS/telemetry
// subscription later without touching the rest of this screen.
// ---------------------------------------------------------------------------
function useDemoTrackingSimulation(shipment, updateShipment) {
  const [progress, setProgress] = useState(shipment ? shipment.progress || 0 : 0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => { if (shipment) setProgress(shipment.progress || 0); }, [shipment && shipment.id]);

  useEffect(() => {
    if (!shipment || !playing || progress >= 100) return;
    const tick = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, Math.round((p + 1.4) * 10) / 10);
        const nextStatus = statusForProgress(next).key;
        updateShipment(shipment.id, { progress: next, status: nextStatus });
        if (next >= 100) setPlaying(false);
        return next;
      });
    }, 260);
    return () => clearInterval(tick);
  }, [shipment && shipment.id, playing, progress]);

  const reset = () => {
    setProgress(0);
    setPlaying(true);
    if (shipment) updateShipment(shipment.id, { progress: 0, status: TRACKING_STAGES[0].key });
  };

  return { progress, playing, setPlaying, reset };
}

function Tracking({ shipment, updateShipment, go }) {
  const { progress, playing, setPlaying, reset } = useDemoTrackingSimulation(shipment, updateShipment);

  if (!shipment) {
    return (
      <Page>
        <div className="empty"><RadioTower size={30}/><h3>Nothing to track yet</h3><p>Accept an industry match first to generate a shipment to track.</p>
          <button className="primaryBtn" onClick={() => go("matches")}><ArrowLeft size={17}/> Back to matches</button>
        </div>
      </Page>
    );
  }

  if (!shipment.industryAccepted) {
    return (
      <Page>
        <div className="empty"><Handshake size={30}/><h3>Awaiting industry acceptance</h3><p>Live tracking starts only after the industry accepts your connection request.</p>
          <button className="primaryBtn" onClick={() => go("matches")}><ArrowLeft size={17}/> Back to matches</button>
        </div>
      </Page>
    );
  }

  const stage = statusForProgress(progress);
  const stageIndex = TRACKING_STAGES.findIndex((s) => s.key === stage.key);
  const remainingHours = shipment.estTravelHours * (1 - progress / 100);
  const etaLabel = progress >= 100 ? "Delivered" : `~${formatDurationHours(Math.max(remainingHours, 1 / 60))} remaining`;
  const StageIcon = stage.icon;

  return (
    <Page>
      <div className="pageTop">
        <div><span className="sectionTag gold">TRANSPORT TRACKING</span><h1>Track the collection</h1><p>{shipment.vehicleId} carrying <b>{shipment.quantity} T {shipment.residueType}</b> to <b>{shipment.industryName}</b>.</p></div>
        <div className="pageTopActions">
          <button className="secondaryBtn" onClick={() => go("logistics")}><ArrowLeft size={17}/> Back to route</button>
          <button className="primaryBtn" onClick={() => go("passport")}><QrCode size={17}/> Residue Passport</button>
        </div>
      </div>

      <div className="demoLiveBanner"><span className="livePulse"/><b>Demo live tracking</b><span className="demoLiveText">Vehicle movement below is a simulated prototype, not a real GPS position. A production build would swap this for a live telemetry/GPS feed.</span></div>

      <div className="trackCard">
        <div className="trackCardTop">
          <div className="trackStatusBig">
            <span className="trackStatusIcon"><StageIcon size={22}/></span>
            <div><span className="miniLabel">CURRENT STATUS</span><h2>{stage.label}</h2></div>
          </div>
          <div className="trackEta"><span className="miniLabel">ETA</span><b>{etaLabel}</b></div>
        </div>

        <div className="routeTrack">
          <div className="routeTrackLine"><i style={{ width: `${progress}%` }}/></div>
          <div className="routeTrackTruck" style={{ left: `${progress}%` }}><Truck size={18}/></div>
          <div className="routeTrackStages">
            {TRACKING_STAGES.map((s, i) => {
              const SIcon = s.icon;
              const done = i < stageIndex || progress >= 100 && i === TRACKING_STAGES.length - 1;
              const active = i === stageIndex;
              return (
                <div key={s.key} className={`trackStage${done ? " done" : ""}${active ? " active" : ""}`}>
                  <span className="trackStageDot">{done ? <CheckCircle2 size={13}/> : <SIcon size={12}/>}</span>
                  <small>{s.label}</small>
                </div>
              );
            })}
          </div>
        </div>

        <div className="trackControls">
          <button className="tinyAction" onClick={() => setPlaying((p) => !p)} disabled={progress >= 100}>
            {playing && progress < 100 ? <><PauseCircle size={15}/> Pause simulation</> : <><PlayCircle size={15}/> Resume simulation</>}
          </button>
          <button className="tinyAction" onClick={reset}><RotateCcw size={15}/> Restart demo</button>
          <span className="trackProgressPct"><Signal size={13}/> {Math.round(progress)}% of route</span>
        </div>
      </div>

      <div className="workspace twoCol">
        <div className="formCard">
          <div className="cardTitle"><span className="roundIcon gold"><Truck size={20}/></span><div><h3>Shipment details</h3><p>Auto-generated for this prototype connection.</p></div></div>
          <div className="routeInfoGrid">
            <div><span>Vehicle ID</span><b>{shipment.vehicleId}</b></div>
            <div><span>Driver</span><b>{shipment.driverName}</b></div>
            <div><span>Residue type</span><b>{shipment.residueType}</b></div>
            <div><span>Quantity</span><b>{shipment.quantity} T</b></div>
            <div><span>Origin</span><b>{shipment.origin}</b></div>
            <div><span>Destination</span><b>{shipment.destination}</b></div>
          </div>
        </div>
        <div className="formCard">
          <div className="cardTitle"><span className="roundIcon blue"><Route size={20}/></span><div><h3>Route progress</h3><p>Derived from the simulated position above.</p></div></div>
          <div className="routeInfoGrid">
            <div><span>Total distance</span><b>{shipment.distanceKm} km</b></div>
            <div><span>Covered (demo)</span><b>{Math.round((progress / 100) * shipment.distanceKm * 10) / 10} km</b></div>
            <div><span>Status</span><b>{stage.label}</b></div>
            <div><span>ETA</span><b>{etaLabel}</b></div>
          </div>
          <p className="routeNote"><Info size={13}/> This card is structured so a real GPS/telemetry integration can replace the simulated <code>progress</code> value later — every other field here would keep working unchanged.</p>
        </div>
      </div>
    </Page>
  );
}

// ---------------------------------------------------------------------------
// RESIDUE PASSPORT — a unique identity for each accepted batch plus a
// functional QR code and the full 11-stage transaction lifecycle. Reads and
// advances the same `shipment` record used by Logistics/Tracking, so it
// always reflects live status rather than a static mock-up.
// ---------------------------------------------------------------------------
function Passport({
  shipment, updateShipment, go, notify,
  actor = "viewer",
  backTo = "tracking",
  backLabel = "Back to tracking",
  emptyTitle = "No passport issued yet",
  emptyText = "Connect with an industry from your matches to issue a Residue Passport for that lot.",
  emptyActionLabel = "Back to matches",
  emptyGo = "matches",
}) {
  const [copied, setCopied] = useState(false);

  if (!shipment) {
    return (
      <Page>
        <div className="pageTop"><div><span className="sectionTag gold">RESIDUE PASSPORT</span><h1>Digital traceability</h1><p>Every accepted lot gets a unique passport ID, QR code and transaction timeline.</p></div></div>
        <div className="empty"><Fingerprint size={30}/><h3>{emptyTitle}</h3><p>{emptyText}</p>
          <button className="primaryBtn" onClick={() => go(emptyGo)}><ArrowLeft size={17}/> {emptyActionLabel}</button>
        </div>
      </Page>
    );
  }

  const currentIndex = transactionIndexForShipment(shipment);
  const currentStage = TRANSACTION_STAGES[Math.max(0, currentIndex)];
  const qrUrl = buildQrCodeUrl(buildPassportQrPayload(shipment));
  const canVerifyQuality = actor === "industry" && currentIndex >= 7 && !shipment.qualityVerified && !shipment.cancelled;
  const canPay = actor === "industry" && shipment.qualityVerified && shipment.paymentStatus !== "completed" && !shipment.cancelled;
  const canConfirmUtilization = actor === "industry" && shipment.paymentStatus === "completed" && !shipment.utilizationConfirmed && !shipment.cancelled;
  const canCancel = !shipment.cancelled && !shipment.utilizationConfirmed;

  const copyId = () => {
    try { navigator.clipboard.writeText(shipment.passportId); } catch {}
    setCopied(true);
    notify("Passport ID copied");
    setTimeout(() => setCopied(false), 1800);
  };

  const markQualityVerified = () => {
    updateShipment(shipment.id, { qualityVerified: true, qualityVerifiedAt: Date.now() }, actor);
    notify("Quality verified by industry (demo action)");
  };
  const completeDemoPayment = () => {
    updateShipment(shipment.id, { paymentStatus: "completed", paymentAt: Date.now() }, actor);
    notify("Demo payment marked complete — no real gateway used");
  };
  const confirmUtilization = () => {
    updateShipment(shipment.id, { utilizationConfirmed: true, utilizationConfirmedAt: Date.now() }, actor);
    notify("Utilization confirmed — lifecycle complete");
  };
  const cancelTransaction = () => {
    updateShipment(shipment.id, { cancelled: true, cancelledAt: Date.now() });
    notify("Transaction cancelled", "error");
  };
  const canDownloadReceipt = shipment.paymentStatus === "completed";
  const downloadReceipt = () => triggerReceiptDownload(shipment, notify);

  return (
    <Page>
      <div className="pageTop">
        <div><span className="sectionTag gold">RESIDUE PASSPORT</span><h1>Digital traceability</h1><p>Unique batch identity, functional QR and the full transaction lifecycle for this lot.</p></div>
        <button className="secondaryBtn" onClick={() => go(backTo)}><ArrowLeft size={17}/> {backLabel}</button>
      </div>

      {shipment.cancelled && (
        <div className="notice warning"><XCircle size={19}/><div><b>Transaction cancelled</b><p>This transaction was cancelled in the demo and will not progress further. Passport and QR data remain visible for record-keeping.</p></div></div>
      )}

      <div className="passportCard">
        <div className="passportLeft">
          <span className="passportTag"><Fingerprint size={13}/> UNIQUE RESIDUE PASSPORT</span>
          <div className="passportIdRow">
            <h2>{shipment.passportId}</h2>
            <button className="tinyAction" onClick={copyId}>{copied ? <CheckCircle2 size={13}/> : <Copy size={13}/>} {copied ? "Copied" : "Copy ID"}</button>
          </div>
          <div className={`passportStatusPill${shipment.cancelled ? " cancelled" : ""}`}>
            {shipment.cancelled ? <XCircle size={14}/> : <BadgeCheck size={14}/>}
            {shipment.cancelled ? "Cancelled" : currentStage.label}
          </div>
          <div className="passportGrid">
            <div><span>Residue Type</span><b>{shipment.residueType}</b></div>
            <div><span>Quantity</span><b>{shipment.quantity} T</b></div>
            <div><span>Origin</span><b>{shipment.origin}</b></div>
            <div><span>Listed On</span><b>{new Date(shipment.createdAt).toLocaleDateString("en-IN")}</b></div>
            <div><span>Quality</span><b>{shipment.qualitySummary}</b></div>
            <div><span>Current Status</span><b>{shipment.cancelled ? "Cancelled" : currentStage.label}</b></div>
            <div><span>Destination</span><b>{shipment.destination}</b></div>
            <div><span>Transaction ID</span><b>{shipment.transactionId}</b></div>
          </div>
          <p className="routeNote"><Info size={13}/> All identifiers, QR content and statuses on this page are generated live from this demo transaction — nothing shown here is a static placeholder image.</p>
        </div>
        <div className="passportRight">
          <div className="qrCard">
            <img src={qrUrl} width={180} height={180} alt={`QR code for residue passport ${shipment.passportId}`} loading="lazy"/>
            <span className="qrCaption"><ScanLine size={13}/> Scan to view batch record</span>
          </div>
        </div>
      </div>

      <div className="sectionMini"><div><span className="sectionTag">TRANSACTION LIFECYCLE</span><h2>Track every stage of this transaction</h2></div><span>{shipment.cancelled ? "Stopped — cancelled" : `${currentIndex + 1} of ${TRANSACTION_STAGES.length} stages`}</span></div>

      <div className="txTimeline">
        {TRANSACTION_STAGES.map((s, i) => {
          const I = s.icon;
          const done = !shipment.cancelled && i < currentIndex;
          const active = !shipment.cancelled && i === currentIndex;
          const stopped = shipment.cancelled && i > currentIndex;
          return (
            <div key={s.key} className={`txStage${done ? " done" : ""}${active ? " active" : ""}${stopped ? " stopped" : ""}`}>
              <div className="txStageMarker">
                <span className="txStageDot">{done ? <CheckCircle2 size={15}/> : <I size={15}/>}</span>
                {i < TRANSACTION_STAGES.length - 1 && <span className="txStageLine"/>}
              </div>
              <div className="txStageBody">
                <b>{s.label}</b>
                <p>{s.blurb}</p>
                {active && !shipment.cancelled && <span className="txStageNow"><CircleDot size={11}/> Current stage</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="passportAudit">
        <div className="cardTitle"><span className="roundIcon blue"><Activity size={20}/></span><div><h3>Verified activity log</h3><p>Timestamped events from the same shipment record — ready for backend audit history later.</p></div></div>
        <div className="auditList">
          {(shipment.events || []).slice().sort((a, b) => a.at - b.at).map((e) => (
            <div className="auditRow" key={e.id}>
              <span className="auditIcon"><Clock size={13}/></span>
              <div><b>{e.label}</b><small>{e.actor} • {new Date(e.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>{e.detail && <em>{e.detail}</em>}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="passportActions">
        <div className="cardTitle"><span className="roundIcon gold"><ClipboardList size={20}/></span><div><h3>Demo actions</h3><p>Advance the post-delivery stages manually for this prototype.</p></div></div>
        <div className="passportActionRow">
          {actor === "industry" && <button className="tinyAction" disabled={!canVerifyQuality} onClick={markQualityVerified}><ShieldCheck size={14}/> Mark quality verified</button>}
          {actor === "industry" && <button className="tinyAction" disabled={!canPay} onClick={completeDemoPayment}><IndianRupee size={14}/> Complete demo payment</button>}
          <button className="tinyAction" disabled={!canDownloadReceipt} onClick={downloadReceipt}><Download size={14}/> Download Receipt</button>
          {actor === "industry" && <button className="tinyAction" disabled={!canConfirmUtilization} onClick={confirmUtilization}><Recycle size={14}/> Confirm utilization</button>}
          <button className="tinyAction danger" disabled={!canCancel} onClick={cancelTransaction}><XCircle size={14}/> Cancel transaction</button>
        </div>
        {actor !== "industry" && <div className="demoNote"><ShieldCheck size={18}/><div><b>Industry-controlled stages</b><p>Quality verification, payment and utilization confirmation are intentionally locked to the industry side of the transaction.</p></div></div>}
        <div className="demoNote"><ShieldCheck size={18}/><div><b>Demo payment status only</b><p>Payment Completed here is a simulated, manually-triggered status for this prototype. No real payment gateway is integrated — a production build would connect this stage to a verified settlement system.</p></div></div>
      </div>
    </Page>
  );
}

function Industry({industries,setIndustries,notify,go,hideProfileTab}) {
  const [tab,setTab]=useState("browse");
  const [profile,setProfile]=useState({name:"",type:"Paper & Pulp",wasteType:"Bagasse",location:"Pune",demand:"",rate:"",contact:""});
  const [search,setSearch]=useState("");
  const filtered=industries.filter(i=>`${i.name} ${i.wasteType} ${i.type}`.toLowerCase().includes(search.toLowerCase()));
  const loadDemo = () => { setIndustries(DEMO_INDUSTRIES); notify("Demo industry network loaded"); setTab("browse"); };
  const clearNetwork = () => { setIndustries([]); notify("Industry network cleared"); };

  const save=()=>{
    if(!profile.name.trim()) return notify("Industry name is required.","error");
    const id=profile.name.toLowerCase().replace(/[^a-z0-9]/g,"-");
    const entry={id,name:profile.name,type:profile.type,wasteType:profile.wasteType,location:profile.location,distance:24,demand:Number(profile.demand)||20,rate:Number(profile.rate)||1200,contact:profile.contact||"Industry representative",verified:false};
    setIndustries(prev=>[...prev.filter(x=>x.id!==id),entry]); notify(`${entry.name} added to the demo network`); setProfile({...profile,name:"",demand:"",rate:"",contact:""}); setTab("browse");
  };
  return <Page>
    <div className="pageTop"><div><span className="sectionTag blue">{hideProfileTab ? "SUPPLY DISCOVERY" : "INDUSTRY PORTAL"}</span><h1>{hideProfileTab ? "Available residue" : "Industry resource network"}</h1><p>{hideProfileTab ? "Search residue currently listed in the SUGAM demo network." : "Browse available residue and publish your material demand."}</p></div>{!hideProfileTab && <button className="primaryBlue" onClick={()=>setTab("profile")}><Plus size={17}/> Add demand profile</button>}</div>
    {!hideProfileTab && <div className="dashboardTabs"><button className={tab==="browse"?"tab active":"tab"} onClick={()=>setTab("browse")}><Package size={16}/> Browse residue</button><button className={tab==="profile"?"tab active":"tab"} onClick={()=>setTab("profile")}><Building2 size={16}/> My demand profile</button></div>}
    {tab==="browse" ? <><div className="toolbar"><div className="search"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search industry, residue or pathway"/></div>
      <div className="toolbarActions">{industries.length===0 && <button className="tinyAction" onClick={loadDemo}><Sparkles size={13}/> Load demo network</button>}{industries.length>0 && <button className="tinyAction danger" onClick={clearNetwork}><X size={13}/> Clear network</button>}<span>{filtered.length} profiles</span></div></div>
      {filtered.length===0 ? <div className="empty"><Building2 size={30}/><h3>No industry demand yet</h3><p>Publish a demand profile or load the demo network to see how the marketplace looks with listings.</p><button className="primaryBlue" onClick={loadDemo}><Sparkles size={17}/> Load demo network</button></div> :
      <div className="industryTable"><div className="tableHead"><span>Industry</span><span>Residue</span><span>Demand</span><span>Rate</span><span>Location</span><span/></div>
      {filtered.map((i,idx)=><div className="tableRow" key={i.id}><div className="tableCompany"><span className="tinyLogo"><Factory size={15}/></span><span><b>{i.name}</b><small>{i.type}</small></span></div><span>{i.wasteType}</span><span>{i.demand} T/mo</span><span>₹{i.rate.toLocaleString("en-IN")}</span><span><MapPin size={13}/>{i.location}</span><button className="requestBtn" onClick={()=>notify(`Material inquiry sent to ${i.name}`)}>Request</button></div>)}</div>}</> :
      <div className="formCard wide"><div className="cardTitle"><span className="roundIcon blue"><Factory size={20}/></span><div><h3>Publish industry demand</h3><p>Tell farmers what material your industry can use.</p></div></div>
        <Field label="Industry name"><input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} placeholder="e.g. Konkan Paper Mills"/></Field>
        <Field label="Utilization pathway"><select value={profile.type} onChange={e=>setProfile({...profile,type:e.target.value})}>{Object.values(METHODS).flat().map(m=><option key={m.method}>{m.method}</option>)}</select></Field>
        <Field label="Residue required"><div className="choiceGrid">{WASTE_TYPES.map(w=><button key={w} className={profile.wasteType===w?"choice blueActive":"choice"} onClick={()=>setProfile({...profile,wasteType:w})}>{w}<CheckCircle2 size={15}/></button>)}</div></Field>
        <div className="formRow"><Field label="Location"><input value={profile.location} onChange={e=>setProfile({...profile,location:e.target.value})} placeholder="City / district"/></Field><Field label="Demand (tons/month)"><input type="number" value={profile.demand} onChange={e=>setProfile({...profile,demand:e.target.value})} placeholder="e.g. 25"/></Field></div>
        <div className="formRow"><Field label="Indicative rate (₹/ton)"><input type="number" value={profile.rate} onChange={e=>setProfile({...profile,rate:e.target.value})} placeholder="e.g. 1500"/></Field><Field label="Contact person"><input value={profile.contact} onChange={e=>setProfile({...profile,contact:e.target.value})} placeholder="Name"/></Field></div>
        <button className="primaryBlue full" onClick={save}><CheckCircle2 size={17}/> Save demand profile</button>
      </div>}
    </Page>;
}

function About({go}) {
  return <Page><div className="pageTop"><div><span className="sectionTag">PRODUCT STORY</span><h1>How SUGAM works</h1><p>A two-sided resource exchange designed around agricultural circularity.</p></div></div>
    <div className="aboutHero"><div className="aboutIcon"><Recycle size={40}/></div><div><span className="miniLabel">CORE IDEA</span><h2>Don't treat residue as the end of a harvest.</h2><p>SUGAM treats agricultural residue as a potential input for another process. The prototype brings farmer supply, utilization pathways and industry demand into one journey.</p></div></div>
    <div className="aboutGrid">{[
      [Sprout,"1. Farmer supply","A farmer records the residue type, quantity, location and availability."],
      [Sparkles,"2. Decision support","The prototype compares transferable-surplus pathways and shows sustainability signals."],
      [Factory,"3. Industry demand","Industries can publish what residue they need, how much they need and an indicative rate."],
      [Handshake,"4. Connection","A farmer can inspect matching industries and send a connection request."],
    ].map(([I,t,p])=><div className="aboutCard" key={t}><I size={24}/><h3>{t}</h3><p>{p}</p></div>)}</div>
    <div className="demoNote"><CircleHelp/><div><b>Prototype note</b><p>Distances, transport estimates, sustainability scores and demo statistics are illustrative. A production version would connect these modules to verified datasets, geolocation, industry verification and transaction workflows.</p></div></div>
    <button className="primaryBtn" onClick={()=>go("farmer")}>Experience the farmer journey <ArrowRight size={17}/></button>
  </Page>;
}

function Page({children}) { return <main className="main">{children}</main>; }

function Field({label,children,error,required}) {
  return <label className={error?"field fieldError":"field"}>
    <span>{label}{required && <span className="req">*</span>}</span>
    {children}
    {error && <small className="fieldErrorText">{error}</small>}
  </label>;
}
function LoopNode({icon,label}) { return <div className="loopNode"><span>{icon}</span><b>{label}</b></div>; }
function LoopArrow({loop}) { return <div className={loop?"loopArrow back":"loopArrow"}>{loop?<Recycle size={16}/>:<ArrowRight size={16}/>}</div>; }
function Metric({value,label,icon}) { return <div className="metric"><span className="metricIcon">{icon}</span><div><b>{value}</b><span>{label}</span></div></div>; }
function MetricSmall({label,value}) { return <div><small>{label}</small><b>{value}</b></div>; }
function InfoCard({icon,title,text}) { return <div className="infoCard"><span className="infoIcon">{icon}</span><h3>{title}</h3><p>{text}</p></div>; }
function ValueCard({icon,title,text}) { return <div className="valueCard"><span>{icon}</span><h3>{title}</h3><p>{text}</p></div>; }
function Toast({message,tone}) { return <div className={tone==="error"?"toast error":"toast"}><CheckCircle2 size={18}/>{message}</div>; }
function Footer(){return <footer><div className="brand footerBrand"><span className="brandMark"><Sprout size={19}/></span><span><b>SUGAM</b><small>Sustainable Resource Exchange</small></span></div><span>Prototype • Agricultural Circularity • SIH-ready concept</span></footer>;}

/* ============================================================
   PHASE 1 — SHARED DESIGN SYSTEM PRIMITIVES
   Reusable pieces used across Farmer / Industry / public screens.
   Nothing below touches existing SUGAM calculations or state.
   ============================================================ */

function StatusBadge({ tone = "neutral", children, icon }) {
  return <span className={"statusBadge tone-" + tone}>{icon}{children}</span>;
}

function DashboardCard({ title, icon, action, children, className = "" }) {
  return (
    <div className={"dashCard " + className}>
      {(title || action) && (
        <div className="dashCardHead">
          <div className="dashCardTitle">{icon}<h3>{title}</h3></div>
          {action}
        </div>
      )}
      <div className="dashCardBody">{children}</div>
    </div>
  );
}

function MetricCard({ icon, label, value, hint, tone = "neutral" }) {
  return (
    <div className={"metricCard tone-" + tone}>
      <span className="metricCardIcon">{icon}</span>
      <div>
        <b>{value}</b>
        <span>{label}</span>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}

function EmptyState({ icon, title, text, action }) {
  return (
    <div className="emptyState">
      <span className="emptyStateIcon">{icon}</span>
      <h4>{title}</h4>
      <p>{text}</p>
      {action}
    </div>
  );
}

// Generic first-entry gate for a role (Farmer / Industry). Presents the
// two required choices — Sign In and Sign Up — plus branding, a short
// explainer and a way to switch roles. Auth here is fully simulated via
// localStorage, matching SUGAM's existing prototype-auth approach; no
// backend is implied.
function RoleGate({ role, onSignIn, onSignUp, onSwitchRole, onHelp, onDemoLogin }) {
  const isFarmer = role === "farmer";
  const accountKey = isFarmer ? "sugam_farmer_real_account_exists" : "sugam_industry_real_account_exists";
  const hasAccount = (() => { try { return localStorage.getItem(accountKey) === "1"; } catch { return false; } })();

  return (
    <Page>
      <section className="gateWrap">
        <div className="gateCard">
          <div className="gateBrand">
            <span className="brandMark"><Sprout size={22}/></span>
            <div><b>SUGAM</b><small>Sustainable Resource Exchange</small></div>
          </div>
          <span className="gateRoleTag">{isFarmer ? <Sprout size={13}/> : <Factory size={13}/>} {isFarmer ? "Farmer Portal" : "Industry Portal"}</span>
          <h1>{isFarmer ? "List and sell your residue, the simple way." : "Find reliable local residue supply."}</h1>
          <p className="gateSub">
            {isFarmer
              ? "Register once, list your residue, and see clear matches, pricing and pickup details — in a few taps."
              : "Post your requirement, discover nearby residue, and manage pickup, quality and payment in one place."}
          </p>

          <div className="gateActions">
            <button className="primaryBtn gateBtn" onClick={onSignIn}>
              {isFarmer ? <Sprout size={18}/> : <Factory size={18}/>} Sign In <ArrowRight size={16}/>
            </button>
            <button className="secondaryBtn gateBtn" onClick={onSignUp}>
              <Users size={18}/> Sign Up {!hasAccount && <span className="gateNewTag">New</span>}
            </button>
          </div>

          <div className="gateMeta">
            <button className="linkBtn" onClick={onSwitchRole}>
              {isFarmer ? <Factory size={14}/> : <Sprout size={14}/>}
              {isFarmer ? "I'm here as an Industry" : "I'm here as a Farmer"}
            </button>
            <button className="linkBtn" onClick={onHelp}><CircleHelp size={14}/> Help &amp; Support</button>
          </div>

          <p className="gateDemoNote"><ShieldCheck size={12}/> Prototype backend sign-in is enabled; OTP delivery is simulated until an SMS provider is connected.</p>

          <div className="demoLoginBox">
            <div className="demoLoginHead"><KeyRound size={15}/> <b>Demo Login</b></div>
            <p className="demoLoginCreds">
              {isFarmer
                ? <>Mobile: <code>9876543210</code> • OTP: <code>1234</code></>
                : <>Email: <code>procurement@sahyadripaper.example</code> • Password: <code>Demo@123</code></>}
            </p>
            <button className="secondaryBtn gateBtn demoLoginBtn" onClick={onDemoLogin}>
              <Sparkles size={16}/> {isFarmer ? "Continue as Demo Farmer" : "Continue as Demo Industry"}
            </button>
          </div>
        </div>

        <div className="gateVisual">
          <div className="gateVisualCircle">
            {isFarmer ? <Leaf size={54}/> : <Factory size={54}/>}
          </div>
          <div className="gateVisualChip chipA"><Package size={15}/><span>Residue listed</span></div>
          <div className="gateVisualChip chipB"><Handshake size={15}/><span>Matched fairly</span></div>
          <div className="gateVisualChip chipC"><Truck size={15}/><span>Pickup tracked</span></div>
        </div>
      </section>
    </Page>
  );
}

/* ============================================================
   PHASE 2 — FARMER SIGN-UP / REGISTRATION WIZARD
   A multi-step, draft-persisted onboarding flow. This is separate
   from the existing residue-registration screen (Farmer component,
   below) which keeps its original logic untouched.
   ============================================================ */

const REG_STEPS = [
  { key: "mobile", label: "Mobile Verification", icon: Phone },
  { key: "personal", label: "Personal Details", icon: UserRound },
  { key: "address", label: "Address", icon: MapPin },
  { key: "farm", label: "Farm & Residue Profile", icon: Sprout },
  { key: "kyc", label: "KYC", icon: Fingerprint },
  { key: "bank", label: "Bank & Payment", icon: IndianRupee },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "review", label: "Review", icon: ClipboardList },
  { key: "consent", label: "Consent & Submit", icon: CheckCircle2 },
];

const REG_RESIDUE_OPTIONS = ["Bagasse", "Sugarcane Leaves", "Press Mud", "Cane Trash"];
const REG_DOC_LIST = [
  { id: "landDoc", label: "Land Record (7/12 or equivalent)", required: true },
  { id: "idProof", label: "Identity Proof (Aadhaar/Voter ID)", required: true },
  { id: "bankProof", label: "Bank Proof (Passbook/Cheque)", required: true },
  { id: "photo", label: "Passport-size Photo", required: false },
];

function emptyRegistration() {
  return {
    step: 0,
    mobile: { number: "", otp: "", sentOtp: "", verified: false, resendIn: 0 },
    personal: { fullName: "", dob: "", gender: "", farmerType: "Individual Farmer", email: "" },
    address: { state: "Maharashtra", district: "", taluka: "", village: "", pin: "" },
    farm: { landStatus: "Owned", landArea: "", landUnit: "Acre", mainCrops: "Sugarcane", residueTypes: ["Bagasse"], availability: "" },
    kyc: { docType: "Aadhaar", docNumber: "", status: "Not submitted" },
    bank: { accountHolder: "", accountNumber: "", confirmAccountNumber: "", ifsc: "", bankName: "", branch: "", accountType: "Savings", status: "Not submitted" },
    documents: REG_DOC_LIST.map((d) => ({ ...d, status: "Pending" })),
    consent: false,
    submitted: false,
    registrationId: null,
    submittedAt: null,
  };
}

// ---------------------------------------------------------------------------
// INDUSTRY ACCOUNT — lightweight profile captured once at sign-up. Deliberately
// simpler than the Farmer wizard (single screen, no OTP/KYC simulation) since
// SUGAM's industry side is a demand-publishing account, not a payout recipient
// needing bank/KYC capture at this stage. Verification/documents live in the
// Industry Account section and can be extended without touching this shape.
// ---------------------------------------------------------------------------
const INDUSTRY_SECTORS = [
  "Paper & Pulp", "Cogeneration Power", "Bio-fertilizer", "Biomass Pellets",
  "Bioethanol / Biofuel", "Board & Packaging", "Other",
];

function emptyIndustryRegistration() {
  return {
    orgName: "",
    sector: "Paper & Pulp",
    location: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    regNumber: "", // GSTIN / company registration — optional, demo-only
    submitted: false,
    registrationId: null,
    submittedAt: null,
    demandId: null, // links to this account's active entry in `industries`
    verified: false, // demo verification flag, set from Account > Verification
  };
}

function generateIndustryRegistrationId(seed) {
  const h = hashSeed(String(seed) + "industry-reg");
  return `SUGAM-IND-${new Date().getFullYear()}-${String(1000 + (h % 8999))}`;
}

function maskAccountNumber(num) {
  if (!num) return "";
  const s = String(num);
  if (s.length <= 4) return s;
  return "•".repeat(s.length - 4) + s.slice(-4);
}

function WizardStepper({ steps, current }) {
  return (
    <div className="wizardStepper">
      {steps.map((s, i) => {
        const I = s.icon;
        const state = i < current ? "done" : i === current ? "active" : "upcoming";
        return (
          <div className={"wizardStep " + state} key={s.key}>
            <span className="wizardStepDot">{i < current ? <CheckCircle2 size={14}/> : <I size={14}/>}</span>
            <span className="wizardStepLabel">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function FarmerRegistration({ data, setData, go, notify }) {
  const [errors, setErrors] = useState({});
  const step = data.step;
  const pct = Math.round((step / (REG_STEPS.length - 1)) * 100);

  const patch = (section, patchObj) => {
    setData((prev) => ({ ...prev, [section]: { ...prev[section], ...patchObj } }));
  };

  const setStep = (n) => setData((prev) => ({ ...prev, step: Math.max(0, Math.min(REG_STEPS.length - 1, n)) }));

  // Demo OTP resend countdown
  useEffect(() => {
    if (data.mobile.resendIn <= 0) return;
    const t = setTimeout(() => patch("mobile", { resendIn: data.mobile.resendIn - 1 }), 1000);
    return () => clearTimeout(t);
  }, [data.mobile.resendIn]);

  const sendOtp = () => {
    if (!/^[6-9]\d{9}$/.test(data.mobile.number)) { setErrors({ number: "Enter a valid 10-digit mobile number" }); return; }
    const demoOtp = "1234"; // transparent prototype OTP, no real SMS sent
    patch("mobile", { sentOtp: demoOtp, resendIn: 30 });
    setErrors({});
    notify("Demo OTP sent: " + demoOtp);
  };

  const verifyOtp = () => {
    if (data.mobile.otp !== data.mobile.sentOtp || !data.mobile.sentOtp) { setErrors({ otp: "Incorrect OTP. Try the demo OTP shown above." }); return; }
    patch("mobile", { verified: true });
    setErrors({});
    notify("Mobile number verified");
  };

  const validators = {
    mobile: () => data.mobile.verified,
    personal: () => data.personal.fullName.trim().length > 1 && data.personal.gender && data.personal.farmerType,
    address: () => data.address.district.trim() && data.address.village.trim() && /^\d{6}$/.test(data.address.pin),
    farm: () => data.farm.landArea && Number(data.farm.landArea) > 0 && data.farm.residueTypes.length > 0,
    kyc: () => data.kyc.docNumber.trim().length > 3,
    bank: () => data.bank.accountHolder.trim() && data.bank.accountNumber.trim().length >= 6 && data.bank.accountNumber === data.bank.confirmAccountNumber && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.bank.ifsc.toUpperCase()),
    documents: () => data.documents.filter((d) => d.required).every((d) => d.status !== "Pending"),
    review: () => true,
    consent: () => data.consent,
  };

  const stepKey = REG_STEPS[step].key;
  const canContinue = validators[stepKey] ? validators[stepKey]() : true;

  const next = async () => {
    if (!canContinue) { notify("Please complete this step before continuing.", "error"); return; }
    if (stepKey === "consent") {
      const regId = "SUGAM-FR-" + Math.floor(100000 + Math.random() * 900000);
      const registration = { ...data, submitted: true, registrationId: regId, submittedAt: new Date().toISOString() };
      setData(registration);
      try {
        const result = await sugamApi("/auth/register/farmer", {
          method: "POST",
          body: {
            identifier: registration.mobile.number,
            registration,
            profile: {
              name: registration.personal.fullName || "",
              location: [registration.address.village, registration.address.taluka, registration.address.district].filter(Boolean).join(", "),
              wasteType: registration.farm.residueTypes?.[0] || "Bagasse",
              quantity: "",
              availableFrom: registration.farm.availability || "",
              moisture: "",
              contamination: "",
              storage: "",
              qualityNotes: "",
              retainedOverride: "",
            }
          }
        });
        writeSugamApiToken(result.token);
      } catch (err) {
        notify(err?.message || "Backend registration could not be completed; your prototype draft is still saved locally.", "error");
        // Keep the original prototype behavior when the Flask server is offline.
      }
      try {
        localStorage.setItem("sugam_farmer_registered", "1");
        localStorage.setItem("sugam_farmer_account_exists", "1");
        localStorage.setItem("sugam_farmer_real_account_exists", "1");
        localStorage.setItem("sugam_active_session", JSON.stringify({ role: "farmer", mode: "real" }));
      } catch {}
      notify("Registration submitted");
      return;
    }
    setStep(step + 1);
  };
  const back = () => setStep(step - 1);
  const saveLater = () => { notify("Draft saved. You can continue anytime."); go("farmerGate"); };

  if (data.submitted) {
    return (
      <Page>
        <div className="regDoneWrap">
          <div className="regDoneCard">
            <span className="regDoneIcon"><CheckCircle2 size={30}/></span>
            <h2>Registration submitted</h2>
            <p>Your SUGAM farmer profile has been created. Verification is a prototype simulation — no real backend review happens here.</p>
            <div className="regDoneGrid">
              <div><small>Registration ID</small><b>{data.registrationId}</b></div>
              <div><small>Status</small><StatusBadge tone="warning">Under Review (Demo)</StatusBadge></div>
              <div><small>Mobile</small><b>{data.mobile.number}</b></div>
              <div><small>Name</small><b>{data.personal.fullName}</b></div>
            </div>
            <div className="regDoneNext">
              <b>Next steps</b>
              <ul>
                <li>Register your residue to get matched with industries.</li>
                <li>Complete any pending document uploads from your profile.</li>
                <li>Watch for match and pickup notifications on your dashboard.</li>
              </ul>
            </div>
            <button className="primaryBtn" onClick={() => go("farmerHome")}>Go to Farmer Dashboard <ArrowRight size={16}/></button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="regWrap">
        <aside className="regSidebar">
          <div className="regSidebarHead">
            <span className="brandMark"><Sprout size={18}/></span>
            <b>Farmer Sign Up</b>
          </div>
          <div className="regProgress">
            <div className="regProgressBarTrack"><div className="regProgressBarFill" style={{ width: pct + "%" }} /></div>
            <span>{pct}% complete</span>
          </div>
          <WizardStepper steps={REG_STEPS} current={step} />
        </aside>

        <div className="regBody">
          <SectionHeaderReg
            title={REG_STEPS[step].label}
            subtitle={"Step " + (step + 1) + " of " + REG_STEPS.length}
          />

          {stepKey === "mobile" && (
            <div className="regGrid">
              <Field label="Mobile Number" required error={errors.number}>
                <div className="inputWithPrefix">
                  <span>+91</span>
                  <input maxLength={10} value={data.mobile.number} disabled={data.mobile.verified}
                    onChange={(e) => patch("mobile", { number: e.target.value.replace(/\D/g, "") })} placeholder="10-digit mobile number" />
                </div>
              </Field>
              {!data.mobile.verified && (
                <>
                  {data.mobile.sentOtp ? (
                    <Field label="Enter OTP" required error={errors.otp}>
                      <input maxLength={4} value={data.mobile.otp} onChange={(e) => patch("mobile", { otp: e.target.value.replace(/\D/g, "") })} placeholder="4-digit demo OTP" />
                      <small className="regHint">Demo OTP for this prototype: <b>{data.mobile.sentOtp}</b></small>
                    </Field>
                  ) : null}
                  <div className="regInlineActions">
                    <button className="secondaryBtn" onClick={sendOtp} disabled={data.mobile.resendIn > 0}>
                      {data.mobile.sentOtp ? (data.mobile.resendIn > 0 ? `Resend OTP (${data.mobile.resendIn}s)` : "Resend OTP") : "Send OTP"}
                    </button>
                    {data.mobile.sentOtp && <button className="primaryBtn" onClick={verifyOtp}>Verify OTP</button>}
                    {data.mobile.sentOtp && <button className="linkBtn" onClick={() => patch("mobile", { sentOtp: "", otp: "", resendIn: 0 })}>Change number</button>}
                  </div>
                </>
              )}
              {data.mobile.verified && <StatusBadge tone="success" icon={<CheckCircle2 size={13}/>}>Mobile Verified</StatusBadge>}
            </div>
          )}

          {stepKey === "personal" && (
            <div className="regGrid two">
              <Field label="Full Name" required><input value={data.personal.fullName} onChange={(e) => patch("personal", { fullName: e.target.value })} placeholder="As per ID proof" /></Field>
              <Field label="Date of Birth"><input type="date" value={data.personal.dob} onChange={(e) => patch("personal", { dob: e.target.value })} /></Field>
              <Field label="Gender" required>
                <select value={data.personal.gender} onChange={(e) => patch("personal", { gender: e.target.value })}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </Field>
              <Field label="Farmer Type" required>
                <select value={data.personal.farmerType} onChange={(e) => patch("personal", { farmerType: e.target.value })}>
                  <option>Individual Farmer</option><option>Farmer Producer Organisation (FPO)</option><option>Farmer Group / Cooperative</option>
                </select>
              </Field>
              <Field label="Email (optional)"><input type="email" value={data.personal.email} onChange={(e) => patch("personal", { email: e.target.value })} placeholder="you@example.com" /></Field>
              <Field label="Verified Mobile"><input value={data.mobile.number} disabled /></Field>
            </div>
          )}

          {stepKey === "address" && (
            <div className="regGrid two">
              <Field label="State" required><input value={data.address.state} onChange={(e) => patch("address", { state: e.target.value })} /></Field>
              <Field label="District" required><input value={data.address.district} onChange={(e) => patch("address", { district: e.target.value })} /></Field>
              <Field label="Taluka / Sub-district"><input value={data.address.taluka} onChange={(e) => patch("address", { taluka: e.target.value })} /></Field>
              <Field label="Village" required><input value={data.address.village} onChange={(e) => patch("address", { village: e.target.value })} /></Field>
              <Field label="PIN Code" required error={data.address.pin && !/^\d{6}$/.test(data.address.pin) ? "Enter a valid 6-digit PIN" : null}>
                <input maxLength={6} value={data.address.pin} onChange={(e) => patch("address", { pin: e.target.value.replace(/\D/g, "") })} />
              </Field>
            </div>
          )}

          {stepKey === "farm" && (
            <div className="regGrid two">
              <Field label="Land Status" required>
                <select value={data.farm.landStatus} onChange={(e) => patch("farm", { landStatus: e.target.value })}>
                  <option>Owned</option><option>Leased</option><option>Shared</option>
                </select>
              </Field>
              <Field label="Land Area" required>
                <div className="inputWithSuffix">
                  <input type="number" min="0" value={data.farm.landArea} onChange={(e) => patch("farm", { landArea: e.target.value })} />
                  <select value={data.farm.landUnit} onChange={(e) => patch("farm", { landUnit: e.target.value })}>
                    <option>Acre</option><option>Hectare</option><option>Guntha</option>
                  </select>
                </div>
              </Field>
              <Field label="Main Crop(s)"><input value={data.farm.mainCrops} onChange={(e) => patch("farm", { mainCrops: e.target.value })} placeholder="e.g. Sugarcane" /></Field>
              <Field label="Expected Availability"><input type="date" value={data.farm.availability} onChange={(e) => patch("farm", { availability: e.target.value })} /></Field>
              <Field label="Expected Residue Type(s)" required>
                <div className="chipPicker">
                  {REG_RESIDUE_OPTIONS.map((r) => {
                    const active = data.farm.residueTypes.includes(r);
                    return (
                      <button type="button" key={r} className={active ? "chip active" : "chip"}
                        onClick={() => patch("farm", { residueTypes: active ? data.farm.residueTypes.filter((x) => x !== r) : [...data.farm.residueTypes, r] })}>
                        {r}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {stepKey === "kyc" && (
            <div className="regGrid two">
              <Field label="Document Type" required>
                <select value={data.kyc.docType} onChange={(e) => patch("kyc", { docType: e.target.value })}>
                  <option>Aadhaar</option><option>Voter ID</option><option>PAN</option>
                </select>
              </Field>
              <Field label="Document Number" required>
                <input value={data.kyc.docNumber} onChange={(e) => patch("kyc", { docNumber: e.target.value })} placeholder="Sensitive — shown masked after entry" />
              </Field>
              {data.kyc.docNumber.length > 3 && <div className="regMaskedPreview">Stored as: <b>{maskAccountNumber(data.kyc.docNumber)}</b></div>}
              <Field label="Verification Status"><StatusBadge tone="warning">{data.kyc.status}</StatusBadge></Field>
              <p className="regFinePrint">Prototype only — no document is actually uploaded to a server or verified by any authority.</p>
            </div>
          )}

          {stepKey === "bank" && (
            <div className="regGrid two">
              <Field label="Account Holder Name" required><input value={data.bank.accountHolder} onChange={(e) => patch("bank", { accountHolder: e.target.value })} /></Field>
              <Field label="Account Type" required>
                <select value={data.bank.accountType} onChange={(e) => patch("bank", { accountType: e.target.value })}>
                  <option>Savings</option><option>Current</option>
                </select>
              </Field>
              <Field label="Account Number" required><input value={data.bank.accountNumber} onChange={(e) => patch("bank", { accountNumber: e.target.value.replace(/\D/g, "") })} /></Field>
              <Field label="Confirm Account Number" required error={data.bank.confirmAccountNumber && data.bank.confirmAccountNumber !== data.bank.accountNumber ? "Does not match" : null}>
                <input value={data.bank.confirmAccountNumber} onChange={(e) => patch("bank", { confirmAccountNumber: e.target.value.replace(/\D/g, "") })} />
              </Field>
              <Field label="IFSC Code" required><input value={data.bank.ifsc} onChange={(e) => patch("bank", { ifsc: e.target.value.toUpperCase() })} placeholder="e.g. SBIN0001234" /></Field>
              <Field label="Bank Name"><input value={data.bank.bankName} onChange={(e) => patch("bank", { bankName: e.target.value })} /></Field>
              <Field label="Branch"><input value={data.bank.branch} onChange={(e) => patch("bank", { branch: e.target.value })} /></Field>
              {data.bank.accountNumber.length >= 4 && <div className="regMaskedPreview">Account on file: <b>{maskAccountNumber(data.bank.accountNumber)}</b></div>}
            </div>
          )}

          {stepKey === "documents" && (
            <div className="regDocList">
              {data.documents.map((doc, i) => (
                <div className="regDocRow" key={doc.id}>
                  <div>
                    <b>{doc.label}</b>
                    <small>{doc.required ? "Required" : "Optional"}</small>
                  </div>
                  <div className="regDocActions">
                    <StatusBadge tone={doc.status === "Uploaded" ? "success" : doc.status === "Pending" ? "neutral" : "warning"}>{doc.status}</StatusBadge>
                    <button className="secondaryBtn small" onClick={() => {
                      const docs = [...data.documents]; docs[i] = { ...doc, status: "Uploaded" }; setData((prev) => ({ ...prev, documents: docs }));
                    }}>{doc.status === "Uploaded" ? "Replace" : "Upload"}</button>
                  </div>
                </div>
              ))}
              <p className="regFinePrint">Uploads are simulated for this prototype; no files are transmitted anywhere.</p>
            </div>
          )}

          {stepKey === "review" && (
            <div className="regReview">
              {[
                ["Personal", "personal", [["Name", data.personal.fullName], ["Gender", data.personal.gender], ["Type", data.personal.farmerType]]],
                ["Address", "address", [["District", data.address.district], ["Village", data.address.village], ["PIN", data.address.pin]]],
                ["Farm", "farm", [["Land", data.farm.landArea + " " + data.farm.landUnit], ["Residue", data.farm.residueTypes.join(", ")]]],
                ["KYC", "kyc", [["Document", data.kyc.docType], ["Number", maskAccountNumber(data.kyc.docNumber)]]],
                ["Bank", "bank", [["Holder", data.bank.accountHolder], ["Account", maskAccountNumber(data.bank.accountNumber)], ["IFSC", data.bank.ifsc]]],
                ["Documents", "documents", data.documents.map((d) => [d.label, d.status])],
              ].map(([title, key, rows]) => (
                <DashboardCard key={key} title={title} action={<button className="linkBtn" onClick={() => setStep(REG_STEPS.findIndex((s) => s.key === key))}>Edit</button>}>
                  {rows.map(([l, v]) => <div className="regReviewRow" key={l}><span>{l}</span><b>{v || "—"}</b></div>)}
                </DashboardCard>
              ))}
            </div>
          )}

          {stepKey === "consent" && (
            <div className="regGrid">
              <label className="regConsentRow">
                <input type="checkbox" checked={data.consent} onChange={(e) => setData((p) => ({ ...p, consent: e.target.checked }))} />
                <span>I confirm the information provided is accurate to the best of my knowledge and I agree to SUGAM's prototype terms of use.</span>
              </label>
            </div>
          )}

          <div className="regFooterActions">
            <div>{step > 0 && <button className="secondaryBtn" onClick={back}><ArrowLeft size={15}/> Back</button>}</div>
            <div className="regFooterRight">
              <button className="linkBtn" onClick={saveLater}>Save &amp; Continue Later</button>
              <button className="primaryBtn" onClick={next} disabled={!canContinue}>
                {stepKey === "consent" ? "Submit Registration" : "Continue"} <ArrowRight size={15}/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}

function SectionHeaderReg({ title, subtitle }) {
  return <div className="regSectionHead"><h2>{title}</h2><small>{subtitle}</small></div>;
}

const FARMER_SHELL_SCREENS = ["farmerHome","farmer","myResidue","analysis","matches","transactionHistory","logistics","tracking","passport","payments","profileKyc","notifications"];

const FARMER_NAV = [
  { section: "HOME", items: [{ key: "farmerHome", label: "Dashboard", icon: HomeIcon }] },
  { section: "RESIDUE", items: [
    { key: "farmer", label: "Register Residue", icon: Sprout },
    { key: "myResidue", label: "My Residue", icon: Package },
    { key: "analysis", label: "Residue Analysis", icon: Sparkles },
    { key: "matches", label: "Industry Matches", icon: Handshake },
  ] },
  { section: "TRANSACTIONS", items: [
    { key: "transactionHistory", label: "Transaction History", icon: ClipboardList },
    { key: "logistics", label: "Pickup & Logistics", icon: Truck },
    { key: "passport", label: "Residue Passport", icon: Fingerprint },
    { key: "payments", label: "Payments & Receipts", icon: IndianRupee },
  ] },
  { section: "ACCOUNT", items: [
    { key: "profileKyc", label: "Profile & KYC", icon: UserRound },
    { key: "notifications", label: "Notifications", icon: Bell },
    { key: "about", label: "Help & Support", icon: CircleHelp },
  ] },
];
// "tracking" is reachable from Logistics/Matches but shares the Pickup & Logistics nav entry.
const FARMER_NAV_HIGHLIGHT = { tracking: "logistics" };

function FarmerShell({ screen, go, farmer, farmerReg, unreadCount, children, onSignOut }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const activeKey = FARMER_NAV_HIGHLIGHT[screen] || screen;
  const displayName = farmerReg?.personal?.fullName || farmer?.name || "Farmer";
  const kycDone = farmerReg?.kyc?.docNumber?.length > 3;
  const bankDone = !!(farmerReg?.bank?.accountNumber && farmerReg?.bank?.ifsc);

  return (
    <div className="shellWrap">
      <aside className={mobileNavOpen ? "shellSidebar open" : "shellSidebar"}>
        <div className="shellSidebarHead">
          <span className="brandMark"><Sprout size={18}/></span>
          <div><b>SUGAM</b><small>Farmer Dashboard</small></div>
        </div>
        <nav className="shellNav">
          {FARMER_NAV.map((group) => (
            <div className="shellNavGroup" key={group.section}>
              <span className="shellNavGroupLabel">{group.section}</span>
              {group.items.map((item) => {
                const I = item.icon;
                return (
                  <button key={item.key} className={activeKey === item.key ? "shellNavItem active" : "shellNavItem"}
                    onClick={() => { setMobileNavOpen(false); go(item.key); }}>
                    <I size={16}/> {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <button className="shellExit" onClick={() => go("home")}><ArrowLeft size={14}/> Exit to public site</button>
      </aside>

      {mobileNavOpen && <div className="shellBackdrop" onClick={() => setMobileNavOpen(false)} />}

      <div className="shellMain">
        <div className="shellTopbar">
          <button className="iconBtn shellMenuBtn" onClick={() => setMobileNavOpen(true)}><Menu size={19}/></button>
          <div className="shellTopbarProfile">
            <span className="shellAvatar"><UserRound size={16}/></span>
            <div><b>{displayName}</b><small>{farmerReg?.registrationId || "Registration pending"}</small></div>
          </div>
          <div className="shellTopbarRight">
            <GoogleLanguageSelector />
            <span className={"shellVerifyChip " + (kycDone && bankDone ? "ok" : "warn")}>
              {kycDone && bankDone ? <BadgeCheck size={13}/> : <Info size={13}/>} {kycDone && bankDone ? "Verified" : "Verification pending"}
            </span>
            <button className="iconBtn shellBell" onClick={() => go("notifications")}>
              <Bell size={18}/>
              {unreadCount > 0 && <span className="shellBellDot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button className="shellSignOutBtn" onClick={() => { if (window.confirm("Sign out of SUGAM?")) onSignOut && onSignOut(); }}><LogOut size={15}/> Sign Out</button>
          </div>
        </div>
        <div className="shellContent">{children}</div>
      </div>
    </div>
  );
}

function FarmerHome({ go, farmer, farmerReg, shipments }) {
  const retention = computeRetention(farmer.wasteType, farmer.quantity, farmer.retainedOverride);
  const latestShipment = shipments[shipments.length - 1] || null;
  const activeShipments = shipments.filter((s) => !s.cancelled && !s.utilizationConfirmed);
  const completedPayments = shipments.filter((s) => s.paymentStatus === "completed");
  const pendingPayments = shipments.filter((s) => s.paymentStatus !== "completed" && !s.cancelled);
  const totalEarned = completedPayments.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const totalPending = pendingPayments.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const latestPayment = completedPayments[completedPayments.length - 1] || null;
  const totalDiverted = shipments.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const co2Factor = (METHODS[farmer.wasteType] || METHODS.Bagasse)[0]?.co2 || 0.5;
  const co2Signal = Math.round(totalDiverted * co2Factor * 10) / 10;

  const kycDone = farmerReg?.kyc?.docNumber?.length > 3;
  const bankDone = !!(farmerReg?.bank?.accountNumber && farmerReg?.bank?.ifsc);
  const registrationDone = !!farmerReg?.submitted;

  const tasks = [];
  if (!registrationDone) tasks.push({ text: "Complete your farmer registration", action: () => go("farmerRegister"), icon: ClipboardList });
  if (registrationDone && !kycDone) tasks.push({ text: "Add your KYC document details", action: () => go("profileKyc"), icon: Fingerprint });
  if (registrationDone && !bankDone) tasks.push({ text: "Add your bank details for payments", action: () => go("profileKyc"), icon: IndianRupee });
  if (!farmer.quantity || Number(farmer.quantity) <= 0) tasks.push({ text: "Register your residue", action: () => go("farmer"), icon: Sprout });
  if (retention.surplus > 0 && shipments.length === 0) tasks.push({ text: "Review utilization pathways & industry matches", action: () => go("analysis"), icon: Handshake });
  const needsQualityCheck = shipments.find((s) => !s.cancelled && transactionIndexForShipment(s) >= 7 && !s.qualityVerified);
  if (needsQualityCheck) tasks.push({ text: "Check quality verification for " + needsQualityCheck.passportId, action: () => { go("passport"); }, icon: ShieldCheck });
  const needsPayment = shipments.find((s) => s.qualityVerified && s.paymentStatus !== "completed" && !s.cancelled);
  if (needsPayment) tasks.push({ text: "Payment pending for " + needsPayment.passportId, action: () => go("passport"), icon: IndianRupee });

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag">FARMER DASHBOARD</span><h1>Welcome back{farmerReg?.personal?.fullName ? ", " + farmerReg.personal.fullName.split(" ")[0] : ""}.</h1><p>Here's where your residue, matches and payments currently stand.</p></div>
      </div>

      <div className="homeMetricRow">
        <MetricCard icon={<Package size={18}/>} label="Transferable surplus" value={retention.surplus + " T"} hint={farmer.wasteType} />
        <MetricCard icon={<Handshake size={18}/>} label="Active transactions" value={activeShipments.length} tone="info" />
        <MetricCard icon={<IndianRupee size={18}/>} label="Total earned (demo)" value={"₹" + totalEarned.toLocaleString("en-IN")} tone="success" />
        <MetricCard icon={<Leaf size={18}/>} label="CO₂ signal (demo)" value={co2Signal + " T"} hint="Illustrative estimate" />
      </div>

      <div className="homeGrid">
        <DashboardCard title="Profile" icon={<UserRound size={17}/>} action={<button className="linkBtn" onClick={() => go("profileKyc")}>View <ChevronRight size={13}/></button>}>
          <div className="regReviewRow"><span>Name</span><b>{farmerReg?.personal?.fullName || "—"}</b></div>
          <div className="regReviewRow"><span>Farmer ID</span><b>{farmerReg?.registrationId || "Pending"}</b></div>
          <div className="regReviewRow"><span>Location</span><b>{farmer.location || "—"}</b></div>
          <div className="regReviewRow"><span>KYC</span><StatusBadge tone={kycDone ? "success" : "warning"}>{kycDone ? "Submitted" : "Pending"}</StatusBadge></div>
          <div className="regReviewRow"><span>Bank</span><StatusBadge tone={bankDone ? "success" : "warning"}>{bankDone ? "Added" : "Pending"}</StatusBadge></div>
        </DashboardCard>

        <DashboardCard title="Residue" icon={<Sprout size={17}/>} action={<button className="linkBtn" onClick={() => go("myResidue")}>View <ChevronRight size={13}/></button>}>
          <div className="regReviewRow"><span>Type</span><b>{farmer.wasteType}</b></div>
          <div className="regReviewRow"><span>Total quantity</span><b>{farmer.quantity || 0} T</b></div>
          <div className="regReviewRow"><span>Transferable</span><b>{retention.surplus} T</b></div>
          <div className="regReviewRow"><span>Available from</span><b>{farmer.availableFrom || "Not set"}</b></div>
          <div className="regReviewRow"><span>Match status</span><StatusBadge tone={shipments.length ? "success" : "neutral"}>{shipments.length ? "Matched" : "Not yet matched"}</StatusBadge></div>
        </DashboardCard>

        <DashboardCard title="Active Transaction" icon={<Truck size={17}/>} action={latestShipment && <button className="linkBtn" onClick={() => go("passport")}>Details <ChevronRight size={13}/></button>}>
          {latestShipment ? (
            <>
              <div className="regReviewRow"><span>Industry</span><b>{latestShipment.industryName}</b></div>
              <div className="regReviewRow"><span>Quantity</span><b>{latestShipment.quantity} T</b></div>
              <div className="regReviewRow"><span>Stage</span><StatusBadge tone="info">{TRANSACTION_STAGES[Math.max(0, transactionIndexForShipment(latestShipment))].label}</StatusBadge></div>
              <div className="regReviewRow"><span>Passport ID</span><b>{latestShipment.passportId}</b></div>
            </>
          ) : <EmptyState icon={<Handshake size={20}/>} title="No active transaction" text="Connect with an industry from your matches to start one." action={<button className="secondaryBtn small" onClick={() => go("matches")}>Find matches</button>} />}
        </DashboardCard>

        <DashboardCard title="Payments" icon={<IndianRupee size={17}/>} action={<button className="linkBtn" onClick={() => go("payments")}>View all <ChevronRight size={13}/></button>}>
          <div className="regReviewRow"><span>Total earned</span><b>₹{totalEarned.toLocaleString("en-IN")}</b></div>
          <div className="regReviewRow"><span>Pending</span><b>₹{totalPending.toLocaleString("en-IN")}</b></div>
          <div className="regReviewRow"><span>Completed payments</span><b>{completedPayments.length}</b></div>
          <div className="regReviewRow"><span>Latest payment</span><b>{latestPayment ? "₹" + (latestPayment.netAmount || 0).toLocaleString("en-IN") : "—"}</b></div>
        </DashboardCard>

        <DashboardCard title="Impact (demo estimate)" icon={<Leaf size={17}/>}>
          <div className="regReviewRow"><span>Residue diverted</span><b>{totalDiverted} T</b></div>
          <div className="regReviewRow"><span>CO₂ signal</span><b>{co2Signal} T</b></div>
          <div className="regReviewRow"><span>Utilization pathway</span><b>{(METHODS[farmer.wasteType] || METHODS.Bagasse)[0]?.method}</b></div>
          <p className="regFinePrint"><ShieldCheck size={12}/> Calculated from disclosed demo assumptions, not a scientific/regulatory measurement.</p>
        </DashboardCard>

        <DashboardCard title="What's Next?" icon={<Sparkles size={17}/>} className="homeNextCard">
          {tasks.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={20}/>} title="You're all caught up" text="No pending actions right now." />
          ) : tasks.map((t, i) => {
            const I = t.icon;
            return (
              <button key={i} className="nextTaskRow" onClick={t.action}>
                <span className="nextTaskIcon"><I size={15}/></span>
                <span>{t.text}</span>
                <ChevronRight size={15}/>
              </button>
            );
          })}
        </DashboardCard>
      </div>
    </>
  );
}

function MyResidue({ farmer, go }) {
  const retention = computeRetention(farmer.wasteType, farmer.quantity, farmer.retainedOverride);
  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag">MY RESIDUE</span><h1>Your current residue listing</h1><p>This is what industries see when they search for compatible supply.</p></div>
        <button className="primaryBtn" onClick={() => go("farmer")}><Sprout size={16}/> Edit / Re-register</button>
      </div>
      <div className="homeGrid two">
        <DashboardCard title="Residue Profile" icon={<Package size={17}/>}>
          <div className="regReviewRow"><span>Type</span><b>{farmer.wasteType}</b></div>
          <div className="regReviewRow"><span>Total quantity</span><b>{farmer.quantity || 0} T</b></div>
          <div className="regReviewRow"><span>Location</span><b>{farmer.location || "—"}</b></div>
          <div className="regReviewRow"><span>Available from</span><b>{farmer.availableFrom || "Not set"}</b></div>
          <div className="regReviewRow"><span>Moisture</span><b>{farmer.moisture || "Not specified"}</b></div>
          <div className="regReviewRow"><span>Contamination</span><b>{farmer.contamination || "Not specified"}</b></div>
          <div className="regReviewRow"><span>Storage</span><b>{farmer.storage || "Not specified"}</b></div>
        </DashboardCard>
        <DashboardCard title="Retention & Surplus" icon={<Sparkles size={17}/>}>
          <div className="regReviewRow"><span>Total residue</span><b>{retention.total} T</b></div>
          <div className="regReviewRow"><span>Recommended retained</span><b>{retention.recommendedRetained} T</b></div>
          <div className="regReviewRow"><span>Your retained amount</span><b>{retention.retained} T</b></div>
          <div className="regReviewRow"><span>Transferable surplus</span><b>{retention.surplus} T</b></div>
          <p className="regFinePrint"><ShieldCheck size={12}/> {retention.rationale}</p>
          <button className="secondaryBtn small" onClick={() => go("analysis")}>See utilization pathways <ArrowRight size={13}/></button>
        </DashboardCard>
      </div>
    </>
  );
}

function TransactionHistory({ shipments, go, setActiveShipmentId }) {
  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag">TRANSACTIONS</span><h1>Transaction history</h1><p>Every industry connection created in this prototype session.</p></div>
      </div>
      {shipments.length === 0 ? (
        <EmptyState icon={<ClipboardList size={22}/>} title="No transactions yet" text="Connect with an industry from your matches to create your first transaction." action={<button className="primaryBtn" onClick={() => go("matches")}>Find matches</button>} />
      ) : (
        <div className="txCardList">
          {[...shipments].reverse().map((s) => {
            const idx = transactionIndexForShipment(s);
            return (
              <div className="txHistCard" key={s.id}>
                <div className="txHistTop">
                  <div><b>{s.industryName}</b><small>{new Date(s.createdAt).toLocaleDateString("en-IN")} • {s.residueType} • {s.quantity} T</small></div>
                  <StatusBadge tone={s.cancelled ? "danger" : idx >= 10 ? "success" : "info"}>{s.cancelled ? "Cancelled" : TRANSACTION_STAGES[Math.max(0, idx)].label}</StatusBadge>
                </div>
                <div className="txHistGrid">
                  <div><span>Gross</span><b>₹{(s.grossAmount || 0).toLocaleString("en-IN")}</b></div>
                  <div><span>Deductions</span><b>₹{((s.transportCost || 0) + (s.handlingCost || 0)).toLocaleString("en-IN")}</b></div>
                  <div><span>Net</span><b>₹{(s.netAmount || 0).toLocaleString("en-IN")}</b></div>
                  <div><span>Payment</span><StatusBadge tone={s.paymentStatus === "completed" ? "success" : "warning"}>{s.paymentStatus === "completed" ? "Completed" : "Pending"}</StatusBadge></div>
                </div>
                <div className="txHistFoot">
                  <small>Passport: {s.passportId} • Txn: {s.transactionId}</small>
                  <button className="linkBtn" onClick={() => { setActiveShipmentId(s.id); go("passport"); }}>Open <ChevronRight size={13}/></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function PaymentsReceipts({ shipments, go, setActiveShipmentId }) {
  const completed = shipments.filter((s) => s.paymentStatus === "completed");
  const pending = shipments.filter((s) => s.paymentStatus !== "completed" && !s.cancelled);
  const totalEarned = completed.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const totalPending = pending.reduce((sum, s) => sum + (s.netAmount || 0), 0);

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag">PAYMENTS &amp; RECEIPTS</span><h1>Your earnings from SUGAM</h1><p>Payment state is a prototype simulation, updated from the Residue Passport actions.</p></div>
      </div>
      <div className="homeMetricRow">
        <MetricCard icon={<IndianRupee size={18}/>} label="Total earned" value={"₹" + totalEarned.toLocaleString("en-IN")} tone="success" />
        <MetricCard icon={<Clock size={18}/>} label="Pending amount" value={"₹" + totalPending.toLocaleString("en-IN")} tone="warning" />
        <MetricCard icon={<CheckCircle2 size={18}/>} label="Completed payments" value={completed.length} />
        <MetricCard icon={<ClipboardList size={18}/>} label="Total transactions" value={shipments.length} />
      </div>
      {shipments.length === 0 ? (
        <EmptyState icon={<IndianRupee size={22}/>} title="No payments yet" text="Payments appear here once a transaction reaches the Payment Completed stage." />
      ) : (
        <div className="txCardList">
          {[...shipments].reverse().map((s) => (
            <div className="txHistCard" key={s.id}>
              <div className="txHistTop">
                <div><b>{s.industryName}</b><small>{s.residueType} • {s.quantity} T • {s.passportId}</small></div>
                <StatusBadge tone={s.paymentStatus === "completed" ? "success" : "warning"}>{s.paymentStatus === "completed" ? "Completed" : "Not Started / Pending"}</StatusBadge>
              </div>
              <div className="txHistGrid">
                <div><span>Rate</span><b>₹{(s.rate || 0).toLocaleString("en-IN")}/T</b></div>
                <div><span>Gross</span><b>₹{(s.grossAmount || 0).toLocaleString("en-IN")}</b></div>
                <div><span>Transport</span><b>₹{(s.transportCost || 0).toLocaleString("en-IN")}</b></div>
                <div><span>Handling</span><b>₹{(s.handlingCost || 0).toLocaleString("en-IN")}</b></div>
                <div><span>Net amount</span><b>₹{(s.netAmount || 0).toLocaleString("en-IN")}</b></div>
                <div><span>Paid on</span><b>{s.paymentAt ? new Date(s.paymentAt).toLocaleDateString("en-IN") : "—"}</b></div>
              </div>
              <div className="txHistFoot">
                <small>Transaction ID: {s.transactionId}</small>
                <div className="toolbarActions">
                  {s.paymentStatus === "completed" && <button className="tinyAction" onClick={() => triggerReceiptDownload(s)}><Download size={13}/> Download Receipt</button>}
                  <button className="linkBtn" onClick={() => { setActiveShipmentId(s.id); go("passport"); }}>{s.paymentStatus === "completed" ? "View receipt" : "Manage payment"} <ChevronRight size={13}/></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="demoNote"><ShieldCheck size={18}/><div><b>Printable receipts</b><p>Every completed payment above has a functional "Download Receipt" button — a full transaction and payment summary you can save, print or forward.</p></div></div>
    </>
  );
}

function ProfileKyc({ farmerReg, setFarmerReg, go }) {
  const jumpTo = (key) => { setFarmerReg((p) => ({ ...p, step: REG_STEPS.findIndex((s) => s.key === key) })); go("farmerRegister"); };
  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag">PROFILE &amp; KYC</span><h1>Your SUGAM profile</h1><p>Registration ID: <b>{farmerReg.registrationId || "Not submitted yet"}</b></p></div>
      </div>
      <div className="homeGrid two">
        <DashboardCard title="Personal" icon={<UserRound size={17}/>} action={<button className="linkBtn" onClick={() => jumpTo("personal")}>Edit</button>}>
          <div className="regReviewRow"><span>Name</span><b>{farmerReg.personal.fullName || "—"}</b></div>
          <div className="regReviewRow"><span>Gender</span><b>{farmerReg.personal.gender || "—"}</b></div>
          <div className="regReviewRow"><span>Type</span><b>{farmerReg.personal.farmerType}</b></div>
          <div className="regReviewRow"><span>Mobile</span><b>{farmerReg.mobile.number ? "+91 " + farmerReg.mobile.number : "—"} {farmerReg.mobile.verified && <StatusBadge tone="success">Verified</StatusBadge>}</b></div>
        </DashboardCard>
        <DashboardCard title="Address" icon={<MapPin size={17}/>} action={<button className="linkBtn" onClick={() => jumpTo("address")}>Edit</button>}>
          <div className="regReviewRow"><span>District</span><b>{farmerReg.address.district || "—"}</b></div>
          <div className="regReviewRow"><span>Village</span><b>{farmerReg.address.village || "—"}</b></div>
          <div className="regReviewRow"><span>PIN</span><b>{farmerReg.address.pin || "—"}</b></div>
        </DashboardCard>
        <DashboardCard title="KYC" icon={<Fingerprint size={17}/>} action={<button className="linkBtn" onClick={() => jumpTo("kyc")}>Edit</button>}>
          <div className="regReviewRow"><span>Document</span><b>{farmerReg.kyc.docType}</b></div>
          <div className="regReviewRow"><span>Number</span><b>{maskAccountNumber(farmerReg.kyc.docNumber)}</b></div>
          <div className="regReviewRow"><span>Status</span><StatusBadge tone={farmerReg.kyc.docNumber?.length > 3 ? "success" : "warning"}>{farmerReg.kyc.docNumber?.length > 3 ? "Submitted (Demo)" : "Not submitted"}</StatusBadge></div>
        </DashboardCard>
        <DashboardCard title="Bank" icon={<IndianRupee size={17}/>} action={<button className="linkBtn" onClick={() => jumpTo("bank")}>Edit</button>}>
          <div className="regReviewRow"><span>Holder</span><b>{farmerReg.bank.accountHolder || "—"}</b></div>
          <div className="regReviewRow"><span>Account</span><b>{maskAccountNumber(farmerReg.bank.accountNumber)}</b></div>
          <div className="regReviewRow"><span>IFSC</span><b>{farmerReg.bank.ifsc || "—"}</b></div>
        </DashboardCard>
        <DashboardCard title="Documents" icon={<FileText size={17}/>} action={<button className="linkBtn" onClick={() => jumpTo("documents")}>Edit</button>}>
          {farmerReg.documents.map((d) => (
            <div className="regReviewRow" key={d.id}><span>{d.label}</span><StatusBadge tone={d.status === "Uploaded" ? "success" : "neutral"}>{d.status}</StatusBadge></div>
          ))}
        </DashboardCard>
      </div>
    </>
  );
}

function NotificationsScreen({ notifications, markRead, markAllRead }) {
  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag">NOTIFICATIONS</span><h1>Activity on your account</h1><p>Generated automatically from real actions taken in this prototype.</p></div>
        {notifications.length > 0 && <button className="secondaryBtn" onClick={markAllRead}><CheckCircle2 size={15}/> Mark all read</button>}
      </div>
      {notifications.length === 0 ? (
        <EmptyState icon={<Bell size={22}/>} title="No notifications yet" text="You'll see updates here as you register residue, get matched, and progress through transactions." />
      ) : (
        <div className="notifList">
          {notifications.map((n) => (
            <button key={n.id} className={n.read ? "notifRow" : "notifRow unread"} onClick={() => markRead(n.id)}>
              <span className={"notifDot tone-" + n.tone}/>
              <span className="notifMsg">{n.message}</span>
              <small className="notifTime">{new Date(n.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</small>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ============================================================
   PHASE 4 — INDUSTRY DASHBOARD (shell, sign-up, overview)
   Mirrors the Farmer shell pattern above. Reuses the existing
   `industries` / `connected` / `shipments` state and the same
   DashboardCard / MetricCard / StatusBadge / EmptyState primitives
   — no new data model, no invented backend. The old single-page
   `Industry` browse+profile component is preserved as-is and is
   now reached from the new nav as "Supply Discovery" / "Demand".
   Matches, Transactions, Traceability and Finance are all real
   screens over the same shared `shipments` records — no invented
   backend, no dead nav buttons.
   ============================================================ */

const INDUSTRY_SHELL_SCREENS = ["industryHome","industryDemand","industrySupply","industryMatches","industryTransactions","industryTracker","industryTraceability","industryFinance","industryProfile","industryNotifications","industryPassport"];
const INDUSTRY_ALL_SCREENS = ["industryGate","industryRegister","industry", ...INDUSTRY_SHELL_SCREENS];

const INDUSTRY_NAV = [
  { section: "OVERVIEW", items: [{ key: "industryHome", label: "Dashboard", icon: HomeIcon }] },
  { section: "DEMAND", items: [{ key: "industryDemand", label: "My Requirements", icon: ClipboardList }] },
  { section: "SUPPLY DISCOVERY", items: [{ key: "industrySupply", label: "Available Residues", icon: Search }] },
  { section: "MATCHES", items: [{ key: "industryMatches", label: "Matches", icon: Handshake }] },
  { section: "TRANSACTIONS", items: [{ key: "industryTransactions", label: "Transactions", icon: Truck }] },
  { section: "TRACKING", items: [{ key: "industryTracker", label: "Goods Tracker", icon: RadioTower }] },
  { section: "TRACEABILITY", items: [{ key: "industryTraceability", label: "Residue Passports", icon: Fingerprint }] },
  { section: "FINANCE", items: [{ key: "industryFinance", label: "Payments & Receipts", icon: IndianRupee }] },
  { section: "ACCOUNT", items: [
    { key: "industryProfile", label: "Industry Profile", icon: UserRound },
    { key: "industryNotifications", label: "Notifications", icon: Bell },
    { key: "about", label: "Help & Support", icon: CircleHelp },
  ] },
];

function IndustryShell({ screen, go, industryReg, unreadCount, children, onSignOut }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const displayName = industryReg?.orgName || "Industry";
  const verified = !!industryReg?.verified;

  return (
    <div className="shellWrap">
      <aside className={mobileNavOpen ? "shellSidebar open" : "shellSidebar"}>
        <div className="shellSidebarHead">
          <span className="brandMark"><Sprout size={18}/></span>
          <div><b>SUGAM</b><small>Industry Dashboard</small></div>
        </div>
        <nav className="shellNav">
          {INDUSTRY_NAV.map((group) => (
            <div className="shellNavGroup" key={group.section}>
              <span className="shellNavGroupLabel">{group.section}</span>
              {group.items.map((item) => {
                const I = item.icon;
                return (
                  <button key={item.key} className={screen === item.key ? "shellNavItem active" : "shellNavItem"}
                    onClick={() => { setMobileNavOpen(false); go(item.key); }}>
                    <I size={16}/> {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <button className="shellExit" onClick={() => go("home")}><ArrowLeft size={14}/> Exit to public site</button>
      </aside>

      {mobileNavOpen && <div className="shellBackdrop" onClick={() => setMobileNavOpen(false)} />}

      <div className="shellMain">
        <div className="shellTopbar">
          <button className="iconBtn shellMenuBtn" onClick={() => setMobileNavOpen(true)}><Menu size={19}/></button>
          <div className="shellTopbarProfile">
            <span className="shellAvatar"><Factory size={16}/></span>
            <div><b>{displayName}</b><small>{industryReg?.registrationId || "Registration pending"}</small></div>
          </div>
          <div className="shellTopbarRight">
            <GoogleLanguageSelector />
            <button className="iconBtn shellBell" onClick={() => go("industryNotifications")}>
              <Bell size={18}/>
              {unreadCount > 0 && <span className="shellBellDot">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </button>
            <button className="shellSignOutBtn" onClick={() => { if (window.confirm("Sign out of SUGAM?")) onSignOut && onSignOut(); }}><LogOut size={15}/> Sign Out</button>
          </div>
        </div>
        <div className="shellContent">{children}</div>
      </div>
    </div>
  );
}

// Single-screen sign-up for an industry account. Deliberately lighter than
// the Farmer wizard — no OTP/bank capture — since an industry account here
// is a demand-publishing profile, not a payout recipient.
function IndustryRegistration({ data, setData, go, notify }) {
  const [errors, setErrors] = useState({});

  const set = (patch) => setData({ ...data, ...patch });

  const submit = async () => {
    const e = {};
    if (!data.orgName.trim()) e.orgName = "Industry / company name is required.";
    if (!data.location.trim()) e.location = "Location is required.";
    if (!data.contactName.trim()) e.contactName = "Contact person is required.";
    if (!data.contactPhone.trim() || data.contactPhone.replace(/\D/g,"").length < 10) e.contactPhone = "Enter a valid 10-digit phone number.";
    setErrors(e);
    if (Object.keys(e).length) return notify("Please fix the highlighted fields.", "error");
    const registrationId = data.registrationId || generateIndustryRegistrationId(data.orgName + Date.now());
    const registration = { ...data, submitted: true, registrationId, submittedAt: Date.now() };
    setData(registration);
    try {
      const result = await sugamApi("/auth/register/industry", {
        method: "POST",
        body: { identifier: registration.contactPhone, registration, profile: registration }
      });
      writeSugamApiToken(result.token);
    } catch (err) {
      notify(err?.message || "Backend registration could not be completed; your prototype profile is still saved locally.", "error");
    }
    try {
      localStorage.setItem("sugam_industry_account_exists", "1");
      localStorage.setItem("sugam_industry_real_account_exists", "1");
      localStorage.setItem("sugam_active_session", JSON.stringify({ role: "industry", mode: "real" }));
    } catch {}
    notify("Industry profile created.");
    go("industryHome");
  };

  return (
    <Page>
      <div className="pageTop">
        <div><span className="sectionTag blue">INDUSTRY SIGN UP</span><h1>Set up your industry profile</h1><p>Tell SUGAM about your organisation so farmers and the marketplace can identify you.</p></div>
      </div>
      <div className="formCard wide">
        <div className="cardTitle"><span className="roundIcon blue"><Factory size={20}/></span><div><h3>Organisation details</h3><p>Used across your dashboard, demand listings and transactions.</p></div></div>
        <Field label="Industry / company name" required error={errors.orgName}><input value={data.orgName} onChange={e=>set({orgName:e.target.value})} placeholder="e.g. Sahyadri Paper Works"/></Field>
        <div className="formRow">
          <Field label="Sector / utilization type"><select value={data.sector} onChange={e=>set({sector:e.target.value})}>{INDUSTRY_SECTORS.map(s=><option key={s}>{s}</option>)}</select></Field>
          <Field label="Location (city / district)" required error={errors.location}><input value={data.location} onChange={e=>set({location:e.target.value})} placeholder="e.g. Pune"/></Field>
        </div>
        <div className="formRow">
          <Field label="Contact person" required error={errors.contactName}><input value={data.contactName} onChange={e=>set({contactName:e.target.value})} placeholder="Name"/></Field>
          <Field label="Contact phone" required error={errors.contactPhone}><input value={data.contactPhone} onChange={e=>set({contactPhone:e.target.value.replace(/[^\d]/g,"").slice(0,10)})} placeholder="10-digit mobile number"/></Field>
        </div>
        <div className="formRow">
          <Field label="Contact email (optional)"><input type="email" value={data.contactEmail} onChange={e=>set({contactEmail:e.target.value})} placeholder="name@company.com"/></Field>
          <Field label="Registration / GST number (optional)"><input value={data.regNumber} onChange={e=>set({regNumber:e.target.value})} placeholder="For demo verification only"/></Field>
        </div>
        <button className="primaryBlue full" onClick={submit}><CheckCircle2 size={17}/> Create industry profile</button>
        <p className="formHint"><ShieldCheck size={12}/> Demo sign-up — no document upload or government verification is performed here.</p>
      </div>
    </Page>
  );
}

function IndustryHome({ go, industryReg, industryDemands, shipments }) {
  const activeDemands = industryDemands.filter((d) => d.status === "active");
  const myDemandIds = industryDemands.map((d) => d.id);
  const myShipments = shipments.filter((s) => myDemandIds.includes(s.industryId));
  const activeShipments = myShipments.filter((s) => !s.cancelled && !s.utilizationConfirmed);
  const pendingQuality = myShipments.filter((s) => !s.cancelled && transactionIndexForShipment(s) >= 7 && !s.qualityVerified);
  const upcomingPickups = myShipments.filter((s) => !s.cancelled && transactionIndexForShipment(s) < 5);
  const payable = myShipments.filter((s) => s.qualityVerified && s.paymentStatus !== "completed" && !s.cancelled);
  const totalPayable = payable.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const recent = [...myShipments].sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);
  const totalProcured = myShipments.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);
  const co2Signal = Math.round(totalProcured * 0.5 * 10) / 10;

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">INDUSTRY DASHBOARD</span><h1>Welcome{industryReg.orgName ? ", " + industryReg.orgName : ""}.</h1><p>Here's what needs your attention right now.</p></div>
        <button className="primaryBlue" onClick={() => go("industryDemand")}><Plus size={17}/> {activeDemands.length ? "Manage demand" : "Publish demand"}</button>
      </div>

      <div className="homeMetricRow">
        <MetricCard icon={<Boxes size={18}/>} label="Active demand" value={activeDemands.length} hint={activeDemands.length ? activeDemands.map((d) => d.residueType).join(", ") : "Publish your requirement"} tone={activeDemands.length ? "info" : "neutral"} />
        <MetricCard icon={<Truck size={18}/>} label="Active shipments" value={activeShipments.length} tone="info" />
        <MetricCard icon={<ShieldCheck size={18}/>} label="Quality checks pending" value={pendingQuality.length} tone={pendingQuality.length ? "warning" : "success"} />
        <MetricCard icon={<IndianRupee size={18}/>} label="Payable (demo)" value={"₹" + totalPayable.toLocaleString("en-IN")} tone={totalPayable ? "warning" : "success"} />
      </div>

      <div className="homeGrid">
        <DashboardCard title="Your Demand" icon={<Boxes size={17}/>} action={<button className="linkBtn" onClick={() => go("industryDemand")}>Manage <ChevronRight size={13}/></button>}>
          {activeDemands.length === 0 ? <EmptyState icon={<Boxes size={20}/>} title="No demand published yet" text="Publish what residue your industry needs so farmers can be matched to you." action={<button className="secondaryBtn small" onClick={() => go("industryDemand")}>Publish demand</button>} /> :
            activeDemands.slice(0, 3).map((d) => (
              <div className="regReviewRow" key={d.id}><span>{d.residueType} • {d.application}</span><b>{d.quantity} T/mo</b></div>
            ))}
        </DashboardCard>

        <DashboardCard title="Available Matching Supply" icon={<Search size={17}/>} action={<button className="linkBtn" onClick={() => go("industrySupply")}>Browse <ChevronRight size={13}/></button>}>
          <p className="regFinePrint" style={{margin:"0 0 8px"}}>Search residue currently listed in the SUGAM demo network by type, quantity and distance.</p>
          <button className="secondaryBtn small" onClick={() => go("industrySupply")}><Search size={14}/> Open supply discovery</button>
        </DashboardCard>

        <DashboardCard title="Active Shipments" icon={<Truck size={17}/>} action={myShipments.length > 0 && <button className="linkBtn" onClick={() => go("industryTransactions")}>View all <ChevronRight size={13}/></button>}>
          {recent.length === 0 ? <EmptyState icon={<Truck size={20}/>} title="No shipments yet" text="Shipments will appear here once a farmer connects to your published demand." /> :
            recent.map((s) => (
              <div className="regReviewRow" key={s.id}><span>{s.passportId}</span><StatusBadge tone="info">{TRANSACTION_STAGES[Math.max(0, transactionIndexForShipment(s))].label}</StatusBadge></div>
            ))}
        </DashboardCard>

        <DashboardCard title="Quality Checks Pending" icon={<ShieldCheck size={17}/>}>
          {pendingQuality.length === 0 ? <EmptyState icon={<ShieldCheck size={20}/>} title="Nothing pending" text="Deliveries awaiting your quality verification will show up here." /> :
            pendingQuality.map((s) => <div className="regReviewRow" key={s.id}><span>{s.passportId}</span><b>{s.quantity} T {s.residueType}</b></div>)}
        </DashboardCard>

        <DashboardCard title="Upcoming Pickups" icon={<CalendarDays size={17}/>}>
          {upcomingPickups.length === 0 ? <EmptyState icon={<CalendarDays size={20}/>} title="No pickups scheduled" text="Scheduled pickups for your active shipments will appear here." /> :
            upcomingPickups.map((s) => <div className="regReviewRow" key={s.id}><span>{s.origin}</span><b>{s.quantity} T</b></div>)}
        </DashboardCard>

        <DashboardCard title="Circularity Summary (demo)" icon={<Leaf size={17}/>}>
          <div className="regReviewRow"><span>Residue procured</span><b>{totalProcured} T</b></div>
          <div className="regReviewRow"><span>CO₂ signal</span><b>{co2Signal} T</b></div>
          <div className="regReviewRow"><span>Completed transactions</span><b>{myShipments.filter(s=>s.utilizationConfirmed).length}</b></div>
          <p className="regFinePrint"><ShieldCheck size={12}/> Calculated from disclosed demo assumptions, not a scientific measurement.</p>
        </DashboardCard>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// DEMAND — full CRUD for the industry's own requirements. Kept as a separate,
// additive data model (`sugam_industry_demands`) so it never touches the
// pre-existing `industries` browse list directly; ACTIVE demands are mirrored
// into that list by the effect in App() so Farmer-side matching (unchanged)
// picks them up automatically.
// ---------------------------------------------------------------------------
const DEMAND_STATUS_TONE = { draft: "neutral", active: "success", paused: "warning", fulfilled: "info" };
const DEMAND_STATUS_LABEL = { draft: "Draft", active: "Active", paused: "Paused", fulfilled: "Fulfilled" };

function emptyDemand() {
  return {
    id: null,
    residueType: WASTE_TYPES[0],
    application: (METHODS[WASTE_TYPES[0]] || [])[0]?.method || "",
    quantity: "",
    location: "",
    requiredDate: "",
    rate: "",
    qualityRequirements: "",
    recurring: false,
    status: "active",
  };
}

function IndustryDemand({ demands, setDemands, industryReg, notify, go }) {
  const [view, setView] = useState("active"); // "active" | "history"
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyDemand());

  const active = demands.filter((d) => d.status === "active" || d.status === "draft" || d.status === "paused");
  const history = demands.filter((d) => d.status === "fulfilled");
  const list = view === "active" ? active : history;

  const openCreate = () => { setForm(emptyDemand()); setFormOpen(true); };
  const openEdit = (d) => { setForm(d); setFormOpen(true); };

  const save = (statusOverride) => {
    if (!form.residueType) return notify("Residue type is required.", "error");
    if (!form.quantity || Number(form.quantity) <= 0) return notify("Enter a valid required quantity.", "error");
    if (!form.location.trim()) return notify("Location is required.", "error");
    const now = Date.now();
    const isNew = !form.id;
    const record = {
      ...form,
      id: form.id || `demand-${industryReg.orgName ? industryReg.orgName.toLowerCase().replace(/[^a-z0-9]/g, "-") : "industry"}-${now}`,
      quantity: Number(form.quantity) || 0,
      rate: Number(form.rate) || 0,
      status: statusOverride || form.status || "active",
      updatedAt: now,
      createdAt: form.createdAt || now,
    };
    setDemands((prev) => isNew ? [record, ...prev] : prev.map((d) => (d.id === record.id ? record : d)));
    notify(isNew ? "Demand published." : "Demand updated.");
    setFormOpen(false);
  };

  const setStatus = (id, status) => {
    setDemands((prev) => prev.map((d) => (d.id === id ? { ...d, status, updatedAt: Date.now() } : d)));
    notify(status === "fulfilled" ? "Demand marked fulfilled and moved to history." : status === "paused" ? "Demand paused — hidden from farmer matching until resumed." : "Demand activated.");
  };

  const remove = (id) => {
    setDemands((prev) => prev.filter((d) => d.id !== id));
    notify("Demand removed.");
  };

  const pathwayOptions = METHODS[form.residueType] || METHODS[WASTE_TYPES[0]];

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">DEMAND</span><h1>Your material requirements</h1><p>Publish what residue you need — active requirements are matched to farmers automatically.</p></div>
        <button className="primaryBlue" onClick={openCreate}><Plus size={17}/> Create demand</button>
      </div>

      <div className="dashboardTabs">
        <button className={view === "active" ? "tab active" : "tab"} onClick={() => setView("active")}><Boxes size={16}/> My Requirements ({active.length})</button>
        <button className={view === "history" ? "tab active" : "tab"} onClick={() => setView("history")}><ClipboardList size={16}/> Demand History ({history.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<Boxes size={22}/>} title={view === "active" ? "No requirements yet" : "No fulfilled demand yet"} text={view === "active" ? "Create your first demand so farmers with matching residue can find you." : "Requirements you mark as fulfilled will be archived here."} action={view === "active" && <button className="secondaryBtn small" onClick={openCreate}><Plus size={14}/> Create demand</button>} />
      ) : (
        <div className="demandList">
          {list.map((d) => (
            <div className="demandCard" key={d.id}>
              <div className="demandCardHead">
                <div><b>{d.residueType}</b><span className="demandSub">{d.application}{d.recurring ? " • Recurring" : ""}</span></div>
                <StatusBadge tone={DEMAND_STATUS_TONE[d.status]}>{DEMAND_STATUS_LABEL[d.status]}</StatusBadge>
              </div>
              <div className="demandCardMeta">
                <span><Boxes size={13}/> {d.quantity} T/mo</span>
                <span><MapPin size={13}/> {d.location}</span>
                <span><IndianRupee size={13}/> ₹{(d.rate || 0).toLocaleString("en-IN")}/T</span>
                {d.requiredDate && <span><CalendarDays size={13}/> {d.requiredDate}</span>}
              </div>
              {d.qualityRequirements && <p className="demandQuality"><ShieldCheck size={12}/> {d.qualityRequirements}</p>}
              <div className="demandActions">
                <button className="tinyAction" onClick={() => openEdit(d)}><SlidersHorizontal size={13}/> Edit</button>
                {d.status !== "active" && d.status !== "fulfilled" && <button className="tinyAction" onClick={() => setStatus(d.id, "active")}><PlayCircle size={13}/> Activate</button>}
                {d.status === "active" && <button className="tinyAction" onClick={() => setStatus(d.id, "paused")}><PauseCircle size={13}/> Pause</button>}
                {d.status !== "fulfilled" && <button className="tinyAction" onClick={() => setStatus(d.id, "fulfilled")}><CheckCircle2 size={13}/> Mark fulfilled</button>}
                <button className="tinyAction danger" onClick={() => remove(d.id)}><X size={13}/> Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <div className="modalBackdrop" onClick={() => setFormOpen(false)}>
          <div className="formCard wide modalCard" onClick={(e) => e.stopPropagation()}>
            <div className="cardTitle"><span className="roundIcon blue"><Boxes size={20}/></span><div><h3>{form.id ? "Edit demand" : "Create demand"}</h3><p>Tell farmers what your industry needs.</p></div></div>
            <Field label="Residue type"><div className="choiceGrid">{WASTE_TYPES.map((w) => <button key={w} className={form.residueType === w ? "choice blueActive" : "choice"} onClick={() => setForm({ ...form, residueType: w, application: (METHODS[w] || [])[0]?.method || "" })}>{w}<CheckCircle2 size={15}/></button>)}</div></Field>
            <Field label="Utilization / application"><select value={form.application} onChange={(e) => setForm({ ...form, application: e.target.value })}>{pathwayOptions.map((m) => <option key={m.method}>{m.method}</option>)}</select></Field>
            <div className="formRow">
              <Field label="Required quantity (tons/month)"><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="e.g. 25"/></Field>
              <Field label="Indicative rate / budget (₹/ton)"><input type="number" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="e.g. 1500"/></Field>
            </div>
            <div className="formRow">
              <Field label="Location"><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City / district"/></Field>
              <Field label="Required date / window (optional)"><input value={form.requiredDate} onChange={(e) => setForm({ ...form, requiredDate: e.target.value })} placeholder="e.g. Within 2 weeks"/></Field>
            </div>
            <Field label="Quality requirements (optional)"><input value={form.qualityRequirements} onChange={(e) => setForm({ ...form, qualityRequirements: e.target.value })} placeholder="e.g. Moisture below 15%, clean loads only"/></Field>
            <label className="recurringToggle"><input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })}/> This is a recurring requirement</label>
            <div className="modalActions">
              <button className="secondaryBtn" onClick={() => setFormOpen(false)}>Cancel</button>
              {!form.id && <button className="secondaryBtn" onClick={() => save("draft")}>Save as draft</button>}
              <button className="primaryBlue" onClick={() => save("active")}><CheckCircle2 size={17}/> {form.id ? "Save changes" : "Publish demand"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// INCOMING REQUESTS — the industry's inbox of connection requests that
// farmers have already sent (via their own Matches screen, which is the only
// place a request can be initiated from). The industry's only action here is
// to Accept a request; it never originates one of its own toward a farmer.
// Reuses the same `shipments` records the Farmer side already creates —
// no new data model, no duplicate request store.
// ---------------------------------------------------------------------------
function IndustrySupply({ shipments, industryDemands, acceptShipment, notify, go }) {
  const [search, setSearch] = useState("");
  const [residueFilter, setResidueFilter] = useState("All");

  const myDemandIds = industryDemands.map((d) => d.id);
  const myRequests = shipments.filter((s) => myDemandIds.includes(s.industryId) && !s.cancelled);
  let filtered = myRequests.filter((s) =>
    (residueFilter === "All" || s.residueType === residueFilter) &&
    `${s.origin} ${s.residueType}`.toLowerCase().includes(search.toLowerCase())
  );
  const pending = filtered.filter((s) => !s.industryAccepted).sort((a, b) => b.createdAt - a.createdAt);
  const accepted = filtered.filter((s) => s.industryAccepted).sort((a, b) => b.createdAt - a.createdAt);

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">INCOMING REQUESTS</span><h1>Requests from farmers</h1><p>Farmers request a connection from their own Matches screen; accept a request here to move it into pickup scheduling. Your industry never sends a request to a farmer.</p></div>
      </div>

      <div className="toolbar">
        <div className="search"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search farmer location or residue"/></div>
        <div className="toolbarActions">
          <select className="tinySelect" value={residueFilter} onChange={(e) => setResidueFilter(e.target.value)}>
            <option>All</option>
            {WASTE_TYPES.map((w) => <option key={w}>{w}</option>)}
          </select>
          <span>{pending.length} awaiting your acceptance</span>
        </div>
      </div>

      {myRequests.length === 0 ? (
        <EmptyState icon={<Handshake size={22}/>} title="No requests yet" text="Once a farmer connects with one of your published demands, their request will appear here for you to accept." action={<button className="secondaryBtn small" onClick={() => go("industryDemand")}>Publish demand</button>} />
      ) : (
        <>
          <div className="sectionMini"><div><h2>Awaiting your acceptance</h2></div></div>
          {pending.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={22}/>} title="Nothing pending" text="You're caught up — new farmer requests will show up here." />
          ) : (
            <div className="demandList">
              {pending.map((s) => (
                <div className="demandCard" key={s.id}>
                  <div className="demandCardHead">
                    <div><b>{s.origin}</b><span className="demandSub">{s.residueType} • Passport {s.passportId}</span></div>
                    <StatusBadge tone="warning">Awaiting acceptance</StatusBadge>
                  </div>
                  <div className="demandCardMeta">
                    <span><Package size={13}/> {s.quantity} T offered</span>
                    <span><MapPin size={13}/> {s.distanceKm} km</span>
                    <span><IndianRupee size={13}/> ₹{s.rate.toLocaleString("en-IN")}/T indicative</span>
                    <span><ShieldCheck size={13}/> {s.qualitySummary}</span>
                  </div>
                  <div className="demandActions">
                    <button className="tinyAction primaryTiny" onClick={() => acceptShipment(s.id)}><CheckCircle2 size={13}/> Accept request</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {accepted.length > 0 && (
            <>
              <div className="sectionMini"><div><h2>Already accepted</h2></div><span>{accepted.length}</span></div>
              <div className="demandList">
                {accepted.map((s) => (
                  <div className="demandCard" key={s.id}>
                    <div className="demandCardHead">
                      <div><b>{s.origin}</b><span className="demandSub">{s.residueType} • Passport {s.passportId}</span></div>
                      <StatusBadge tone="success">Accepted</StatusBadge>
                    </div>
                    <div className="demandCardMeta">
                      <span><Package size={13}/> {s.quantity} T</span>
                      <span><Truck size={13}/> {TRANSACTION_STAGES[Math.max(0, transactionIndexForShipment(s))].label}</span>
                    </div>
                    <div className="demandActions">
                      <button className="tinyAction" onClick={() => go("industryTransactions")}><ChevronRight size={13}/> View in Transactions</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
      <div className="demoNote"><ShieldCheck size={18}/><div><b>About this list</b><p>Every row here is a real request already sent by a farmer from their Matches screen. Accepting moves the shipment into pickup scheduling — this demo does not let the industry initiate a request toward a farmer.</p></div></div>
    </>
  );
}

// ---------------------------------------------------------------------------
// MATCHES — explainable matching between the industry's own active demand(s)
// and available farmer supply. Shows the named factors behind each score
// instead of a bare percentage (SUGAM Innovation #1 — see spec section 18).
// ---------------------------------------------------------------------------
function IndustryMatches({ farmer, farmerReg, industryDemands, notify, go }) {
  const [requests, setRequests] = useState([]);
  const activeDemands = industryDemands.filter((d) => d.status === "active");
  const [activeDemandId, setActiveDemandId] = useState(activeDemands[0]?.id || null);
  const demand = activeDemands.find((d) => d.id === activeDemandId) || activeDemands[0] || null;

  if (activeDemands.length === 0) {
    return (
      <>
        <div className="pageTop"><div><span className="sectionTag blue">MATCHES</span><h1>Explainable matches</h1></div></div>
        <EmptyState icon={<Handshake size={22}/>} title="No active demand to match against" text="Publish a demand first — matches are ranked against your specific requirement, not a generic search." action={<button className="secondaryBtn small" onClick={() => go("industryDemand")}>Create demand</button>} />
      </>
    );
  }

  const supply = buildFarmerSupplyList(farmer, farmerReg);
  const ranked = supply
    .map((s) => ({ ...s, ...scoreSupplyDemandMatch(s, demand) }))
    .sort((a, b) => b.score - a.score);

  const request = (s) => {
    if (requests.includes(s.id)) return;
    setRequests((prev) => [...prev, s.id]);
    notify(`Interest sent to ${s.name} for ${s.quantity} T ${s.wasteType}`);
  };

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">MATCHES</span><h1>Explainable matches</h1><p>Ranked against your selected requirement, with the factors behind every score shown.</p></div>
      </div>

      {activeDemands.length > 1 && (
        <div className="dashboardTabs">
          {activeDemands.map((d) => (
            <button key={d.id} className={demand.id === d.id ? "tab active" : "tab"} onClick={() => setActiveDemandId(d.id)}>
              <Boxes size={16}/> {d.residueType} • {d.quantity} T/mo
            </button>
          ))}
        </div>
      )}

      <div className="matchHero">
        <div><span className="miniLabel">MATCHING AGAINST</span><h2>{demand.residueType} for {demand.application}</h2><p>{demand.quantity} T/mo required in {demand.location || "your area"}, indicative rate ₹{(demand.rate || 0).toLocaleString("en-IN")}/T.</p></div>
      </div>

      <div className="matchGrid">
        {ranked.map((s, i) => {
          const requested = requests.includes(s.id);
          return (
            <div className={i === 0 ? "matchCard top" : "matchCard"} key={s.id}>
              <div className="matchHead">
                <div className="companyLogo"><UserRound size={20}/></div>
                <div className="companyName"><h3>{s.name}</h3><span>{s.location} {s.verified && <span className="chip verified"><ShieldCheck size={11}/> Verified</span>}</span></div>
                <div className="matchScore" style={{"--pct": s.score}}><div className="ring"><b>{s.score}%</b><small>MATCH</small></div></div>
              </div>
              {i === 0 && <div className="bestRibbon"><Award size={14}/> Strongest available match</div>}
              <div className="matchFactors">
                {s.factors.map((f) => (
                  <div className={f.positive ? "matchFactor good" : "matchFactor bad"} key={f.label}>
                    {f.positive ? <CheckCircle2 size={13}/> : <XCircle size={13}/>}
                    <div><b>{f.label}</b><small>{f.detail}</small></div>
                  </div>
                ))}
              </div>
              <button className={requested ? "connectedBtn" : "connectBtn"} disabled={requested} onClick={() => request(s)}>
                {requested ? <><CheckCircle2 size={17}/> Request sent</> : <><Handshake size={17}/> Request this supply</>}
              </button>
              <small className="disclaimer">*Match score is a transparent demo heuristic, not a production AI prediction.</small>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// TRANSACTIONS — real Industry-side view over the same `shipments` records
// the Farmer side already creates and progresses. An industry's own
// transactions are identified as any shipment whose `industryId` matches one
// of that industry's own demand IDs (see the demand→industries mirror effect
// in App()) — no new data model, no duplicate transaction store. Quality
// verification and demo payment are the same shipment-level actions already
// used on the Farmer Passport screen, just exposed here for the buyer side
// where they naturally belong.
// ---------------------------------------------------------------------------
function IndustryTransactions({ shipments, industryDemands, updateShipment, notify, go, setActiveShipmentId }) {
  const [tab, setTab] = useState("active");
  const myDemandIds = industryDemands.map((d) => d.id);
  const myShipments = shipments.filter((s) => myDemandIds.includes(s.industryId));
  const active = myShipments.filter((s) => !s.cancelled && !s.utilizationConfirmed);
  const history = myShipments.filter((s) => s.cancelled || s.utilizationConfirmed);
  const list = ([...(tab === "active" ? active : history)]).sort((a, b) => b.createdAt - a.createdAt);

  const pendingPickup = active.filter((s) => transactionIndexForShipment(s) < 5).length;
  const inTransit = active.filter((s) => { const i = transactionIndexForShipment(s); return i >= 5 && i < 7; }).length;
  const pendingQuality = active.filter((s) => transactionIndexForShipment(s) >= 7 && !s.qualityVerified).length;
  const pendingPayment = active.filter((s) => s.qualityVerified && s.paymentStatus !== "completed").length;

  const openPassport = (s) => { setActiveShipmentId(s.id); go("industryPassport"); };
  const markQualityVerified = (s) => { updateShipment(s.id, { qualityVerified: true, qualityVerifiedAt: Date.now() }, "Industry"); notify(`Quality verified for ${s.passportId}`); };
  const completePayment = (s) => { updateShipment(s.id, { paymentStatus: "completed", paymentAt: Date.now() }, "Industry"); notify(`Demo payment completed for ${s.passportId}`); };

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">TRANSACTIONS</span><h1>Active transactions</h1><p>Offers, pickup &amp; logistics, quality verification and delivery for every procurement tied to your demand.</p></div>
      </div>

      <div className="homeMetricRow">
        <MetricCard icon={<Truck size={18}/>} label="Active transactions" value={active.length} tone="info" />
        <MetricCard icon={<CalendarDays size={18}/>} label="Pending pickup" value={pendingPickup} tone={pendingPickup ? "warning" : "success"} />
        <MetricCard icon={<Route size={18}/>} label="In transit" value={inTransit} tone="info" />
        <MetricCard icon={<ShieldCheck size={18}/>} label="Quality checks pending" value={pendingQuality} tone={pendingQuality ? "warning" : "success"} />
      </div>

      <div className="dashboardTabs">
        <button className={tab === "active" ? "tab active" : "tab"} onClick={() => setTab("active")}><Truck size={15}/> Active ({active.length})</button>
        <button className={tab === "history" ? "tab active" : "tab"} onClick={() => setTab("history")}><ClipboardList size={15}/> History ({history.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={22}/>}
          title={tab === "active" ? "No active transactions" : "No transaction history yet"}
          text={tab === "active" ? "A transaction is created here as soon as a farmer connects to one of your published demands." : "Completed and cancelled transactions will be listed here."}
          action={<button className="secondaryBtn small" onClick={() => go("industryDemand")}>Manage demand</button>}
        />
      ) : (
        <div className="txCardList">
          {list.map((s) => {
            const idx = transactionIndexForShipment(s);
            const canVerify = idx >= 7 && !s.qualityVerified && !s.cancelled;
            const canPay = s.qualityVerified && s.paymentStatus !== "completed" && !s.cancelled;
            return (
              <div className="txHistCard" key={s.id}>
                <div className="txHistTop">
                  <div><b>{s.origin}</b><small>{new Date(s.createdAt).toLocaleDateString("en-IN")} • {s.residueType} • {s.quantity} T</small></div>
                  <StatusBadge tone={s.cancelled ? "danger" : idx >= 10 ? "success" : "info"}>{s.cancelled ? "Cancelled" : TRANSACTION_STAGES[Math.max(0, idx)].label}</StatusBadge>
                </div>
                <div className="txHistGrid">
                  <div><span>Payable (net)</span><b>₹{(s.netAmount || 0).toLocaleString("en-IN")}</b></div>
                  <div><span>Distance</span><b>{s.distanceKm} km</b></div>
                  <div><span>Quality</span><b>{s.qualityVerified ? "Verified" : "Pending"}</b></div>
                  <div><span>Payment</span><StatusBadge tone={s.paymentStatus === "completed" ? "success" : "warning"}>{s.paymentStatus === "completed" ? "Completed" : "Pending"}</StatusBadge></div>
                </div>
                <div className="txHistFoot">
                  <small>Passport: {s.passportId} • Txn: {s.transactionId}</small>
                  <div className="toolbarActions">
                    {canVerify && <button className="tinyAction" onClick={() => markQualityVerified(s)}><ShieldCheck size={13}/> Verify quality</button>}
                    {canPay && <button className="tinyAction" onClick={() => completePayment(s)}><IndianRupee size={13}/> Complete payment</button>}
                    <button className="linkBtn" onClick={() => openPassport(s)}>Open <ChevronRight size={13}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="demoNote"><ShieldCheck size={18}/><div><b>Demo lifecycle</b><p>Pickup, transit and delivery progress the same way as on the Farmer side of this prototype. Quality verification and payment are manual demo actions here — no real inspection or payment gateway is integrated.</p></div></div>
    </>
  );
}

// ---------------------------------------------------------------------------
// TRACEABILITY — Passport / QR lookup across the industry's own transactions.
// Reuses the exact same shipment records and the same Passport component
// used on the Farmer side (see the `industryPassport` route in App()) so the
// lifecycle, QR payload and identifiers are identical on both sides of a
// transaction — nothing here is a second, divergent traceability system.
// ---------------------------------------------------------------------------
function IndustryTraceability({ shipments, industryDemands, go, setActiveShipmentId }) {
  const [query, setQuery] = useState("");
  const myDemandIds = industryDemands.map((d) => d.id);
  const myShipments = [...shipments.filter((s) => myDemandIds.includes(s.industryId))].sort((a, b) => b.createdAt - a.createdAt);
  const q = query.trim().toLowerCase();
  const filtered = q ? myShipments.filter((s) => s.passportId.toLowerCase().includes(q) || s.transactionId.toLowerCase().includes(q) || s.residueType.toLowerCase().includes(q)) : myShipments;

  const openPassport = (s) => { setActiveShipmentId(s.id); go("industryPassport"); };

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">TRACEABILITY</span><h1>Residue Passports</h1><p>Look up any passport or transaction ID tied to your procurements and view its full lifecycle.</p></div>
      </div>

      {myShipments.length === 0 ? (
        <EmptyState icon={<Fingerprint size={22}/>} title="No passports yet" text="A Residue Passport is issued automatically as soon as a farmer connects to one of your published demands." action={<button className="secondaryBtn small" onClick={() => go("industryDemand")}>Manage demand</button>} />
      ) : (
        <>
          <div className="search"><Search size={15}/><input placeholder="Search by Passport ID, Transaction ID or residue type" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          {filtered.length === 0 ? (
            <EmptyState icon={<Search size={22}/>} title="No match" text={`Nothing matches "${query}" in your transactions.`} />
          ) : (
            <div className="txCardList">
              {filtered.map((s) => {
                const idx = transactionIndexForShipment(s);
                return (
                  <div className="txHistCard" key={s.id}>
                    <div className="txHistTop">
                      <div><b>{s.passportId}</b><small>{s.residueType} • {s.quantity} T • from {s.origin}</small></div>
                      <StatusBadge tone={s.cancelled ? "danger" : idx >= 10 ? "success" : "info"}>{s.cancelled ? "Cancelled" : TRANSACTION_STAGES[Math.max(0, idx)].label}</StatusBadge>
                    </div>
                    <div className="txHistGrid">
                      <div><span>Origin</span><b>{s.origin}</b></div>
                      <div><span>Destination</span><b>{s.destination}</b></div>
                      <div><span>Quality</span><b>{s.qualityVerified ? "Verified" : "Pending"}</b></div>
                      <div><span>Utilization</span><b>{s.utilizationConfirmed ? "Confirmed" : "Pending"}</b></div>
                    </div>
                    <div className="txHistFoot">
                      <small>Txn: {s.transactionId}</small>
                      <button className="linkBtn" onClick={() => openPassport(s)}><QrCode size={13}/> Open full passport <ChevronRight size={13}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// INDUSTRY GOODS/SHIPMENT TRACKER — live view over the same shipment records
// used by Transactions, Traceability and Finance. No separate tracker state.
// ---------------------------------------------------------------------------
function IndustryTracker({ shipments, industryDemands, go, setActiveShipmentId }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);

  const demandIds = useMemo(() => new Set(industryDemands.map((d) => d.id)), [industryDemands]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments
      .filter((s) => demandIds.has(s.industryId) || String(s.industryId || "").startsWith("demo-demand-"))
      .filter((s) => {
        const status = simplifiedGoodsStatus(s).label.toLowerCase();
        return filter === "all" || status === filter;
      })
      .filter((s) => {
        if (!q) return true;
        return [s.transactionId, s.passportId, s.farmerName, s.residueType, s.origin, s.destination, s.industryName, s.vehicleId, s.driverName]
          .filter(Boolean).join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [shipments, demandIds, filter, query]);

  const selected = rows.find((s) => s.id === selectedId) || rows[0] || null;
  const openShipment = (shipment) => { setSelectedId(shipment.id); setActiveShipmentId(shipment.id); };
  const openDetails = (shipment) => { setActiveShipmentId(shipment.id); go("industryTransactions"); };

  const statusCounts = rows.reduce((acc, s) => {
    const label = simplifiedGoodsStatus(s).label;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const stages = [
    { label: "Registered", icon: ClipboardList },
    { label: "Matched", icon: Handshake },
    { label: "Pickup Scheduled", icon: CalendarDays },
    { label: "In Transit", icon: Truck },
    { label: "Delivered", icon: CheckCircle2 },
  ];

  const filters = [
    ["all", "All", rows.length],
    ["registered", "Registered", statusCounts.Registered || 0],
    ["matched", "Matched", statusCounts.Matched || 0],
    ["pickup scheduled", "Pickup", statusCounts["Pickup Scheduled"] || 0],
    ["in transit", "In transit", statusCounts["In Transit"] || 0],
    ["delivered", "Delivered", statusCounts.Delivered || 0],
    ["cancelled", "Cancelled", statusCounts.Cancelled || 0],
  ];

  return (
    <>
      <div className="pageTop"><div><span className="sectionTag blue">GOODS TRACKER</span><h1>Track your incoming goods</h1><p>Monitor every farmer shipment from registration through delivery using the same live transaction records.</p></div></div>
      <div className="homeMetricRow">
        <MetricCard icon={<Boxes size={18}/>} label="Total shipments" value={rows.length} />
        <MetricCard icon={<Clock size={18}/>} label="Pickup scheduled" value={statusCounts["Pickup Scheduled"] || 0} tone="warning" />
        <MetricCard icon={<Truck size={18}/>} label="In transit" value={statusCounts["In Transit"] || 0} tone="info" />
        <MetricCard icon={<CheckCircle2 size={18}/>} label="Delivered" value={statusCounts.Delivered || 0} tone="success" />
      </div>

      <div className="trackerToolbar">
        <div className="search trackerSearch"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search farmer, shipment, residue, vehicle..." /></div>
        <div className="trackerFilters">
          {filters.map(([key, label, count]) => <button key={key} className={filter === key ? "tab active" : "tab"} onClick={() => setFilter(key)}>{label} ({count})</button>)}
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={<RadioTower size={22}/>} title="No shipments found" text="Try another search/filter, or add demo data from the Industry dashboard." action={<button className="secondaryBtn small" onClick={() => { setQuery(""); setFilter("all"); }}>Reset filters</button>} />
      ) : (
        <div className="trackerLayout">
          <div className="trackerList">
            {rows.map((s) => {
              const state = simplifiedGoodsStatus(s);
              const active = selected?.id === s.id;
              return <button key={s.id} className={"goodsTrackerCard" + (active ? " selected" : "")} onClick={() => openShipment(s)}>
                <div className="goodsTrackerTop"><div className="goodsTrackerIdentity"><span className="trackerIcon"><Truck size={17}/></span><div><b>{s.farmerName || "SUGAM Farmer"}</b><small>{s.residueType} • {s.quantity} T • {s.transactionId}</small></div></div><StatusBadge tone={state.tone}>{state.label}</StatusBadge></div>
                <div className="goodsTrackerRoute"><span>{s.origin}</span><ArrowRight size={13}/><span>{s.destination}</span></div>
                <div className="goodsTrackerProgress"><i style={{ width: `${Math.min(100, Math.max(0, state.progress))}%` }}/></div>
                <div className="goodsTrackerMeta"><span><Truck size={12}/> {s.vehicleId || "Vehicle pending"}</span><span><Clock size={12}/> {s.createdAt ? new Date(s.createdAt).toLocaleDateString("en-IN") : "—"}</span></div>
              </button>;
            })}
          </div>

          {selected && <div className="formCard trackerDetail">
            <div className="cardTitle"><span className="roundIcon blue"><RadioTower size={20}/></span><div><h3>Shipment tracker</h3><p>{selected.transactionId}</p></div></div>
            <div className="trackerHeroStatus"><div><span>Current status</span><b>{simplifiedGoodsStatus(selected).label}</b></div><StatusBadge tone={simplifiedGoodsStatus(selected).tone}>{Math.round(simplifiedGoodsStatus(selected).progress)}% journey</StatusBadge></div>
            <div className="trackerTimeline">
              {stages.map((stage, index) => {
                const current = simplifiedGoodsStatus(selected).label;
                const currentIndex = stages.findIndex((x) => x.label === current);
                const done = selected.cancelled ? false : index <= currentIndex;
                const I = stage.icon;
                return <div className={"trackerTimelineStage " + (done ? "done" : "") + (index === currentIndex ? " active" : "")} key={stage.label}>
                  <span>{done ? <CheckCircle2 size={14}/> : <I size={14}/>}</span>
                  <div><b>{stage.label}</b><small>{index === 0 ? "Shipment registered" : index === 1 ? "Industry match recorded" : index === 2 ? "Pickup arranged" : index === 3 ? "Goods are on the route" : "Goods received at industry"}</small></div>
                </div>;
              })}
            </div>
            <div className="routeInfoGrid">
              <div><span>Farmer / supplier</span><b>{selected.farmerName || "SUGAM Farmer"}</b></div><div><span>Residue</span><b>{selected.residueType} • {selected.quantity} T</b></div>
              <div><span>Vehicle</span><b>{selected.vehicleId || "—"}</b></div><div><span>Driver</span><b>{selected.driverName || "—"}</b></div>
              <div><span>Origin</span><b>{selected.origin}</b></div><div><span>Destination</span><b>{selected.destination}</b></div>
              <div><span>Distance</span><b>{selected.distanceKm || 0} km</b></div><div><span>Payment</span><b>{selected.paymentStatus === "completed" ? "Completed" : "Pending"}</b></div>
            </div>
            <div className="bottomAction"><button className="secondaryBtn small" onClick={() => openDetails(selected)}><ClipboardList size={14}/> Open transaction</button>{selected.paymentStatus === "completed" && <button className="secondaryBtn small" onClick={() => triggerReceiptDownload(selected)}><Download size={14}/> Download receipt</button>}</div>
          </div>}
        </div>
      )}
      <div className="demoNote"><ShieldCheck size={18}/><div><b>Live prototype tracker</b><p>Statuses are derived from the same shipment lifecycle used by Transactions, Traceability and Finance. The demo records are illustrative and no live GPS/payment service is connected.</p></div></div>
    </>
  );
}

// ---------------------------------------------------------------------------
// FINANCE — Industry-side payable amounts, payment status and payment
// history, over the exact same shipment/payment fields the Farmer Payments &
// Receipts screen already reads (rate, grossAmount, transportCost,
// handlingCost, netAmount, paymentStatus, paymentAt) — no separate ledger.
// "Payable" mirrors the Farmer "earned" view from the buyer's side: the same
// net amount, the same demo payment action.
// ---------------------------------------------------------------------------
function IndustryFinance({ shipments, industryDemands, updateShipment, notify, go, setActiveShipmentId }) {
  const [tab, setTab] = useState("payable");
  const myDemandIds = industryDemands.map((d) => d.id);
  const myShipments = shipments.filter((s) => myDemandIds.includes(s.industryId));

  const payable = myShipments.filter((s) => s.paymentStatus !== "completed" && !s.cancelled);
  const paid = myShipments.filter((s) => s.paymentStatus === "completed");
  const totalPayable = payable.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const totalPaid = paid.reduce((sum, s) => sum + (s.netAmount || 0), 0);
  const readyToPay = payable.filter((s) => s.qualityVerified);

  const list = ([...(tab === "payable" ? payable : paid)]).sort((a, b) => (b.paymentAt || b.createdAt) - (a.paymentAt || a.createdAt));

  const openPassport = (s) => { setActiveShipmentId(s.id); go("industryPassport"); };
  const completePayment = (s) => { updateShipment(s.id, { paymentStatus: "completed", paymentAt: Date.now() }); notify(`Demo payment completed for ${s.passportId}`); };

  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">FINANCE</span><h1>Payments &amp; receipts</h1><p>Payable amounts, payment status and payment history across your procurements.</p></div>
      </div>

      <div className="homeMetricRow">
        <MetricCard icon={<IndianRupee size={18}/>} label="Total payable" value={"₹" + totalPayable.toLocaleString("en-IN")} tone={totalPayable ? "warning" : "success"} />
        <MetricCard icon={<CheckCircle2 size={18}/>} label="Ready to pay" value={readyToPay.length} hint="Quality verified, awaiting payment" tone={readyToPay.length ? "info" : "neutral"} />
        <MetricCard icon={<IndianRupee size={18}/>} label="Total paid" value={"₹" + totalPaid.toLocaleString("en-IN")} tone="success" />
        <MetricCard icon={<ClipboardList size={18}/>} label="Paid transactions" value={paid.length} />
      </div>

      <div className="dashboardTabs">
        <button className={tab === "payable" ? "tab active" : "tab"} onClick={() => setTab("payable")}><Clock size={15}/> Payable ({payable.length})</button>
        <button className={tab === "paid" ? "tab active" : "tab"} onClick={() => setTab("paid")}><CheckCircle2 size={15}/> Payment history ({paid.length})</button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<IndianRupee size={22}/>}
          title={tab === "payable" ? "Nothing payable right now" : "No payments recorded yet"}
          text={tab === "payable" ? "Amounts appear here once a transaction is quality-verified and awaiting payment." : "Completed demo payments for your procurements will be listed here."}
        />
      ) : (
        <div className="txCardList">
          {list.map((s) => {
            const canPay = s.qualityVerified && s.paymentStatus !== "completed" && !s.cancelled;
            return (
              <div className="txHistCard" key={s.id}>
                <div className="txHistTop">
                  <div><b>{s.origin}</b><small>{s.residueType} • {s.quantity} T • {s.passportId}</small></div>
                  <StatusBadge tone={s.paymentStatus === "completed" ? "success" : s.qualityVerified ? "warning" : "neutral"}>
                    {s.paymentStatus === "completed" ? "Completed" : s.qualityVerified ? "Pending" : "Awaiting quality check"}
                  </StatusBadge>
                </div>
                <div className="txHistGrid">
                  <div><span>Rate</span><b>₹{(s.rate || 0).toLocaleString("en-IN")}/T</b></div>
                  <div><span>Gross</span><b>₹{(s.grossAmount || 0).toLocaleString("en-IN")}</b></div>
                  <div><span>Deductions</span><b>₹{((s.transportCost || 0) + (s.handlingCost || 0)).toLocaleString("en-IN")}</b></div>
                  <div><span>Net payable</span><b>₹{(s.netAmount || 0).toLocaleString("en-IN")}</b></div>
                  <div><span>Paid on</span><b>{s.paymentAt ? new Date(s.paymentAt).toLocaleDateString("en-IN") : "—"}</b></div>
                </div>
                <div className="txHistFoot">
                  <small>Transaction ID: {s.transactionId}</small>
                  <div className="toolbarActions">
                    {canPay && <button className="tinyAction" onClick={() => completePayment(s)}><IndianRupee size={13}/> Complete payment</button>}
                    {s.paymentStatus === "completed" && <button className="tinyAction" onClick={() => triggerReceiptDownload(s, notify)}><Download size={13}/> Download Receipt</button>}
                    <button className="linkBtn" onClick={() => openPassport(s)}>{s.paymentStatus === "completed" ? "View receipt" : "Open"} <ChevronRight size={13}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="demoNote"><ShieldCheck size={18}/><div><b>Demo payment status only</b><p>Payment Completed here is a simulated, manually-triggered status for this prototype, identical to the Farmer-side demo payment action. No real payment gateway is integrated.</p></div></div>
    </>
  );
}

function IndustryProfile({ industryReg, go }) {
  return (
    <>
      <div className="pageTop">
        <div><span className="sectionTag blue">ACCOUNT</span><h1>Industry profile</h1><p>Your organisation details as published to the SUGAM demo network.</p></div>
      </div>
      <div className="homeGrid">
        <DashboardCard title="Organisation" icon={<Factory size={17}/>} action={<button className="linkBtn" onClick={() => go("industryDemand")}>Edit demand <ChevronRight size={13}/></button>}>
          <div className="regReviewRow"><span>Name</span><b>{industryReg.orgName || "—"}</b></div>
          <div className="regReviewRow"><span>Sector</span><b>{industryReg.sector}</b></div>
          <div className="regReviewRow"><span>Location</span><b>{industryReg.location || "—"}</b></div>
          <div className="regReviewRow"><span>Registration ID</span><b>{industryReg.registrationId || "Pending"}</b></div>
        </DashboardCard>
        <DashboardCard title="Contact" icon={<UserRound size={17}/>}>
          <div className="regReviewRow"><span>Contact person</span><b>{industryReg.contactName || "—"}</b></div>
          <div className="regReviewRow"><span>Phone</span><b>{industryReg.contactPhone || "—"}</b></div>
          <div className="regReviewRow"><span>Email</span><b>{industryReg.contactEmail || "—"}</b></div>
        </DashboardCard>
        <DashboardCard title="Verification" icon={<ShieldCheck size={17}/>}>
          <div className="regReviewRow"><span>Registration / GST number</span><b>{industryReg.regNumber || "Not provided"}</b></div>
          <div className="regReviewRow"><span>Status</span><StatusBadge tone={industryReg.verified ? "success" : "warning"}>{industryReg.verified ? "Verified" : "Verification pending"}</StatusBadge></div>
          <p className="regFinePrint"><ShieldCheck size={12}/> Document upload and verification workflow are coming in a future update — this is a demo status flag only.</p>
        </DashboardCard>
      </div>
    </>
  );
}

// Honest placeholder for Industry sections not yet rebuilt in this pass —
// keeps every nav item clickable and clearly communicates real scope instead
// of a broken/dead screen.
function ComingSoon({ icon, title, text, go }) {
  return (
    <>
      <div className="pageTop"><div><span className="sectionTag blue">INDUSTRY DASHBOARD</span><h1>{title}</h1></div></div>
      <EmptyState icon={icon} title="Coming in the next update" text={text} action={<button className="secondaryBtn small" onClick={() => go("industryHome")}>Back to dashboard</button>} />
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,600;9..144,700;9..144,800&family=IBM+Plex+Mono:wght@500;600&display=swap');
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:${C.cream};color:${C.ink};font-family:'DM Sans',sans-serif}button,input,select{font:inherit}button{cursor:pointer}.app{min-height:100vh}
button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:2px solid ${C.gold};outline-offset:2px}
.nav{height:72px;padding:0 clamp(18px,4vw,64px);display:flex;align-items:center;justify-content:space-between;background:rgba(255,253,248,.94);border-bottom:1px solid ${C.line};position:sticky;top:0;z-index:50;backdrop-filter:blur(14px)}.brand{border:0;background:none;display:flex;align-items:center;gap:10px;color:${C.ink};text-align:left}.brandMark{width:39px;height:39px;border-radius:12px;background:${C.green};color:#fff;display:grid;place-items:center}.brand b{display:block;font-family:'Fraunces',serif;font-size:20px;letter-spacing:.04em}.brand small{display:block;font-size:9px;color:${C.muted};letter-spacing:.07em;text-transform:uppercase}.navLinks{display:flex;gap:4px;margin-left:auto;margin-right:25px}.navLinks button,.iconBtn{border:0;background:transparent;color:${C.muted};padding:9px 12px;border-radius:9px;display:flex;align-items:center;gap:6px;font-size:13px}.navLinks button:hover,.navLinks .navActive{background:#EDF3EE;color:${C.green};font-weight:700}.navRight{display:flex;align-items:center;gap:12px}
.sugamLanguage{display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid ${C.line};border-radius:10px;padding:7px 9px;color:${C.green};font-size:11px;font-weight:700;white-space:nowrap}
.sugamLanguage select{border:0;background:transparent;color:${C.ink};font-size:11px;font-weight:700;outline:none;cursor:pointer;padding:0 2px}
.sugamLanguageLabel{color:${C.muted};font-size:10px}
#sugam-google-translate{position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden}
/* Google's own translation toolbar stays off-screen; the SUGAM selector is the only visible language control. */
.goog-te-banner-frame,.goog-te-banner-frame.skiptranslate,iframe.goog-te-banner-frame,body > .skiptranslate{display:none!important;visibility:hidden!important;height:0!important;min-height:0!important;width:0!important;overflow:hidden!important}
html,body,body.translated-ltr,body.translated-rtl{top:0!important;margin-top:0!important;position:static!important}
.goog-tooltip{display:none!important}
.goog-text-highlight{background:none!important;box-shadow:none!important}
.sugamLanguage .goog-te-gadget{font-size:0!important}
.dashboardMode > .nav{display:none!important}
@media(max-width:900px){.sugamLanguageLabel{display:none}.sugamLanguage{padding:7px 8px}}
.live{font-size:11px;color:${C.green};font-weight:700;background:#EDF5EE;padding:7px 10px;border-radius:30px}.live i{width:6px;height:6px;border-radius:50%;background:${C.green2};display:inline-block;margin-right:5px}.iconBtn{display:none}.hero{min-height:600px;background:${C.green};color:#fff;display:grid;grid-template-columns:1.1fr .9fr;padding:75px clamp(24px,7vw,100px);position:relative;overflow:hidden}.heroGlow{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(94,159,107,.24),transparent 65%);right:-180px;top:-180px}.heroContent{max-width:690px;z-index:2}.eyebrow,.sectionTag,.miniLabel{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.13em;font-weight:600}.eyebrow{color:#C6D8CA;margin-bottom:22px}.eyebrow span{color:${C.gold}}h1,h2,h3{font-family:'Fraunces',serif}.hero h1{font-size:clamp(48px,6.5vw,82px);line-height:.98;margin:0 0 24px;letter-spacing:-.04em}.hero h1 em{color:${C.gold};font-style:normal}.heroText{font-size:17px;line-height:1.7;color:#D9E4DB;max-width:610px;margin:0}.heroActions{display:flex;gap:12px;flex-wrap:wrap;margin:32px 0}.primaryBtn,.secondaryBtn,.primaryBlue,.goldBtn,.connectBtn,.connectedBtn{border:0;border-radius:10px;padding:13px 17px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:13px;transition:.18s}.primaryBtn{background:${C.green};color:#fff}.hero .primaryBtn{background:#fff;color:${C.green}}.primaryBtn:hover,.primaryBlue:hover,.goldBtn:hover,.connectBtn:hover{transform:translateY(-2px);filter:brightness(1.03)}.secondaryBtn{background:transparent;border:1px solid #CDD8CE;color:${C.ink}}.hero .secondaryBtn{color:#fff;border-color:#65826F}.trustRow{display:flex;gap:20px;flex-wrap:wrap;color:#BFD0C3;font-size:11px}.trustRow span{display:flex;align-items:center;gap:5px}.heroVisual{display:grid;place-items:center;position:relative;min-height:420px}.plantCircle{width:310px;height:310px;border-radius:50%;border:1px solid rgba(255,255,255,.2);display:grid;place-items:center;background:radial-gradient(circle,#316D4B,#1C563C);box-shadow:0 25px 80px rgba(0,0,0,.22)}.plantInner{width:210px;height:210px;border-radius:50%;border:1px dashed rgba(255,255,255,.3);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#DDEBDF}.plantInner svg{color:${C.gold};margin-bottom:10px}.plantInner span{font:600 10px 'IBM Plex Mono';letter-spacing:.16em}.plantInner strong{font-family:'Fraunces';font-size:24px;margin-top:5px}.orbitCard,.impactPill{position:absolute;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(12px);border-radius:13px;padding:12px;display:flex;gap:10px;align-items:center}.orbitCard svg{color:${C.gold}}.orbitCard b{display:block;font-family:'IBM Plex Mono';font-size:15px}.orbitCard small{display:block;color:#B9CDBE;font-size:10px;margin-top:2px}.cardA{top:30px;left:5%}.cardB{bottom:50px;right:0}.impactPill{bottom:8px;left:8%;color:#DCE9DE;font-size:11px}.impactPill svg{color:${C.green3}}.statsStrip{display:grid;grid-template-columns:repeat(4,1fr);background:#fff}.statsDisclaimer{background:#FFF9E9;border-bottom:1px solid #EADBB1;color:#725A25;font-size:10.5px;padding:8px 20px;display:flex;align-items:center;justify-content:center;gap:6px;border-top:1px solid #EADBB1}.metric{padding:25px clamp(15px,4vw,55px);display:flex;gap:13px;align-items:center;border-right:1px solid ${C.line};border-bottom:1px solid ${C.line}}.metricIcon{width:39px;height:39px;border-radius:10px;background:#EEF5EF;color:${C.green2};display:grid;place-items:center}.metricIcon svg{width:19px}.metric b{display:block;font:600 22px 'IBM Plex Mono';color:${C.green}}.metric span:last-child{display:block;font-size:10.5px;color:${C.muted};margin-top:4px}.section{max-width:1180px;margin:auto;padding:90px 24px}.sectionHeading{display:flex;justify-content:space-between;gap:50px;margin-bottom:38px}.sectionHeading>div{max-width:600px}.sectionHeading h2,.journey h2,.cta h2{font-size:42px;line-height:1.08;margin:10px 0}.sectionHeading p{max-width:420px;color:${C.muted};line-height:1.7;font-size:14px}.sectionTag{color:${C.green2}}.sectionTag.gold{color:${C.gold}}.sectionTag.blue{color:${C.blue}}.problemGrid,.valueGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}.infoCard,.valueCard{background:#fff;border:1px solid ${C.line};border-radius:15px;padding:25px;box-shadow:0 8px 25px rgba(30,50,40,.03)}.infoIcon,.valueCard>span{width:45px;height:45px;border-radius:11px;background:#EEF5EF;color:${C.green2};display:grid;place-items:center}.infoCard h3,.valueCard h3{font-size:21px;margin:20px 0 8px}.infoCard p,.valueCard p{font-size:13px;color:${C.muted};line-height:1.65;margin:0}.journey{background:${C.green};color:#fff;padding:80px clamp(24px,7vw,100px)}.journeyGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#47745A}.journeyItem{background:${C.green};padding:25px;min-height:190px}.journeyItem>span{font:600 11px 'IBM Plex Mono';color:${C.gold};display:block;margin-bottom:25px}.journeyItem svg{color:#C9DDCE;display:block;margin-bottom:17px}.journeyItem small{font:600 10px 'IBM Plex Mono';letter-spacing:.1em;color:#A9C0AE;display:block}.journeyItem b{font-family:'Fraunces';font-size:21px;display:block;margin-top:5px}.loop{max-width:1180px;margin:0 auto 90px;padding:0 24px}.loopHead{max-width:540px;margin-bottom:26px}.loopHead h2{font-size:32px;margin:8px 0 0}.loopRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid ${C.line};border-radius:16px;padding:24px;box-shadow:${C.shadow}}.loopNode{flex:1;min-width:110px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:9px}.loopNode span{width:44px;height:44px;border-radius:12px;background:#EEF5EF;color:${C.green2};display:grid;place-items:center}.loopNode b{font-size:12px;color:${C.ink}}.loopArrow{color:${C.muted};flex:none}.loopArrow.back{color:${C.gold}}.loopCaption{font-size:11.5px;color:${C.muted};margin-top:14px}.cta{background:#173C2C;color:#fff;max-width:1180px;margin:0 auto 80px;border-radius:20px;padding:48px 55px;display:flex;align-items:center;justify-content:space-between;gap:30px}.cta h2{font-size:36px}.cta p{color:#BBD0C0;max-width:570px;line-height:1.6;font-size:13px}.goldBtn{background:${C.gold};color:${C.ink}}footer{border-top:1px solid ${C.line};padding:25px clamp(20px,5vw,70px);display:flex;justify-content:space-between;align-items:center;color:${C.muted};font-size:10px}.footerBrand{transform:scale(.9);transform-origin:left center}.main{max-width:1180px;margin:auto;padding:40px 24px 90px}
.stepper{display:flex;align-items:center;gap:0;margin-bottom:26px;flex-wrap:wrap}.step{display:flex;align-items:center;gap:9px}.stepIcon{width:31px;height:31px;border-radius:50%;display:grid;place-items:center;background:#EDEDE2;color:${C.muted};flex:none;transition:.2s}.step.active .stepIcon{background:${C.green};color:#fff;box-shadow:0 0 0 4px #EAF3EB}.step.done .stepIcon{background:#DCEBE0;color:${C.green2}}.stepText b{display:block;font:600 8.5px 'IBM Plex Mono';color:${C.muted}}.stepText small{display:block;font-size:11px;font-weight:700;color:${C.ink};white-space:nowrap}.step.active .stepText small{color:${C.green}}.step.done .stepText small{color:${C.green2}}.stepLine{width:30px;height:1px;background:${C.line};margin:0 8px}
.pageTop{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin-bottom:35px}.pageTop h1{font-size:48px;line-height:1;margin:10px 0}.pageTop p{color:${C.muted};margin:0;font-size:14px}.workspace.twoCol{display:grid;grid-template-columns:1.4fr .8fr;gap:20px}.formCard{background:#fff;border:1px solid ${C.line};border-radius:17px;padding:30px;box-shadow:${C.shadow}}.formCard.wide{max-width:800px;margin:auto}.cardTitle{display:flex;gap:12px;align-items:center;margin-bottom:28px}.roundIcon{width:43px;height:43px;border-radius:11px;display:grid;place-items:center}.roundIcon.green{background:#EAF3EB;color:${C.green2}}.roundIcon.blue{background:${C.blueSoft};color:${C.blue}}.cardTitle h3{font-size:22px;margin:0}.cardTitle p{font-size:11px;color:${C.muted};margin:4px 0 0}.field{display:block;margin-bottom:19px}.field>span{display:block;text-transform:uppercase;letter-spacing:.07em;font:600 9.5px 'IBM Plex Mono';color:${C.muted};margin-bottom:7px}.req{color:${C.red}}.field input,.field select{width:100%;border:1px solid #D8D9D1;background:#FFFDF9;border-radius:9px;padding:12px 13px;outline:none;color:${C.ink};font-size:13px}.field input:focus,.field select:focus{border-color:${C.green2};box-shadow:0 0 0 3px #EAF3EB}.fieldError input,.fieldError select{border-color:${C.red}}.fieldError input:focus,.fieldError select:focus{box-shadow:0 0 0 3px ${C.redSoft}}.fieldErrorText{display:block;color:${C.red};font-size:10.5px;margin-top:6px}.inputIcon,.inputSuffix{position:relative;display:flex;align-items:center}.inputIcon svg{position:absolute;left:12px;color:${C.muted}}.inputIcon input{padding-left:38px}.inputSuffix span{position:absolute;right:12px;font:600 9px 'IBM Plex Mono';color:${C.muted}}.inputSuffix input{padding-right:55px}.formRow{display:grid;grid-template-columns:1fr 1fr;gap:14px}.choiceGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.choice{border:1px solid ${C.line};background:#fff;border-radius:9px;padding:11px 12px;text-align:left;display:flex;align-items:center;gap:8px;font-size:12px;color:${C.ink}}.choice span{font-size:18px}.choice svg{margin-left:auto;opacity:0;color:${C.green2}}.choice.active{background:#EDF5EE;border-color:${C.green2};color:${C.green};font-weight:700}.choice.active svg,.choice.blueActive svg{opacity:1}.choice.blueActive{background:${C.blueSoft};border-color:${C.blue};color:${C.blue};font-weight:700}.full{width:100%;margin-top:4px}.formHint{display:flex;gap:6px;justify-content:center;color:#9A9F98;font-size:10px;margin:12px 0 0}.greenPanel{background:${C.green};color:#fff;border-radius:17px;padding:32px;position:relative;overflow:hidden}.greenPanel:after{content:"";position:absolute;width:220px;height:220px;border-radius:50%;background:rgba(94,159,107,.18);right:-90px;bottom:-100px}.panelOrb{width:62px;height:62px;border-radius:18px;background:#FFFFFF14;display:grid;place-items:center;color:${C.gold};margin-bottom:38px}.greenPanel h2{font-size:31px;line-height:1.08;margin:10px 0 12px}.greenPanel>p{font-size:13px;line-height:1.7;color:#C8D9CC;margin-bottom:28px}.bullet{display:flex;gap:10px;margin:18px 0}.bullet svg{width:17px;color:${C.gold};flex:none}.bullet b,.bullet small{display:block}.bullet b{font-size:12px}.bullet small{font-size:10px;color:#AFC5B4;margin-top:2px}.analysisBadge{background:#EEF5EF;color:${C.green};border-radius:30px;padding:9px 12px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:6px}.analysisSummary{display:grid;grid-template-columns:repeat(4,1fr);background:#fff;border:1px solid ${C.line};border-radius:14px;overflow:hidden;margin-bottom:15px}.analysisSummary>div{padding:17px 20px;border-right:1px solid ${C.line}}.analysisSummary span,.analysisSummary b{display:block}.analysisSummary span{font:600 9px 'IBM Plex Mono';color:${C.muted};margin-bottom:5px}.analysisSummary b{font-size:13px}.notice{border-radius:12px;padding:14px 17px;display:flex;gap:11px;margin-bottom:38px}.notice.warning{background:${C.redSoft};color:#75402F}.notice svg{flex:none;margin-top:2px}.notice p{font-size:11px;line-height:1.5;margin:4px 0 0}.sectionMini{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:17px}.sectionMini h2{font-size:27px;margin:6px 0 0}.sectionMini>span{font-size:11px;color:${C.muted}}.methodGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:15px}.methodCard{background:#fff;border:1px solid ${C.line};border-radius:15px;padding:21px}.methodCard.featured{background:${C.green};color:#fff;border-color:${C.green}}.methodTop{display:flex;justify-content:space-between;align-items:center}.methodIcon{width:40px;height:40px;border-radius:10px;background:#EDF4EE;color:${C.green2};display:grid;place-items:center}.featured .methodIcon{background:#FFFFFF12;color:${C.gold}}.score{font:600 11px 'IBM Plex Mono';padding:5px 8px;background:${C.goldSoft};color:${C.green};border-radius:20px}.featured .score{background:#FFFFFF14;color:${C.gold}}.rank{font:600 8.5px 'IBM Plex Mono';letter-spacing:.1em;color:${C.muted};margin-top:20px}.featured .rank{color:#AFC8B5}.methodCard h3{font-size:22px;margin:7px 0}.methodCard p{font-size:11.5px;line-height:1.55;color:${C.muted};min-height:54px}.featured p{color:#C8D9CC}.progress{height:5px;background:#E7E9E2;border-radius:20px;overflow:hidden;margin:15px 0}.progress i{display:block;height:100%;background:${C.green2};border-radius:20px}.featured .progress{background:#FFFFFF18}.featured .progress i{background:${C.gold}}.methodStats{display:grid;grid-template-columns:repeat(3,1fr);gap:7px}.methodStats div{background:#F5F6F1;border-radius:8px;padding:8px}.featured .methodStats div{background:#FFFFFF10}.methodStats small,.methodStats b{display:block}.methodStats small{font:600 7px 'IBM Plex Mono';color:${C.muted}}.featured .methodStats small{color:#AFC8B5}.methodStats b{font-size:11px;margin-top:3px}.bottomAction{display:flex;justify-content:flex-end;gap:10px;margin-top:25px}.matchHero{background:${C.green};color:#fff;border-radius:17px;padding:27px 30px;display:flex;justify-content:space-between;align-items:center;margin-bottom:38px}.matchHero h2{font-size:31px;margin:8px 0}.matchHero p{font-size:12px;color:#C7D9CB;max-width:650px;margin:0}.matchHeroScore{text-align:right;border-left:1px solid #FFFFFF22;padding-left:35px}.matchHeroScore span,.matchHeroScore small{display:block;color:#AFC8B5;font-size:9px}.matchHeroScore b{display:block;font:600 27px 'IBM Plex Mono';color:${C.gold};margin:5px 0}.sortPill{background:#fff;border:1px solid ${C.line};padding:8px 10px;border-radius:20px;display:flex;align-items:center;gap:5px;font-size:10px;color:${C.muted}}.matchGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:15px}.matchCard{background:#fff;border:1px solid ${C.line};border-radius:15px;padding:20px;position:relative}.matchCard.top{border:2px solid ${C.gold}}.matchHead{display:flex;align-items:center;gap:11px}.companyLogo,.tinyLogo{display:grid;place-items:center;background:${C.blueSoft};color:${C.blue};border-radius:10px}.companyLogo{width:43px;height:43px}.companyName{flex:1}.companyName h3{font-size:18px;margin:0 0 3px}.companyName span{font-size:10px;color:${C.muted};display:flex;align-items:center;gap:5px;flex-wrap:wrap}.chip{display:inline-flex;align-items:center;gap:3px;font-size:8px;font-weight:700;padding:3px 7px;border-radius:20px}.chip.verified{background:#E6F0E8;color:${C.green2}}.matchScore{width:56px;height:56px;border-radius:50%;background:conic-gradient(${C.green2} calc(var(--pct,0)*1%),#EAEBE3 0);display:grid;place-items:center;flex:none}.matchScore .ring{width:44px;height:44px;border-radius:50%;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;color:${C.green2}}.matchScore .ring b{font:600 13px 'IBM Plex Mono'}.matchScore .ring small{font:600 6px 'IBM Plex Mono';margin-top:1px;color:${C.muted}}.bestRibbon{display:inline-flex;align-items:center;gap:5px;background:${C.goldSoft};color:#74591F;border-radius:20px;padding:5px 8px;font-size:9px;font-weight:700;margin:12px 0}.companyMeta{display:flex;gap:8px;flex-wrap:wrap;padding:14px 0;border-bottom:1px solid ${C.line}}.companyMeta span{display:flex;align-items:center;gap:4px;background:#F5F6F1;color:${C.muted};font-size:10px;padding:5px 9px;border-radius:20px}.matchMetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:12px 0}.matchMetrics div{background:#F7F7F2;padding:9px;border-radius:8px}.matchMetrics small,.matchMetrics b{display:block}.matchMetrics small{font-size:8px;color:${C.muted}}.matchMetrics b{font:600 11px 'IBM Plex Mono';margin-top:3px}.contact{display:flex;gap:6px;align-items:center;font-size:10px;color:${C.muted};padding:9px 0}.contact .location{margin-left:auto}.connectBtn,.connectedBtn{width:100%;background:${C.green};color:#fff}.connectedBtn{background:#E6F0E8;color:${C.green}}.disclaimer{display:block;color:#A2A59F;font-size:8px;margin-top:8px}.dashboardTabs{display:flex;gap:5px;margin-bottom:20px}.tab{border:1px solid ${C.line};background:#fff;padding:10px 14px;border-radius:9px;display:flex;align-items:center;gap:6px;color:${C.muted};font-size:11px}.tab.active{background:${C.blue};color:#fff;border-color:${C.blue};font-weight:700}.primaryBlue{background:${C.blue};color:#fff}.toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:10px;color:${C.muted};gap:10px;flex-wrap:wrap}.toolbarActions{display:flex;align-items:center;gap:7px}.tinyAction{border:1px solid ${C.line};background:#fff;border-radius:7px;padding:7px 9px;display:flex;align-items:center;gap:4px;font-size:9px;font-weight:700;color:${C.blue};cursor:pointer;transition:.15s}.tinyAction:hover:not(:disabled){background:${C.blueSoft}}.tinyAction.danger{color:${C.red}}.tinyAction.danger:hover:not(:disabled){background:${C.redSoft}}.tinyAction:disabled{opacity:.45;cursor:not-allowed}.search{width:350px;background:#fff;border:1px solid ${C.line};border-radius:9px;display:flex;align-items:center;gap:7px;padding:9px 11px}.search svg{color:${C.muted}}.search input{border:0;outline:0;background:transparent;width:100%;font-size:11px}.industryTable{background:#fff;border:1px solid ${C.line};border-radius:14px;overflow:hidden}.tableHead,.tableRow{display:grid;grid-template-columns:1.6fr 1fr .9fr .9fr 1fr .8fr;align-items:center;gap:10px}.tableHead{background:${C.blue};color:#fff;padding:12px 16px;font:600 8.5px 'IBM Plex Mono';text-transform:uppercase;letter-spacing:.07em}.tableRow{padding:14px 16px;border-top:1px solid #EEEDE7;font-size:10.5px}.tableCompany{display:flex;gap:8px;align-items:center}.tinyLogo{width:31px;height:31px}.tableCompany b,.tableCompany small{display:block}.tableCompany small{color:${C.muted};font-size:8.5px;margin-top:2px}.tableRow>span{color:${C.muted};display:flex;align-items:center;gap:3px}.requestBtn{border:1px solid ${C.blue};background:#fff;color:${C.blue};border-radius:7px;padding:7px 9px;font-size:9px;font-weight:700}.empty{background:#fff;border:1px dashed #CDD6CC;border-radius:15px;padding:50px;text-align:center;color:${C.muted}}.empty svg{color:${C.green2}}.empty h3{font-size:22px;color:${C.ink};margin:13px 0 5px}.empty p{font-size:12px;margin-bottom:20px}.aboutHero{background:${C.green};color:#fff;border-radius:18px;padding:42px;display:flex;gap:25px;align-items:flex-start;margin-bottom:25px}.aboutIcon{width:72px;height:72px;border-radius:18px;background:#FFFFFF12;display:grid;place-items:center;color:${C.gold};flex:none}.aboutHero h2{font-size:35px;margin:8px 0}.aboutHero p{color:#C6D8CA;line-height:1.7;font-size:13px;max-width:720px}.aboutGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.aboutCard{background:#fff;border:1px solid ${C.line};padding:22px;border-radius:13px}.aboutCard>svg{color:${C.green2}}.aboutCard h3{font-size:18px}.aboutCard p{font-size:11px;color:${C.muted};line-height:1.6}.demoNote{display:flex;gap:11px;background:#FFF9E9;border:1px solid #EADBB1;border-radius:12px;padding:15px;margin:20px 0;color:#725A25}.demoNote svg{flex:none}.demoNote p{font-size:10.5px;line-height:1.55;margin:4px 0}.toast{position:fixed;right:25px;bottom:25px;background:${C.green};color:#fff;padding:13px 17px;border-radius:10px;box-shadow:0 15px 35px rgba(0,0,0,.18);display:flex;align-items:center;gap:8px;font-size:12px;z-index:100}.toast.error{background:${C.red}}.pathwayChooser{background:#fff;border:1px solid ${C.line};border-radius:16px;padding:20px;margin-bottom:18px;box-shadow:0 8px 24px rgba(23,74,53,.04)}.chooserHead{display:flex;justify-content:space-between;align-items:flex-end;gap:15px;margin-bottom:14px}.chooserHead h2{font-size:21px;margin:6px 0 0}.chooserHead>span{font-size:10px;color:${C.muted}}.chooserGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.pathChoice{border:1px solid ${C.line};background:#FBFBF7;border-radius:11px;padding:12px;display:flex;align-items:center;gap:9px;text-align:left;cursor:pointer;color:${C.ink}}.pathChoice.selected{background:${C.green};border-color:${C.green};color:#fff}.pathChoiceIcon{width:34px;height:34px;border-radius:9px;background:#EAF2EC;color:${C.green2};display:grid;place-items:center;flex:none}.selected .pathChoiceIcon{background:#FFFFFF12;color:${C.gold}}.pathChoiceText{flex:1}.pathChoiceText b,.pathChoiceText small{display:block}.pathChoiceText b{font-size:11px}.pathChoiceText small{font-size:8px;color:${C.muted};margin-top:3px}.selected .pathChoiceText small{color:#BBD0C0}
@media(max-width:900px){.hero{grid-template-columns:1fr}.heroVisual{display:none}.statsStrip{grid-template-columns:1fr 1fr}.methodGrid,.problemGrid,.valueGrid,.chooserGrid{grid-template-columns:1fr 1fr}.aboutGrid{grid-template-columns:1fr 1fr}.journeyGrid{grid-template-columns:1fr 1fr}.workspace.twoCol{grid-template-columns:1fr}.greenPanel{min-height:300px}.matchGrid{grid-template-columns:1fr}.pageTop{align-items:flex-start;flex-direction:column}.navLinks{display:none}.navLinks.open{display:flex;position:absolute;top:72px;left:0;right:0;background:#fff;padding:12px;flex-direction:column;border-bottom:1px solid ${C.line};box-shadow:0 10px 20px #0000000b}.iconBtn{display:flex}.navRight .live{display:none}.tableHead,.tableRow{grid-template-columns:1.4fr 1fr .8fr .8fr}.tableHead span:nth-child(4),.tableHead span:nth-child(5),.tableRow>span:nth-child(4),.tableRow>span:nth-child(5){display:none}.cta{margin:0 20px 60px;flex-direction:column;align-items:flex-start}.sectionHeading{flex-direction:column;gap:5px}.loopRow{flex-direction:column}.loopArrow{transform:rotate(90deg)}.loopArrow.back{transform:none}}
@media(max-width:600px){.hero{padding:55px 22px}.hero h1{font-size:48px}.statsStrip{grid-template-columns:1fr 1fr}.metric{padding:18px 12px}.metric b{font-size:17px}.section{padding:60px 18px}.problemGrid,.valueGrid,.methodGrid,.aboutGrid{grid-template-columns:1fr}.journeyGrid{grid-template-columns:1fr}.journeyItem{min-height:130px}.analysisSummary{grid-template-columns:1fr 1fr}.analysisSummary>div:nth-child(2){border-right:0}.formRow,.choiceGrid{grid-template-columns:1fr}.main{padding:30px 16px 70px}.pageTop h1{font-size:39px}.formCard{padding:22px}.matchHero{flex-direction:column;align-items:flex-start;gap:20px}.matchHeroScore{border-left:0;border-top:1px solid #FFFFFF22;padding:17px 0 0;text-align:left;width:100%}.sectionMini{align-items:flex-start;gap:10px;flex-direction:column}.search{width:100%}.toolbar{align-items:stretch;flex-direction:column;gap:9px}.toolbarActions{justify-content:space-between}.tableHead{display:none}.industryTable{border:0;background:transparent}.tableRow{display:block;background:#fff;border:1px solid ${C.line};border-radius:12px;margin-bottom:8px;padding:14px}.tableRow>span{display:none}.tableRow .requestBtn{width:100%;margin-top:10px}.aboutHero{padding:25px;flex-direction:column}.aboutHero h2{font-size:28px}footer{flex-direction:column;gap:10px;align-items:flex-start}.cta{padding:30px}.cta h2{font-size:30px}.stepText{display:none}.stepLine{width:14px}.chooserGrid{grid-template-columns:1fr}}
.qualityToggle{display:flex;align-items:center;gap:6px;border:0;background:none;color:${C.blue};font-size:12.5px;font-weight:700;padding:4px 0 14px;cursor:pointer}.qualityToggle small{color:${C.muted};font-weight:500}.qualityPanel{background:#F7F7F2;border:1px solid ${C.line};border-radius:12px;padding:16px 16px 2px;margin-bottom:18px}.qualityNotes{width:100%;border:1px solid #D8D9D1;background:#FFFDF9;border-radius:9px;padding:10px 12px;font-size:13px;color:${C.ink};resize:vertical}
.retentionCard{background:#fff;border:1px solid ${C.line};border-radius:16px;padding:22px 24px;margin-bottom:18px;box-shadow:0 8px 24px rgba(23,74,53,.04)}.retentionHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;flex-wrap:wrap}.retentionTitle{display:flex;align-items:center;gap:8px;font-family:'Fraunces',serif;font-weight:700;font-size:17px;color:${C.ink}}.estimateBadge{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:${C.blue};background:${C.blueSoft};border-radius:20px;padding:4px 9px;white-space:nowrap}.retentionText{font-size:12px;color:${C.muted};line-height:1.6;margin:0 0 16px}.retentionFlow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:18px;color:${C.muted}}.flowFigure{background:#F5F6F1;border-radius:10px;padding:10px 14px;flex:1 1 130px;min-width:110px}.flowFigure span{display:block;font-size:9.5px;color:${C.muted};text-transform:uppercase;letter-spacing:.05em}.flowFigure b{display:block;font-family:'IBM Plex Mono';font-size:16px;margin-top:3px;color:${C.ink}}.flowFigure.retain{background:${C.goldSoft}}.flowFigure.retain b{color:#8A6A22}.flowFigure.surplus{background:#E6F0E8}.flowFigure.surplus b{color:${C.green}}.retentionSliderRow{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:700;color:${C.muted};margin-bottom:6px;gap:10px;flex-wrap:wrap}.retentionSlider{width:100%;accent-color:${C.green2}}
.pathwayGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;margin-bottom:22px}.pathwayCard{background:#fff;border:1px solid ${C.line};border-radius:15px;padding:18px 20px;transition:border-color .15s ease}.pathwayCard.best{background:${C.green};color:#fff;border-color:${C.green}}.pathwayCard.selected{border-color:${C.gold};border-width:2px}.pathwayTop{display:flex;align-items:flex-start;gap:10px;cursor:pointer;margin-bottom:12px}.pathwayIcon{width:34px;height:34px;border-radius:9px;background:#EDF4EE;color:${C.green2};display:grid;place-items:center;flex:none}.pathwayCard.best .pathwayIcon{background:#FFFFFF1a;color:${C.gold}}.pathwayHeadText{flex:1}.pathwayHeadText b{display:block;font-family:'Fraunces',serif;font-size:15.5px}.pathwayHeadText small{display:block;font-size:11.5px;color:${C.muted};margin-top:2px}.pathwayCard.best .pathwayHeadText small{color:#C8D9CC}.pathwayBadge{display:flex;align-items:center;gap:4px;font:700 9.5px 'IBM Plex Mono';background:${C.goldSoft};color:#8A6A22;border-radius:20px;padding:4px 8px;white-space:nowrap;flex:none}.pathwayCard.best .pathwayBadge{background:#FFFFFF22;color:${C.gold}}.pathwayMetrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:10px;cursor:pointer}.pathwayMetric{background:#F5F6F1;border-radius:8px;padding:8px 9px}.pathwayCard.best .pathwayMetric{background:#FFFFFF12}.pathwayMetric small{display:block;font:600 8px 'IBM Plex Mono';color:${C.muted}}.pathwayCard.best .pathwayMetric small{color:#C8D9CC}.pathwayMetric b{display:block;font:600 12.5px 'IBM Plex Mono';margin-top:3px}.pathwayMetric.net b{color:${C.green}}.pathwayCard.best .pathwayMetric.net b{color:${C.gold}}.pathwayMetric.accent{background:#EAF3EB}.pathwayCard.best .pathwayMetric.accent{background:rgba(94,159,107,.2)}.pathwayCompat{font-size:11px;color:${C.muted};background:#F5F6F1;border-radius:8px;padding:7px 10px;margin-bottom:10px}.pathwayCompat b{color:${C.ink}}.pathwayCard.best .pathwayCompat{background:#FFFFFF12;color:#DDE8DF}.pathwayCard.best .pathwayCompat b{color:#fff}.whyToggle{display:flex;align-items:center;gap:5px;border:0;background:none;padding:0;cursor:pointer;font-size:11.5px;font-weight:700;color:${C.blue}}.pathwayCard.best .whyToggle{color:${C.gold}}.whyText{font-size:11.5px;line-height:1.55;color:${C.muted};margin:8px 0 0}.pathwayCard.best .whyText{color:#DDE8DF}.pathwaySelected{display:flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:${C.green2};margin-top:10px;cursor:pointer}.pathwayCard.best .pathwaySelected{color:${C.gold}}
.confirmBox{background:#fff;border:1.5px solid ${C.line};border-radius:14px;padding:18px 20px;margin-bottom:18px}.confirmBox p{font-size:12.5px;color:${C.muted};line-height:1.6;margin:0 0 14px}.confirmBox.confirmed{background:#EAF3EB;border-color:${C.green2}}.confirmedRow{display:flex;align-items:center;gap:8px;font-weight:700;color:${C.green};font-size:13px}
@media(max-width:900px){.pathwayGrid{grid-template-columns:1fr}}
.logisticsBtn{width:100%;margin-top:8px;border:1px solid ${C.blue};background:${C.blueSoft};color:${C.blue};border-radius:10px;padding:11px 13px;display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:12px}
.routeCard{background:#fff;border:1px solid ${C.line};border-radius:17px;padding:26px 28px;box-shadow:${C.shadow};margin-bottom:20px}
.routePoints{display:flex;align-items:center;gap:14px;margin-bottom:20px;flex-wrap:wrap}
.routePoint{display:flex;align-items:center;gap:10px;flex:1;min-width:180px}
.routeDot{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;flex:none;color:#fff}
.routeDot.origin{background:${C.green2}}
.routeDot.dest{background:${C.blue}}
.routePoint b{display:block;font-size:14.5px;color:${C.ink};margin-top:2px}
.routeConnector{flex:1.2;min-width:160px;text-align:center;padding:0 6px}
.routeLine{height:2px;background:repeating-linear-gradient(90deg,${C.line} 0 8px,transparent 8px 14px);margin-bottom:8px;position:relative}
.routeLine:before,.routeLine:after{content:"";position:absolute;top:50%;transform:translateY(-50%);width:6px;height:6px;border-radius:50%;background:${C.gold}}
.routeLine:before{left:0}.routeLine:after{right:0}
.routeConnectorMeta{display:flex;justify-content:center;gap:14px;font-size:11px;color:${C.muted};font-weight:700}
.routeConnectorMeta span{display:flex;align-items:center;gap:4px}
.secondaryBtn.onDark{color:#fff;border-color:#FFFFFF3a;background:#FFFFFF12}
.routeInfoGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.routeInfoGrid div{background:#F5F6F1;border-radius:9px;padding:10px 12px}
.routeInfoGrid span{display:block;font:600 8.5px 'IBM Plex Mono';color:${C.muted};text-transform:uppercase;letter-spacing:.05em}
.routeInfoGrid b{display:block;font-size:13px;margin-top:4px;color:${C.ink}}
.routeNote{display:flex;gap:6px;font-size:10.5px;color:${C.muted};line-height:1.55;margin:0}
.routeNote svg{flex:none;margin-top:2px}
.demoLiveBanner{display:flex;align-items:center;gap:10px;background:#FFF3E4;border:1px solid #F0D6A8;color:#7A4E14;border-radius:12px;padding:12px 16px;margin-bottom:20px;flex-wrap:wrap}
.livePulse{width:9px;height:9px;border-radius:50%;background:#E0863A;flex:none;box-shadow:0 0 0 0 rgba(224,134,58,.6);animation:livePulse 1.6s infinite}
@keyframes livePulse{0%{box-shadow:0 0 0 0 rgba(224,134,58,.55)}70%{box-shadow:0 0 0 9px rgba(224,134,58,0)}100%{box-shadow:0 0 0 0 rgba(224,134,58,0)}}
.demoLiveBanner b{font-size:12.5px;white-space:nowrap}
.demoLiveText{font-size:11px;line-height:1.5;color:#8A5C1E}
.trackCard{background:#fff;border:1px solid ${C.line};border-radius:18px;padding:26px 28px;box-shadow:${C.shadow};margin-bottom:20px}
.trackCardTop{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:28px}
.trackStatusBig{display:flex;align-items:center;gap:12px}
.trackStatusIcon{width:48px;height:48px;border-radius:13px;background:${C.green};color:#fff;display:grid;place-items:center;flex:none}
.trackStatusBig h2{font-size:24px;margin:4px 0 0}
.trackEta{text-align:right}
.trackEta b{display:block;font:600 17px 'IBM Plex Mono';color:${C.green};margin-top:4px}
.routeTrack{position:relative;padding:10px 0 34px;margin-bottom:10px}
.routeTrackLine{height:6px;background:#EAEBE3;border-radius:20px;position:relative;overflow:visible}
.routeTrackLine i{display:block;height:100%;background:linear-gradient(90deg,${C.green2},${C.green});border-radius:20px;transition:width .25s linear}
.routeTrackTruck{position:absolute;top:-13px;transform:translateX(-50%);width:32px;height:32px;border-radius:50%;background:${C.green};color:#fff;display:grid;place-items:center;box-shadow:0 6px 16px rgba(23,74,53,.35);transition:left .25s linear;border:2px solid #fff}
.routeTrackStages{display:flex;justify-content:space-between;margin-top:20px;gap:4px}
.trackStage{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1;text-align:center}
.trackStage small{font-size:8.5px;color:${C.muted};font-weight:600;line-height:1.3}
.trackStageDot{width:24px;height:24px;border-radius:50%;background:#EDEDE2;color:${C.muted};display:grid;place-items:center;flex:none}
.trackStage.done .trackStageDot{background:#DCEBE0;color:${C.green2}}
.trackStage.active .trackStageDot{background:${C.green};color:#fff;box-shadow:0 0 0 4px #EAF3EB}
.trackStage.active small{color:${C.green};font-weight:700}
.trackControls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;border-top:1px solid ${C.line};padding-top:16px}
.trackControls .tinyAction:disabled{opacity:.5;cursor:not-allowed}
.trackProgressPct{margin-left:auto;display:flex;align-items:center;gap:5px;font-size:10.5px;color:${C.muted};font-weight:700}
.roundIcon.gold{background:${C.goldSoft};color:#8A6A22}
@media(max-width:700px){.routePoints{flex-direction:column;align-items:flex-start}.routeConnector{width:100%}.routeLine{transform:rotate(90deg);width:40px;margin:14px auto}.routeInfoGrid{grid-template-columns:1fr}.routeTrackStages{flex-wrap:wrap}.trackStage{flex:0 0 22%}}
.pageTopActions{display:flex;gap:10px;flex-wrap:wrap}
.passportBtn{background:${C.green};color:#fff;border-color:${C.green}}
.passportCard{background:#fff;border:1px solid ${C.line};border-radius:18px;box-shadow:${C.shadow};padding:30px 32px;display:grid;grid-template-columns:1.5fr .9fr;gap:26px;margin-bottom:30px}
.passportTag{display:inline-flex;align-items:center;gap:6px;font:600 10px 'IBM Plex Mono';letter-spacing:.1em;color:${C.gold};background:${C.goldSoft};border-radius:20px;padding:6px 10px;margin-bottom:14px}
.passportIdRow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:12px}
.passportIdRow h2{font:600 30px 'IBM Plex Mono';color:${C.ink};margin:0;letter-spacing:-.01em}
.passportStatusPill{display:inline-flex;align-items:center;gap:6px;background:#EAF3EB;color:${C.green};font-size:11.5px;font-weight:700;border-radius:20px;padding:7px 12px;margin-bottom:22px}
.passportStatusPill.cancelled{background:${C.redSoft};color:${C.red}}
.passportGrid{display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:16px}
.passportGrid span{display:block;font:600 8.5px 'IBM Plex Mono';color:${C.muted};text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.passportGrid b{display:block;font-size:13px;color:${C.ink}}
.passportRight{display:flex;align-items:flex-start;justify-content:center}
.qrCard{background:${C.paper};border:1px solid ${C.line};border-radius:16px;padding:18px;display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}
.qrCard img{border-radius:10px;background:#fff;padding:8px;border:1px solid ${C.line};max-width:100%;height:auto}
.qrCaption{display:flex;align-items:center;gap:5px;font-size:10.5px;color:${C.muted};font-weight:600}
.txTimeline{background:#fff;border:1px solid ${C.line};border-radius:17px;box-shadow:${C.shadow};padding:28px 30px 8px;margin-bottom:24px}
.txStage{display:flex;gap:16px}
.txStageMarker{display:flex;flex-direction:column;align-items:center}
.txStageDot{width:34px;height:34px;border-radius:50%;background:#EDEDE2;color:${C.muted};display:grid;place-items:center;flex:none;transition:.2s}
.txStageLine{width:2px;flex:1;min-height:26px;background:${C.line};margin:2px 0}
.txStage.done .txStageDot{background:#DCEBE0;color:${C.green2}}
.txStage.done .txStageLine{background:${C.green3}}
.txStage.active .txStageDot{background:${C.green};color:#fff;box-shadow:0 0 0 5px #EAF3EB}
.txStage.stopped .txStageDot{background:${C.redSoft};color:${C.red}}
.txStageBody{padding-bottom:26px;flex:1}
.txStageBody b{display:block;font-size:14px;color:${C.ink};margin-bottom:3px}
.txStageBody p{font-size:11.5px;color:${C.muted};line-height:1.55;margin:0}
.txStage.active .txStageBody b{color:${C.green}}
.txStageNow{display:inline-flex;align-items:center;gap:5px;color:${C.green2};font:600 9.5px 'IBM Plex Mono';margin-top:6px}
.passportActions{background:#fff;border:1px solid ${C.line};border-radius:17px;padding:26px 28px;box-shadow:${C.shadow}}
.passportActionRow{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0 18px}
@media(max-width:900px){.passportCard{grid-template-columns:1fr}.passportRight{justify-content:flex-start}.passportGrid{grid-template-columns:1fr 1fr}}
@media(max-width:600px){.passportIdRow h2{font-size:22px}.passportGrid{grid-template-columns:1fr}.passportActionRow{flex-direction:column}.passportActionRow button{width:100%}}

/* ============================================================
   PHASE 1 — SHARED DESIGN SYSTEM CSS
   ============================================================ */
.statusBadge{display:inline-flex;align-items:center;gap:5px;font:700 10.5px 'IBM Plex Mono';padding:5px 11px;border-radius:20px;letter-spacing:.02em;white-space:nowrap}
.statusBadge.tone-neutral{background:#EFEDE3;color:${C.muted}}
.statusBadge.tone-success{background:#DCEBE0;color:${C.green2}}
.statusBadge.tone-warning{background:${C.goldSoft};color:#8A6A21}
.statusBadge.tone-danger{background:${C.redSoft};color:${C.red}}
.statusBadge.tone-info{background:${C.blueSoft};color:${C.blue}}

.dashCard{background:#fff;border:1px solid ${C.line};border-radius:16px;box-shadow:${C.shadow};padding:20px 22px}
.dashCardHead{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}
.dashCardTitle{display:flex;align-items:center;gap:9px;color:${C.ink}}
.dashCardTitle h3{font-size:14.5px;margin:0}
.dashCardBody{font-size:13px;color:${C.ink}}

.metricCard{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid ${C.line};border-radius:14px;padding:14px 16px}
.metricCardIcon{width:38px;height:38px;border-radius:11px;display:grid;place-items:center;background:#EAF3EB;color:${C.green2};flex:none}
.metricCard.tone-warning .metricCardIcon{background:${C.goldSoft};color:#8A6A21}
.metricCard.tone-danger .metricCardIcon{background:${C.redSoft};color:${C.red}}
.metricCard.tone-info .metricCardIcon{background:${C.blueSoft};color:${C.blue}}
.metricCard b{display:block;font-size:17px;color:${C.ink}}
.metricCard span{display:block;font-size:11px;color:${C.muted};font-weight:600}
.metricCard small{display:block;font-size:10px;color:${C.muted};margin-top:2px}

.emptyState{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:34px 20px;color:${C.muted}}
.emptyStateIcon{width:46px;height:46px;border-radius:50%;background:#EFEDE3;display:grid;place-items:center;color:${C.green2};margin-bottom:6px}
.emptyState h4{margin:0;color:${C.ink};font-size:14.5px}
.emptyState p{margin:0;font-size:12.5px;max-width:320px}

.gateWrap{display:grid;grid-template-columns:1.1fr .9fr;gap:40px;align-items:center;max-width:1080px;margin:36px auto;padding:0 20px 60px}
.gateCard{background:#fff;border:1px solid ${C.line};border-radius:22px;box-shadow:${C.shadow};padding:38px 36px}
.gateBrand{display:flex;align-items:center;gap:10px;margin-bottom:18px}
.gateBrand div{display:flex;flex-direction:column;line-height:1.15}
.gateBrand b{font:700 16px 'Fraunces';color:${C.green}}
.gateBrand small{font-size:10px;color:${C.muted};font-weight:600}
.gateRoleTag{display:inline-flex;align-items:center;gap:6px;background:${C.goldSoft};color:#8A6A21;font:700 10.5px 'IBM Plex Mono';padding:5px 11px;border-radius:20px;margin-bottom:14px}
.gateCard h1{font-family:'Fraunces';font-size:27px;line-height:1.2;color:${C.ink};margin:0 0 10px}
.gateSub{font-size:13.5px;color:${C.muted};line-height:1.6;margin:0 0 26px;max-width:420px}
.gateActions{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:22px}
.gateBtn{position:relative}
.gateNewTag{background:${C.green2};color:#fff;font-size:9px;font-weight:700;border-radius:8px;padding:2px 6px;margin-left:6px}
.gateMeta{display:flex;flex-wrap:wrap;gap:18px;margin-bottom:16px}
.linkBtn{background:none;border:none;color:${C.blue};font-size:12.5px;font-weight:600;display:inline-flex;align-items:center;gap:6px;cursor:pointer;padding:0}
.linkBtn:hover{text-decoration:underline}
.gateDemoNote{display:flex;align-items:center;gap:6px;font-size:11px;color:${C.muted};margin:0}
.gateVisual{position:relative;height:320px;display:flex;align-items:center;justify-content:center}
.gateVisualCircle{width:190px;height:190px;border-radius:50%;background:linear-gradient(160deg,${C.green},${C.green3});display:grid;place-items:center;color:#fff;box-shadow:${C.shadow}}
.gateVisualChip{position:absolute;display:flex;align-items:center;gap:7px;background:#fff;border:1px solid ${C.line};border-radius:14px;padding:9px 13px;box-shadow:${C.shadow};font-size:11.5px;font-weight:700;color:${C.ink}}
.gateVisualChip svg{color:${C.green2}}
.chipA{top:6px;left:0}
.chipB{bottom:40px;right:-6px}
.chipC{bottom:0;left:20px}
@media(max-width:820px){.gateWrap{grid-template-columns:1fr;gap:26px;margin:20px auto}.gateVisual{height:220px}.gateCard{padding:28px 22px}}

/* ============================================================
   PHASE 2 — REGISTRATION WIZARD CSS
   ============================================================ */
.regWrap{display:grid;grid-template-columns:260px 1fr;gap:0;max-width:1080px;margin:28px auto 60px;background:#fff;border:1px solid ${C.line};border-radius:20px;box-shadow:${C.shadow};overflow:hidden;min-height:560px}
.regSidebar{background:${C.cream};border-right:1px solid ${C.line};padding:26px 20px}
.regSidebarHead{display:flex;align-items:center;gap:9px;margin-bottom:20px;font:700 14px 'Fraunces';color:${C.green}}
.regProgress{margin-bottom:18px}
.regProgressBarTrack{height:6px;border-radius:6px;background:#E5E2D4;overflow:hidden;margin-bottom:6px}
.regProgressBarFill{height:100%;background:${C.green2};transition:width .3s}
.regProgress span{font-size:11px;color:${C.muted};font-weight:700}
.wizardStepper{display:flex;flex-direction:column;gap:2px}
.wizardStep{display:flex;align-items:center;gap:10px;padding:9px 8px;border-radius:10px;font-size:12px;color:${C.muted};font-weight:600}
.wizardStep.active{background:#fff;color:${C.green};box-shadow:0 2px 8px rgba(23,74,53,.08)}
.wizardStep.done{color:${C.green2}}
.wizardStepDot{width:24px;height:24px;border-radius:50%;background:#E7E3D3;display:grid;place-items:center;flex:none}
.wizardStep.done .wizardStepDot{background:#DCEBE0;color:${C.green2}}
.wizardStep.active .wizardStepDot{background:${C.green};color:#fff}
.regBody{padding:30px 34px 26px;display:flex;flex-direction:column}
.regSectionHead{margin-bottom:18px}
.regSectionHead h2{margin:0 0 4px;font:700 19px 'Fraunces';color:${C.ink}}
.regSectionHead small{color:${C.muted};font-weight:600;font-size:11.5px}
.regGrid{display:flex;flex-direction:column;gap:16px;max-width:560px}
.regGrid.two{display:grid;grid-template-columns:1fr 1fr;gap:16px 18px;max-width:640px}
.inputWithPrefix{display:flex;align-items:center;border:1px solid ${C.line};border-radius:10px;overflow:hidden}
.inputWithPrefix span{background:${C.cream};padding:10px 12px;font-weight:700;color:${C.muted};font-size:13px}
.inputWithPrefix input{border:none;flex:1}
.inputWithSuffix{display:flex;gap:8px}
.inputWithSuffix input{flex:2}
.inputWithSuffix select{flex:1}
.regHint{display:block;margin-top:6px;color:${C.muted};font-size:11.5px}
.regInlineActions{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.regMaskedPreview{font-size:12px;color:${C.muted};background:${C.cream};padding:8px 12px;border-radius:8px;grid-column:1/-1}
.regFinePrint{font-size:11px;color:${C.muted};grid-column:1/-1;display:flex;align-items:center;gap:6px}
.chipPicker{display:flex;gap:8px;flex-wrap:wrap}
.chip{border:1px solid ${C.line};background:#fff;border-radius:20px;padding:8px 14px;font-size:12.5px;font-weight:600;color:${C.ink};cursor:pointer}
.chip.active{background:${C.green};color:#fff;border-color:${C.green}}
.regDocList{display:flex;flex-direction:column;gap:10px;max-width:640px}
.regDocRow{display:flex;align-items:center;justify-content:space-between;border:1px solid ${C.line};border-radius:12px;padding:14px 16px}
.regDocRow b{display:block;font-size:13px;color:${C.ink}}
.regDocRow small{color:${C.muted};font-size:11px}
.regDocActions{display:flex;align-items:center;gap:10px}
.secondaryBtn.small{padding:7px 12px;font-size:11.5px}
.regReview{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:740px}
.regReviewRow{display:flex;justify-content:space-between;font-size:12.5px;padding:5px 0;border-bottom:1px dashed ${C.line}}
.regReviewRow span{color:${C.muted}}
.regReviewRow b{color:${C.ink};text-align:right}
.regConsentRow{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:${C.ink};max-width:560px}
.regConsentRow input{margin-top:3px}
.regFooterActions{display:flex;justify-content:space-between;align-items:center;margin-top:28px;padding-top:20px;border-top:1px solid ${C.line}}
.regFooterRight{display:flex;align-items:center;gap:18px}
.regDoneWrap{display:flex;justify-content:center;padding:50px 20px}
.regDoneCard{max-width:480px;background:#fff;border:1px solid ${C.line};border-radius:20px;box-shadow:${C.shadow};padding:36px 34px;text-align:center}
.regDoneIcon{width:56px;height:56px;border-radius:50%;background:#DCEBE0;color:${C.green2};display:grid;place-items:center;margin:0 auto 14px}
.regDoneCard h2{margin:0 0 8px;font:700 21px 'Fraunces'}
.regDoneCard p{color:${C.muted};font-size:13px;margin:0 0 20px}
.regDoneGrid{display:grid;grid-template-columns:1fr 1fr;gap:14px;text-align:left;background:${C.cream};border-radius:12px;padding:16px 18px;margin-bottom:20px}
.regDoneGrid small{display:block;color:${C.muted};font-size:10.5px;margin-bottom:3px}
.regDoneNext{text-align:left;margin-bottom:22px}
.regDoneNext ul{margin:8px 0 0;padding-left:18px;font-size:12.5px;color:${C.ink};line-height:1.7}
@media(max-width:820px){.regWrap{grid-template-columns:1fr;margin:14px auto}.regSidebar{border-right:none;border-bottom:1px solid ${C.line}}.wizardStepper{flex-direction:row;flex-wrap:wrap}.regGrid.two{grid-template-columns:1fr}.regReview{grid-template-columns:1fr}.regDoneGrid{grid-template-columns:1fr}}

/* ============================================================
   PHASE 3 — FARMER DASHBOARD SHELL CSS
   ============================================================ */
.shellWrap{display:flex;min-height:calc(100vh - 66px)}
.shellSidebar{width:250px;flex:none;background:#fff;border-right:1px solid ${C.line};display:flex;flex-direction:column;padding:20px 14px}
.shellSidebarHead{display:flex;align-items:center;gap:9px;padding:6px 8px 18px;border-bottom:1px solid ${C.line};margin-bottom:14px}
.shellSidebarHead b{display:block;font:700 14px 'Fraunces';color:${C.green}}
.shellSidebarHead small{color:${C.muted};font-size:10px;font-weight:600}
.shellNav{flex:1;overflow-y:auto}
.shellNavGroup{margin-bottom:16px}
.shellNavGroupLabel{display:block;font:700 10px 'IBM Plex Mono';color:${C.muted};letter-spacing:.06em;padding:0 10px 6px}
.shellNavItem{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 10px;border-radius:10px;font-size:13px;font-weight:600;color:${C.ink};background:none;border:none;cursor:pointer;margin-bottom:2px}
.shellNavItem:hover{background:${C.cream}}
.shellNavItem.active{background:#EAF3EB;color:${C.green}}
.shellExit{display:flex;align-items:center;gap:8px;justify-content:center;background:none;border:1px solid ${C.line};border-radius:10px;padding:10px;font-size:12px;font-weight:600;color:${C.muted};cursor:pointer}
.shellBackdrop{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:40}
.shellMain{flex:1;min-width:0;display:flex;flex-direction:column}
.shellTopbar{display:flex;align-items:center;gap:14px;padding:14px 24px;background:#fff;border-bottom:1px solid ${C.line}}
.shellMenuBtn{display:none}
.shellTopbarProfile{display:flex;align-items:center;gap:10px}
.shellAvatar{width:34px;height:34px;border-radius:50%;background:${C.goldSoft};color:#8A6A21;display:grid;place-items:center;flex:none}
.shellTopbarProfile b{display:block;font-size:13px;color:${C.ink}}
.shellTopbarProfile small{color:${C.muted};font-size:10.5px}
.shellTopbarRight{margin-left:auto;display:flex;align-items:center;gap:14px}
.shellVerifyChip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;padding:5px 10px;border-radius:16px}
.shellVerifyChip.ok{background:#DCEBE0;color:${C.green2}}
.shellVerifyChip.warn{background:${C.goldSoft};color:#8A6A21}
.shellBell{position:relative}
.shellBellDot{position:absolute;top:-4px;right:-4px;background:${C.red};color:#fff;font-size:9px;font-weight:700;border-radius:10px;min-width:16px;height:16px;display:grid;place-items:center;padding:0 3px}
.shellContent{padding:26px 30px 50px;max-width:1180px;width:100%;margin:0 auto}
@media(max-width:980px){.shellSidebar{position:fixed;top:0;left:-270px;bottom:0;z-index:50;transition:left .2s;box-shadow:${C.shadow}}.shellSidebar.open{left:0}.shellMenuBtn{display:inline-flex}.shellContent{padding:18px 16px 40px}}

.homeMetricRow{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.homeGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.homeGrid.two{grid-template-columns:1fr 1fr}
.homeNextCard{grid-column:span 3}
.nextTaskRow{display:flex;align-items:center;gap:10px;width:100%;text-align:left;background:${C.cream};border:1px solid ${C.line};border-radius:12px;padding:12px 14px;margin-bottom:8px;font-size:12.5px;font-weight:600;color:${C.ink};cursor:pointer}
.nextTaskRow:last-child{margin-bottom:0}
.nextTaskRow svg:last-child{margin-left:auto;color:${C.muted}}
.nextTaskIcon{width:28px;height:28px;border-radius:8px;background:#fff;display:grid;place-items:center;color:${C.green2};flex:none}
@media(max-width:980px){.homeMetricRow{grid-template-columns:1fr 1fr}.homeGrid{grid-template-columns:1fr}.homeGrid.two{grid-template-columns:1fr}.homeNextCard{grid-column:span 1}}

.demoLoginBox{margin-top:18px;padding:16px;border:1px solid #EADBB1;background:#FFF9E9;border-radius:12px}
.demoLoginHead{display:flex;align-items:center;gap:7px;color:#725A25;font-size:12px}
.demoLoginCreds{font-size:10.5px;color:${C.muted};line-height:1.5;margin:7px 0 11px}
.demoLoginCreds code{font:600 10px 'IBM Plex Mono';background:#fff;border:1px solid #E8DFC6;border-radius:5px;padding:2px 5px;color:${C.ink}}
.demoLoginBtn{width:100%;justify-content:center}
.shellSignOutBtn{display:inline-flex;align-items:center;gap:6px;border:1px solid #E2C5BA;background:#FFF7F4;color:${C.red};border-radius:8px;padding:8px 11px;font-size:10.5px;font-weight:700;cursor:pointer}
.shellSignOutBtn:hover{background:${C.redSoft}}
.trackerToolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.trackerSearch{width:min(390px,100%)}
.trackerFilters{display:flex;gap:6px;flex-wrap:wrap}
.trackerFilters .tab{padding:8px 10px;font-size:9.5px}
.trackerLayout{display:grid;grid-template-columns:minmax(0,1fr) minmax(360px,.9fr);gap:16px;align-items:start}
.trackerList{display:flex;flex-direction:column;gap:10px}
.goodsTrackerCard{width:100%;text-align:left;background:#fff;border:1px solid ${C.line};border-radius:14px;padding:16px;cursor:pointer;box-shadow:0 7px 22px rgba(23,74,53,.04);transition:.15s}
.goodsTrackerCard:hover{border-color:#B9CEC0;transform:translateY(-1px)}
.goodsTrackerCard.selected{border:2px solid ${C.green2};padding:15px;background:#FBFDF9}
.goodsTrackerTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.goodsTrackerIdentity{display:flex;align-items:center;gap:9px;min-width:0}
.trackerIcon{width:34px;height:34px;border-radius:9px;background:${C.blueSoft};color:${C.blue};display:grid;place-items:center;flex:none}
.goodsTrackerIdentity b,.goodsTrackerIdentity small{display:block}
.goodsTrackerIdentity b{font-size:12.5px;color:${C.ink}}
.goodsTrackerIdentity small{font-size:9.5px;color:${C.muted};margin-top:3px}
.goodsTrackerRoute{display:flex;align-items:center;gap:7px;color:${C.muted};font-size:9.5px;margin:13px 0 9px}
.goodsTrackerRoute span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.goodsTrackerRoute span:first-child{max-width:42%}
.goodsTrackerRoute span:last-child{max-width:42%}
.goodsTrackerProgress{height:5px;background:#E8EAE3;border-radius:20px;overflow:hidden}
.goodsTrackerProgress i{display:block;height:100%;background:${C.green2};border-radius:20px}
.goodsTrackerMeta{display:flex;justify-content:space-between;gap:8px;margin-top:9px;color:${C.muted};font-size:9px}
.goodsTrackerMeta span{display:flex;align-items:center;gap:4px}
.trackerDetail{position:sticky;top:18px}
.trackerHeroStatus{display:flex;align-items:center;justify-content:space-between;gap:10px;background:${C.cream};border-radius:11px;padding:13px;margin-bottom:18px}
.trackerHeroStatus span,.trackerHeroStatus b{display:block}
.trackerHeroStatus span{font-size:9px;color:${C.muted};text-transform:uppercase;letter-spacing:.05em}
.trackerHeroStatus b{font-size:18px;color:${C.green};margin-top:3px}
.trackerTimeline{display:flex;flex-direction:column;gap:0;border-left:2px solid #E6E9E1;margin:0 0 20px 8px}
.trackerTimelineStage{display:flex;gap:10px;position:relative;padding:0 0 15px 17px;color:${C.muted}}
.trackerTimelineStage>span{position:absolute;left:-10px;top:0;width:18px;height:18px;border-radius:50%;background:#fff;border:2px solid #D9DDD5;display:grid;place-items:center}
.trackerTimelineStage.done>span{border-color:${C.green2};color:${C.green2};background:#EAF3EB}
.trackerTimelineStage.active>span{box-shadow:0 0 0 4px #EAF3EB}
.trackerTimelineStage b,.trackerTimelineStage small{display:block}
.trackerTimelineStage b{font-size:11px;color:${C.ink}}
.trackerTimelineStage small{font-size:9px;margin-top:2px}
@media(max-width:900px){.trackerLayout{grid-template-columns:1fr}.trackerDetail{position:static}}
@media(max-width:700px){.trackerToolbar{align-items:stretch}.trackerFilters{overflow-x:auto;flex-wrap:nowrap;padding-bottom:3px}.trackerFilters .tab{white-space:nowrap}.goodsTrackerRoute{font-size:9px}.goodsTrackerMeta{flex-direction:column}}
.txCardList{display:flex;flex-direction:column;gap:12px}
.txHistCard{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:16px 18px;box-shadow:${C.shadow}}
.txHistTop{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px}
.txHistTop b{display:block;font-size:13.5px;color:${C.ink}}
.txHistTop small{color:${C.muted};font-size:11px}
.txHistGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 14px;border-top:1px dashed ${C.line};border-bottom:1px dashed ${C.line};padding:10px 0;margin-bottom:10px}
.txHistGrid span{display:block;font-size:10px;color:${C.muted};font-weight:700;text-transform:uppercase}
.txHistGrid b{display:block;font-size:12.5px;color:${C.ink};margin-top:2px}
.txHistFoot{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:${C.muted}}
@media(max-width:700px){.txHistGrid{grid-template-columns:1fr 1fr}}

.matchWaiting{display:flex;align-items:flex-start;gap:7px;background:#F7F6EF;border:1px dashed #D7D5C8;color:${C.muted};font-size:10.5px;line-height:1.45;border-radius:9px;padding:8px 10px;margin-top:7px}
.matchWaiting svg{flex:none;margin-top:1px;color:#8A6A21}
.passportAudit{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:18px 20px;box-shadow:${C.shadow};margin-bottom:18px}
.auditList{display:flex;flex-direction:column;gap:0;margin-top:8px}
.auditRow{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px dashed ${C.line}}
.auditRow:last-child{border-bottom:0}
.auditIcon{width:28px;height:28px;border-radius:8px;background:${C.blueSoft};color:${C.blue};display:grid;place-items:center;flex:none}
.auditRow b,.auditRow small,.auditRow em{display:block}
.auditRow b{font-size:11.5px;color:${C.ink}}
.auditRow small{font-size:9.5px;color:${C.muted};margin-top:2px}
.auditRow em{font-style:normal;font-size:9.5px;color:${C.muted};margin-top:3px}
@media(max-width:700px){.auditRow{padding:9px 0}.matchWaiting{font-size:10px}}

.notifList{display:flex;flex-direction:column;gap:6px}
.notifRow{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:1px solid ${C.line};border-radius:12px;padding:13px 16px;cursor:pointer}
.notifRow.unread{background:#F5FAF6;border-color:${C.green3}}
.notifDot{width:9px;height:9px;border-radius:50%;flex:none;background:${C.muted}}
.notifDot.tone-success{background:${C.green2}}
.notifDot.tone-error{background:${C.red}}
.notifMsg{flex:1;font-size:12.5px;color:${C.ink};font-weight:600}
.notifTime{color:${C.muted};font-size:10.5px;white-space:nowrap}

/* PHASE 5 — Industry Demand CRUD */
.demandList{display:flex;flex-direction:column;gap:12px}
.demandCard{background:#fff;border:1px solid ${C.line};border-radius:14px;padding:18px 20px;box-shadow:${C.shadow}}
.demandCardHead{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.demandCardHead b{font-size:16px;display:block}
.demandSub{display:block;font-size:10.5px;color:${C.muted};margin-top:3px}
.demandCardMeta{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}
.demandCardMeta span{display:flex;align-items:center;gap:4px;background:#F5F6F1;color:${C.muted};font-size:10.5px;padding:5px 9px;border-radius:20px}
.demandQuality{display:flex;align-items:flex-start;gap:6px;font-size:11px;color:${C.muted};background:${C.blueSoft};border-radius:8px;padding:8px 10px;margin:0 0 10px}
.demandActions{display:flex;flex-wrap:wrap;gap:7px}
.modalBackdrop{position:fixed;inset:0;background:rgba(23,35,29,.45);display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto;z-index:200}
.modalCard{max-width:640px;width:100%;margin:0}
.modalActions{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}
.recurringToggle{display:flex;align-items:center;gap:8px;font-size:12px;color:${C.ink};margin:4px 0 22px}
.recurringToggle input{width:16px;height:16px}
@media(max-width:700px){.demandCardMeta{gap:6px}.modalBackdrop{padding:0}.modalCard{border-radius:0;min-height:100vh}}
`;

export default App;