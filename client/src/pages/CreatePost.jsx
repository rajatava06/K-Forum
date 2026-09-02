import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from '../services/axiosSetup';
import toast from 'react-hot-toast';
import { Send, Tag, Eye, EyeOff, Image, X, Calendar, ShieldCheck, Clock, CheckCircle } from 'lucide-react';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    isAnonymous: false,
    eventDate: ''
  });
  const [pollOptions, setPollOptions] = useState([
    { text: '' },
    { text: '' }
  ]);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { id: 'academics', name: 'Academics', icon: '📚' },
    { id: 'events', name: 'Events', icon: '🎉' },
    { id: 'rants', name: 'Rants', icon: '😤' },
    { id: 'internships', name: 'Internships', icon: '💼' },
    { id: 'lost-found', name: 'Lost & Found', icon: '🔍' },
    { id: 'clubs', name: 'Clubs', icon: '🏛️' },
    { id: 'general', name: 'General', icon: '💬' },
    { id: 'Bookies', name: 'Bookies', icon: '🤖' },
    { id: 'qna', name: 'Q&A', icon: '❓' },
    { id: 'polling', name: 'Polling', icon: '📊' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 Images Allowed');
      return;
    }

    const newImageFiles = files.filter(file => {
      // Check Size (Max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is 5MB.`);
        return false;
      }
      // Check Type (PNG or JPG/JPEG only)
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast.error(`"${file.name}" is ignored. Only PNG and JPG images are allowed.`);
        return false;
      }
      return true;
    });

    const newImagePreviews = newImageFiles.map(file => ({
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setSelectedImages([...selectedImages, ...newImagePreviews]);
    setImageFiles([...imageFiles, ...newImageFiles]);
  };

  const removeImage = (index) => {
    const newSelectedImages = [...selectedImages];
    const newImageFiles = [...imageFiles];

    // Revoke the object URL to free up memory
    URL.revokeObjectURL(selectedImages[index].url);

    newSelectedImages.splice(index, 1);
    newImageFiles.splice(index, 1);

    setSelectedImages(newSelectedImages);
    setImageFiles(newImageFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content || (formData.category === 'qna' ? 'Q&A' : 'Poll'));
      formDataToSend.append('category', formData.category);
      formDataToSend.append('tags', formData.tags);
      formDataToSend.append('isAnonymous', formData.isAnonymous);
      if (formData.category === 'events' && formData.eventDate) {
        formDataToSend.append('eventDate', formData.eventDate);
      }

      if (['qna', 'polling'].includes(formData.category)) {
        const cleanOptions = pollOptions.filter(opt => opt.text.trim() !== '');
        if (cleanOptions.length < 2) {
          throw new Error('Please provide at least 2 options.');
        }
        formDataToSend.append('pollOptions', JSON.stringify(cleanOptions));

        if (formData.category === 'qna') {
          if (correctAnswers.length === 0) {
            throw new Error('Please select at least one correct answer for Q&A.');
          }
          formDataToSend.append('correctAnswers', JSON.stringify(correctAnswers));
        }
      }

      imageFiles.forEach(file => {
        formDataToSend.append('images', file);
      });

      const response = await axios.post(
        '/api/posts',
        formDataToSend
      );

      // Handle different moderation statuses
      if (response.data.moderationStatus === 'PENDING_REVIEW') {
        setShowReviewModal(true);
        toast.success('Post submitted for review! It will be visible once approved.', {
          duration: 5000,
          icon: '⏳'
        });
      } else {
        toast.success('Post Created and Published Successfully!');
        navigate(`/post/${response.data.post._id}`);
      }
    } catch (error) {
      console.error('Error creating post:', error);
      if (error.response?.data?.reason) {
        // Handle moderation rejection
        toast.error(`Post rejected: ${error.response.data.reason}`);
      } else if (error.response?.data?.errors) {
        // Handle validation errors from server
        const errors = error.response.data.errors;
        Object.values(errors).forEach(error => {
          toast.error(error);
        });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.message) {
        // Handle client-side validation errors
        toast.error(error.message);
      } else {
        toast.error('Failed to create post');
      }
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="relative z-10 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-panel p-4 sm:p-10 rounded-3xl shadow-2xl backdrop-blur-xl border border-white/5">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-4 animate-float">
              Create New Post
            </h1>
            <p className="text-gray-400 text-lg">Share Your Thoughts With The K-Forum Community</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title / Question */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                {['qna', 'polling'].includes(formData.category) ? 'Question' : 'Title'}
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength="200"
                className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all placeholder-gray-600 font-medium text-lg"
                placeholder={['qna', 'polling'].includes(formData.category) ? 'Ask your question here...' : 'Give your post a catchy title...'}
              />
              <div className="flex justify-end">
                <span className="text-xs text-gray-500 font-mono">
                  {formData.title.length}/200
                </span>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border cursor-pointer transition-all duration-300 group overflow-hidden ${formData.category === category.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.id}
                      checked={formData.category === category.id}
                      onChange={handleChange}
                      className="sr-only"
                    />
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{category.icon}</span>
                    <span className={`text-sm font-bold ${formData.category === category.id ? 'text-emerald-400' : 'text-gray-400 group-hover:text-gray-200'}`}>
                      {category.name}
                    </span>
                    {formData.category === category.id && (
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/10 to-transparent pointer-events-none" />
                    )}
                  </label>
                ))}
              </div>
            </div>


            {/* Event Date Picker - Only for Events */}
            {formData.category === 'events' && (
              <div className="space-y-2 animate-fade-in">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                  Event Date
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors w-5 h-5 pointer-events-none" />
                  <input
                    type="date"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required={formData.category === 'events'}
                    className="w-full bg-white/5 text-white pl-14 pr-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all placeholder-gray-600 appearance-none [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-50 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                  />
                </div>
              </div>
            )}

            {/* Options Builder for Q&A and Polling */}
            {['qna', 'polling'].includes(formData.category) && (
              <div className="space-y-4 animate-fade-in bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                    {formData.category === 'qna' ? 'Answer Options' : 'Poll Options'}
                  </label>
                  <span className="text-xs text-gray-500 font-mono">
                    {pollOptions.length}/10 options
                  </span>
                </div>

                <div className="space-y-3">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {formData.category === 'qna' && (
                        <label className="flex items-center justify-center cursor-pointer select-none" title="Mark as correct answer">
                          <input
                            type="checkbox"
                            checked={correctAnswers.includes(index)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setCorrectAnswers([...correctAnswers, index]);
                              } else {
                                setCorrectAnswers(correctAnswers.filter(i => i !== index));
                              }
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500/30 bg-gray-800"
                          />
                        </label>
                      )}

                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => {
                          const newOpts = [...pollOptions];
                          newOpts[index].text = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        required
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 bg-white/5 text-white px-4 py-3 rounded-xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all text-sm font-medium"
                      />

                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newOpts = pollOptions.filter((_, i) => i !== index);
                            setPollOptions(newOpts);
                            const newCorrects = correctAnswers
                              .filter(i => i !== index)
                              .map(i => (i > index ? i - 1 : i));
                            setCorrectAnswers(newCorrects);
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {pollOptions.length < 10 && (
                  <button
                    type="button"
                    onClick={() => {
                      setPollOptions([...pollOptions, { text: '' }]);
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 border border-dashed border-white/10 hover:border-emerald-500/30 rounded-xl text-sm font-bold text-gray-300 hover:text-emerald-400 transition-all flex items-center justify-center gap-2"
                  >
                    + Add Option
                  </button>
                )}

                {formData.category === 'qna' && correctAnswers.length === 0 && (
                  <p className="text-xs text-amber-400/80 mt-2">
                    ⚠️ Tip: Mark at least one correct answer using the checkbox.
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            {!['qna', 'polling'].includes(formData.category) && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                  Content
                </label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  required={!['qna', 'polling'].includes(formData.category)}
                  maxLength="5000"
                  rows="8"
                  className="w-full bg-white/5 text-white px-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all resize-none placeholder-gray-600 leading-relaxed"
                  placeholder="What's on your mind? Share your story, confession, or question..."
                />
                <div className="flex justify-end">
                  <span className="text-xs text-gray-500 font-mono">
                    {formData.content.length}/5000
                  </span>
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                #TAGS (OPTIONAL)
              </label>
              <div className="relative group">
                <Tag className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-500 transition-colors w-5 h-5" />
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full bg-white/5 text-white pl-14 pr-6 py-4 rounded-2xl border border-gray-700/50 focus:border-emerald-500/50 focus:bg-white/10 focus:outline-none transition-all placeholder-gray-600"
                  placeholder="academics, events, life (comma separated)"
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className={`flex flex-row items-center justify-between p-4 sm:p-6 rounded-2xl border transition-all duration-300 gap-4 ${formData.isAnonymous
              ? 'bg-emerald-900/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.05)]'
              : 'bg-white/5 border-white/5'
              }`}>
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                <div className={`p-3 rounded-xl shrink-0 ${formData.isAnonymous ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-400'}`}>
                  {formData.isAnonymous ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-base sm:text-lg ${formData.isAnonymous ? 'text-emerald-400' : 'text-gray-200'}`}>
                    {formData.isAnonymous ? 'Anonymous Mode' : 'Public Post'}
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm leading-snug">
                    {formData.isAnonymous
                      ? 'Your identity will be completely hidden.'
                      : 'Your name and profile will be visible.'
                    }
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-12 sm:w-14 h-7 sm:h-8 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] sm:after:top-[4px] after:left-[3px] sm:after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 sm:after:h-6 after:w-5 sm:after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-teal-500 border border-gray-600"></div>
              </label>
            </div>

            {/* Image Upload */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-300 uppercase tracking-wider ml-1">
                Images (Max 5)
              </label>
              <div className="space-y-4">
                <label className="w-full flex flex-col items-center justify-center px-4 py-8 bg-white/5 text-gray-400 rounded-2xl border-2 border-white/10 border-dashed cursor-pointer hover:border-emerald-500/50 hover:bg-white/10 transition-all group">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg">
                    <Image className="w-8 h-8 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-sm font-medium group-hover:text-emerald-300 transition-colors">Click To Upload Images</span>
                  <span className="text-xs text-gray-600 mt-1">JPG or PNG up to 5MB each</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>

                {selectedImages.length > 0 && (
                  <div className={`${selectedImages.length === 1 ? '' : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4'}`}>
                    {selectedImages.map((image, index) => (
                      <div key={index} className={`relative group overflow-hidden glass-card rounded-2xl ${selectedImages.length === 1
                        ? 'w-full max-w-2xl mx-auto'
                        : 'aspect-square'
                        }`}>
                        <img
                          src={image.url}
                          alt={`Preview ${index + 1}`}
                          className={`w-full object-cover ${selectedImages.length === 1
                            ? 'h-auto max-h-[500px] object-contain bg-black/5'
                            : 'h-full'
                            }`}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-full transform scale-0 group-hover:scale-100 transition-all"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Publish Post first, Cancel second, in separate rows with reduced width */}
            <div className="flex flex-col items-center gap-3 pt-8 border-t border-gray-700/30">
              <button
                type="submit"
                disabled={loading || !formData.title || (!['qna', 'polling'].includes(formData.category) && !formData.content) || !formData.category}
                className="w-full max-w-xs relative overflow-hidden bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3.5 rounded-xl font-bold text-base shadow-lg hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Publishing...' : 'Publish Post'}
                  {!loading && <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full max-w-xs py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-bold text-sm text-center"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Review Submission Popup Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 sm:p-8 rounded-3xl border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center relative overflow-hidden">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-center mx-auto mb-5 text-emerald-400">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">
              Post Submitted for Review!
            </h3>

            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Your post has been pre-checked by AI and sent to our admin team for review. It will be published to the community feed as soon as an admin approves it.
            </p>

            <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 mb-6 text-xs text-gray-400 flex items-center justify-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Reviews are typically processed quickly by admins.</span>
            </div>

            <button
              onClick={() => {
                setShowReviewModal(false);
                navigate('/');
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg transition-all"
            >
              Got it, go to feed
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;