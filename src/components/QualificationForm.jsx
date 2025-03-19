import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressBar from './ProgressBar';
import ContactForm from './ContactForm';

const QualificationForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    accidentDate: null,
    medicalTreatment: null,
    medicalTreatmentDate: null,
    atFault: null,
    hasAttorney: null,
    movingViolation: null,
    priorSettlement: null,
    insuranceCoverage: {
      liability: false,
      uninsured: false,
      underinsured: false
    }
  });
  
  const [isQualified, setIsQualified] = useState(null);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [questions, setQuestions] = useState([
    {
      id: 'accidentDate',
      question: 'When did your accident occur?',
      helpText: 'This helps us understand the timeline of your case.',
      type: 'date',
      validation: (value) => {
        if (!value) return false;
        const date = new Date(value);
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        return date >= oneYearAgo;
      }
    },
    {
      id: 'medicalTreatment',
      question: 'Did you receive medical treatment after the accident?',
      helpText: 'Medical records are important for documenting your injuries.',
      type: 'boolean',
      followUp: {
        condition: (value) => value === true,
        question: {
          id: 'medicalTreatmentDate',
          question: 'Approximately when did you first receive medical treatment?',
          helpText: 'An approximate date is fine.',
          type: 'date'
        }
      }
    },
    {
      id: 'atFault',
      question: 'Were you found at fault for the accident?',
      helpText: 'This helps us understand liability in your case.',
      type: 'boolean',
      options: [
        { value: true, label: 'Yes' },
        { value: false, label: 'No' },
        { value: null, label: 'Unsure' }
      ],
      reverseLogic: true // "No" is the qualifying answer
    },
    {
      id: 'hasAttorney',
      question: 'Do you currently have an attorney handling your case?',
      helpText: 'We want to ensure we\'re not interfering with existing representation.',
      type: 'select',
      options: [
        { value: 'no', label: 'No', isQualifying: true },
        { value: 'yes-change', label: 'Yes, but I\'m considering a change', isQualifying: true },
        { value: 'yes', label: 'Yes, and I want to keep them', isQualifying: false }
      ]
    },
    {
      id: 'movingViolation',
      question: 'Did you receive a traffic ticket or moving violation from this accident?',
      helpText: 'This helps us understand the circumstances of the accident.',
      type: 'boolean',
      reverseLogic: true // "No" is the qualifying answer
    },
    {
      id: 'priorSettlement',
      question: 'Have you already received a settlement for this accident?',
      helpText: 'This helps us understand if your case has already been resolved.',
      type: 'boolean',
      reverseLogic: true // "No" is the qualifying answer
    },
    {
      id: 'insuranceCoverage',
      question: 'Which insurance coverage is applicable in your situation?',
      helpText: 'Select all that apply. This helps us understand potential sources of recovery.',
      type: 'checkbox',
      options: [
        { id: 'liability', label: 'The other party\'s insurance' },
        { id: 'uninsured', label: 'Your Uninsured Motorist (UM) coverage' },
        { id: 'underinsured', label: 'Your Underinsured Motorist (UIM) coverage' }
      ],
      validation: (value) => Object.values(value).some(v => v === true)
    }
  ]);

  const handleInputChange = (questionId, value) => {
    setValidationError(null);
    
    setFormData(prev => {
      if (questionId === 'insuranceCoverage') {
        return {
          ...prev,
          insuranceCoverage: {
            ...prev.insuranceCoverage,
            [value.id]: value.checked
          }
        };
      }
      return { ...prev, [questionId]: value };
    });
  };

  const checkQualification = () => {
    // Check if accident was within last 12 months
    const accidentDate = new Date(formData.accidentDate);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const isRecentAccident = accidentDate >= oneYearAgo;

    // Check if medical treatment was within 60 days of accident
    let isMedicalTreatmentTimely = true;
    if (formData.medicalTreatment && formData.medicalTreatmentDate) {
      const treatmentDate = new Date(formData.medicalTreatmentDate);
      const accidentDateObj = new Date(formData.accidentDate);
      const sixtyDaysAfterAccident = new Date(accidentDateObj);
      sixtyDaysAfterAccident.setDate(accidentDateObj.getDate() + 60);
      isMedicalTreatmentTimely = treatmentDate <= sixtyDaysAfterAccident;
    }

    // Check if at least one insurance coverage is selected
    const hasInsurance = Object.values(formData.insuranceCoverage).some(v => v === true);

    // Check if user qualifies based on all criteria
    const qualified = 
      isRecentAccident && 
      formData.medicalTreatment === true && 
      isMedicalTreatmentTimely &&
      (formData.atFault === false || formData.atFault === null) && 
      (formData.hasAttorney === 'no' || formData.hasAttorney === 'yes-change') &&
      formData.movingViolation === false &&
      formData.priorSettlement === false &&
      hasInsurance;

    setIsQualified(qualified);
  };

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    
    // Validate current answer before proceeding
    let isValid = false;
    
    if (currentQuestion.type === 'boolean') {
      isValid = formData[currentQuestion.id] !== null;
    } else if (currentQuestion.type === 'select') {
      isValid = formData[currentQuestion.id] !== null;
    } else if (currentQuestion.type === 'date') {
      isValid = formData[currentQuestion.id] && (!currentQuestion.validation || currentQuestion.validation(formData[currentQuestion.id]));
    } else if (currentQuestion.type === 'checkbox') {
      isValid = currentQuestion.validation(formData[currentQuestion.id]);
    }
    
    if (!isValid) {
      // Show validation error
      setValidationError('Please answer this question to continue.');
      return;
    }
    
    // Check if we should show a follow-up question
    if (currentQuestion.followUp && currentQuestion.followUp.condition(formData[currentQuestion.id])) {
      // Create a new questions array with the follow-up question inserted
      const updatedQuestions = [...questions];
      updatedQuestions.splice(currentStep + 1, 0, currentQuestion.followUp.question);
      setQuestions(updatedQuestions);
    }
    
    // Check if we should skip to results based on disqualifying answers
    if (currentQuestion.type === 'boolean' && currentQuestion.reverseLogic) {
      if (formData[currentQuestion.id] === true) {
        // This is a disqualifying answer
        checkQualification();
        setCurrentStep(questions.length);
        return;
      }
    } else if (currentQuestion.type === 'select') {
      const selectedOption = currentQuestion.options.find(opt => opt.value === formData[currentQuestion.id]);
      if (selectedOption && !selectedOption.isQualifying) {
        // This is a disqualifying answer
        checkQualification();
        setCurrentStep(questions.length);
        return;
      }
    }
    
    // If we're at the last question, evaluate qualification
    if (currentStep === questions.length - 1) {
      checkQualification();
    }
    
    // Move to next question
    setCurrentStep(prev => prev + 1);
    setValidationError(null);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    setValidationError(null);
  };

  const handleSubmitContactInfo = (contactInfo) => {
    // Here you would typically send the data to your backend
    console.log('Submitting form data:', { ...formData, contactInfo });
    setFormSubmitted(true);
    
    // In a real implementation, you would send this data to your server
    // fetch('/api/submit-case', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...formData, contactInfo })
    // })
    // .then(response => response.json())
    // .then(data => {
    //   setFormSubmitted(true);
    // })
    // .catch(error => {
    //   console.error('Error submitting form:', error);
    // });
  };

  // Render the current question
  const renderQuestion = () => {
    if (currentStep >= questions.length) {
      return null;
    }

    const question = questions[currentStep];

    return (
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="mb-8"
      >
        <h3 className="text-xl font-semibold mb-2 text-gray-800">{question.question}</h3>
        {question.helpText && (
          <p className="text-sm text-gray-600 mb-4">{question.helpText}</p>
        )}
        
        {question.type === 'boolean' && (
          <div className="flex flex-wrap gap-4">
            {(question.options || [
              { value: true, label: 'Yes' },
              { value: false, label: 'No' }
            ]).map(option => (
              <button
                key={String(option.value)}
                onClick={() => handleInputChange(question.id, option.value)}
                className={`px-6 py-3 rounded-lg transition-colors ${
                  formData[question.id] === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {question.type === 'date' && (
          <div>
            <input
              type="date"
              onChange={(e) => handleInputChange(question.id, e.target.value)}
              value={formData[question.id] || ''}
              max={new Date().toISOString().split('T')[0]}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {formData[question.id] && question.validation && !question.validation(formData[question.id]) && (
              <p className="text-red-500 mt-2">
                {question.id === 'accidentDate' 
                  ? 'Your accident must have occurred within the last 12 months.'
                  : 'Please enter a valid date.'}
              </p>
            )}
          </div>
        )}

        {question.type === 'select' && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange(question.id, option.value)}
                className={`w-full text-left px-6 py-3 rounded-lg transition-colors ${
                  formData[question.id] === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {question.type === 'checkbox' && (
          <div className="space-y-3">
            {question.options.map((option) => (
              <div key={option.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={option.id}
                  checked={formData.insuranceCoverage[option.id] || false}
                  onChange={(e) => 
                    handleInputChange('insuranceCoverage', {
                      id: option.id,
                      checked: e.target.checked
                    })
                  }
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor={option.id} className="ml-3 text-gray-700">
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        )}
        
        {validationError && (
          <p className="text-red-500 mt-4">{validationError}</p>
        )}
      </motion.div>
    );
  };

  // Render results or contact form after all questions
  const renderResults = () => {
    if (formSubmitted) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <div className="bg-green-100 text-green-800 p-6 rounded-lg mb-6">
            <h3 className="text-2xl font-bold mb-2">Thank You!</h3>
            <p className="text-lg">
              Your information has been successfully received. Our legal team will reach out shortly to discuss the next steps for your case.
            </p>
          </div>
          
          <div className="mt-8">
            <h4 className="text-xl font-semibold mb-4">What Happens Next?</h4>
            <ol className="text-left space-y-4 text-gray-700">
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-bold">1</span>
                <span>A case specialist will review your information within 24 hours.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-bold">2</span>
                <span>We'll contact you via your preferred method to discuss your case in detail.</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mr-3 font-bold">3</span>
                <span>Our team will explain your options and recommend the best path forward.</span>
              </li>
            </ol>
          </div>
        </motion.div>
      );
    }

    if (isQualified === true) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-700">
              Based on your responses, we'd like to learn more about your situation. Please provide your contact information below so we can discuss how we might be able to help.
            </p>
          </div>
          <ContactForm onSubmit={handleSubmitContactInfo} />
        </motion.div>
      );
    } else if (isQualified === false) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8"
        >
          <div className="bg-blue-50 text-blue-800 p-6 rounded-lg mb-6">
            <h3 className="text-2xl font-bold mb-2">Thank You</h3>
            <p className="text-lg">
              Thank you for submitting your information! We're reviewing your responses and will reach out if additional information is needed or if we have resources to assist you further.
            </p>
          </div>
          
          <div className="mt-6 text-gray-700">
            <h4 className="text-xl font-semibold mb-4">Additional Resources</h4>
            <p className="mb-4">
              While we review your case, you might find these resources helpful:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-6">
              <li><a href="/resources/after-accident-checklist" className="text-blue-600 hover:underline">What to Do After a Car Accident Checklist</a></li>
              <li><a href="/resources/understanding-insurance-claims" className="text-blue-600 hover:underline">Understanding Insurance Claims Process</a></li>
              <li><a href="/resources/common-injuries" className="text-blue-600 hover:underline">Common Car Accident Injuries and Treatment Options</a></li>
            </ul>
          </div>
          
          <div className="mt-8 border-t pt-6">
            <h4 className="text-lg font-semibold mb-3">Have Additional Questions?</h4>
            <p className="mb-4">
              Feel free to reach out to our team directly. We're here to help.
            </p>
            <ContactForm onSubmit={handleSubmitContactInfo} simplified={true} />
          </div>
        </motion.div>
      );
    }
    
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-8 border border-gray-100">
      <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Free Claim Evaluation
      </h2>
      
      {currentStep < questions.length && (
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={questions.length} 
        />
      )}
      
      <AnimatePresence mode="wait">
        {currentStep < questions.length ? renderQuestion() : renderResults()}
      </AnimatePresence>
      
      {currentStep < questions.length && (
        <div className="flex justify-between mt-8">
          {currentStep > 0 ? (
            <button
              onClick={handleBack}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
          ) : (
            <div></div> // Empty div to maintain flex spacing
          )}
          
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {currentStep === questions.length - 1 ? 'Submit' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
};

export default QualificationForm; 