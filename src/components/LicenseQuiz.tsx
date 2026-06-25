import { useState } from 'react';
import { pickQuizQuestions } from '../game/events/drivers';
import type { QuizQuestion } from '../game/events/drivers';

const PASS_SCORE = 8;

export function LicenseQuiz({ onComplete }: { onComplete: (score: number, passed: boolean) => void }) {
  const [questions] = useState<QuizQuestion[]>(pickQuizQuestions);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const score = answers.reduce((sum, choiceIndex, i) => sum + (choiceIndex === questions[i].correctIndex ? 1 : 0), 0);
  const passed = score >= PASS_SCORE;

  const selectAnswer = (choiceIndex: number) => {
    const nextAnswers = [...answers, choiceIndex];
    setAnswers(nextAnswers);
    if (currentIndex + 1 >= questions.length) {
      setSubmitted(true);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  if (submitted) {
    return (
      <div className="quiz-result">
        <p className={`quiz-score ${passed ? 'pass' : 'fail'}`}>{score}/10</p>
        <p className="death-note">
          {passed
            ? "You passed! You've earned your driver's license."
            : `You needed ${PASS_SCORE}/10 to pass. Better luck next time.`}
        </p>
        <button className="primary-btn" onClick={() => onComplete(score, passed)}>
          Continue
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="quiz">
      <p className="quiz-progress">
        Question {currentIndex + 1} of {questions.length}
      </p>
      <div className="quiz-question">
        <p className="quiz-question-text">{q.question}</p>
        <div className="quiz-choices">
          {q.choices.map((choice, ci) => (
            <button key={ci} type="button" className="quiz-choice-btn" onClick={() => selectAnswer(ci)}>
              {choice}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
