const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testGemini() {
  const key = process.env.GEMINI_API_KEY;
  console.log("Using Key (prefix):", key?.substring(0, 5));
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Say hello world in JSON format: { \"msg\": \"hello world\" }");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.error("Test Error:", error);
  }
}

testGemini();
