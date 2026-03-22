const res = await fetch('/api/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    prompt: inputValue, // whatever your input state is
  }),
});

const data = await res.json();
setOutput(data.result);
