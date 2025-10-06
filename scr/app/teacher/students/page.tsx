'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Users, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  FileText,
  Search,
  Filter,
  RefreshCw,
  UserPlus
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Student {
  id: string;
  nisn: string;
  name: string;
  class: string;
  createdAt: string;
}

interface UploadResult {
  students: Array<{
    nisn: string;
    name: string;
    class: string;
    action: 'created' | 'updated';
  }>;
  errors: string[];
}

export default function StudentsPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');

  useEffect(() => {
    // Check if teacher is logged in
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) {
      router.push('/teacher/login');
      return;
    }

    const parsedTeacher = JSON.parse(teacherData);
    setTeacher(parsedTeacher);

    // Fetch students
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Gagal memuat data siswa');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is Excel
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setError('Harap pilih file Excel (.xlsx atau .xls)');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/students', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setUploadResult(data);
        await fetchStudents(); // Refresh student list
        
        // Reset file input
        e.target.value = '';
      } else {
        setError(data.error || 'Gagal mengupload file');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengupload file');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      ['NISN', 'Nama', 'Kelas'],
      ['1234567890', 'Ahmad Rizki', 'VII-A'],
      ['0987654321', 'Siti Nurhaliza', 'VII-B'],
      ['1122334455', 'Budi Santoso', 'VIII-A']
    ];

    // Create CSV content
    const csvContent = templateData.map(row => row.join(',')).join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_siswa.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter students based on search and class filter
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.nisn.includes(searchTerm) ||
                         student.class.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !filterClass || student.class === filterClass;
    return matchesSearch && matchesClass;
  });

  // Get unique classes for filter
  const uniqueClasses = Array.from(new Set(students.map(s => s.class))).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data siswa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/teacher/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Data Siswa</h1>
                <p className="text-sm text-gray-600">Kelola data siswa dan import dari Excel</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Import Data Siswa</CardTitle>
            <CardDescription>
              Upload file Excel untuk menambah atau memperbarui data siswa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                  Upload File Excel
                </Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    disabled={isUploading}
                  />
                  
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {isUploading ? 'Mengupload...' : 'Pilih file Excel'}
                    </p>
                    <p className="text-sm text-gray-600 mb-4">
                      Format: .xlsx atau .xls
                    </p>
                    <Button 
                      type="button" 
                      variant="outline"
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Pilih File
                        </>
                      )}
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">
                  Download Template
                </Label>
                <div className="border rounded-lg p-6 bg-gray-50">
                  <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-center text-gray-700 mb-4">
                    Download template Excel untuk format yang benar
                  </p>
                  <Button 
                    onClick={downloadTemplate}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </div>
            </div>

            {isUploading && (
              <div className="mt-4">
                <Progress value={66} className="w-full" />
                <p className="text-sm text-gray-600 mt-2">Memproses file...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Result */}
        {uploadResult && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Hasil Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-green-600 mb-2">
                    Berhasil Diproses ({uploadResult.students.length})
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {uploadResult.students.map((student, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span>{student.name} ({student.nisn})</span>
                        <Badge variant={student.action === 'created' ? 'default' : 'secondary'}>
                          {student.action === 'created' ? 'Dibuat' : 'Diperbarui'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">
                      Error ({uploadResult.errors.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Students Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Daftar Siswa</CardTitle>
                <CardDescription>
                  Total {filteredStudents.length} siswa
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchStudents}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari berdasarkan nama, NISN, atau kelas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="w-full sm:w-48">
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Semua Kelas</option>
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterClass ? 'Tidak ada siswa yang cocok' : 'Belum ada data siswa'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterClass 
                    ? 'Coba ubah filter atau kata kunci pencarian'
                    : 'Upload file Excel untuk menambah data siswa'
                  }
                </p>
                {!searchTerm && !filterClass && (
                  <Button onClick={() => document.getElementById('file-upload')?.click()}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Upload Data Siswa
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Tanggal Ditambahkan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.nisn}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{student.class}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(student.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}