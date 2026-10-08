import { describe, expect, it } from 'vitest';
import {
  groupMembers,
  groupsToMerges,
  looksLikeSameSubject,
  longestCourseName,
  mergeCourseNames,
  mergesToGroups,
  normalizeSubjectName,
  sanitizeCourseMerges,
  suggestMergeGroups,
  unmergeCourseGroup,
} from '../lib/subjectMerge';

const NLP_SHORT = 'Natural Language Procsg';
const NLP_LONG = 'Natural Language Processing';

describe('normalizeSubjectName', () => {
  it('lowercases and strips punctuation', () => {
    expect(normalizeSubjectName('  Cloud  Computing! ')).toBe('cloud computing');
  });
});

describe('longestCourseName', () => {
  it('picks the longest variant', () => {
    expect(longestCourseName([NLP_SHORT, NLP_LONG])).toBe(NLP_LONG);
    expect(longestCourseName([NLP_LONG, NLP_SHORT])).toBe(NLP_LONG);
  });
});

describe('group conversion', () => {
  it('round-trips groups through the merge map', () => {
    const merges = groupsToMerges([[NLP_SHORT, NLP_LONG]]);
    expect(merges).toEqual({
      [NLP_SHORT]: NLP_LONG,
      [NLP_LONG]: NLP_LONG,
    });
    expect(mergesToGroups(merges)).toEqual([[NLP_LONG, NLP_SHORT]]);
  });

  it('drops groups that collapse to a single name', () => {
    expect(groupsToMerges([['Solo']])).toEqual({});
  });
});

describe('mergeCourseNames', () => {
  it('combines the picked names under the longest one', () => {
    const merges = mergeCourseNames({}, [NLP_SHORT, NLP_LONG]);
    expect(merges[NLP_SHORT]).toBe(NLP_LONG);
    expect(merges[NLP_LONG]).toBe(NLP_LONG);
  });

  it('pulls an existing group into a larger one and re-picks the display name', () => {
    let merges = mergeCourseNames({}, ['NLP Procsg', 'NLP']);
    expect(merges['NLP Procsg']).toBe('NLP Procsg');
    merges = mergeCourseNames(merges, ['NLP Procsg', NLP_LONG]);
    const members = groupMembers(merges, 'NLP');
    expect(members.sort()).toEqual(['NLP', 'NLP Procsg', NLP_LONG].sort());
    expect(merges['NLP']).toBe(NLP_LONG);
    expect(merges['NLP Procsg']).toBe(NLP_LONG);
  });

  it('ignores a single name', () => {
    const current = { Alpha: 'Alpha' };
    expect(mergeCourseNames(current, ['Alpha'])).toBe(current);
  });
});

describe('unmergeCourseGroup', () => {
  it('removes every member of the group', () => {
    const merges = mergeCourseNames({}, [NLP_SHORT, NLP_LONG]);
    expect(unmergeCourseGroup(merges, NLP_LONG)).toEqual({});
  });
});

describe('sanitizeCourseMerges', () => {
  it('drops names that are not in this PDF and recomputes the group', () => {
    const merges = mergeCourseNames({}, [NLP_SHORT, NLP_LONG]);
    expect(sanitizeCourseMerges(merges, [NLP_SHORT])).toEqual({});
    expect(sanitizeCourseMerges(merges, [NLP_SHORT, NLP_LONG])).toEqual(merges);
  });
});

describe('looksLikeSameSubject', () => {
  it('flags a truncated export of the same subject', () => {
    expect(looksLikeSameSubject(NLP_SHORT, NLP_LONG)).toBe(true);
    expect(looksLikeSameSubject(NLP_LONG, NLP_SHORT)).toBe(true);
  });

  it('flags names that differ only in spacing or case', () => {
    expect(looksLikeSameSubject('Cloud Computing', 'cloud  computing')).toBe(true);
  });

  it('flags a short name that is a clean prefix of a longer one', () => {
    expect(looksLikeSameSubject('Cloud Computing', 'Cloud Computing Lab')).toBe(true);
  });

  it('leaves unrelated subjects alone', () => {
    expect(looksLikeSameSubject('Cloud Computing', 'Deep Learning')).toBe(false);
    expect(looksLikeSameSubject('Data Structures', 'Data Structures and Algorithms')).toBe(false);
  });

  it('never groups very short names', () => {
    expect(looksLikeSameSubject('IoT', 'IOT Lab')).toBe(false);
  });
});

describe('suggestMergeGroups', () => {
  it('returns one group per cluster of look-alike names', () => {
    const groups = suggestMergeGroups([
      NLP_SHORT,
      NLP_LONG,
      'Cloud Computing',
      'Deep Learning',
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0].sort()).toEqual([NLP_SHORT, NLP_LONG].sort());
  });

  it('returns nothing when every name is distinct', () => {
    expect(suggestMergeGroups(['Cloud Computing', 'Deep Learning'])).toEqual([]);
  });
});
