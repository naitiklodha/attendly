import { describe, expect, it } from 'vitest';
import { mergeAttendanceHistory } from '../lib/attendanceHistory';
import type { Drive, HourSlot, ParsedAttendance } from '../lib/types';

function slot(id: number, partial: Partial<HourSlot> = {}): HourSlot {
    return {
        id,
        courseRaw: 'Cloud ComputingP1 BTI Comp B1',
        courseName: 'Cloud Computing',
        typeCode: 'P1',
        lectureType: 'PRAC',
        division: 'BTI Comp B1',
        date: '2026-07-13',
        start: '10:00 AM',
        end: '11:00 AM',
        status: 'A',
        ...partial,
    };
}

function parsed(slots: HourSlot[], studentName = 'Student'): ParsedAttendance {
    const dates = slots.map((item) => item.date).sort();
    return {
        header: {
            studentName,
            studentNumber: '70322100139',
            rollNo: 'C028',
            academicYear: '2026-2027, Semester XI',
            programName: 'B.Tech',
        },
        slots,
        dateRange: { from: dates[0] ?? '', to: dates.at(-1) ?? '' },
    };
}

describe('mergeAttendanceHistory', () => {
    it('keeps stored slot data and drive assignment while appending only new slots', () => {
        const oldSlot = slot(7, { status: 'A' });
        const newSlot = slot(8, {
            date: '2026-07-14',
            start: '11:00 AM',
            end: '12:00 PM',
        });
        const oldParsed = parsed([oldSlot]);
        const incoming = parsed([
            slot(1, { status: 'P' }),
            newSlot,
        ], 'Updated Student');
        const drives: Drive[] = [
            { id: 'drive-1', company: 'TCS', description: 'Interview', rowIds: [7] },
        ];

        const result = mergeAttendanceHistory({ parsed: oldParsed, drives }, incoming);

        expect(result.parsed.slots).toHaveLength(2);
        expect(result.parsed.slots[0]).toEqual(oldSlot);
        expect(result.parsed.slots[1]).toMatchObject({
            ...newSlot,
            id: 8,
        });
        expect(result.parsed.header.studentName).toBe('Updated Student');
        expect(result.parsed.dateRange).toEqual({ from: '2026-07-13', to: '2026-07-14' });
        expect(result.drives).toEqual(drives);
    });

    it('does not duplicate slots when the same PDF is uploaded again', () => {
        const first = parsed([slot(1)]);
        const firstMerge = mergeAttendanceHistory(null, first);
        const secondMerge = mergeAttendanceHistory(firstMerge, first);

        expect(secondMerge.parsed.slots).toEqual(first.slots);
        expect(secondMerge.drives).toEqual([]);
    });

    it('assigns unseen slots IDs above every existing row ID', () => {
        const existing = parsed([slot(20)]);
        const incoming = parsed([
            slot(1, { date: '2026-07-14', start: '11:00 AM', end: '12:00 PM' }),
        ]);

        const result = mergeAttendanceHistory({ parsed: existing, drives: [] }, incoming);

        expect(result.parsed.slots.map((item) => item.id)).toEqual([20, 21]);
    });
});
