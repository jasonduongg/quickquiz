'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';

interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

interface QuizFeedback {
    id: number;
    yourAnswer: string;
    correctAnswer: string;
}

interface QuizResult {
    correct: number;
    total: number;
    feedback: QuizFeedback[];
}

interface Quiz {
    _id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageUrl: string;
}

export default function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = use(params);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnswers, setShowAnswers] = useState(false);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const response = await fetch(`/api/quizzes/${quizId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch quiz');
                }
                const data = await response.json();
                setQuiz(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchQuiz();
    }, [quizId]);

    const handleAnswerSelect = (questionId: number, answer: string) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleNextQuestion = () => {
        if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (!quiz) return;

        try {
            const response = await fetch('/api/quizzes/grade', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quizId: quiz._id,
                    answers: selectedAnswers
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to grade quiz');
            }

            const result = await response.json();
            setQuizResult(result);
            setIsSubmitted(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-offwhite flex font-telegraf">
                <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
                    <div className="flex justify-center items-center min-h-[200px]">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-offwhite flex font-telegraf">
                <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
                    <div className="text-red-500 text-center p-4">
                        Error: {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen bg-offwhite flex font-telegraf">
                <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
                    <div className="text-center p-4 text-gray-600">
                        Quiz not found
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-offwhite flex font-telegraf">
            <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-6">
                <div className="mb-4">
                    <Link
                        href="/"
                        className="inline-flex items-center text-blue-700 hover:text-blue-800 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Quizzes
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2 text-black">{quiz.title}</h1>
                    <p className="text-gray-600">{quiz.description}</p>
                    <div className="mt-2 text-sm text-gray-500">
                        <span className="mr-4">Difficulty: {quiz.metadata.difficulty}</span>
                        <span>Created: {new Date(quiz.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>

                {!isSubmitted ? (
                    <div className="space-y-6">
                        {/* Progress Dots */}
                        <div className="flex items-center gap-3 mb-6">
                            <span className="text-sm font-medium text-gray-700">Progress:</span>
                            <div className="flex gap-2">
                                {quiz.questions.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentQuestionIndex(index)}
                                        className={`w-4 h-4 rounded-full transition-all duration-200 ${selectedAnswers[quiz.questions[index].id]
                                            ? 'bg-blue-600 scale-110'
                                            : 'bg-gray-200 hover:bg-gray-300'
                                            } ${currentQuestionIndex === index
                                                ? 'ring-2 ring-blue-400 ring-offset-1'
                                                : ''
                                            }`}
                                        aria-label={`Go to question ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium text-black">
                                    Question {currentQuestionIndex + 1} of {quiz.questions.length}
                                </h3>
                                <div className="text-sm text-gray-500">
                                    {Object.keys(selectedAnswers).length} of {quiz.questions.length} answered
                                </div>
                            </div>
                            <h3 className="text-xl font-medium mb-6 text-black">
                                {quiz.questions[currentQuestionIndex].text}
                            </h3>
                            <div className="space-y-3">
                                {quiz.questions[currentQuestionIndex].options.map((option, optionIndex) => (
                                    <label
                                        key={optionIndex}
                                        className={`flex items-center space-x-3 p-4 rounded-lg cursor-pointer transition-colors ${selectedAnswers[quiz.questions[currentQuestionIndex].id] === optionIndex.toString()
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'bg-white border-2 border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${quiz.questions[currentQuestionIndex].id}`}
                                            value={optionIndex.toString()}
                                            checked={selectedAnswers[quiz.questions[currentQuestionIndex].id] === optionIndex.toString()}
                                            onChange={() => handleAnswerSelect(quiz.questions[currentQuestionIndex].id, optionIndex.toString())}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="text-black">{String.fromCharCode(65 + optionIndex)}. {option}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between items-center">
                            <button
                                onClick={handlePreviousQuestion}
                                disabled={currentQuestionIndex === 0}
                                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {currentQuestionIndex === quiz.questions.length - 1 ? (
                                <button
                                    onClick={handleSubmit}
                                    disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
                                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    Submit Quiz
                                </button>
                            ) : (
                                <button
                                    onClick={handleNextQuestion}
                                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2 text-black">Quiz Results</h2>
                                    <p className="text-lg text-gray-700">
                                        You scored {quizResult?.correct} out of {quizResult?.total} questions correctly.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowAnswers(!showAnswers)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    {showAnswers ? (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                            Hide Answers
                                        </>
                                    ) : (
                                        <>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                            Show Answers
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {quizResult?.feedback.map((feedback) => {
                                const question = quiz.questions[feedback.id - 1];
                                const isCorrect = feedback.yourAnswer === feedback.correctAnswer;

                                return (
                                    <div
                                        key={feedback.id}
                                        className={`bg-white rounded-lg p-6 shadow-sm border-l-4 ${isCorrect ? 'border-green-500' : 'border-red-500'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="text-lg font-medium text-black">
                                                Question {feedback.id}
                                            </h3>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${isCorrect
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 mb-4">{question.text}</p>
                                        {showAnswers && (
                                            <div className="space-y-2">
                                                <p className="text-sm">
                                                    <span className="font-medium text-black">Your answer:</span>{' '}
                                                    <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                                                        {feedback.yourAnswer}
                                                    </span>
                                                </p>
                                                {!isCorrect && (
                                                    <p className="text-sm">
                                                        <span className="font-medium text-black">Correct answer:</span>{' '}
                                                        <span className="text-green-600">
                                                            {feedback.correctAnswer}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-6">
                            <Link
                                href="/"
                                className="text-blue-700 hover:text-blue-800 transition-colors"
                            >
                                ← Back to Quizzes
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 