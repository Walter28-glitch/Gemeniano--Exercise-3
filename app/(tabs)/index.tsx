import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Switch,
} from 'react-native';


import { questions as initialQuestions } from './questions';

const App = () => {
  const [activeTab, setActiveTab] = useState('preview');
  const [questions, setQuestions] = useState(initialQuestions);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(600); // 10 minutes in seconds
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [highestScore, setHighestScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timerDuration);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false); // New state for home screen
  
  
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    id: null,
    type: 'multiple',
    question: '',
    choices: { A: '', B: '', C: '', D: '' },
    answer: 'A',
  });

  
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
    setIsTimerActive(false);
    setQuizStarted(false); // Go back to home screen after completion
  };

  
  const startQuiz = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setTimeLeft(timerDuration);
    setIsTimerActive(timerEnabled);
    setQuizStarted(true);
  };

  
  const restartQuiz = () => {
    startQuiz();
  };

  
  useEffect(() => {
    let timer;
    if (isTimerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerActive) {
      
      finishQuiz();
    }
    return () => clearInterval(timer);
  }, [isTimerActive, timeLeft]);

  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  
  const handleSaveQuestion = () => {
    if (!questionForm.question.trim()) {
      Alert.alert('Error', 'Please enter a question');
      return;
    }
    
    
    const validChoices = {};
    let hasValidChoice = false;
    Object.entries(questionForm.choices).forEach(([key, value]) => {
      if (value.trim()) {
        validChoices[key] = value.trim();
        hasValidChoice = true;
      }
    });
    
    if (!hasValidChoice) {
      Alert.alert('Error', 'Please enter at least one choice');
      return;
    }
    
    
    if (questionForm.type === 'checkbox') {
      
      const validAnswers = questionForm.answer.filter(key => validChoices[key]);
      if (validAnswers.length === 0) {
        Alert.alert('Error', 'Please select at least one correct answer');
        return;
      }
    } else {
      
      if (!validChoices[questionForm.answer]) {
        Alert.alert('Error', 'Please select a valid correct answer');
        return;
      }
    }
    
    const updatedQuestion = {
      ...questionForm,
      choices: validChoices,
      answer: questionForm.type === 'checkbox' ? 
        questionForm.answer.filter(key => validChoices[key]) : 
        questionForm.answer
    };
    
    if (editingQuestion) {
      
      setQuestions(questions.map(q => 
        q.id === editingQuestion.id ? updatedQuestion : q
      ));
    } else {
      // Add new question
      const newId = Math.max(...questions.map(q => q.id), 0) + 1;
      setQuestions([...questions, { ...updatedQuestion, id: newId }]);
    }
    
    resetQuestionForm();
    setShowQuestionModal(false);
  };

  
  const resetQuestionForm = () => {
    setQuestionForm({
      id: null,
      type: 'multiple',
      question: '',
      choices: { A: '', B: '', C: '', D: '' },
      answer: 'A',
    });
    setEditingQuestion(null);
  };

  
  const openAddQuestion = () => {
    resetQuestionForm();
    setShowQuestionModal(true);
  };

  
  const openEditQuestion = (question) => {
    setEditingQuestion(question);
    setQuestionForm({
      ...question,
      
      choices: {
        A: question.choices.A || '',
        B: question.choices.B || '',
        C: question.choices.C || '',
        D: question.choices.D || '',
      }
    });
    setShowQuestionModal(true);
  };

  
  const deleteQuestion = (questionId) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setQuestions(questions.filter(q => q.id !== questionId));
          }
        }
      ]
    );
  };

  
  const toggleAnswerSelection = (key) => {
    if (questionForm.type === 'checkbox') {
      const currentAnswers = questionForm.answer || [];
      if (currentAnswers.includes(key)) {
        setQuestionForm({
          ...questionForm,
          answer: currentAnswers.filter(a => a !== key)
        });
      } else {
        setQuestionForm({
          ...questionForm,
          answer: [...currentAnswers, key]
        });
      }
    } else {
      setQuestionForm({
        ...questionForm,
        answer: key
      });
    }
  };

  
  const renderHomeScreen = () => (
    <View style={styles.homeContainer}>
      <Text style={styles.homeTitle}>ADV102 Quiz</Text>
      <Text style={styles.homeSubtitle}>Test your knowledge!</Text>
      
      {highestScore > 0 && (
        <View style={styles.scoreCard}>
          <Text style={styles.highestScoreLabel}>Highest Score:</Text>
          <Text style={styles.highestScoreValue}>
            {highestScore}/{questions.length}
          </Text>
        </View>
      )}
      
      <TouchableOpacity style={styles.startButton} onPress={startQuiz}>
        <Text style={styles.startButtonText}>Start Quiz</Text>
      </TouchableOpacity>
      
      {questions.length === 0 && (
        <Text style={styles.noQuestionsText}>
          No questions available. Please add questions in Quiz Settings.
        </Text>
      )}
    </View>
  );

  
  const renderPreviewTab = () => {
    if (quizCompleted) {
      const currentScore = calculateScore(userAnswers);
      const percentage = Math.round((currentScore / questions.length) * 100);
      
      return (
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
                onPress={() => setQuizCompleted(false)}
              >
                <Text style={styles.resultsButtonText}>Back to Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      );
    }
    
    
    if (!quizStarted) {
      return renderHomeScreen();
    }
    
    
    const currentQuestion = questions[currentQuestionIndex];
    const choicesArray = Object.entries(currentQuestion.choices).map(([key, value]) => ({
      key,
      value
    }));

    return (
      <>
        <View style={styles.quizHeader}>
          <Text style={styles.questionCounter}>
            Question {currentQuestionIndex + 1} of {questions.length}
          </Text>
          {timerEnabled && (
            <Text style={[styles.timerText, timeLeft <= 60 && styles.timerWarning]}>
              Time: {formatTime(timeLeft)}
            </Text>
          )}
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
      </>
    );
  };

  
  const renderSettingsTab = () => {
    return (
      <FlatList
        data={['timer', 'questions']} // Dummy data for sections
        renderItem={({ item }) => {
          if (item === 'timer') {
            return (
              <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Quiz Timer</Text>
                <View style={styles.timerSetting}>
                  <Text style={styles.settingLabel}>Enable Timer:</Text>
                  <Switch
                    value={timerEnabled}
                    onValueChange={setTimerEnabled}
                    trackColor={{ false: "#767577", true: "#81b0ff" }}
                    thumbColor={timerEnabled ? "#f5dd4b" : "#f4f3f4"}
                  />
                </View>
                
                {timerEnabled && (
                  <View style={styles.durationSetting}>
                    <Text style={styles.settingLabel}>Duration (minutes):</Text>
                    <TextInput
                      style={styles.durationInput}
                      value={Math.floor(timerDuration / 60).toString()}
                      onChangeText={(text) => {
                        const mins = parseInt(text) || 0;
                        setTimerDuration(Math.max(1, mins) * 60);
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>
            );
          } else if (item === 'questions') {
            return (
              <View style={styles.settingsSection}>
                <Text style={styles.settingsTitle}>Quiz Questions</Text>
                <TouchableOpacity style={styles.addButton} onPress={openAddQuestion}>
                  <Text style={styles.addButtonText}>+ Add New Question</Text>
                </TouchableOpacity>
                
                {questions.length === 0 ? (
                  <Text style={styles.emptyText}>No questions added yet</Text>
                ) : (
                  <View style={styles.questionsListContainer}>
                    {questions.map((item) => (
                      <View key={item.id} style={styles.questionItem}>
                        <Text style={styles.questionItemText} numberOfLines={2}>
                          {item.question}
                        </Text>
                        <View style={styles.questionActions}>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.editButton]} 
                            onPress={() => openEditQuestion(item)}
                          >
                            <Text style={styles.actionButtonText}>Edit</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]} 
                            onPress={() => deleteQuestion(item.id)}
                          >
                            <Text style={styles.actionButtonText}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }
          return null;
        }}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.settingsContainer}
        ListFooterComponent={<View style={{ height: 20 }} />} // Add padding at bottom
      />
    );
  };

  
  const renderQuestionModal = () => {
    const choicesArray = Object.entries(questionForm.choices);
    
    return (
      <Modal
        visible={showQuestionModal}
        animationType="slide"
        onRequestClose={() => setShowQuestionModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
            </Text>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowQuestionModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Question Type</Text>
              <View style={styles.typeSelector}>
                {['multiple', 'truefalse', 'checkbox'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      questionForm.type === type && styles.activeTypeButton
                    ]}
                    onPress={() => setQuestionForm({...questionForm, type})}
                  >
                    <Text style={[
                      styles.typeButtonText,
                      questionForm.type === type && styles.activeTypeButtonText
                    ]}>
                      {type === 'multiple' ? 'Multiple Choice' : 
                       type === 'truefalse' ? 'True/False' : 'Checkbox'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Question</Text>
              <TextInput
                style={styles.textInput}
                value={questionForm.question}
                onChangeText={(text) => setQuestionForm({...questionForm, question: text})}
                placeholder="Enter your question"
                multiline
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Choices</Text>
              {choicesArray.map(([key, value]) => (
                <View key={key} style={styles.choiceRow}>
                  <Text style={styles.choiceKey}>{key}:</Text>
                  <TextInput
                    style={styles.choiceInput}
                    value={value}
                    onChangeText={(text) => {
                      const newChoices = {...questionForm.choices};
                      newChoices[key] = text;
                      setQuestionForm({...questionForm, choices: newChoices});
                    }}
                    placeholder={`Enter choice ${key}`}
                  />
                </View>
              ))}
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {questionForm.type === 'checkbox' ? 'Correct Answers' : 'Correct Answer'}
              </Text>
              <View style={styles.answerOptions}>
                {choicesArray.map(([key, value]) => {
                  if (!value.trim()) return null;
                  
                  const isSelected = questionForm.type === 'checkbox'
                    ? (questionForm.answer || []).includes(key)
                    : questionForm.answer === key;
                    
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[
                        styles.answerOption,
                        isSelected && styles.selectedAnswerOption
                      ]}
                      onPress={() => toggleAnswerSelection(key)}
                    >
                      <Text style={styles.answerOptionText}>
                        {key}. {value}
                      </Text>
                      {isSelected && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowQuestionModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]} 
                onPress={handleSaveQuestion}
              >
                <Text style={styles.modalButtonText}>
                  {editingQuestion ? 'Update' : 'Add'} Question
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'preview' && styles.activeTab]}
          onPress={() => {
            setActiveTab('preview');
            if (activeTab === 'settings') {
              // Reset timer when switching to preview
              setTimeLeft(timerDuration);
            }
          }}
        >
          <Text style={[styles.tabText, activeTab === 'preview' && styles.activeTabText]}>
            Preview Quiz
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'settings' && styles.activeTab]}
          onPress={() => {
            setActiveTab('settings');
            // Don't reset quiz state when going to settings
          }}
        >
          <Text style={[styles.tabText, activeTab === 'settings' && styles.activeTabText]}>
            Quiz Settings
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'preview' ? renderPreviewTab() : renderSettingsTab()}
      </View>
      
      {/* Question Modal */}
      {renderQuestionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    elevation: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
  },
  homeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  homeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  homeSubtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
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
    marginBottom: 30,
  },
  highestScoreLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 5,
  },
  highestScoreValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
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
  noQuestionsText: {
    marginTop: 30,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
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
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  timerWarning: {
    color: '#f44336',
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
  settingsContainer: {
    padding: 20,
  },
  settingsSection: {
    marginBottom: 30,
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  timerSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  durationSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionsListContainer: {
    
  },
  questionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  questionItemText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  questionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 5,
  },
  editButton: {
    backgroundColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  actionButtonText: {
    color: 'white',
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    minHeight: 60,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeTypeButton: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  typeButtonText: {
    color: '#666',
    fontSize: 14,
  },
  activeTypeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  choiceKey: {
    width: 30,
    fontWeight: 'bold',
    color: '#333',
  },
  choiceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  answerOptions: {
    gap: 10,
  },
  answerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
  },
  selectedAnswerOption: {
    borderColor: '#2196F3',
    backgroundColor: '#E3F2FD',
  },
  answerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  checkmark: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#9E9E9E',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    marginLeft: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;