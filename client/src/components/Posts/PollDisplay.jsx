import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from '../../services/axiosSetup';
import toast from 'react-hot-toast';
import { Check, Info } from 'lucide-react';

const PollDisplay = ({ post: initialPost }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(initialPost);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fallback to category for backward compat with posts created before postType field existed
  const isQna = post.postType === 'qna' || (post.postType === 'normal' && post.category === 'qna');
  const hasVoted = post.userPollVote !== undefined && post.userPollVote !== null;
  const isAuthor = user && post.author && 
    (post.author._id?.toString() || post.author?.toString()) === user._id?.toString();
  const showResults = hasVoted || isAuthor;

  // Calculate total votes
  const totalVotes = (post.pollOptions || []).reduce((sum, opt) => sum + (opt.voteCount || 0), 0);

  // Don't render at all if there are no options to show (prevents crashes)
  if (!post.pollOptions || post.pollOptions.length === 0) {
    return (
      <div className="bg-white/5 border border-white/5 rounded-2xl p-5 my-4 text-center text-gray-500 text-sm">
        No poll options available.
      </div>
    );
  }

  const handleOptionSelect = (index) => {
    setError(null);
    if (isQna) {
      if (selectedIndices.includes(index)) {
        setSelectedIndices(selectedIndices.filter(i => i !== index));
      } else {
        setSelectedIndices([...selectedIndices, index]);
      }
    } else {
      setSelectedIndices([index]);
    }
  };

  const handleVoteSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to vote');
      navigate('/login');
      return;
    }

    if (selectedIndices.length === 0) {
      setError('Please select at least one option to vote.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(`/api/posts/${post._id}/poll-vote`, {
        optionIndices: selectedIndices
      });

      // Update local state with response data
      setPost(prevPost => ({
        ...prevPost,
        pollOptions: response.data.pollOptions,
        correctAnswers: response.data.correctAnswers,
        userPollVote: response.data.userPollVote
      }));

      toast.success(response.data.message || 'Vote registered successfully!');
    } catch (err) {
      console.error('Error submitting vote:', err);
      const errMsg = err.response?.data?.message || 'Failed to submit vote. Please try again.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="bg-white/5 border border-white/5 rounded-2xl p-5 my-4"
      onClick={(e) => {
        // Prevent card clicks from triggering parent Navigation
        e.stopPropagation();
      }}
    >
      <div className="flex items-center gap-2 mb-4 text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
        <span>{isQna ? '❓ Q&A Section' : '📊 Poll'}</span>
        <span>•</span>
        <span>{totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}</span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-900/20 border border-red-500/20 text-red-300 text-xs rounded-xl flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {showResults ? (
        // Render Poll Results (Percentages)
        <div className="space-y-3">
          {(post.pollOptions || []).map((option, idx) => {
            const votes = option.voteCount || 0;
            const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            
            // Check correctness/choices
            const isUserChoice = isQna 
              ? Array.isArray(post.userPollVote) && post.userPollVote.includes(idx)
              : post.userPollVote === idx;
            
            const isCorrect = post.correctAnswers && post.correctAnswers.includes(idx);
            
            let borderClass = 'border-white/5 bg-white/5';
            let progressColor = 'bg-emerald-500/20';

            if (isQna) {
              if (isCorrect) {
                borderClass = 'border-emerald-500/30 bg-emerald-950/20';
                progressColor = 'bg-emerald-500/30';
              } else if (isUserChoice && !isCorrect) {
                borderClass = 'border-red-500/30 bg-red-950/20';
                progressColor = 'bg-red-500/20';
              }
            } else {
              if (isUserChoice) {
                borderClass = 'border-emerald-500/30 bg-emerald-950/20';
                progressColor = 'bg-emerald-500/30';
              }
            }

            return (
              <div 
                key={option._id || idx}
                className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${borderClass}`}
              >
                {/* Percentage progress bar */}
                <div 
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${progressColor}`}
                  style={{ width: `${percentage}%` }}
                />

                <div className="relative flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 pr-4">
                    {isQna && isCorrect && (
                      <span className="bg-emerald-500 text-black rounded-full p-0.5 text-[10px] font-bold">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                    <span className="text-white font-medium">{option.text}</span>
                    {isUserChoice && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded">
                        Your Pick
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono shrink-0">
                    <span className="text-gray-300 font-bold">{percentage}%</span>
                    <span className="text-gray-500 text-xs">({votes})</span>
                  </div>
                </div>
              </div>
            );
          })}

          {isQna && post.correctAnswers && post.correctAnswers.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              💡 Correct answers are highlighted in green.
            </p>
          )}
        </div>
      ) : (
        // Render Poll Choices (Voting view)
        <form onSubmit={handleVoteSubmit} className="space-y-3">
          {(post.pollOptions || []).map((option, idx) => {
            const isSelected = selectedIndices.includes(idx);
            
            return (
              <button
                key={option._id || idx}
                type="button"
                onClick={() => handleOptionSelect(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${
                  isSelected 
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                    : 'border-white/5 bg-white/5 text-gray-300 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <span className="font-medium text-sm">{option.text}</span>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-emerald-500 bg-emerald-500 text-black' : 'border-gray-600'
                }`}>
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}

          <button
            type="submit"
            disabled={isSubmitting || selectedIndices.length === 0}
            className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 disabled:from-emerald-500/50 disabled:to-teal-500/50 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/20 active:scale-98 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Voting...' : 'Submit Vote'}
          </button>
        </form>
      )}
    </div>
  );
};

export default PollDisplay;
