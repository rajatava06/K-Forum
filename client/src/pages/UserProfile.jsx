import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/axiosSetup';
import toast from 'react-hot-toast';
import { User, Book, Code, Mail, Calendar, Flame, Trophy, Target, ArrowLeft } from 'lucide-react';
import PostCard from '../components/Posts/PostCard';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          axios.get(`/api/users/${id}`),
          axios.get(`/api/users/${id}/posts?page=${currentPage}`)
        ]);

        setUser(userResponse.data);
        setPosts(postsResponse.data.posts);
        setTotalPages(postsResponse.data.totalPages);
      } catch (error) {
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id, currentPage]);

  const handlePostDelete = (deletedPostId) => {
    setPosts(posts.filter(post => post._id !== deletedPostId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#17d059] border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">User Not Found</div>
      </div>
    );
  }

  const wordleStreak = user.wordleStreak || { current: 0, max: 0, totalWins: 0 };

  return (
    <div className="min-h-screen py-4 sm:py-8 px-2 sm:px-4">
      <div className="max-w-4xl mx-auto">
        {/* Top Header with Back Button */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-gray-300 hover:text-white border border-white/10 text-sm font-semibold transition-all shadow-md"
          >
            <ArrowLeft className="w-4 h-4 text-[#17d059]" />
            <span>Back</span>
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-8 shadow-xl border border-white/10 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-gradient-to-r from-[#17d059] to-emerald-600 rounded-full flex items-center justify-center overflow-hidden p-0.5 shadow-lg shadow-emerald-500/20 border-2 border-emerald-500/30">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
              )}
            </div>
            <div className="flex-1 w-full min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2 truncate">
                {user.name}
              </h1>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                {user.email && (
                  <div className="flex items-center justify-center sm:justify-start text-gray-300 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                    <Mail className="w-4 h-4 mr-2.5 text-[#17d059] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                )}
                {user.studentId && (
                  <div className="flex items-center justify-center sm:justify-start text-gray-300 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                    <Code className="w-4 h-4 mr-2.5 text-[#17d059] shrink-0" />
                    <span className="truncate">@{user.studentId}</span>
                  </div>
                )}
                {user.branch && (
                  <div className="flex items-center justify-center sm:justify-start text-gray-300 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                    <Book className="w-4 h-4 mr-2.5 text-[#17d059] shrink-0" />
                    <span className="truncate">{user.branch}</span>
                  </div>
                )}
                {user.year && (
                  <div className="flex items-center justify-center sm:justify-start text-gray-300 bg-white/5 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border border-white/5 sm:border-none">
                    <Calendar className="w-4 h-4 mr-2.5 text-[#17d059] shrink-0" />
                    <span>
                      {(() => {
                        const y = parseInt(user.year);
                        if (y === 1) return '1st';
                        if (y === 2) return '2nd';
                        if (y === 3) return '3rd';
                        if (y === 4) return '4th';
                        return `${user.year}th`;
                      })()} Year
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats and Wordle Streak */}
          <div className="mt-6 pt-6 border-t border-white/10">
            {/* Forum Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-6 bg-white/5 rounded-xl p-3 sm:p-4 border border-white/5 text-center mb-4">
              <div className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-bold text-[#17d059]">{user.postCount || 0}</span>
                <span className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">Posts</span>
              </div>
              <div className="flex flex-col items-center border-x border-white/10 px-1 sm:px-2">
                <span className="text-xl sm:text-2xl font-bold text-[#17d059]">{user.connectionCount || 0}</span>
                <span className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">Connections</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-bold text-[#17d059]">{user.reputation || 0}</span>
                <span className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">Reputation</span>
              </div>
            </div>

            {/* 🔥 Wordle Streak Display */}
            {wordleStreak.current > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-orange-500/20 via-red-500/15 to-orange-500/20 border border-orange-500/30">
                <div className="flex items-center gap-3">
                  <Flame
                    className="w-6 h-6 text-orange-400 animate-pulse shrink-0"
                    style={{ filter: 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.6))' }}
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-orange-400">{wordleStreak.current}</span>
                    <span className="text-gray-300 text-sm font-medium">Day Streak</span>
                  </div>
                  {wordleStreak.current >= 7 && (
                    <span className="px-2 py-0.5 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                      🔥
                    </span>
                  )}
                </div>

                {(wordleStreak.max > 0 || wordleStreak.totalWins > 0) && (
                  <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-400 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                    <div className="flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-purple-400" />
                      <span>Best: <span className="text-white font-semibold">{wordleStreak.max}</span></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Wins: <span className="text-white font-semibold">{wordleStreak.totalWins}</span></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* User's Posts */}
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Posts</h2>
          {posts.length > 0 ? (
            <>
              {posts.map(post => (
                <PostCard key={post._id} post={post} onDelete={handlePostDelete} />
              ))}
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-8">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${currentPage === page
                        ? 'bg-[#17d059] text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-8 bg-white/5 rounded-2xl border border-white/10">
              No posts yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;