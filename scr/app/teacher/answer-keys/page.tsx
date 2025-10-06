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
  Key, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
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
  _count: {
    questions: number;
    answerKeys: number;
  };
}

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  options: string[];
}

interface AnswerKey {
  id: string;
  questionNumber: number;
  correctAnswer: string;
}

export default function AnswerKeysPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answerKeys, setAnswerKeys] = useState<AnswerKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingAnswers, setEditingAnswers] = useState<{[key: number]: string}>({});

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

  useEffect(() => {
    if (selectedExam) {
      fetchQuestions();
      fetchAnswerKeys();
    }
  }, [selectedExam]);

  const fetchExams = async () => {
    try {
      const response = await fetch('/api/exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data);
      }
    } catch (error) {
      console.error('Error fetching exams:', error);
      setError('Gagal memuat data ujian');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`/api/questions?examId=${selectedExam}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.map((q: any) => ({
          ...q,
          options: JSON.parse(q.options)
        })));
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const fetchAnswerKeys = async () => {
    try {
      const response = await fetch(`/api/answer-keys?examId=${selectedExam}`);
      if (response.ok) {
        const data = await response.json();
        setAnswerKeys(data);
        
        // Initialize editing answers
        const initialAnswers: {[key: number]: string} = {};
        data.forEach((ak: AnswerKey) => {
          initialAnswers[ak.questionNumber] = ak.correctAnswer;
        });
        setEditingAnswers(initialAnswers);
      }
    } catch (error) {
      console.error('Error fetching answer keys:', error);
    }
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setEditingAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const saveAnswerKeys = async () => {
    if (!selectedExam) {
      setError('Pilih ujian terlebih dahulu');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // Delete existing answer keys for this exam
      await fetch(`/api/answer-keys?examId=${selectedExam}`, {
        method: 'DELETE'
      });

      // Create new answer keys
      for (const [questionNumber, correctAnswer] of Object.entries(editingAnswers)) {
        if (correctAnswer) {
          await fetch('/api/answer-keys', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              examId: selectedExam,
              questionNumber: parseInt(questionNumber),
              correctAnswer
            }),
          });
        }
      }

      setSuccess('Kunci jawaban berhasil disimpan!');
      await fetchAnswerKeys(); // Refresh answer keys
      
    } catch (error) {
      setError('Gagal menyimpan kunci jawaban');
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletionStatus = () => {
    const totalQuestions = questions.length;
    const answeredQuestions = Object.keys(editingAnswers).filter(key => 
      editingAnswers[parseInt(key)]
    ).length;
    
    return {
      total: totalQuestions,
      answered: answeredQuestions,
      percentage: totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
    };
  };

  const status = getCompletionStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data kunci jawaban...</p>
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
                <h1 className="text-xl font-semibold text-gray-900">Kunci Jawaban</h1>
                <p className="text-sm text-gray-600">Kelola kunci jawaban untuk setiap ujian</p>
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

        {/* Exam Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pilih Ujian</CardTitle>
            <CardDescription>
              Pilih ujian untuk mengatur kunci jawaban
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-md">
              <Label htmlFor="exam-select">Ujian</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih ujian..." />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      {exam.code} - {exam.title} ({exam._count.questions} soal)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedExam && (
          <>
            {/* Status Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Status Kunci Jawaban</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{status.answered}</div>
                    <div className="text-sm text-gray-600">Sudah Diisi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{status.total - status.answered}</div>
                    <div className="text-sm text-gray-600">Belum Diisi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{status.percentage}%</div>
                    <div className="text-sm text-gray-600">Kelengkapan</div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${status.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Answer Keys Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daftar Kunci Jawaban</CardTitle>
                    <CardDescription>
                      Atur kunci jawaban untuk setiap soal
                    </CardDescription>
                  </div>
                  
                  <Button
                    onClick={saveAnswerKeys}
                    disabled={isSaving || status.answered === 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Simpan Kunci Jawaban
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Belum ada soal
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload soal PDF terlebih dahulu untuk membuat kunci jawaban
                    </p>
                    <Link href="/teacher/upload-exam">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Soal PDF
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((question) => (
                      <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium mb-2">
                              Soal {question.questionNumber}
                            </h4>
                            <p className="text-sm text-gray-700 mb-3">
                              {question.questionText}
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {question.options.map((option, index) => (
                                <label 
                                  key={index}
                                  className="flex items-center space-x-2 cursor-pointer hover:bg-white p-2 rounded"
                                >
                                  <input
                                    type="radio"
                                    name={`question-${question.questionNumber}`}
                                    value={option}
                                    checked={editingAnswers[question.questionNumber] === option}
                                    onChange={(e) => handleAnswerChange(question.questionNumber, e.target.value)}
                                    className="text-blue-600"
                                  />
                                  <span className="text-sm">
                                    {String.fromCharCode(65 + index)}. {option}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          
                          {editingAnswers[question.questionNumber] && (
                            <Badge className="bg-green-100 text-green-800 ml-4">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Terisi
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}