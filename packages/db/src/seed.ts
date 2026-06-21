import { prisma } from "@code-royale/db";

async function main() {
  const problems = [
    {
      title: "Two Sum",
      description:
        "Given an array of integers and a target, return the indices of the two numbers that add up to the target. Input format: first line is the array as comma-separated integers, second line is the target. Output: the two indices, space-separated.",
      category: "arrays",
      difficulty: "EASY" as const,
      testCases: [
        { input: "2,7,11,15\n9", expected: "0 1", isHidden: false },
        { input: "3,2,4\n6", expected: "1 2", isHidden: false },
        { input: "3,3\n6", expected: "0 1", isHidden: true },
      ],
    },
    {
      title: "Valid Parentheses",
      description:
        "Given a string containing only '(', ')', '{', '}', '[' and ']', determine if the input string is valid (every open bracket is closed by the same type, in the correct order). Output 'true' or 'false'.",
      category: "strings",
      difficulty: "EASY" as const,
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
        "Given the head of a singly linked list (represented as comma-separated values), reverse it and return the reversed list in the same comma-separated format.",
      category: "linked-list",
      difficulty: "EASY" as const,
      testCases: [
        { input: "1,2,3,4,5", expected: "5,4,3,2,1", isHidden: false },
        { input: "1,2", expected: "2,1", isHidden: false },
        { input: "1", expected: "1", isHidden: true },
      ],
    },
    {
      title: "Maximum Subarray",
      description:
        "Given an integer array, find the contiguous subarray with the largest sum and return that sum. Input: comma-separated integers.",
      category: "arrays",
      difficulty: "MEDIUM" as const,
      testCases: [
        { input: "-2,1,-3,4,-1,2,1,-5,4", expected: "6", isHidden: false },
        { input: "1", expected: "1", isHidden: false },
        { input: "5,4,-1,7,8", expected: "23", isHidden: true },
      ],
    },
    {
      title: "Binary Tree Level Order Traversal",
      description:
        "Given a binary tree as a comma-separated level-order array (null for missing nodes), return its level order traversal as a list of lists, formatted as semicolon-separated rows of comma-separated values.",
      category: "trees",
      difficulty: "MEDIUM" as const,
      testCases: [
        { input: "3,9,20,null,null,15,7", expected: "3;9,20;15,7", isHidden: false },
        { input: "1", expected: "1", isHidden: true },
      ],
    },
    {
      title: "Number of Islands",
      description:
        "Given an m x n grid of '1's (land) and '0's (water), return the number of islands. Input: rows separated by newlines, cells comma-separated.",
      category: "graphs",
      difficulty: "MEDIUM" as const,
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
      title: "Climbing Stairs",
      description:
        "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. Return the number of distinct ways to reach the top.",
      category: "dp",
      difficulty: "EASY" as const,
      testCases: [
        { input: "2", expected: "2", isHidden: false },
        { input: "3", expected: "3", isHidden: false },
        { input: "5", expected: "8", isHidden: true },
      ],
    },
    {
      title: "Longest Common Subsequence",
      description:
        "Given two strings, return the length of their longest common subsequence. Input: two strings on separate lines.",
      category: "dp",
      difficulty: "HARD" as const,
      testCases: [
        { input: "abcde\nace", expected: "3", isHidden: false },
        { input: "abc\nabc", expected: "3", isHidden: false },
        { input: "abc\ndef", expected: "0", isHidden: true },
      ],
    },
    {
      title: "Merge Intervals",
      description:
        "Given an array of intervals (formatted as 'start-end' comma-separated, e.g. '1-3,2-6,8-10'), merge all overlapping intervals and return the result in the same format.",
      category: "arrays",
      difficulty: "MEDIUM" as const,
      testCases: [
        { input: "1-3,2-6,8-10,15-18", expected: "1-6,8-10,15-18", isHidden: false },
        { input: "1-4,4-5", expected: "1-5", isHidden: true },
      ],
    },
    {
      title: "Word Ladder",
      description:
        "Given a beginWord, endWord, and a word list, return the length of the shortest transformation sequence from beginWord to endWord, changing one letter at a time, each intermediate word must exist in the word list. Return 0 if no such sequence exists.",
      category: "graphs",
      difficulty: "HARD" as const,
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
        category: p.category,
        difficulty: p.difficulty,
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