const res = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: inputValue,
  }),
});

const data = await res.json();

console.log("DATA COMING:", data); // 👈 IMPORTANT

setOutput(data.result);
