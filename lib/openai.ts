import OpenAI from "openai"

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const AI_PROMPTS = {
  ANALYZE_JD: (company: string, role: string, jd: string) => `
    You are an expert career coach and technical recruiter.
    Analyze the following job description for the role of ${role} at ${company}.
    
    Job Description:
    ${jd.slice(0, 8000)}
    
    Output exactly in this JSON format. Do not include any other text, markdown backticks, or explanations. 
    {
      "interviewQuestions": [
        { "category": "Technical", "question": "..." },
        { "category": "Behavioral", "question": "..." }
      ],
      "skillGaps": [
        { "skill": "...", "importance": "High/Medium/Low", "reason": "..." }
      ],
      "resumeTips": [
        "Tip 1",
        "Tip 2"
      ],
      "preparationRoadmap": [
        { "week": 1, "focus": "...", "resources": ["Resource 1", "Resource 2"] }
      ]
    }
  `
}
