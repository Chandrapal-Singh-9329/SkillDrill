import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/groqService.js";
import userModel from "../models/userModel.js";
import interviewModel from "../models/interviewModel.js";

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Resume required",
      });
    }

    const filePath = req.file.path;

    // READ PDF
    const fileBuffer = await fs.promises.readFile(filePath);

    const uint8Array = new Uint8Array(fileBuffer);

    const pdf = await pdfjsLib.getDocument({
      data: uint8Array,
    }).promise;

    // EXTRACT TEXT
    let resumeText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      const content = await page.getTextContent();

      const pageText = content.items.map((item) => item.str).join(" ");

      resumeText += pageText + "\n";
    }

    // CLEAN TEXT
    resumeText = resumeText.replace(/\s+/g, " ").trim();

    // AI PROMPT
    const messages = [
      {
        role: "system",
        content: `
            Extract structured data from the resume.

            Return ONLY valid JSON.

            Do not return markdown.
            Do not return code.
            Do not return explanations.
            Do not use triple backticks.

            Return data in this exact format:

            {
            "role": "string",
            "experience": "string",
            "projects": ["project1", "project2"],
            "skills": ["skill1", "skill2"]
            }
        `,
      },
      {
        role: "user",
        content: resumeText,
      },
    ];

    // AI RESPONSE
    const aiResponse = await askAi(messages);

    // CLEAN RESPONSE
    const cleanedResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```python/g, "")
      .replace(/```/g, "")
      .trim();

    // EXTRACT JSON
    const start = cleanedResponse.indexOf("{");

    const end = cleanedResponse.lastIndexOf("}");

    if (start === -1 || end === -1) {
      throw new Error("No valid JSON found in AI response");
    }

    const jsonString = cleanedResponse.slice(start, end + 1);

    // PARSE JSON
    const parsed = JSON.parse(jsonString);

    // DELETE FILE
    fs.unlinkSync(filePath);

    // SEND RESPONSE
    return res.status(200).json({
      success: true,
      role: parsed.role || "",
      experience: parsed.experience || "",
      projects: parsed.projects || [],
      skills: parsed.skills || [],
      resumeText,
    });
  } catch (error) {
    console.log("Resume Analyze Error:", error);

    // DELETE FILE IF ERROR
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const generateQuestion = async (req, res) => {
  try {
    // 1. ADDED: Extract jobDescription from req.body
    let {
      role,
      experience,
      mode,
      jobDescription,
      resumeText,
      projects,
      skills,
    } = req.body;

    role = role?.trim();
    experience = experience?.trim();
    mode = mode?.trim();

    if (!role || !experience || !mode) {
      return res
        .status(400)
        .json({ message: "Role, Experience and Mode are required," });
    }

    const user = await userModel.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.credits < 50) {
      return res
        .status(400)
        .json({ message: "Not enough credits. Minimum 50 required." });
    }

    const projectText =
      Array.isArray(projects) && projects.length ? projects.join(", ") : "None";

    const skillsText =
      Array.isArray(skills) && skills.length ? skills.join(", ") : "None";

    const safeResume = resumeText?.trim() || "None";

    // 2. ADDED: Safely handle Job Description
    const safeJD = jobDescription?.trim() || "None";

    const userPrompt = `
    Candidate Profile:
    - Target Role: ${role}
    - Experience Level: ${experience}
    - Interview Mode: ${mode}
    - Job Description: ${safeJD}
    - Projects: ${projectText}
    - Skills: ${skillsText}
    - Resume Details: ${safeResume}

    TASK: Generate exactly 5 interview questions based on the above profile.
    `;

    const messages = [
      {
        role: "system",
        content: `
You are an expert ${mode} interviewer. 
Your ONLY job is to generate exactly 5 interview questions based on the user's provided profile.

CRITICAL OUTPUT RULES:
- Return EXACTLY 5 lines.
- Each line must contain EXACTLY ONE question.
- DO NOT number the questions, use bullet points, or echo the profile.
- DO NOT say "Here are the questions". Just return the questions.

${mode === "HR" ? `
        - Question 1: "Tell me about yourself and your professional journey."
        - Question 2, 3, 4: Behavioral questions focusing on teamwork, leadership, and problem-solving.
        - Question 5: "Why should we hire you for this role?"
        - STRICT RULE: Do not ask technical questions.` 
        : `
        MANDATORY TECHNICAL STRUCTURE:
        - Question 1: Ask about their experience with the role: ${role}.
        - Question 2, 3, 4: Deep technical questions based on the candidate's actual Skills: ${skillsText}. 
          If skills include Java, ask Java; if Python, ask Python. Focus on core concepts, frameworks, and best practices.
        - Question 5: Ask a complex scenario or system design problem related to ${role}.
        `}

QUESTION STYLE:
- Keep language simple and conversational (15 to 25 words per question).
- Questions must be professional, practical, and tailored to the Job Description, Skills, and Projects provided.
`,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ];

    const aiResponse = await askAi(messages);

    if (!aiResponse || !aiResponse.trim()) {
      return res.status(500).json({ message: "AI returned empty response." });
    }

    const questionArray = aiResponse
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, 5);

    if (questionArray.length === 0) {
      return res
        .status(500)
        .json({ message: "AI failed to generate questions." });
    }

    user.credits -= 50;
    await user.save();

    const interview = await interviewModel.create({
      userId: user._id,
      role,
      experience,
      mode,
      resumeText: safeResume,
      questions: questionArray.map((q, index) => ({
        question: q,
        difficulty: ["easy", "easy", "medium", "medium", "hard"][index],
        timeLimit: [60, 60, 90, 90, 120][index],
      })),
    });

    res.json({
      interviewId: interview._id,
      creditsLeft: user.credits,
      userName: user.name,
      questions: interview.questions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to  create questions ${error}` });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const { interviewId, questionIndex, answer, timeTaken } = req.body;

    const interview = await interviewModel.findById(interviewId);
    const question = interview.questions[questionIndex];

    if (!answer) {
      question.score = 0;
      question.feedback = "You did not submit an answer";
      question.answer = "";

      await interview.save();

      return res.json({ feedback: question.feedback });
    }

    if (timeTaken > question.timeLimit) {
      question.score = 0;
      question.feedback = "Time limit exceeded. Answer not evaluated.";
      question.answer = answer;

      await interview.save();

      return res.json({ feedback: question.feedback });
    }

    const messages = [
      {
        role: "system",
        content: `
    You are a professional human interviewer evaluating a candidate's answer in a real interview.

    Evaluate naturally and fairly, like a real person would.

    Score the answer in these areas (0 to 10):

    1. Confidence – Does the answer sound clear, confident, and well-presented?
    2. Communication – Is the language simple, clear, and easy to understand?
    3. Correctness – Is the answer accurate, relevant, and complete?

    Rules:
    - Be realistic and unbiased.
    - Do not give random high scores.
    - If the answer is weak, score low.
    - If the answer is strong and detailed, score high.
    - Consider clarity, structure, and relevance.

    Calculate:
    finalScore = average of confidence, communication, and correctness (rounded to nearest whole number).

    Feedback Rules:
    - Write natural human feedback.
    - 10 to 15 words only.
    - Sound like real interview feedback.
    - Can suggest improvement if needed.
    - Do NOT repeat the question.
    - Do NOT explain scoring.
    - Keep tone professional and honest.

    Return ONLY valid JSON in this format:

    {
      "confidence": number,
      "communication": number,
      "correctness": number,
      "finalScore": number,
      "feedback": "short human feedback"
    }
    `,
      },
      {
        role: "user",
        content: `
        Question: ${question.question}
        Answer: ${answer}`,
      },
    ];

    const aiResponse = await askAi(messages);

    const cleanResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    console.log("CLEAN RESPONSE:");
    console.log(cleanResponse);

    const parsed = JSON.parse(cleanResponse);

    question.answer = answer;
    question.confidence = parsed.confidence;
    question.communication = parsed.communication;
    question.correctness = parsed.correctness;
    question.score = parsed.finalScore;
    question.feedback = parsed.feedback;

    await interview.save();

    return res.status(200).json({ feedback: parsed.feedback });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to submit answer ${error}` });
  }
};

