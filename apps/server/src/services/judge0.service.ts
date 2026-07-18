
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
  code: string,
  language: string,
  input: string,
  expected: string,
  harness: string
) {

 
  const JUDGE0_URL = process.env.JUDGE0_API_URL!;
  const languageId = LANGUAGE_IDS[language];
  if (!languageId) throw new Error(`Unsupported language: ${language}`);

  const fullCode = `${code}\n\n${harness}`;

  // use wait=true — synchronous, no polling needed
  const res = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
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

  const result = await res.json();
  console.log("Judge0 raw result:", JSON.stringify(result));

  return {
    passed: result.status?.id === 3,
    runtimeMs: result.time
      ? Math.round(parseFloat(result.time) * 1000)
      : null,
  };
}

export async function runAllTestCases(
  code: string,
  harness: string,
  language: string,
  testCases: { input: string; expected: string }[],
  
) {
  for (const tc of testCases) {
    const result = await runCode(code, language, tc.input, tc.expected, harness);
    if (!result.passed) {
      return { 
        passed: false, runtimeMs: result.runtimeMs 
      };
    }
  }
  return { passed: true, runtimeMs: null };
}