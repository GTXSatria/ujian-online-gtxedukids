'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Upload, 
  Users, 
  Key, 
  BarChart3,
  LogOut,
  Plus,
  FileText,
  TrendingUp,
  Clock,
  User,
  Menu,
  X,
  Home
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
  description?: string;
  duration: number;
  createdAt: string;
  _count: {
    questions: number;
    examResults: number;
  };
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if teacher is logged in
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) {
      router.push('/teacher/login');
      return;
    }

    const parsedTeacher = JSON.parse(teacherData);
    setTeacher(parsedTeacher);

    // Fetch exams
    fetchExams();
  }, [router]);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacher');
    router.push('/');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: Home,
      href: '/teacher/dashboard',
      color: 'text-blue-600'
    },
    {
      title: 'Upload Soal PDF',
      icon: Upload,
      href: '/teacher/upload-exam',
      color: 'text-green-600'
    },
    {
      title: 'Data Siswa',
      icon: Users,
      href: '/teacher/students',
      color: 'text-purple-600'
    },
    {
      title: 'Kunci Jawaban',
      icon: Key,
      href: '/teacher/answer-keys',
      color: 'text-orange-600'
    },
    {
      title: 'Hasil Ujian',
      icon: BarChart3,
      href: '/teacher/results',
      color: 'text-red-600'
    }
  ];

  const stats = {
    totalExams: exams.length,
    totalQuestions: exams.reduce((sum, exam) => sum + exam._count.questions, 0),
    totalParticipants: exams.reduce((sum, exam) => sum + exam._count.examResults, 0),
    avgDuration: exams.length > 0 
      ? Math.round(exams.reduce((sum, exam) => sum + exam.duration, 0) / exams.length)
      : 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center space-x-3 ml-4 lg:ml-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Dashboard Guru</h1>
                  <p className="text-sm text-gray-600">Sistem Ujian Online</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {teacher?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{teacher?.name}</p>
                  <p className="text-xs text-gray-600">{teacher?.email}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-600 hover:text-red-600"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {teacher?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">{teacher?.name}</p>
                  <p className="text-xs text-gray-600">Guru</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    router.pathname === item.href
                      ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="font-medium">{item.title}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <Link
                href="/"
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Beranda</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Selamat datang kembali, {teacher?.name}! 👋
              </h2>
              <p className="text-gray-600">
                Kelola ujian dan pantau perkembangan siswa dengan mudah.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Ujian</p>
                      <p className="text-3xl font-bold">{stats.totalExams}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Soal</p>
                      <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                    </div>
                    <Plus className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Peserta</p>
                      <p className="text-3xl font-bold">{stats.totalParticipants}</p>
                    </div>
                    <Users className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Rata-rata Durasi</p>
                      <p className="text-3xl font-bold">{stats.avgDuration}m</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/teacher/upload-exam">
                  <Button className="w-full h-20 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                    <div className="flex flex-col items-center space-y-2">
                      <Upload className="h-6 w-6" />
                      <span>Upload Soal PDF</span>
                    </div>
                  </Button>
                </Link>

                <Link href="/teacher/students">
                  <Button className="w-full h-20 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                    <div className="flex flex-col items-center space-y-2">
                      <Users className="h-6 w-6" />
                      <span>Data Siswa</span>
                    </div>
                  </Button>
                </Link>

                <Link href="/teacher/answer-keys">
                  <Button className="w-full h-20 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
                    <div className="flex flex-col items-center space-y-2">
                      <Key className="h-6 w-6" />
                      <span>Kunci Jawaban</span>
                    </div>
                  </Button>
                </Link>

                <Link href="/teacher/results">
                  <Button className="w-full h-20 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                    <div className="flex flex-col items-center space-y-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>Hasil Ujian</span>
                    </div>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Recent Exams */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Ujian Terbaru</h3>
                <Link href="/teacher/results">
                  <Button variant="outline" size="sm">
                    Lihat Semua
                  </Button>
                </Link>
              </div>

              {exams.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      Belum ada ujian
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Mulai dengan mengupload soal PDF untuk ujian pertama Anda.
                    </p>
                    <Link href="/teacher/upload-exam">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Soal PDF
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams.slice(0, 6).map((exam) => (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">{exam.code}</Badge>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1" />
                            {exam.duration}m
                          </div>
                        </div>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        {exam.description && (
                          <CardDescription>{exam.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center">
                            <Plus className="h-4 w-4 mr-1" />
                            {exam._count.questions} soal
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {exam._count.examResults} peserta
                          </div>
                        </div>
                        <div className="mt-4 flex space-x-2">
                          <Link href={`/teacher/exam/${exam.id}`}>
                            <Button variant="outline" size="sm" className="flex-1">
                              Detail
                            </Button>
                          </Link>
                          <Link href={`/teacher/results?exam=${exam.id}`}>
                            <Button size="sm" className="flex-1">
                              Hasil
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}