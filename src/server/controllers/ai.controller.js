import { GoogleGenAI } from '@google/genai';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ProjectNote } from '../models/note.model.js';

export const generateSubtasks = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    throw new ApiError(400, 'Task title is required');
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'Gemini API key is not configured');
  }

  const aiTone = req.user?.aiPreference?.tone || 'professional';
  const aiInstructions = req.user?.aiPreference?.instructions || '';

  let toneText = "professional, business-appropriate, and constructive";
  if (aiTone === 'casual') toneText = "friendly, casual, and energetic";
  if (aiTone === 'concise') toneText = "extremely short, concise, and direct (no fluff)";

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a project management assistant. Generate a list of 3-7 concrete, actionable subtasks/checklist items for a task titled "${title}" with the description "${description || ''}".
Guidelines:
- Write in a ${toneText} tone.
${aiInstructions ? `- Additional User Instructions: ${aiInstructions}` : ''}
Return ONLY a valid JSON array of strings, for example: ["Subtask 1", "Subtask 2"]. Do not wrap in markdown or write anything else.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || '';
    text = text.trim();
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }

    const subtasksList = JSON.parse(text);
    if (!Array.isArray(subtasksList)) {
      throw new Error('Response is not an array');
    }

    return res.status(200).json(
      new ApiResponse(200, subtasksList, 'Subtasks generated successfully')
    );
  } catch (error) {
    console.error("Gemini subtask generation error:", error);
    throw new ApiError(500, 'Failed to generate subtasks with AI');
  }
});

export const summarizeNotes = asyncHandler(async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    throw new ApiError(400, 'Project ID is required');
  }

  const notes = await ProjectNote.find({ project: projectId }).populate('createdBy', 'fullname');

  if (!notes || notes.length === 0) {
    return res.status(200).json(
      new ApiResponse(200, 'No notes exist for this project yet. Add some notes first!', 'No notes found to summarize')
    );
  }

  const notesCombined = notes.map((n, i) => `Note ${i + 1} (by ${n.createdBy?.fullname || 'Unknown'}): ${n.content}`).join('\n\n');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new ApiError(500, 'Gemini API key is not configured');
  }

  const aiTone = req.user?.aiPreference?.tone || 'professional';
  const aiInstructions = req.user?.aiPreference?.instructions || '';

  let toneText = "professional, business-appropriate, and constructive";
  if (aiTone === 'casual') toneText = "friendly, casual, and energetic";
  if (aiTone === 'concise') toneText = "extremely short, concise, and direct (no fluff)";

  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a project coordinator. Below are notes compiled by the project team for the project. Please summarize these notes, extract action items, assignees (if mentioned), and next steps in a beautiful, structured Markdown format. Use emojis to make it visually engaging and readable.
Guidelines:
- Write in a ${toneText} tone.
${aiInstructions ? `- Additional User Instructions: ${aiInstructions}` : ''}

Notes:
${notesCombined}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return res.status(200).json(
      new ApiResponse(200, response.text, 'Notes summarized successfully')
    );
  } catch (error) {
    console.error("Gemini note summarization error:", error);
    throw new ApiError(500, 'Failed to summarize notes with AI');
  }
});
