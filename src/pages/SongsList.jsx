import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { Search, PlusCircle, Filter, Music, FileText, Image, File } from 'lucide-react';
import { SONG_CATEGORIES, SONG_LANGUAGES } from '../constants';

export default function SongsList() {
  const { songs, refreshSongs } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [catFilter, setCat] = useState('');
  const [langFilter, setLang] = useState('');
  const [showFilters, setShowF] = useState(false);

  useEffect(() => {
    refreshSongs();
  }, [refreshSongs]);

  const filtered = useMemo(() => {
    return songs
      .filter(s => {
        const q = search.toLowerCase();
        return !q || 
          s.title?.toLowerCase().includes(q) ||
          s.titleSearch?.toLowerCase().includes(q) ||
          s.author?.toLowerCase().includes(q) ||
          s.authorSearch?.toLowerCase().includes(q) ||
          s.lyrics?.toLowerCase().includes(q) ||
          s.lyricsSearch?.toLowerCase().includes(q) ||
          s.searchKeywords?.toLowerCase().includes(q) ||
          s.tags?.some(t => t.toLowerCase().includes(q));
      })
      .filter(s => !catFilter || s.category === catFilter)
      .filter(s => !langFilter || s.language === langFilter)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }, [songs, search, catFilter, langFilter]);

  const filtersActive = !!(catFilter || langFilter);

  const getContentTypeIcon = (type) => {
    switch (type) {
      case 'image': return <Image size={12} className="text-purple-500" />;
      case 'pdf': return <File size={12} className="text-red-500" />;
      case 'mixed': return <FileText size={12} className="text-blue-500" />;
      default: return <FileText size={12} className="text-gray-400" />;
    }
  };

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Songs</h1>
          <p className="text-sm text-gray-500">{filtered.length} of {songs.length} songs</p>
        </div>
        <button onClick={() => navigate('/songs/new')}
          className="flex items-center gap-2 bg-sky-500 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <PlusCircle size={16} /> Add Song
        </button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search in English (e.g., radhe radhe, krishna bhajan)…"
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400" />
        </div>
        <button onClick={() => setShowF(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
            filtersActive ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}>
          <Filter size={15} /> {filtersActive ? 'Filtered' : 'Filter'}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
            <select value={catFilter} onChange={e => setCat(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400">
              <option value="">All Categories</option>
              {Object.entries(SONG_CATEGORIES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Language</label>
            <select value={langFilter} onChange={e => setLang(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-sky-400">
              <option value="">All Languages</option>
              {SONG_LANGUAGES.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2 flex items-center justify-between border-t pt-3 mt-1">
            <span className="text-xs text-gray-500">
              {filtersActive ? `${filtered.length} results` : 'No filters active'}
            </span>
            <button onClick={() => { setCat(''); setLang(''); }}
              className="text-xs text-sky-700 hover:underline px-2 py-2">Clear all</button>
          </div>
        </div>
      )}

      {/* Songs list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
            <div className="text-4xl mb-2">🎵</div>
            <p className="text-gray-500 text-sm">No songs found</p>
            {search && <button onClick={() => setSearch('')} className="text-sky-700 text-sm mt-1 hover:underline">Clear search</button>}
            {!search && (
              <button onClick={() => navigate('/songs/new')} className="text-sky-700 text-sm mt-2 hover:underline">
                Add your first song
              </button>
            )}
          </div>
        ) : (
          filtered.map(song => (
            <button key={song.id} onClick={() => navigate(`/songs/${song.id}`)}
              className="w-full bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-all text-left hover:border-sky-100">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 flex-shrink-0">
                  <Music size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">{song.title}</span>
                    {song.titleSearch && (
                      <span className="text-xs text-gray-400">({song.titleSearch})</span>
                    )}
                  </div>
                  {song.author && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      by {song.author}
                      {song.authorSearch && <span className="text-gray-400"> ({song.authorSearch})</span>}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {song.category && SONG_CATEGORIES[song.category] && (
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${SONG_CATEGORIES[song.category].bg} ${SONG_CATEGORIES[song.category].text}`}>
                        {SONG_CATEGORIES[song.category].label}
                      </span>
                    )}
                    {song.language && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {song.language}
                      </span>
                    )}
                    {song.contentType && song.contentType !== 'text' && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        {getContentTypeIcon(song.contentType)}
                        {song.contentType}
                      </span>
                    )}
                  </div>
                  {song.lyrics && (
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{song.lyrics.slice(0, 100)}…</p>
                  )}
                  {song.tags && song.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {song.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                      {song.tags.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{song.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
