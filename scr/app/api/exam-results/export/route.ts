import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

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

    // Get exam details
    const exam = await db.exam.findUnique({
      where: { id: examId },
      include: {
        teacher: {
          select: {
            name: true
          }
        }
      }
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found' },
        { status: 404 }
      );
    }

    // Get exam results
    const results = await db.examResult.findMany({
      where: { examId },
      include: {
        student: {
          select: {
            nisn: true,
            name: true,
            class: true
          }
        }
      },
      orderBy: [
        { score: 'desc' },
        { student: { name: 'asc' } }
      ]
    });

    // Calculate statistics
    const totalStudents = results.length;
    const averageScore = totalStudents > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalStudents)
      : 0;
    const highestScore = totalStudents > 0 
      ? Math.max(...results.map(r => r.score))
      : 0;
    const lowestScore = totalStudents > 0 
      ? Math.min(...results.map(r => r.score))
      : 0;

    // Prepare data for Excel
    const excelData = [
      // Header information
      ['LAPORAN HASIL UJIAN'],
      [''],
      ['Kode Ujian:', exam.code],
      ['Judul Ujian:', exam.title],
      ['Pengajar:', exam.teacher.name],
      ['Tanggal:', new Date().toLocaleDateString('id-ID')],
      [''],
      ['STATISTIK'],
      ['Total Peserta:', totalStudents],
      ['Rata-rata:', averageScore],
      ['Nilai Tertinggi:', highestScore],
      ['Nilai Terendah:', lowestScore],
      [''],
      // Table headers
      ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Nilai', 'Benar', 'Salah', 'Grade', 'Rank'],
      // Data rows
      ...results.map((result, index) => {
        const rank = index + 1;
        const grade = getGrade(result.score);
        const wrong = result.totalQuestions - result.correctAnswers;
        
        return [
          rank,
          result.student.nisn,
          result.student.name,
          result.student.class,
          result.score,
          result.correctAnswers,
          wrong,
          grade,
          rank
        ];
      })
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 5 },  // No
      { wch: 15 }, // NISN
      { wch: 25 }, // Nama Siswa
      { wch: 10 }, // Kelas
      { wch: 8 },  // Nilai
      { wch: 8 },  // Benar
      { wch: 8 },  // Salah
      { wch: 10 }, // Grade
      { wch: 8 }   // Rank
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Hasil Ujian');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Return file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Hasil_Ujian_${exam.code}_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    });
  } catch (error) {
    console.error('Error exporting exam results:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
}