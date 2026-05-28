import fs from "fs";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { askAi } from "../services/groqService.js";

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

      const pageText = content.items
        .map((item) => item.str)
        .join(" ");

      resumeText += pageText + "\n";
    }

    // CLEAN TEXT
    resumeText = resumeText
      .replace(/\s+/g, " ")
      .trim();

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

    console.log("AI RESPONSE:", aiResponse);

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

    const jsonString = cleanedResponse.slice(
      start,
      end + 1
    );

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