import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView
} from 'react-native';


import { questions } from './questions';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [highestScore, setHighestScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  
  const calculateScore = (answers) => {
    let score = 0;
    questions.forEach((question) => {
      const userAnswer = answers[question.id];
      const correctAnswer = question.answer;
      
      
      if (Array.isArray(correctAnswer)) {
        
        if (Array.isArray(userAnswer) && 
            userAnswer.length === correctAnswer.length && 
            userAnswer.every(answer => correctAnswer.includes(answer)) &&
            correctAnswer.every(answer => userAnswer.includes(answer))) {
          score++;
        }
      } else {
        
        if (userAnswer === correctAnswer) {
          score++;
        }
      }
    });
    return score;
  };

  
  const handleAnswerSelect = (choiceKey) => {
    const currentQuestion = questions[currentQuestionIndex];
    
    if (currentQuestion.type === "checkbox") {
      
      const currentSelections = userAnswers[currentQuestion.id] || [];
      let newSelections;
      
      if (currentSelections.includes(choiceKey)) {
        
        newSelections = currentSelections.filter(item => item !== choiceKey);
      } else {
        
        newSelections = [...currentSelections, choiceKey];
      }
      
      setUserAnswers({
        ...userAnswers,
        [currentQuestion.id]: newSelections
      });
    } else {
      
      setUserAnswers({
        ...userAnswers,
        [currentQuestion.id]: choiceKey
      });
    }
  };

  
  const isOptionSelected = (choiceKey) => {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = userAnswers[currentQuestion.id];
    
    if (!userAnswer) return false;
    
    if (Array.isArray(userAnswer)) {
      return userAnswer.includes(choiceKey);
    } else {
      return userAnswer === choiceKey;
    }
  };

  
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      
      finishQuiz();
    }
  };

  
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  
  const finishQuiz = () => {
    const currentScore = calculateScore(userAnswers);
    if (currentScore > highestScore) {
      setHighestScore(currentScore);
    }
    setQuizCompleted(true);
    setCurrentScreen('results');
  };

  
  const startQuiz = () => {
    setCurrentScreen('quiz');
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
  };

  
  const restartQuiz = () => {
    startQuiz();
  };

  
  const HomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.homeContent}>
        <Text style={styles.title}>ADV102 Exercise Quiz</Text>
        <Text style={styles.subtitle}>Test your knowledge!</Text>
        <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
          <Text style={styles.startButtonText}>Start Quiz</Text>
        </TouchableOpacity>
        {highestScore > 0 && (
          <Text style={styles.highestScoreText}>
            Highest Score: {highestScore}/{questions.length}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );

  
  const QuizScreen = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = userAnswers[currentQuestion.id];

    
    const choicesArray = Object.entries(currentQuestion.choices).map(([key, value]) => ({
      key,
      value
    }));

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.quizHeader}>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          <Text style={styles.scoreDisplay}>
            Answered: {Object.keys(userAnswers).length}/{questions.length}
          </Text>
        </View>

        <ScrollView style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
          <Text style={styles.questionType}>
            {currentQuestion.type === "multiple" ? "Multiple Choice" : 
             currentQuestion.type === "truefalse" ? "True or False" : 
             "Select all that apply"}
          </Text>
          
          <View style={styles.answersContainer}>
            {choicesArray.map((choice, index) => (
              <TouchableOpacity
                key={choice.key}
                style={[
                  styles.answerButton,
                  isOptionSelected(choice.key) && styles.selectedAnswer,
                  quizCompleted && 
                    ((Array.isArray(currentQuestion.answer) && currentQuestion.answer.includes(choice.key)) || 
                     (!Array.isArray(currentQuestion.answer) && currentQuestion.answer === choice.key)) && 
                    styles.correctAnswer,
                  quizCompleted && 
                    isOptionSelected(choice.key) && 
                    !((Array.isArray(currentQuestion.answer) && currentQuestion.answer.includes(choice.key)) || 
                      (!Array.isArray(currentQuestion.answer) && currentQuestion.answer === choice.key)) && 
                    styles.wrongAnswer
                ]}
                onPress={() => handleAnswerSelect(choice.key)}
              >
                <View style={styles.answerRow}>
                  <Text style={styles.choiceLetter}>{choice.key}.</Text>
                  <Text style={styles.answerText}>{choice.value}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[styles.navButton, currentQuestionIndex === 0 && styles.disabledButton]}
            onPress={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <Text style={styles.navButtonText}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navButton}
            onPress={currentQuestionIndex === questions.length - 1 ? finishQuiz : handleNext}
          >
            <Text style={styles.navButtonText}>
              {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  
  const ResultsScreen = () => {
    const currentScore = calculateScore(userAnswers);
    const percentage = Math.round((currentScore / questions.length) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsScrollContainer}>
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Quiz Results</Text>
            
            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Your Score:</Text>
              <Text style={styles.scoreValue}>
                {currentScore}/{questions.length} ({percentage}%)
              </Text>
            </View>

            <View style={styles.scoreCard}>
              <Text style={styles.scoreLabel}>Highest Score:</Text>
              <Text style={styles.scoreValue}>
                {highestScore}/{questions.length}
              </Text>
            </View>

            <View style={styles.detailedResults}>
              <Text style={styles.detailedResultsTitle}>Question Breakdown:</Text>
              {questions.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isCorrect = Array.isArray(question.answer) 
                  ? (Array.isArray(userAnswer) && 
                     userAnswer.length === question.answer.length && 
                     userAnswer.every(a => question.answer.includes(a)) &&
                     question.answer.every(a => userAnswer.includes(a)))
                  : userAnswer === question.answer;
                
                return (
                  <View key={question.id} style={styles.questionResult}>
                    <Text style={styles.questionNumber}>Q{index + 1}:</Text>
                    <Text style={[styles.resultStatus, isCorrect ? styles.correct : styles.incorrect]}>
                      {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.performanceContainer}>
              {percentage >= 90 && <Text style={[styles.performanceText, styles.excellent]}>Excellent! 🎉</Text>}
              {percentage >= 70 && percentage < 90 && <Text style={[styles.performanceText, styles.good]}>Good job! 👍</Text>}
              {percentage >= 50 && percentage < 70 && <Text style={[styles.performanceText, styles.average]}>Not bad! Keep practicing 💪</Text>}
              {percentage < 50 && <Text style={[styles.performanceText, styles.needImprovement]}>You can do better! Try again 📚</Text>}
            </View>

            <View style={styles.resultsButtons}>
              <TouchableOpacity style={styles.resultsButton} onPress={restartQuiz}>
                <Text style={styles.resultsButtonText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.resultsButton, styles.homeButton]} 
                onPress={() => setCurrentScreen('home')}
              >
                <Text style={styles.resultsButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  };

  
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'quiz':
        return <QuizScreen />;
      case 'results':
        return <ResultsScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return renderScreen();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  homeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 8,
    elevation: 3,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  highestScoreText: {
    marginTop: 30,
    fontSize: 16,
    color: '#666',
  },
  quizHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: 'white',
  },
  questionCounter: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  scoreDisplay: {
    fontSize: 16,
    color: '#666',
  },
  questionContainer: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  questionType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  answersContainer: {
    gap: 15,
  },
  answerButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  choiceLetter: {
    fontWeight: 'bold',
    marginRight: 10,
    fontSize: 16,
    minWidth: 20,
  },
  answerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  selectedAnswer: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  correctAnswer: {
    backgroundColor: '#C8E6C9',
    borderColor: '#4CAF50',
  },
  wrongAnswer: {
    backgroundColor: '#FFCDD2',
    borderColor: '#F44336',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: 'white',
  },
  navButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultsContainer: {
    alignItems: 'center',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  scoreCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
    marginVertical: 10,
    elevation: 3,
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  detailedResults: {
    width: '100%',
    maxWidth: 400,
    marginTop: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
  },
  detailedResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  questionResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  questionNumber: {
    fontWeight: 'bold',
    color: '#333',
  },
  resultStatus: {
    fontWeight: 'bold',
  },
  correct: {
    color: '#4CAF50',
  },
  incorrect: {
    color: '#F44336',
  },
  performanceContainer: {
    marginVertical: 30,
    alignItems: 'center',
  },
  performanceText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  excellent: {
    color: '#4CAF50',
  },
  good: {
    color: '#2196F3',
  },
  average: {
    color: '#FF9800',
  },
  needImprovement: {
    color: '#F44336',
  },
  resultsButtons: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 30,
  },
  resultsButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  homeButton: {
    backgroundColor: '#9E9E9E',
  },
  resultsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;