import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { examId, questionNumber, correctAnswer } = await request.json();

    if (!examId || !questionNumber || !correctAnswer) {
      return NextResponse.json(
        { error: 'Exam ID, question number, and correct answer are required' },
        { status: 400 }
      );
    }

    // Create answer key
    const answerKey = await db.answerKey.create({
      data: {
        examId,
        questionNumber,
        correctAnswer
      }
    });

    return NextResponse.json(answerKey);
  } catch (error) {
    console.error('Error creating answer key:', error);
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

    const answerKeys = await db.answerKey.findMany({
      where: { examId },
      orderBy: { questionNumber: 'asc' }
    });

    return NextResponse.json(answerKeys);
  } catch (error) {
    console.error('Error fetching answer keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID is required' },
        { status: 400 }
      );
    }

    // Delete all answer keys for this exam
    await db.answerKey.deleteMany({
      where: { examId }
    });

    return NextResponse.json({ message: 'Answer keys deleted successfully' });
  } catch (error) {
    console.error('Error deleting answer keys:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}