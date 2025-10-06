import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { examId, questionText, options, questionNumber } = await request.json();

    if (!examId || !questionText || !options || !questionNumber) {
      return NextResponse.json(
        { error: 'Exam ID, question text, options, and question number are required' },
        { status: 400 }
      );
    }

    // Create question
    const question = await db.question.create({
      data: {
        examId,
        questionText,
        options: JSON.stringify(options),
        questionNumber
      }
    });

    return NextResponse.json(question);
  } catch (error) {
    console.error('Error creating question:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    const questions = await db.question.findMany({
      where: { examId },
      orderBy: { questionNumber: 'asc' }
    });

    return NextResponse.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}