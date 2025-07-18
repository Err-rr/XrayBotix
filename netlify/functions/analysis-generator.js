const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const { condition } = JSON.parse(event.body);
    if (!condition) throw new Error("No condition received");

    const prompt = `
      You are a medical assistant specializing in radiology. Provide a concise yet comprehensive analysis of the condition "${condition}" detected in an X-ray image.

      Your response should include:
      1. A brief explanation of the condition (1-2 sentences)
      2. Common symptoms associated with this condition (bullet points)
      3. Recommended diagnostic tests (bullet points)
      4. Treatment options (bullet points)
      5. When to seek immediate medical attention, and the right specialist/ doctor type to see (1-2 sentence)

      Format your response in clear bulletwise points with appropriate spacing. 
      Use medical terminology but keep it understandable for patients.
      Do not include any markdown formatting.
      Be factual and cite evidence-based medicine.
      Limit the response to 200 words maximum.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return {
      statusCode: 200,
      body: JSON.stringify({ analysis: responseText }),
    };
  } catch (error) {
    console.error("Function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to generate analysis",
        details: error.message,
      }),
    };
  }
};