export const finishInterview = async (req, res) => {
  try {
    const { interviewId } = req.body;
    const interview = await interviewModel.findById(interviewId);
    if (!interview) {
      return res.status(400).json({ message: "failed to find Interview" });
    }

    const totalQuestions = interview.questions.length;

    let totalScore = 0;
    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalScore += q.score || 0;
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const finalScore = totalQuestions ? totalScore / totalQuestions : 0;

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    interview.finalScore = finalScore;
    interview.status = "completed";

    await interview.save();

    return res.status(200).json({
      finalScore: Number(finalScore.toFixed(1)),
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions.map((q) => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || 0,
        confidence: q.confidence || 0,
        communication: q.communication || 0,
        correctness: q.correctness || 0,
      })),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to finish Interview ${error}` });
  }
};

export const getMyInterviews = async (req, res) => {
  try {
    const interviews = await interviewModel
      .find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .select("role expereince mode finalScore status createdAt");

    return res.status(200).json(interviews);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to find currentUser Interview ${error}` });
  }
};

export const getInterviewReport = async (req, res) => {
  try {
    const interview = await interviewModel.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    const totalQuestions = interview.questions.length;

    let totalConfidence = 0;
    let totalCommunication = 0;
    let totalCorrectness = 0;

    interview.questions.forEach((q) => {
      totalConfidence += q.confidence || 0;
      totalCommunication += q.communication || 0;
      totalCorrectness += q.correctness || 0;
    });

    const avgConfidence = totalQuestions ? totalConfidence / totalQuestions : 0;

    const avgCommunication = totalQuestions
      ? totalCommunication / totalQuestions
      : 0;

    const avgCorrectness = totalQuestions
      ? totalCorrectness / totalQuestions
      : 0;

    return res.json({
      finalScore: interview.finalScore,
      confidence: Number(avgConfidence.toFixed(1)),
      communication: Number(avgCommunication.toFixed(1)),
      correctness: Number(avgCorrectness.toFixed(1)),
      questionWiseScore: interview.questions,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `failed to finish currentUser Interview ${error}` });
  }
};

export const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    await interviewModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Interview deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
