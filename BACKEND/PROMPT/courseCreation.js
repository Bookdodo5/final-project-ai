export const systemInstruction = `You are an expert course creator. Generate a comprehensive course structure based on the provided topic, length, and language. The course should be well-organized with modules and lessons.`;

export const prompt = (topic, language, length) => `
Create a structured course with modules and lessons based on the following parameters:

Generate the course structure in the following JSON format:
{
  "courseName": "Course Title",
  "description": "Detailed course description",
  "modules": [
    {
      "moduleName": "Module 1 Title",
      "description": "Module description",
      "contentText": "Detailed lesson content in markdown format",
      "moduleQuiz": [
        {
          "questionText": "Question text",
          "type": "mcq|open-ended|true-false",
          "options": ["Option 1", "Option 2", "Option 3"],
          "correctAnswer": "Correct answer",
          "questionOrder": 1,
          "star": 1
        }
      ]
    }
  ]
}

Make sure to:
1. Structure the content logically
2. Include practical examples and exercises
3. Ensure the content matches the specified language
4. Follow the specified length (short, medium, comprehensive)
5. Include key learning objectives for each module
6. Add relevant examples and real-world applications

Generate the course based on this topic: ${topic}
Language: ${language}
Length: ${length}
`;