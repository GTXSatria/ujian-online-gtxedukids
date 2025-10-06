'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  Award,
  ChevronRight,
  School,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sistem Ujian Online</h1>
                <p className="text-sm text-gray-600">Platform Pembelajaran Digital</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              v2.0
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <section className="text-center mb-16">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Selamat Datang di
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Sistem Ujian Online
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Platform modern untuk mengelola ujian online dengan fitur upload soal PDF, 
              pengolahan nilai otomatis, dan export hasil ke Excel.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Badge variant="outline" className="text-sm py-2 px-4">
                <BookOpen className="w-4 h-4 mr-2" />
                Upload Soal PDF
              </Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">
                <Users className="w-4 h-4 mr-2" />
                Manajemen Siswa
              </Badge>
              <Badge variant="outline" className="text-sm py-2 px-4">
                <Award className="w-4 h-4 mr-2" />
                Export Excel
              </Badge>
            </div>
          </div>
        </section>

        {/* User Selection Cards */}
        <section className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Pilih Jenis Pengguna
          </h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Teacher Card */}
            <Card 
              className={`relative overflow-hidden transition-all duration-300 cursor-pointer ${
                hoveredCard === 'teacher' 
                  ? 'transform scale-105 shadow-2xl border-blue-500' 
                  : 'shadow-lg hover:shadow-xl'
              }`}
              onMouseEnter={() => setHoveredCard('teacher')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 opacity-0 transition-opacity duration-300 ${
                hoveredCard === 'teacher' ? 'opacity-5' : ''
              }`} />
              
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-blue-600 to-blue-700">
                  <AvatarFallback className="text-2xl">
                    <UserCheck className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Guru
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Kelola ujian, upload soal, dan pantau hasil siswa
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                    Upload soal PDF
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                    Import data siswa (Excel)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                    Kelola kunci jawaban
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-blue-600" />
                    Download hasil ujian (Excel)
                  </div>
                </div>
                
                <Link href="/teacher/login" className="block">
                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 transition-all duration-300"
                    size="lg"
                  >
                    Masuk sebagai Guru
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Student Card */}
            <Card 
              className={`relative overflow-hidden transition-all duration-300 cursor-pointer ${
                hoveredCard === 'student' 
                  ? 'transform scale-105 shadow-2xl border-purple-500' 
                  : 'shadow-lg hover:shadow-xl'
              }`}
              onMouseEnter={() => setHoveredCard('student')}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-700 opacity-0 transition-opacity duration-300 ${
                hoveredCard === 'student' ? 'opacity-5' : ''
              }`} />
              
              <CardHeader className="text-center pb-4">
                <Avatar className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-purple-700">
                  <AvatarFallback className="text-2xl">
                    <GraduationCap className="w-10 h-10" />
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Siswa
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Ikuti ujian online dan lihat hasil
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-purple-600" />
                    Akses ujian dengan kode
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-purple-600" />
                    Timer ujian otomatis
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-purple-600" />
                    Lihat hasil langsung
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 mr-2 text-purple-600" />
                    Interface yang user-friendly
                  </div>
                </div>
                
                <Link href="/student/exam" className="block">
                  <Button 
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-3 transition-all duration-300"
                    size="lg"
                  >
                    Mulai Ujian
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-20 max-w-6xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-12">
            Fitur Unggulan
          </h3>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Soal PDF
              </h4>
              <p className="text-gray-600 text-sm">
                Upload file PDF soal ujian dan sistem akan mengekstrak pertanyaan secara otomatis
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Manajemen Siswa
              </h4>
              <p className="text-gray-600 text-sm">
                Import data siswa dari file Excel dengan mudah dan cepat
              </p>
            </Card>

            <Card className="text-center p-6 border-0 shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">
                Export Hasil Excel
              </h4>
              <p className="text-gray-600 text-sm">
                Download hasil ujian dalam format Excel dengan statistik lengkap
              </p>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              © 2024 Sistem Ujian Online. Dibuat dengan ❤️ untuk pendidikan Indonesia.
            </p>
            <p className="text-sm">
              Powered by Next.js 15 & Modern Web Technologies
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}