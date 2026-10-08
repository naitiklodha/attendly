import type { CourseMerges } from './subjectMerge';
import type { Drive, ParsedAttendance } from './types';
import type { HourSlot } from './types';

export interface StudentAttendanceHistory {
    parsed: ParsedAttendance;
    drives: Drive[];
    merges?: CourseMerges;
}

function slotIdentity(slot: HourSlot): string {
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
    return [
        normalize(slot.courseRaw),
        slot.date,
        normalize(slot.start),
        normalize(slot.end),
    ].join('\u001f');
}

export function mergeAttendanceHistory(
    existing: StudentAttendanceHistory | null,
    incoming: ParsedAttendance,
): StudentAttendanceHistory {
    if (!existing) return { parsed: incoming, drives: [], merges: {} };

    const slots = [...existing.parsed.slots];
    const identities = new Set(slots.map(slotIdentity));
    let nextId = slots.reduce((maxId, slot) => Math.max(maxId, slot.id), 0) + 1;

    for (const slot of incoming.slots) {
        const identity = slotIdentity(slot);
        if (identities.has(identity)) continue;
        slots.push({ ...slot, id: nextId });
        identities.add(identity);
        nextId += 1;
    }

    const dates = slots.map((slot) => slot.date).sort();
    return {
        parsed: {
            header: incoming.header,
            slots,
            dateRange: {
                from: dates[0] ?? incoming.dateRange.from,
                to: dates[dates.length - 1] ?? incoming.dateRange.to,
            },
        },
        drives: existing.drives,
        merges: existing.merges ?? {},
    };
}
