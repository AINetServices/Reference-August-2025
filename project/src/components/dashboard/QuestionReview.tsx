import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Send, Edit3 } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
}

interface QuestionReviewProps {
  roleId: string;
  organizationId: string;
  candidateId: string;
  referenceId: string;
  onApprove: (questions: Question[]) => void;
}

export function QuestionReview({
  roleId,
  organizationId,
  candidateId,
  referenceId,
  onApprove
}: QuestionReviewProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editingQuestions, setEditingQuestions] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [roleId, organizationId]);

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('role_id', roleId)
        .eq('organization_id', organizationId);

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestion = (questionId: string, newText: string) => {
    setEditingQuestions(prev => ({
      ...prev,
      [questionId]: newText
    }));
  };

  const handleSaveEdit = (questionId: string) => {
    const newText = editingQuestions[questionId];
    if (newText) {
      setQuestions(prev => 
        prev.map(q => 
          q.id === questionId 
            ? { ...q, question_text: newText }
            : q
        )
      );
    }
    setEditingQuestions(prev => {
      const { [questionId]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleApprove = async () => {
    setSubmitting(true);
    
    try {
      const finalQuestions = questions.map(q => ({
        ...q,
        question_text: editingQuestions[q.id] || q.question_text
      }));

      // Create reference request
      const { error } = await supabase
        .from('reference_requests')
        .insert({
          candidate_id: candidateId,
          reference_id: referenceId,
          questions: finalQuestions,
          status: 'approved'
        });

      if (error) throw error;

      onApprove(finalQuestions);
    } catch (error) {
      console.error('Error approving questions:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Review Questions</h2>
      
      <div className="space-y-4 mb-6">
        {questions.map((question) => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            {editingQuestions[question.id] !== undefined ? (
              <div className="space-y-3">
                <textarea
                  value={editingQuestions[question.id]}
                  onChange={(e) => handleEditQuestion(question.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveEdit(question.id)}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={() => setEditingQuestions(prev => {
                      const { [question.id]: _, ...rest } = prev;
                      return rest;
                    })}
                    className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <p className="text-gray-700 flex-1">{question.question_text}</p>
                <button
                  onClick={() => setEditingQuestions(prev => ({
                    ...prev,
                    [question.id]: question.question_text
                  }))}
                  className="ml-3 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <Send className="w-5 h-5" />
            <span>{submitting ? 'Approving...' : 'Approve & Send to Reference'}</span>
          </button>
        </div>
      )}
    </div>
  );
}