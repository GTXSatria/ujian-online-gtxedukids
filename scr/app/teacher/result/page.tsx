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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Search,
  Filter,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Award,
  Clock,
  FileText
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Exam {
  id: string;
  code: string;
  title: string;
  teacher: {
    name: string;
  };
  _count: {
    examResults: number;
  };
}

interface ExamResult {
  id: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  startTime: string;
  submitTime: string;
  student: {
    nisn: string;
    name: string;
    class: string;
  };
  exam: {
    code: string;
    title: string;
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');

  useEffect(() => {
    // Check if teacher is logged in
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) {
      router.push('/teacher/login');
      return;
    }

    const parsedTeacher = JSON.parse(teacherData);
    setTeacher(parsedTeacher);

    // Fetch exams and results
    fetchData();
  }, [router]);

  useEffect(() => {
    if (selectedExam) {
      fetchResults(selectedExam);
    } else {
      fetchResults();
    }
  }, [selectedExam]);

  const fetchData = async () => {
    try {
      const [examsResponse, resultsResponse] = await Promise.all([
        fetch('/api/exams'),
        fetch('/api/exam-results')
      ]);

      if (examsResponse.ok) {
        const examsData = await examsResponse.json();
        setExams(examsData);
      }

      if (resultsResponse.ok) {
        const resultsData = await resultsResponse.json();
        setResults(resultsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResults = async (examId?: string) => {
    try {
      const url = examId ? `/api/exam-results?examId=${examId}` : '/api/exam-results';
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const exportToExcel = async () => {
    if (!selectedExam) {
      setError('Pilih ujian terlebih dahulu untuk export');
      return;
    }

    setIsExporting(true);
    setError('');

    try {
      const response = await fetch(`/api/exam-results/export?examId=${selectedExam}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from response headers or create one
        const contentDisposition = response.headers.get('content-disposition');
        let filename = 'hasil_ujian.xlsx';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess('File Excel berhasil diunduh!');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal export data');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat export data');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter and sort results
  const filteredResults = results
    .filter(result => {
      const matchesSearch = result.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           result.student.nisn.includes(searchTerm) ||
                           result.student.class.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.student.name.localeCompare(b.student.name);
        case 'date':
          return new Date(b.submitTime).getTime() - new Date(a.submitTime).getTime();
        default:
          return 0;
      }
    });

  // Calculate statistics
  const stats = {
    totalParticipants: filteredResults.length,
    averageScore: filteredResults.length > 0 
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length)
      : 0,
    highestScore: filteredResults.length > 0 
      ? Math.max(...filteredResults.map(r => r.score))
      : 0,
    lowestScore: filteredResults.length > 0 
      ? Math.min(...filteredResults.map(r => r.score))
      : 0,
  };

  const getGrade = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'A', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { label: 'B', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { label: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { label: 'D', color: 'bg-orange-100 text-orange-800' };
    return { label: 'E', color: 'bg-red-100 text-red-800' };
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Award className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Award className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-orange-600" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data hasil ujian...</p>
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
                <h1 className="text-xl font-semibold text-gray-900">Hasil Ujian</h1>
                <p className="text-sm text-gray-600">Lihat dan download hasil ujian siswa</p>
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

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Hasil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="exam-select">Pilih Ujian</Label>
                <Select value={selectedExam} onValueChange={setSelectedExam}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua ujian" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua Ujian</SelectItem>
                    {exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id}>
                        {exam.code} - {exam.title} ({exam._count.examResults} peserta)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="search">Cari Siswa</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Nama, NISN, atau kelas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sort">Urutkan</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Nilai Tertinggi</SelectItem>
                    <SelectItem value="name">Nama A-Z</SelectItem>
                    <SelectItem value="date">Tanggal Terbaru</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={exportToExcel}
                disabled={isExporting || !selectedExam || filteredResults.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Mengekspor...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Excel
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        {filteredResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Peserta</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Rata-rata</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.averageScore}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tertinggi</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.highestScore}</p>
                  </div>
                  <Award className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Terendah</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.lowestScore}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Results Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Hasil Ujian</CardTitle>
            <CardDescription>
              {filteredResults.length} hasil ditemukan
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {filteredResults.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedExam ? 'Belum ada hasil untuk ujian ini' : 'Belum ada hasil ujian'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedExam 
                    ? 'Siswa belum mengerjakan ujian ini'
                    : 'Pilih ujian untuk melihat hasilnya'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Rank</TableHead>
                      <TableHead>NISN</TableHead>
                      <TableHead>Nama Siswa</TableHead>
                      <TableHead>Kelas</TableHead>
                      <TableHead>Ujian</TableHead>
                      <TableHead>Nilai</TableHead>
                      <TableHead>Benar</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Waktu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => {
                      const grade = getGrade(result.score);
                      const duration = Math.round(
                        (new Date(result.submitTime).getTime() - new Date(result.startTime).getTime()) / 60000
                      );
                      
                      return (
                        <TableRow key={result.id}>
                          <TableCell>
                            <div className="flex items-center justify-center">
                              {getRankIcon(index) || <span className="text-sm font-medium">#{index + 1}</span>}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{result.student.nisn}</TableCell>
                          <TableCell>{result.student.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{result.student.class}</Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{result.exam.code}</div>
                              <div className="text-sm text-gray-600">{result.exam.title}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-lg font-bold text-blue-600">{result.score}</div>
                          </TableCell>
                          <TableCell>
                            {result.correctAnswers}/{result.totalQuestions}
                          </TableCell>
                          <TableCell>
                            <Badge className={grade.color}>{grade.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Clock className="h-4 w-4 mr-1" />
                              {duration}m
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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