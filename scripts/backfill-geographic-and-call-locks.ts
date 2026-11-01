import fs from "fs";
for (const envFile of [".env", ".env.local"]) {
  if (fs.existsSync(envFile)) {
    const env = fs.readFileSync(envFile, "utf8");
    for (const line of env.split("\n")) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}
import { prisma } from "../src/lib/prisma";

const db = prisma as any;

function parseLocation(raw: string, leader: any) {
  const cleaned = (raw || "").trim();
  const parts = cleaned.split(/[\/,]/).map((p) => p.trim()).filter(Boolean);

  let state = "";
  let district = "";
  let part = "";

  if (parts.length >= 1) {
    const s = parts[0].toLowerCase();
    if (s === "ap" || s === "andhra" || s === "andhra pradesh") {
      state = "Andhra Pradesh";
    } else if (s === "tn" || s === "tamil nadu" || s === "tamilnadu") {
      state = "Tamil Nadu";
    } else if (s === "ts" || s === "telangana") {
      state = "Telangana";
    } else if (s === "ka" || s === "karnataka") {
      state = "Karnataka";
    } else if (s === "kl" || s === "kerala") {
      state = "Kerala";
    } else {
      state = parts[0];
    }
  }

  if (parts.length >= 2) {
    const d = parts[1].toLowerCase();
    if (d === "konaseema") district = "Konaseema";
    else if (d === "rjy" || d === "rajahmundry") district = "East Godavari (Rajahmundry)";
    else if (d === "kkd" || d === "kakinada") district = "Kakinada";
    else if (d === "krishna") district = "Krishna";
    else if (d === "chennai") district = "Chennai";
    else district = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
  }

  if (parts.length >= 3) {
    const p = parts[2].toLowerCase();
    if (p === "amp" || p === "amalapuram") part = "Amalapuram";
    else if (p === "vijayawada" || p === "vja") part = "Vijayawada";
    else part = parts[2].charAt(0).toUpperCase() + parts[2].slice(1);
  }

  // Fallbacks from leader user profile
  if (!state && leader?.state) state = leader.state;
  if (!part && leader?.part) part = leader.part;

  // Determine Zone
  let zone = leader?.zone || "South";
  if (state === "Andhra Pradesh" || state === "Tamil Nadu" || state === "Telangana" || state === "Karnataka" || state === "Kerala") {
    zone = "South";
  } else if (state === "Maharashtra" || state === "Gujarat") {
    zone = "West";
  } else if (state === "Delhi" || state === "Punjab" || state === "Uttar Pradesh") {
    zone = "North";
  } else if (state === "West Bengal" || state === "Odisha" || state === "Bihar") {
    zone = "East";
  }

  return { state, zone, district: district || "General District", part: part || "General Unit" };
}

async function backfill() {
  console.log("Starting backfill for Geographic Fields and Call Locks...");

  const sheets = await db.verificationSheet.findMany({
    include: {
      meetingReport: {
        include: { leader: true },
      },
      callAttempts: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  console.log(`Found ${sheets.length} verification sheets.`);

  for (const sheet of sheets) {
    const geo = parseLocation(sheet.stateDistrictCity, sheet.meetingReport?.leader);

    // Check answered call attempts
    const answeredAttempt = sheet.callAttempts.find(
      (a: any) => a.status === "COMPLETED" && (a.duration || 0) > 0
    );

    const isCallLocked = Boolean(answeredAttempt);
    const callLockedReason = answeredAttempt
      ? `Call answered by recipient (Call ID: ${answeredAttempt.providerCallId || answeredAttempt.providerRequestId || answeredAttempt.id}, Duration: ${answeredAttempt.duration}s)`
      : null;
    const callAnsweredAt = answeredAttempt
      ? answeredAttempt.answeredAt || answeredAttempt.createdAt
      : null;

    console.log(`Updating Sheet ID ${sheet.id} (${sheet.convenerName}):`, {
      ...geo,
      isCallLocked,
      callLockedReason,
      callAnsweredAt,
    });

    await db.verificationSheet.update({
      where: { id: sheet.id },
      data: {
        state: geo.state,
        zone: geo.zone,
        district: geo.district,
        part: geo.part,
        isCallLocked,
        callLockedReason,
        callAnsweredAt,
      },
    });
  }

  console.log("Backfill completed successfully!");
}

backfill().finally(() => prisma.$disconnect());
