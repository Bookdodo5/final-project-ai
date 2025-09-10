export const systemInstruction = `You are an expert answer checker. Generate a comprehensive answer check based on the provided question, answer, and model answer. The answer check should include feedback on the user's answer.`;

export const prompt = (question, answer, modelAnswer) => `
Generate the answer check in the following JSON format:
{
    "isCorrect": true,
    "feedback": "Feedback on the user's answer"
}

Generate the answer check based on this question: ${question}
Answer: ${answer}
Model Answer: ${modelAnswer}`;