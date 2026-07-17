// src/components/SearchPeople.jsx
import React, { useState, useContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from './usercontext';
import axios from 'axios';
import {
  Search, Sparkles, Loader2, AlertCircle,
  MapPin, Briefcase, GraduationCap, User, X
} from 'lucide-react';

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(callback, delay) {
  const timerRef = React.useRef(null);
  return useCallback((...args) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

// ── Similarity Badge ──────────────────────────────────────────────────────────
function SimilarityBadge({ score, method }) {
  if (method === 'keyword') {
    return (
      <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
        Keyword match
      </span>
    );
  }
  if (score === null || score === undefined) return null;

  const percentage = Math.round(score * 100);
  let color = 'text-gray-500 bg-gray-100';
  if (percentage >= 70) color = 'text-green-700 bg-green-50 border border-green-200';
  else if (percentage >= 45) color = 'text-blue-700 bg-blue-50 border border-blue-200';
  else if (percentage >= 25) color = 'text-amber-700 bg-amber-50 border border-amber-200';

  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {percentage}% match
    </span>
  );
}

// ── Profile Result Card ───────────────────────────────────────────────────────
function ProfileCard({ result }) {
  const owner = result.owner;
  const hasPhoto = owner?.profile_picture?.url;

  return (
    <Link
      to={`/getprofile/${owner?._id}`}
      className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {hasPhoto ? (
          <img
            src={owner.profile_picture.url}
            alt={owner.display_name}
            className="w-12 h-12 rounded-full object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
            {owner?.display_name?.charAt(0).toUpperCase() || '?'}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
              {owner?.full_name || owner?.display_name || 'Unknown'}
            </h3>
            <SimilarityBadge score={result.similarityScore} method={result.searchMethod} />
          </div>

          {result.headline && (
            <p className="text-sm text-gray-600 mt-0.5 truncate">
              {result.headline}
            </p>
          )}

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {result.location && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin size={11} />
                {result.location}
              </span>
            )}
            {result.Experience?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <Briefcase size={11} />
                {result.Experience[0].title} at {result.Experience[0].company}
              </span>
            )}
            {result.Education?.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <GraduationCap size={11} />
                {result.Education[0].school}
              </span>
            )}
          </div>

          {result.bio && (
            <p className="text-xs text-gray-400 mt-2 line-clamp-2">
              {result.bio}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SearchPeople() {
  const { curruser } = useContext(UserContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchMethod, setSearchMethod] = useState('');
  const [totalResults, setTotalResults] = useState(0);

  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get(`/features/search`, {
        params: { query: searchQuery },
        withCredentials: true,
      });
      setResults(res.data.results || []);
      setSearchMethod(res.data.searchMethod || '');
      setTotalResults(res.data.totalResults || 0);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useDebounce(performSearch, 400);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    debouncedSearch(val);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Semantic Search</h1>
          </div>
          <p className="text-sm text-gray-500 ml-[42px]">
            Search by meaning, not just keywords — powered by AI embeddings
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={handleInputChange}
              placeholder='Try: "machine learning engineers in Bangalore" or "React developers"'
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Search Status */}
        {searched && !loading && (
          <div className="flex items-center justify-between mb-4 px-1">
            <p className="text-xs text-gray-500">
              {totalResults} result{totalResults !== 1 ? 's' : ''} found
              {searchMethod === 'semantic' && (
                <span className="ml-1.5 text-purple-600 font-medium">
                  • AI Semantic Search
                </span>
              )}
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-12">
            <Loader2 size={28} className="text-purple-500 animate-spin mb-3" />
            <p className="text-sm text-gray-500">Searching with AI...</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((result) => (
              <ProfileCard key={result._id} result={result} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && searched && results.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={20} className="text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              No profiles found
            </p>
            <p className="text-xs text-gray-400">
              Try different keywords or a broader search query
            </p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !searched && (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search size={22} className="text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">
              Search for people
            </p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Type a role, skill, company, university, or location — the AI understands
              meaning, so "ML engineer" will find "Machine Learning researcher" too.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
