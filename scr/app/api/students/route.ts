import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const excelFile = formData.get('file') as File;

    if (!excelFile) {
      return NextResponse.json(
        { error: 'Excel file is required' },
        { status: 400 }
      );
    }

    // Read Excel file
    const buffer = await excelFile.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const students = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as any;
      
      // Try to find NISN, Nama, and Kelas columns (case insensitive)
      const nisn = row['NISN'] || row['nisn'] || row['Nisn'] || row['No. Induk'] || row['NO INDUK'];
      const name = row['Nama'] || row['nama'] || row['Nama Siswa'] || row['Siswa'];
      const studentClass = row['Kelas'] || row['kelas'] || row['CLASS'];

      if (!nisn || !name || !studentClass) {
        errors.push(`Row ${i + 1}: Missing required fields (NISN, Nama, Kelas)`);
        continue;
      }

      try {
        // Check if student already exists
        const existingStudent = await db.student.findUnique({
          where: { nisn: nisn.toString() }
        });

        if (existingStudent) {
          // Update existing student
          await db.student.update({
            where: { nisn: nisn.toString() },
            data: {
              name: name.toString(),
              class: studentClass.toString()
            }
          });
          students.push({ nisn: nisn.toString(), name: name.toString(), class: studentClass.toString(), action: 'updated' });
        } else {
          // Create new student
          await db.student.create({
            data: {
              nisn: nisn.toString(),
              name: name.toString(),
              class: studentClass.toString()
            }
          });
          students.push({ nisn: nisn.toString(), name: name.toString(), class: studentClass.toString(), action: 'created' });
        }
      } catch (error) {
        errors.push(`Row ${i + 1}: Error processing student - ${error}`);
      }
    }

    return NextResponse.json({
      message: `Successfully processed ${students.length} students`,
      students,
      errors
    });
  } catch (error) {
    console.error('Error uploading students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const students = await db.student.findMany({
      orderBy: [
        { class: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}