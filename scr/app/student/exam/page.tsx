'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  User,
  FileText,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Exam {
  id: string;
  code: string;
  title: string;
  description?: string;
  duration: number;
}

interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  options: string[];
}

interface Answer {
  questionNumber: number;
  answer: string;
}

export default function StudentExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<'login' | 'exam' | 'result'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form
  const [loginData, setLoginData] = useState({
    name: '',
    nisn: '',
    examCode: ''
  });

  // Exam data
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{[key: number]: string}>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Result data
  const [result, setResult] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number;
  } | null>(null);

  useEffect(() => {
    if (step === 'exam' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (step === 'exam' && timeRemaining === 0) {
      submitExam();
    }
  }, [step, timeRemaining]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!loginData.name || !loginData.nisn || !loginData.examCode) {
      setError('Semua field harus diisi');
      setIsLoading(false);
      return;
    }

    try {
      // Find exam by code
      const examResponse = await fetch('/api/exams');
      if (examResponse.ok) {
        const exams = await examResponse.json();
        const foundExam = exams.find((e: Exam) => e.code === loginData.examCode);
        
        if (!foundExam) {
          setError('Kode ujian tidak ditemukan');
          setIsLoading(false);
          return;
        }

        setExam(foundExam);

        // Get questions for this exam
        const questionsResponse = await fetch(`/api/questions?examId=${foundExam.id}`);
        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          const parsedQuestions = questionsData.map((q: any) => ({
            ...q,
            options: JSON.parse(q.options)
          }));
          
          if (parsedQuestions.length === 0) {
            setError('Ujian ini belum memiliki soal');
            setIsLoading(false);
            return;
          }

          setQuestions(parsedQuestions);
          setTimeRemaining(foundExam.duration * 60); // Convert minutes to seconds
          setStartTime(new Date());
          setStep('exam');
        } else {
          setError('Gagal memuat soal');
        }
      } else {
        setError('Gagal memuat data ujian');
      }
    } catch (error) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionNumber]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const submitExam = async () => {
    if (!exam || !startTime) return;

    setIsLoading(true);
    setError('');

    try {
      // Prepare answers array
      const answersArray: Answer[] = questions.map(q => ({
        questionNumber: q.questionNumber,
        answer: answers[q.questionNumber] || ''
      }));

      // Submit exam result
      const response = await fetch('/api/exam-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: `temp-${loginData.nisn}`, // In production, create actual student record
          examId: exam.id,
          answers: answersArray,
          startTime: startTime.toISOString()
        }),
      });

      if (response.ok) {
        const resultData = await response.json();
        setResult({
          score: resultData.score,
          totalQuestions: resultData.totalQuestions,
          correctAnswers: resultData.correctAnswers
        });
        setStep('result');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Gagal menyimpan hasil ujian');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat menyimpan hasil');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const answered = Object.keys(answers).length;
    return Math.round((answered / questions.length) * 100);
  };

  const getGrade = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'A', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { label: 'B', color: 'bg-blue-100 text-blue-800' };
    if (score >= 70) return { label: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 60) return { label: 'D', color: 'bg-orange-100 text-orange-800' };
    return { label: 'E', color: 'bg-red-100 text-red-800' };
  };

  if (step === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Beranda
            </Link>
            
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Portal Ujian Siswa
            </h1>
            <p className="text-gray-600">
              Masukkan data Anda untuk memulai ujian
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Mulai Ujian</CardTitle>
              <CardDescription>
                Isi data diri Anda dengan benar
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name">Nama Lengkap *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Masukkan nama lengkap"
                      value={loginData.name}
                      onChange={(e) => setLoginData({ ...loginData, name: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nisn">NISN *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="nisn"
                      type="text"
                      placeholder="Masukkan NISN"
                      value={loginData.nisn}
                      onChange={(e) => setLoginData({ ...loginData, nisn: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="examCode">Kode Ujian *</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="examCode"
                      type="text"
                      placeholder="Masukkan kode ujian"
                      value={loginData.examCode}
                      onChange={(e) => setLoginData({ ...loginData, examCode: e.target.value.toUpperCase() })}
                      className="pl-10 uppercase"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memuat...
                    </>
                  ) : (
                    'Mulai Ujian'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-sm text-gray-600">
            <p>Pastikan Anda memiliki kode ujian yang valid</p>
            <p>Hubungi guru jika mengalami kesulitan</p>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'exam' && exam && questions.length > 0) {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = getProgress();
    const isTimeRunningOut = timeRemaining <= 300; // 5 minutes

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{exam.title}</h1>
                  <p className="text-sm text-gray-600">{loginData.name} ({loginData.nisn})</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                  isTimeRunningOut ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  <Clock className="h-4 w-4" />
                  <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                </div>
                
                <Badge variant="secondary">
                  {currentQuestionIndex + 1}/{questions.length}
                </Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Question Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {questions.map((q, index) => {
                const isAnswered = answers[q.questionNumber];
                const isCurrent = index === currentQuestionIndex;
                
                return (
                  <button
                    key={q.id}
                    onClick={() => goToQuestion(index)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white'
                        : isAnswered
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">
                Soal {currentQuestion.questionNumber}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-800 mb-6 text-lg leading-relaxed">
                {currentQuestion.questionText}
              </p>

              <RadioGroup
                value={answers[currentQuestion.questionNumber] || ''}
                onValueChange={(value) => handleAnswerChange(currentQuestion.questionNumber, value)}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 cursor-pointer text-base"
                    >
                      {String.fromCharCode(65 + index)}. {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={previousQuestion}
              disabled={currentQuestionIndex === 0}
            >
              Sebelumnya
            </Button>

            <div className="flex space-x-2">
              {currentQuestionIndex === questions.length - 1 ? (
                <Button
                  onClick={submitExam}
                  disabled={isLoading || Object.keys(answers).length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Selesaikan Ujian'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextQuestion}
                  disabled={currentQuestionIndex === questions.length - 1}
                >
                  Selanjutnya
                </Button>
              )}
            </div>
          </div>

          {isTimeRunningOut && (
            <Alert className="mt-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Waktu tinggal 5 menit lagi! Segera selesaikan ujian Anda.
              </AlertDescription>
            </Alert>
          )}
        </main>
      </div>
    );
  }

  if (step === 'result' && result) {
    const grade = getGrade(result.score);

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Ujian Selesai!
            </h1>
            <p className="text-gray-600">
              Terima kasih telah mengikuti ujian
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-xl">Hasil Ujian</CardTitle>
              <CardDescription>
                {exam?.title}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="text-center space-y-6">
              <div>
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {result.score}
                </div>
                <Badge className={grade.color} variant="secondary">
                  Grade {grade.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Jawaban Benar</div>
                  <div className="text-lg font-semibold text-green-600">
                    {result.correctAnswers}
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Total Soal</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {result.totalQuestions}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600 mb-4">
                  Simpan atau screenshot hasil ini sebagai bukti
                </p>
                
                <Link href="/" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    Kembali ke Beranda
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}