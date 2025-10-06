'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Plus,
  Clock
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface ExtractedQuestion {
  questionNumber: number;
  questionText: string;
  options: string[];
}

export default function UploadExamPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form data
  const [examData, setExamData] = useState({
    code: '',
    title: '',
    description: '',
    duration: 60
  });

  // PDF file
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreview, setPdfPreview] = useState<string>('');

  // Extracted questions
  const [extractedQuestions, setExtractedQuestions] = useState<ExtractedQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  useEffect(() => {
    // Check if teacher is logged in
    const teacherData = localStorage.getItem('teacher');
    if (!teacherData) {
      router.push('/teacher/login');
      return;
    }

    const parsedTeacher = JSON.parse(teacherData);
    setTeacher(parsedTeacher);
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      setPdfPreview(file.name);
      setError('');
      setExtractedQuestions([]);
    } else {
      setError('Harap pilih file PDF yang valid');
      setPdfFile(null);
      setPdfPreview('');
    }
  };

  const extractQuestionsFromPDF = async () => {
    if (!pdfFile) {
      setError('Harap pilih file PDF terlebih dahulu');
      return;
    }

    setIsExtracting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', pdfFile);

      const response = await fetch('/api/pdf-extract', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setExtractedQuestions(data.questions);
        setSuccess(`Berhasil mengekstrak ${data.questions.length} soal dari PDF`);
      } else {
        setError(data.error || 'Gagal mengekstrak soal dari PDF');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengekstrak soal');
    } finally {
      setIsExtracting(false);
    }
  };

  const updateQuestion = (index: number, field: keyof ExtractedQuestion, value: any) => {
    const updatedQuestions = [...extractedQuestions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setExtractedQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...extractedQuestions];
    updatedQuestions[questionIndex].options.push('');
    setExtractedQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...extractedQuestions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setExtractedQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...extractedQuestions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setExtractedQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = extractedQuestions.filter((_, i) => i !== index);
    setExtractedQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacher) {
      setError('Anda harus login terlebih dahulu');
      return;
    }

    if (!examData.code || !examData.title || !pdfFile) {
      setError('Harap lengkapi semua field yang diperlukan');
      return;
    }

    if (extractedQuestions.length === 0) {
      setError('Harap ekstrak soal dari PDF terlebih dahulu');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Upload exam with PDF
      const formData = new FormData();
      formData.append('code', examData.code);
      formData.append('title', examData.title);
      formData.append('description', examData.description);
      formData.append('duration', examData.duration.toString());
      formData.append('teacherId', teacher.id);
      formData.append('pdf', pdfFile);

      const examResponse = await fetch('/api/exams', {
        method: 'POST',
        body: formData,
      });

      const examResult = await examResponse.json();

      if (!examResponse.ok) {
        throw new Error(examResult.error || 'Gagal membuat ujian');
      }

      // Upload questions
      for (const question of extractedQuestions) {
        await fetch('/api/questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            examId: examResult.id,
            questionText: question.questionText,
            options: question.options,
            questionNumber: question.questionNumber
          }),
        });
      }

      setSuccess('Ujian berhasil dibuat! Mengarahkan ke dashboard...');
      
      setTimeout(() => {
        router.push('/teacher/dashboard');
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

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
                <h1 className="text-xl font-semibold text-gray-900">Upload Soal PDF</h1>
                <p className="text-sm text-gray-600">Buat ujian baru dari file PDF</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exam Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Ujian</CardTitle>
              <CardDescription>
                Masukkan detail ujian yang akan dibuat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kode Ujian *</Label>
                  <Input
                    id="code"
                    placeholder="Contoh: MATH001"
                    value={examData.code}
                    onChange={(e) => setExamData({ ...examData, code: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Durasi (menit) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    placeholder="60"
                    value={examData.duration}
                    onChange={(e) => setExamData({ ...examData, duration: parseInt(e.target.value) || 60 })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Judul Ujian *</Label>
                <Input
                  id="title"
                  placeholder="Contoh: Ujian Matematika Semester Ganjil"
                  value={examData.title}
                  onChange={(e) => setExamData({ ...examData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang ujian (opsional)"
                  value={examData.description}
                  onChange={(e) => setExamData({ ...examData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* PDF Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload File PDF</CardTitle>
              <CardDescription>
                Upload file PDF yang berisi soal-soal ujian
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                
                <label htmlFor="pdf-upload" className="cursor-pointer">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    {pdfPreview || 'Pilih file PDF'}
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    Klik untuk memilih file atau drag and drop
                  </p>
                  <Button type="button" variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Pilih File
                  </Button>
                </label>
              </div>

              {pdfFile && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{pdfFile.name}</span>
                    <Badge variant="secondary">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </Badge>
                  </div>
                  
                  <Button
                    type="button"
                    onClick={extractQuestionsFromPDF}
                    disabled={isExtracting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Mengekstrak...
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Ekstrak Soal
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Extracted Questions */}
          {extractedQuestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Soal yang Diekstrak ({extractedQuestions.length})</CardTitle>
                <CardDescription>
                  Periksa dan edit soal yang telah diekstrak dari PDF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {extractedQuestions.map((question, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">Soal {question.questionNumber}</h4>
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingQuestion(editingQuestion === index ? null : index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeQuestion(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {editingQuestion === index ? (
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm font-medium">Pertanyaan</Label>
                            <Textarea
                              value={question.questionText}
                              onChange={(e) => updateQuestion(index, 'questionText', e.target.value)}
                              rows={2}
                            />
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium">Pilihan Jawaban</Label>
                            <div className="space-y-2 mt-2">
                              {question.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <span className="text-sm font-medium w-8">
                                    {String.fromCharCode(65 + optionIndex)}.
                                  </span>
                                  <Input
                                    value={option}
                                    onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                                    placeholder={`Pilihan ${String.fromCharCode(65 + optionIndex)}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeOption(index, optionIndex)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addOption(index)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Tambah Pilihan
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-3">{question.questionText}</p>
                          <div className="space-y-1">
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-2">
                                <span className="text-sm font-medium">
                                  {String.fromCharCode(65 + optionIndex)}.
                                </span>
                                <span className="text-sm">{option}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Link href="/teacher/dashboard">
              <Button variant="outline" type="button">
                Batal
              </Button>
            </Link>
            
            <Button
              type="submit"
              disabled={isLoading || extractedQuestions.length === 0}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Ujian'
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}