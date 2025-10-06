import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const examId = searchParams.get('examId');

    let results;

    if (examId) {
      // Get results for specific exam
      results = await db.examResult.findMany({
        where: { examId },
        include: {
          student: {
            select: {
              nisn: true,
              name: true,
              class: true
            }
          },
          exam: {
            select: {
              code: true,
              title: true
            }
          }
        },
        orderBy: [
          { score: 'desc' },
          { student: { name: 'asc' } }
        ]
      });
    } else {
      // Get all results
      results = await db.examResult.findMany({
        include: {
          student: {
            select: {
              nisn: true,
              name: true,
              class: true
            }
          },
          exam: {
            select: {
              code: true,
              title: true
            }
          }
        },
        orderBy: [
          { exam: { title: 'asc' } },
          { score: 'desc' }
        ]
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching exam results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, examId, answers, startTime } = await request.json();

    if (!studentId || !examId || !answers || !startTime) {
      return NextResponse.json(
        { error: 'Student ID, exam ID, answers, and start time are required' },
        { status: 400 }
      );
    }

    // Get exam and answer keys
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        answerKeys: true
      }
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Calculate score
    let correctAnswers = 0;
    const totalQuestions = exam.answerKeys.length;

    for (const answerKey of exam.answerKeys) {
      const studentAnswer = answers.find((a: any) => a.questionNumber === answerKey.questionNumber);
      if (studentAnswer && studentAnswer.answer === answerKey.correctAnswer) {
        correctAnswers++;
      }
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // Save exam result
    const examResult = await db.examResult.create({
      data: {
        studentId,
        examId,
        score,
        totalQuestions,
        correctAnswers,
        answers: JSON.stringify(answers),
        startTime: new Date(startTime),
        submitTime: new Date()
      }
    });

    return NextResponse.json(examResult);
  } catch (error) {
    console.error('Error submitting exam result:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}