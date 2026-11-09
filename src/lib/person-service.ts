import { prisma } from "@/lib/prisma";

export interface FindOrCreatePersonParams {
  personId?: string | null;
  name?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
}

/**
 * Finds or creates a MeetingPerson record without creating unwanted duplicates.
 */
export async function findOrCreateMeetingPerson({
  personId,
  name,
  phoneNumber,
  notes,
}: FindOrCreatePersonParams) {
  const db = prisma as any;

  // 1. If explicit personId is given, search by ID first
  if (personId && typeof personId === "string" && personId.trim()) {
    const existing = await db.meetingPerson.findUnique({
      where: { id: personId.trim() },
    });
    if (existing) {
      // Optionally update notes or phone if newly provided
      if ((phoneNumber && !existing.phoneNumber) || (notes && !existing.notes)) {
        return await db.meetingPerson.update({
          where: { id: existing.id },
          data: {
            phoneNumber: existing.phoneNumber || phoneNumber?.trim() || null,
            notes: existing.notes || notes?.trim() || null,
          },
        });
      }
      return existing;
    }
  }

  // 2. Validate clean name
  const cleanName = (name || "").trim();
  if (!cleanName) {
    return null;
  }

  const cleanPhone = (phoneNumber || "").trim() || null;
  const cleanNotes = (notes || "").trim() || null;

  // 3. Match by name & phone or exact name
  let matchedPerson = null;

  if (cleanPhone) {
    matchedPerson = await db.meetingPerson.findFirst({
      where: {
        AND: [
          { name: { equals: cleanName, mode: "insensitive" } },
          { phoneNumber: { equals: cleanPhone, mode: "insensitive" } },
        ],
      },
    });
  }

  if (!matchedPerson) {
    matchedPerson = await db.meetingPerson.findFirst({
      where: {
        name: { equals: cleanName, mode: "insensitive" },
      },
    });
  }

  if (matchedPerson) {
    // Update phone if it was empty previously
    if (cleanPhone && !matchedPerson.phoneNumber) {
      matchedPerson = await db.meetingPerson.update({
        where: { id: matchedPerson.id },
        data: {
          phoneNumber: cleanPhone,
          notes: cleanNotes || matchedPerson.notes,
        },
      });
    }
    return matchedPerson;
  }

  // 4. Create new person record with unique ID
  return await db.meetingPerson.create({
    data: {
      name: cleanName,
      phoneNumber: cleanPhone,
      notes: cleanNotes,
    },
  });
}

