'use client';

import { creditedIds, summarize } from '@/lib/calculate';
import { formatReportDate } from '@/lib/format';
import { useApp } from '@/lib/store';
import type { CourseLine } from '@/lib/types';

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

      {/* Annexure rendered in Task 15 */}
    </div>
  );
}
