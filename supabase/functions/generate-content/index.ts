import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function GenerateInput() {
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    const { data, error } = await supabase.functions.invoke(
      "generate-content",
      {
        body: {
          prompt: inputValue
        }
      }
    );

    if (error) {
      console.error(error);
      setResult("Error generating");
    } else {
      setResult(data.result);
    }

    setLoading(false);
  };

  return (
    <div>
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Enter prompt..."
      />

      <button onClick={handleGenerate}>
        {loading ? "Generating..." : "Generate"}
      </button>

      <p>{result}</p>
    </div>
  );
}
