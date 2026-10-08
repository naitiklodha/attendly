export type CourseMerges = Record<string, string>;

const MIN_NAME_LENGTH = 10;

export function normalizeSubjectName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function longestCourseName(names: string[]): string {
  return names.reduce(
    (longest, name) => (name.length > longest.length ? name : longest),
    names[0],
  );
}

export function mergesToGroups(merges: CourseMerges): string[][] {
  const groups = new Map<string, Set<string>>();
  for (const [source, display] of Object.entries(merges)) {
    if (!display) continue;
    const members = groups.get(display) ?? new Set<string>();
    members.add(display);
    members.add(source);
    groups.set(display, members);
  }
  return [...groups.values()].map((members) => [...members]);
}

export function groupsToMerges(groups: string[][]): CourseMerges {
  const merges: CourseMerges = {};
  for (const group of groups) {
    const members = [...new Set(group)].filter(Boolean);
    if (members.length < 2) continue;
    const display = longestCourseName(members);
    for (const member of members) merges[member] = display;
  }
  return merges;
}

export function mergeCourseNames(current: CourseMerges, names: string[]): CourseMerges {
  const wanted = [...new Set(names)].filter(Boolean);
  if (wanted.length < 2) return current;
  const wantedSet = new Set(wanted);
  const groups = mergesToGroups(current);
  const combined = new Set(wanted);
  for (const group of groups) {
    if (group.some((name) => wantedSet.has(name))) {
      for (const member of group) combined.add(member);
    }
  }
  const next = groups.filter((group) => !group.some((name) => wantedSet.has(name)));
  next.push([...combined]);
  return groupsToMerges(next);
}

export function unmergeCourseGroup(current: CourseMerges, display: string): CourseMerges {
  const groups = mergesToGroups(current).filter((group) => !group.includes(display));
  return groupsToMerges(groups);
}

export function sanitizeCourseMerges(
  current: CourseMerges,
  available: Iterable<string>,
): CourseMerges {
  const present = new Set(available);
  const groups = mergesToGroups(current)
    .map((group) => group.filter((name) => present.has(name)))
    .filter((group) => group.length >= 2);
  return groupsToMerges(groups);
}

export function groupMembers(merges: CourseMerges, name: string): string[] {
  const display = merges[name] ?? name;
  const members = new Set<string>([display, name]);
  for (const [source, target] of Object.entries(merges)) {
    if (target === display) members.add(source);
  }
  return [...members];
}

function commonPrefixLength(a: string, b: string): number {
  const max = Math.min(a.length, b.length);
  let i = 0;
  while (i < max && a[i] === b[i]) i += 1;
  return i;
}

export function looksLikeSameSubject(a: string, b: string): boolean {
  const left = normalizeSubjectName(a);
  const right = normalizeSubjectName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const [short, long] = left.length <= right.length ? [left, right] : [right, left];
  if (short.length < MIN_NAME_LENGTH) return false;
  if (long.startsWith(short)) {
    return long.length - short.length <= Math.max(6, Math.floor(short.length * 0.6));
  }
  const shared = commonPrefixLength(left, right);
  return shared >= MIN_NAME_LENGTH && shared >= Math.ceil(short.length * 0.8);
}

export function suggestMergeGroups(names: string[]): string[][] {
  const pending = [...new Set(names)].filter(Boolean);
  const adjacency = new Map<string, Set<string>>();
  for (const name of pending) adjacency.set(name, new Set());
  for (let i = 0; i < pending.length; i += 1) {
    for (let j = i + 1; j < pending.length; j += 1) {
      if (!looksLikeSameSubject(pending[i], pending[j])) continue;
      adjacency.get(pending[i])!.add(pending[j]);
      adjacency.get(pending[j])!.add(pending[i]);
    }
  }

  const seen = new Set<string>();
  const groups: string[][] = [];
  for (const name of pending) {
    if (seen.has(name)) continue;
    const component: string[] = [];
    const stack = [name];
    seen.add(name);
    while (stack.length > 0) {
      const current = stack.pop()!;
      component.push(current);
      for (const next of adjacency.get(current) ?? []) {
        if (seen.has(next)) continue;
        seen.add(next);
        stack.push(next);
      }
    }
    if (component.length > 1) groups.push(component);
  }
  return groups;
}
