import axios from "axios";

export const askAi = async (messages) => {

  try {

    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.3-70b-versatile",
        messages: messages,
        temperature: 0.3, // 0.3 means less creative, very strict to instructions
        max_tokens: 1000, // Maximum words AI can generate (safety feature)
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content =
      response?.data?.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
      throw new Error("AI returned empty response");
    }

    return content;

  } catch (error) {

    console.log(
      "Groq Error:",
      error.response?.data || error.message
    );

    throw new Error(
      error.response?.data?.error?.message ||
      "Groq API Error"
    );
  }
};