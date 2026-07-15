const JUDGE0_URL = process.env.JUDGE0_API_URL!;

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 63,
  python: 71,
  cpp: 54,
  java: 62,
  typescript: 74,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCode(
  playerCode: string,
  harness: string,
  language: string,
  input: string,
  expected: string
) {
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  // combine player's function + harness
  const fullCode = `${playerCode}\n\n${harness}`;

  const submitRes = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language_id: languageId,
        source_code: fullCode,
        stdin: input,
        expected_output: expected,
      }),
    }
  );

  const { token } = await submitRes.json();

  for (let i = 0; i < 10; i++) {
    await sleep(1500);

    const resultRes = await fetch(
      `${JUDGE0_URL}/submissions/${token}?base64_encoded=false`
    );
    const result = await resultRes.json();

    if (result.status.id <= 2) continue;

    return {
      passed: result.status.id === 3,
      runtimeMs: result.time
        ? Math.round(parseFloat(result.time) * 1000)
        : null,
    };
  }

  return { passed: false, runtimeMs: null };
}

export async function runAllTestCases(
  playerCode: string,
  harness: string,
  language: string,
  testCases: { input: string; expected: string }[]
) {
  for (const tc of testCases) {
    const result = await runCode(playerCode, harness, language, tc.input, tc.expected);
    if (!result.passed) {
      return { passed: false, runtimeMs: result.runtimeMs };
    }
  }
  return { passed: true, runtimeMs: null };
}