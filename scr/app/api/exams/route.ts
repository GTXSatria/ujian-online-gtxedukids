import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const code = formData.get('code') as string;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const duration = parseInt(formData.get('duration') as string);
    const teacherId = formData.get('teacherId') as string;
    const pdfFile = formData.get('pdf') as File;

    if (!code || !title || !duration || !teacherId) {
      return NextResponse.json(
        { error: 'Code, title, duration, and teacherId are required' },
        { status: 400 }
      );
    }

    // Check if exam code already exists
    const existingExam = await db.exam.findUnique({
      where: { code }
    });

    if (existingExam) {
      return NextResponse.json(
        { error: 'Exam with this code already exists' },
        { status: 400 }
      );
    }

    let pdfUrl = null;

    // Handle PDF upload
    if (pdfFile) {
      const bytes = await pdfFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileName = `${Date.now()}-${pdfFile.name}`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'exams');
      
      // Create directory if it doesn't exist
      await writeFile(path.join(uploadDir, fileName), buffer);
      pdfUrl = `/uploads/exams/${fileName}`;
    }

    // Create exam
    const exam = await db.exam.create({
      data: {
        code,
        title,
        description,
        duration,
        teacherId,
        pdfUrl
      }
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const exams = await db.exam.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            questions: true,
            examResults: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}