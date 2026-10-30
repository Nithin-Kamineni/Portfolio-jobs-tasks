// The NeetCode roadmap: topics in learning order and which topic unlocks which.
export const TOPICS = [
  'Arrays & Hashing', 'Two Pointers', 'Stack', 'Binary Search', 'Sliding Window', 'Linked List', 'Trees', 'Tries',
  'Heap / Priority Queue', 'Backtracking', 'Intervals', 'Greedy', 'Advanced Graphs', 'Graphs', '1-D Dynamic Programming',
  '2-D Dynamic Programming', 'Bit Manipulation', 'Math & Geometry',
];

// Grid position of each node (column, row).
export const NODES: { topic: string; x: number; y: number }[] = [
  { topic: 'Arrays & Hashing', x: 3, y: 0 },
  { topic: 'Two Pointers', x: 2, y: 1 }, { topic: 'Stack', x: 4, y: 1 },
  { topic: 'Binary Search', x: 1, y: 2 }, { topic: 'Sliding Window', x: 3, y: 2 }, { topic: 'Linked List', x: 5, y: 2 },
  { topic: 'Trees', x: 3, y: 3 },
  { topic: 'Tries', x: 1, y: 4 }, { topic: 'Heap / Priority Queue', x: 3, y: 4 }, { topic: 'Backtracking', x: 5, y: 4 },
  { topic: 'Intervals', x: 0, y: 5 }, { topic: 'Greedy', x: 1, y: 5 }, { topic: 'Graphs', x: 4, y: 5 }, { topic: '1-D Dynamic Programming', x: 6, y: 5 },
  { topic: 'Advanced Graphs', x: 2.5, y: 6 }, { topic: '2-D Dynamic Programming', x: 5, y: 6 }, { topic: 'Bit Manipulation', x: 6.5, y: 6 },
  { topic: 'Math & Geometry', x: 5.75, y: 7 },
];

export const EDGES: [string, string][] = [
  ['Arrays & Hashing', 'Two Pointers'], ['Arrays & Hashing', 'Stack'],
  ['Two Pointers', 'Binary Search'], ['Two Pointers', 'Sliding Window'], ['Two Pointers', 'Linked List'],
  ['Binary Search', 'Trees'], ['Linked List', 'Trees'],
  ['Trees', 'Tries'], ['Trees', 'Heap / Priority Queue'], ['Trees', 'Backtracking'],
  ['Heap / Priority Queue', 'Intervals'], ['Heap / Priority Queue', 'Greedy'], ['Heap / Priority Queue', 'Advanced Graphs'],
  ['Backtracking', 'Graphs'], ['Backtracking', '1-D Dynamic Programming'],
  ['Graphs', 'Advanced Graphs'], ['Graphs', '2-D Dynamic Programming'], ['Graphs', 'Math & Geometry'],
  ['1-D Dynamic Programming', '2-D Dynamic Programming'], ['1-D Dynamic Programming', 'Bit Manipulation'],
  ['Bit Manipulation', 'Math & Geometry'],
];
