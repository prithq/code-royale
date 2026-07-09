const JUDGE0_URL = process.env.JUDGE0_API_URL!;
const JUDGE0_KEY = process.env.JUDGE0_API_KEY!;

const LANGUAGE_IDS: Record<string, number> = {
  javascript: 93,
  python: 71,
  cpp: 54,
  java: 62,
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runCode(code:string,input:string,expected:string,language:string){

    const languageId=LANGUAGE_IDS[language]

    if(!languageId)
        throw new Error(`language not supported`)


    const submitRes = await fetch(
    `${JUDGE0_URL}/submissions?base64_encoded=false&wait=false`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-RapidAPI-Key": JUDGE0_KEY,
        "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
      },
      body: JSON.stringify({
        language_id: languageId,
        source_code: code,
        stdin: input,
        expected_output: expected,
      }),
    }
  );

  const { token } = await submitRes.json();

  //polling for submission
  
  for(let i=0;i<10;i++){
    await sleep(1500)

    const resultRes=await fetch(`${JUDGE0_URL}/submissions/${token}?base64_encoded=false`,
        {
            headers:{

                          "X-RapidAPI-Key": JUDGE0_KEY,
                         "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com",
            }
        }
    )

    const result=await resultRes.json()

    if(result.status.id<=2)continue

    return{
        passed:result.status.id===3,
        runtimeMs:result.time?Math.round(parseFloat(result.time)*1000):null

    }
  }

  return {passed:false,runtimeMs:null}

}



export async function runAllTestCases(
    code:string,
    language:string,
    testCases:{input:string,expected:string}[]
){


    for(const tc of testCases){
        const result=await runCode(code,tc.input,tc.expected,language)

        if(!result?.passed){
            return{passed:false,runtimeMs:result?.runtimeMs}
        }
    }
    return {passed:true,runtimeMs:null}
}