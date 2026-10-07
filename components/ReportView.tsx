'use client';

import { creditedIds, summarize } from '@/lib/calculate';
import { formatDayLabel, formatReportDate, formatTimeRange } from '@/lib/format';
import { useApp } from '@/lib/store';
import type { CourseLine, Drive, HourSlot } from '@/lib/types';

interface Row {
  sNo: number;
  line: CourseLine;
  first: boolean;
  percentage?: number;
}

const FOOTNOTES = [
  'The overall attendance % for each course is reflected once, whereas lectures conducted/attended for Theory / Practical/Tutorial/Studio are shown in a separate row, as applicable.',
  'Please contact school Course Co-ordinator/AR/DR for any attendance-related queries within 2 days from the receipt of the report.',
  'You will be detained if you do not comply with the attendance requirement of 80% attendance in each course. You have to register afresh and repeat the Semester / Year in the subsequent Academic year as per readmission rules mentioned in the Student Resource Book.',
  'For academic-related concerns, please write to us at mpstme-mum.academics@nmims.edu with the following details to ensure prompt assistance.\nStudent SAP ID | Student Name | Student Roll No. | Name of the Program | Academic Term',
];

function buildAnnexure(drives: Drive[], slots: HourSlot[]) {
  const byId = new Map(slots.map((s) => [s.id, s]));
  const toMinutes = (t: string): number => {
    const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t);
    if (!m) return 0;
    const h = Number(m[1]) % 12;
    return (m[3] === 'PM' ? h + 12 : h) * 60 + Number(m[2]);
  };
  return drives
    .map((drive) => ({
      drive,
      hours: drive.rowIds
        .map((id) => byId.get(id))
        .filter((s): s is HourSlot => Boolean(s))
        .sort(
          (a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start),
        ),
    }))
    .filter((block) => block.hours.length > 0);
}

export default function ReportView() {
  const { state } = useApp();
  if (!state.parsed) return null;
  const { header, dateRange } = state.parsed;
  const summaries = summarize(state.parsed.slots, creditedIds(state.drives));

  const rows: Row[] = [];
  for (const summary of summaries) {
    summary.lines.forEach((line, i) => {
      rows.push({
        sNo: rows.length + 1,
        line,
        first: i === 0,
        percentage: i === 0 ? summary.percentage : undefined,
      });
    });
  }

  const th = 'border border-zinc-500 px-2 py-1.5 text-left font-bold';
  const td = 'border border-zinc-500 px-2 py-1.5 align-top';

  const annexure = buildAnnexure(state.drives, state.parsed.slots);
  const totalCredited = annexure.reduce((sum, b) => sum + b.hours.length, 0);

  return (
    <div className="report-sheet mx-auto text-zinc-900">
      <h1 className="text-center text-[13px] font-bold uppercase tracking-wide">
        Mukesh Patel School of Technology Management &amp; Engineering - Mumbai
      </h1>

      <div className="mt-8 space-y-1.5 text-[11px]">
        <p>
          <span className="inline-block w-[52mm]">Student Name:</span>
          {header.studentName}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Student Number:</span>
          {header.studentNumber}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Additional ID Number:</span>
          {header.rollNo}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Academic Year &amp; Academic Session</span>
          {header.academicYear}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Program Name:</span>
          {header.programName}
        </p>
        <p className="pt-2 font-semibold">
          Attendance Report Date: From {formatReportDate(dateRange.from)} To{' '}
          {formatReportDate(dateRange.to)}
        </p>
      </div>

      <table className="mt-6 w-full border-collapse text-[10px] leading-tight">
        <thead>
          <tr className="bg-zinc-100">
            <th className={`${th} w-[6%]`}>S.No.</th>
            <th className={`${th} w-[17%]`}>Course Name</th>
            <th className={`${th} w-[23%]`}>Division Name</th>
            <th className={`${th} w-[10%]`}>Lecture Type</th>
            <th className={`${th} w-[13%]`}>Total No. Of Classes Conducted</th>
            <th className={`${th} w-[13%]`}>Total No. Of Classes Attended</th>
            <th className={`${th} w-[12%]`}>Percentage (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.sNo}-${row.line.lectureType}`}>
              <td className={`${td} text-center`}>{row.sNo}</td>
              <td className={td}>{row.line.courseName}</td>
              <td className={td}>
                {row.line.courseRaw}
                <br />
                {row.line.division}
              </td>
              <td className={td}>{row.line.lectureType}</td>
              <td className={`${td} text-center`}>{row.line.conducted}</td>
              <td className={`${td} text-center`}>{row.line.attended}</td>
              <td className={`${td} text-center font-semibold`}>
                {row.percentage !== undefined ? row.percentage.toFixed(2) : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ol className="mt-6 list-decimal space-y-1 pl-4 text-[9.5px] leading-snug">
        {FOOTNOTES.map((note) => (
          <li key={note.slice(0, 30)}>{note}</li>
        ))}
      </ol>

      <p className="mt-6 text-[9.5px] italic">
        This is system generated attendance report and needs no signature....
      </p>

      {annexure.length > 0 && (
        <section className="page-break mt-10">
          <h2 className="text-center text-[12px] font-bold uppercase tracking-wide">
            Annexure — Placement Drive Excusals
          </h2>
          <p className="mt-3 text-[10px] leading-relaxed">
            The following {totalCredited} hour{totalCredited === 1 ? '' : 's'} were missed due to
            placement drives and are credited as present attendance in the report above.
          </p>

          {annexure.map((block, i) => (
            <div key={block.drive.id} className="mt-5">
              <p className="text-[11px] font-bold">
                Drive {i + 1} — {block.drive.company}
                <span className="ml-2 font-normal text-zinc-600">({block.hours.length} hour{block.hours.length === 1 ? '' : 's'})</span>
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-zinc-800">
                {block.drive.description}
              </p>
              <table className="mt-2 w-full border-collapse text-[9.5px]">
                <thead>
                  <tr className="bg-zinc-100">
                    <th className={`${th} w-[24%]`}>Date</th>
                    <th className={`${th} w-[26%]`}>Time Slot</th>
                    <th className={`${th} w-[32%]`}>Subject</th>
                    <th className={`${th} w-[18%]`}>Lecture Type</th>
                  </tr>
                </thead>
                <tbody>
                  {block.hours.map((hour) => (
                    <tr key={hour.id}>
                      <td className={td}>{formatDayLabel(hour.date)}</td>
                      <td className={td}>{formatTimeRange(hour.start, hour.end)}</td>
                      <td className={td}>{hour.courseName}</td>
                      <td className={td}>{hour.lectureType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
