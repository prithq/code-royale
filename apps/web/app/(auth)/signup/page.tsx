"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [result, setResult] = useState<string | null>(null);

  async function handleSignup() {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      setResult(`Error: ${error.message}`);
      return;
    }

    setResult(`Success! User created: ${JSON.stringify(data)}`);
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Signup Test</h1>
      <input placeholder="name" value={name} onChange={(e) => setName(e.target.value)} />
      <br />
      <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <br />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <button onClick={handleSignup}>Sign Up</button>
      {result && <p>{result}</p>}
    </div>
  );
}