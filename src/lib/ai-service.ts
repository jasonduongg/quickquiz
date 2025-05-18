import { OpenAI } from 'openai';
import { v4 as uuidv4 } from 'uuid';

export interface QuizRequest {
    topic: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    numQuestions?: number;
}

export interface QuizQuestion {
    id: number;
    text: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface QuizResponse {
    quizId: string;
    topic: string;
    questions: QuizQuestion[];
    metadata: {
        difficulty: string;
        generatedAt: string;
        modelUsed: string;
        seed: number;
    };
    imageUrl: string;
}

export class AIService {
    private client: OpenAI;
    private model: string;
    private maxTokens: number;
    private temperature: number;

    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not set in environment variables');
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Validate and set model
        this.model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
        if (!['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'].includes(this.model)) {
            console.warn(`Invalid model ${this.model}, defaulting to gpt-3.5-turbo`);
            this.model = 'gpt-3.5-turbo';
        }

        // Validate and set max tokens
        const maxTokens = parseInt(process.env.MAX_TOKENS || '2000');
        if (isNaN(maxTokens) || maxTokens <= 0) {
            console.warn('Invalid MAX_TOKENS, defaulting to 2000');
            this.maxTokens = 2000;
        } else {
            this.maxTokens = maxTokens;
        }

        // Validate and set temperature
        const temperature = parseFloat(process.env.TEMPERATURE || '0.7');
        if (isNaN(temperature) || temperature < 0 || temperature > 1) {
            console.warn('Invalid TEMPERATURE, defaulting to 0.7');
            this.temperature = 0.7;
        } else {
            this.temperature = temperature;
        }

        console.log('AIService initialized with:', {
            model: this.model,
            maxTokens: this.maxTokens,
            temperature: this.temperature
        });
    }

    private async generateQuizImage(topic: string): Promise<string> {
        try {
            console.log('Generating image for topic:', topic);
            const prompt = `Create a simple and realistic illustration about ${topic}, designed for educational use in a quiz. The image should be clean and minimal, with a light, friendly color palette. Avoid any text or words or letters, you should not try to generate any fake letters either, stick to objects only. Focus on clarity, simplicity, and fast rendering.`;

            console.log('DALL-E prompt:', prompt);
            const response = await this.client.images.generate({
                model: "dall-e-2",
                prompt: prompt,
                n: 1,
                size: "512x512"
            });
            console.log('DALL-E response:', JSON.stringify(response, null, 2));

            if (!response.data?.[0]?.url) {
                console.error('No image URL in DALL-E response:', response);
                throw new Error('No image URL received from OpenAI');
            }

            const imageUrl = response.data[0].url;
            console.log('Generated image URL:', imageUrl);
            return imageUrl;
        } catch (error) {
            console.error('Error generating quiz image:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            return 'https://placehold.co/512x512/e2e8f0/1e293b?text=Quiz+Image';
        }
    }

    private createPrompt(request: QuizRequest): { prompt: string; seed: number } {
        const seed = Math.floor(Math.random() * 1000000);
        const difficulty = request.difficulty || 'medium';
        const numQuestions = request.numQuestions || 5;

        const prompt = `Generate a ${difficulty} difficulty quiz about ${request.topic} with ${numQuestions} questions.
Random seed for variety: ${seed}

For each question, provide:
1. The question text
2. Four multiple choice options
3. The correct answer
4. A brief explanation of why the answer is correct

Format the response as a JSON object with the following structure:
{
    "topic": "string",
    "questions": [
        {
            "id": number,
            "text": "string",
            "options": ["string", "string", "string", "string"],
            "correctAnswer": "string",
            "explanation": "string"
        }
    ]
}

Ensure the questions are challenging but fair, and the explanations are clear and educational.`;

        return { prompt, seed };
    }

    async generateQuiz(request: QuizRequest): Promise<QuizResponse> {
        try {
            console.log('Starting quiz generation for topic:', request.topic);
            // Generate quiz content and image in parallel
            const [quizContent, imageUrl] = await Promise.all([
                (async () => {
                    console.log('Generating quiz content...');
                    const { prompt, seed } = this.createPrompt(request);
                    const completion = await this.client.chat.completions.create({
                        model: this.model,
                        messages: [
                            {
                                role: "system",
                                content: "You are an expert quiz generator. Generate educational and engaging quiz questions."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: this.temperature,
                        max_tokens: this.maxTokens,
                        response_format: { type: "json_object" }
                    });

                    const content = completion.choices[0].message.content;
                    if (!content) {
                        throw new Error('No content received from OpenAI');
                    }

                    const quizData = JSON.parse(content);
                    console.log('Generated quiz content:', JSON.stringify(quizData, null, 2));
                    return {
                        quizData,
                        seed
                    };
                })(),
                this.generateQuizImage(request.topic)
            ]);

            console.log('Quiz generation completed. Image URL:', imageUrl);

            const quizResponse = {
                quizId: uuidv4(),
                topic: quizContent.quizData.topic,
                questions: quizContent.quizData.questions.map((q: QuizQuestion) => ({
                    id: q.id,
                    text: q.text,
                    options: q.options,
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation
                })),
                metadata: {
                    difficulty: request.difficulty || 'medium',
                    generatedAt: new Date().toISOString(),
                    modelUsed: this.model,
                    seed: quizContent.seed
                },
                imageUrl
            };

            console.log('Final quiz response:', JSON.stringify(quizResponse, null, 2));
            return quizResponse;
        } catch (error) {
            console.error('Error generating quiz:', error);
            if (error instanceof Error) {
                console.error('Error details:', {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                });
            }
            throw new Error('Failed to generate quiz');
        }
    }
} 