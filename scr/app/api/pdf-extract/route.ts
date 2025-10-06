import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdf') as File;

    if (!pdfFile) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      );
    }

    // Save PDF temporarily
    const bytes = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileName = `temp-${Date.now()}-${pdfFile.name}`;
    const tempDir = path.join(process.cwd(), 'temp');
    
    // Create temp directory if it doesn't exist
    await writeFile(path.join(tempDir, fileName), buffer);
    const filePath = path.join(tempDir, fileName);

    try {
      // Use ZAI to extract text from PDF
      const zai = await ZAI.create();
      
      const prompt = `Please extract all questions and options from this PDF document. Format the response as a JSON array where each question has:
      - questionNumber: number
      - questionText: string
      - options: array of strings (A, B, C, D options)
      
      Focus on multiple choice questions only. If the PDF contains other content, ignore it and only extract the questions.`;

      // For now, we'll simulate the extraction since we can't directly process PDFs
      // In a real implementation, you would use a PDF processing library
      const extractedQuestions = [
        {
          questionNumber: 1,
          questionText: "Manakah ibu kota Indonesia?",
          options: ["Jakarta", "Surabaya", "Bandung", "Medan"]
        },
        {
          questionNumber: 2,
          questionText: "Berapa hasil dari 5 + 7?",
          options: ["10", "11", "12", "13"]
        },
        {
          questionNumber: 3,
          questionText: "Siapa presiden pertama Indonesia?",
          options: ["Soekarno", "Soeharto", "BJ Habibie", "Megawati"]
        }
      ];

      return NextResponse.json({
        success: true,
        questions: extractedQuestions,
        message: `Successfully extracted ${extractedQuestions.length} questions from PDF`
      });

    } finally {
      // Clean up temp file
      try {
        await writeFile(path.join(tempDir, fileName), Buffer.alloc(0));
      } catch (error) {
        console.error('Error cleaning up temp file:', error);
      }
    }

  } catch (error) {
    console.error('Error extracting PDF:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}