import { prisma } from "@code-royale/db";

async function main() {
  const problems = [
    {
      title: "Two Sum",
      description:
        "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Your function should be named twoSum(nums, target) where nums is an array of numbers and target is a number. Return an array of two indices.",
      categories: ["arrays"],
      difficulty: "EASY" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const parts = input.trim().split('\\n');
  const nums = parts[0].split(',').map(Number);
  const target = Number(parts[1]);
  const result = twoSum(nums, target);
  console.log(result.join(' '));
});`,
      testCases: [
        { input: "2,7,11,15\n9", expected: "0 1", isHidden: false },
        { input: "3,2,4\n6", expected: "1 2", isHidden: false },
        { input: "3,3\n6", expected: "0 1", isHidden: true },
      ],
    },
    {
      title: "Valid Parentheses",
      description:
        "Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Every open bracket must be closed by the same type in the correct order. Your function should be named isValid(s) where s is a string. Return true or false.",
      categories: ["strings"],
      difficulty: "EASY" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const result = isValid(input.trim());
  console.log(result.toString());
});`,
      testCases: [
        { input: "()", expected: "true", isHidden: false },
        { input: "()[]{}", expected: "true", isHidden: false },
        { input: "(]", expected: "false", isHidden: false },
        { input: "([)]", expected: "false", isHidden: true },
      ],
    },
    {
      title: "Reverse Linked List",
      description:
        "Given a linked list represented as an array of numbers, reverse it and return the reversed array. Your function should be named reverseList(nums) where nums is an array of numbers. Return the reversed array.",
      categories: ["linked-list"],
      difficulty: "EASY" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const nums = input.trim().split(',').map(Number);
  const result = reverseList(nums);
  process.stdout.write(result.join(','));
});`,
      testCases: [
        { input: "1,2,3,4,5", expected: "5,4,3,2,1", isHidden: false },
        { input: "1,2", expected: "2,1", isHidden: false },
        { input: "1", expected: "1", isHidden: true },
      ],
    },
    {
      title: "Maximum Subarray",
      description:
        "Given an integer array, find the contiguous subarray with the largest sum and return that sum. Your function should be named maxSubArray(nums) where nums is an array of numbers. Return a number.",
      categories: ["arrays"],
      difficulty: "MEDIUM" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const nums = input.trim().split(',').map(Number);
  console.log(maxSubArray(nums));
});`,
      testCases: [
        { input: "-2,1,-3,4,-1,2,1,-5,4", expected: "6", isHidden: false },
        { input: "1", expected: "1", isHidden: false },
        { input: "5,4,-1,7,8", expected: "23", isHidden: true },
      ],
    },
    {
      title: "Climbing Stairs",
      description:
        "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top. Your function should be named climbStairs(n) where n is a number. Return a number.",
      categories: ["dp"],
      difficulty: "EASY" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  console.log(climbStairs(Number(input.trim())));
});`,
      testCases: [
        { input: "2", expected: "2", isHidden: false },
        { input: "3", expected: "3", isHidden: false },
        { input: "5", expected: "8", isHidden: true },
      ],
    },
    {
      title: "Number of Islands",
      description:
        "Given an m x n grid of '1's (land) and '0's (water), return the number of islands. Your function should be named numIslands(grid) where grid is a 2D array of strings ('1' or '0'). Return a number.",
      categories: ["graphs"],
      difficulty: "MEDIUM" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const grid = input.trim().split('\\n').map(row => row.split(','));
  console.log(numIslands(grid));
});`,
      testCases: [
        {
          input: "1,1,1,1,0\n1,1,0,1,0\n1,1,0,0,0\n0,0,0,0,0",
          expected: "1",
          isHidden: false,
        },
        {
          input: "1,1,0,0,0\n1,1,0,0,0\n0,0,1,0,0\n0,0,0,1,1",
          expected: "3",
          isHidden: true,
        },
      ],
    },
    {
      title: "Longest Common Subsequence",
      description:
        "Given two strings, return the length of their longest common subsequence. Your function should be named longestCommonSubsequence(text1, text2) where both are strings. Return a number.",
      categories: ["dp"],
      difficulty: "HARD" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const parts = input.trim().split('\\n');
  console.log(longestCommonSubsequence(parts[0], parts[1]));
});`,
      testCases: [
        { input: "abcde\nace", expected: "3", isHidden: false },
        { input: "abc\nabc", expected: "3", isHidden: false },
        { input: "abc\ndef", expected: "0", isHidden: true },
      ],
    },
    {
      title: "Merge Intervals",
      description:
        "Given an array of intervals where each interval is [start, end], merge all overlapping intervals. Your function should be named merge(intervals) where intervals is a 2D array. Return a 2D array of merged intervals.",
      categories: ["arrays"],
      difficulty: "MEDIUM" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const intervals = input.trim().split(',').map(s => s.split('-').map(Number));
  const result = merge(intervals);
  console.log(result.map(i => i.join('-')).join(','));
});`,
      testCases: [
        { input: "1-3,2-6,8-10,15-18", expected: "1-6,8-10,15-18", isHidden: false },
        { input: "1-4,4-5", expected: "1-5", isHidden: true },
      ],
    },
    {
      title: "Binary Tree Level Order Traversal",
      description:
        "Given a binary tree represented as a level-order array (null for missing nodes), return its level order traversal as a 2D array. Your function should be named levelOrder(vals) where vals is an array of numbers/nulls. Return a 2D array of numbers.",
      categories: ["trees"],
      difficulty: "MEDIUM" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const vals = input.trim().split(',').map(v => v === 'null' ? null : Number(v));
  console.log(levelOrder(vals).map(row => row.join(',')).join(';'));
});`,
      testCases: [
        { input: "3,9,20,null,null,15,7", expected: "3;9,20;15,7", isHidden: false },
        { input: "1", expected: "1", isHidden: true },
      ],
    },
    {
      title: "Word Ladder",
      description:
        "Given a beginWord, endWord, and a word list, return the length of the shortest transformation sequence from beginWord to endWord changing one letter at a time. Each intermediate word must exist in the word list. Return 0 if no sequence exists. Your function should be named ladderLength(beginWord, endWord, wordList).",
      categories: ["graphs"],
      difficulty: "HARD" as const,
      harness: `
const lines = process.stdin.resume().setEncoding('utf8');
let input = '';
lines.on('data', d => input += d);
lines.on('end', () => {
  const parts = input.trim().split('\\n');
  const beginWord = parts[0];
  const endWord = parts[1];
  const wordList = parts[2].split(',');
  console.log(ladderLength(beginWord, endWord, wordList));
});`,
      testCases: [
        {
          input: "hit\ncog\nhot,dot,dog,lot,log,cog",
          expected: "5",
          isHidden: false,
        },
        {
          input: "hit\ncog\nhot,dot,dog,lot,log",
          expected: "0",
          isHidden: true,
        },
      ],
    },
  ];

  for (const p of problems) {
    await prisma.problem.create({
      data: {
        title: p.title,
        description: p.description,
        categories: p.categories,
        difficulty: p.difficulty,
        harness: p.harness,
        testCases: {
          create: p.testCases,
        },
      },
    });
    console.log(`Seeded: ${p.title}`);
  }

  console.log(`\nDone — ${problems.length} problems seeded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });