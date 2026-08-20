import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Edit, Trash2, Share2, Copy, Check, ChevronDown, ChevronUp, X, ZoomIn } from 'lucide-react';
import { SONG_CATEGORIES } from '../constants';

export default function SongDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs, deleteSong } = useApp();
  const [showEnglish, setShowEnglish] = useState(false);
  const [copied, setCopied] = useState(null);
  const [previewImg, setPreviewImg] = useState(null);

  const song = songs.find(s => s.id === id);

  useEffect(() => {
    if (!song) navigate('/songs');
  }, [song, navigate]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setPreviewImg(null); };
    if (previewImg) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [previewImg]);

  if (!song) return null;

  const handleDelete = () => {
    if (window.confirm(`Delete "${song.title}"? This cannot be undone.`)) {
      deleteSong(id);
      navigate('/songs');
    }
  };

  const base64ToBlob = (base64) => {
    const parts = base64.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const raw = atob(parts[1]);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type: mime });
  };

  const handleShare = async () => {
    const shareText = `${song.title} - ${song.author || 'Unknown'}\n\n${song.lyrics || ''}`;

    if (navigator.share && song.pageImages?.length > 0) {
      try {
        const files = song.pageImages.slice(0, 4).map((img, i) => {
          const blob = base64ToBlob(img);
          return new File([blob], `page-${i + 1}.jpg`, { type: 'image/jpeg' });
        });
        await navigator.share({
          title: song.title,
          text: shareText,
          files,
        });
        return;
      } catch (e) {
        // user cancelled or file share not supported — fall through to text share
      }
    }

    if (navigator.share) {
      await navigator.share({ title: song.title, text: shareText }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      setCopied('lyrics');
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const category = song.category ? SONG_CATEGORIES[song.category] : null;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/songs')} className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm">
          <ArrowLeft size={16} /> Songs
        </button>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/songs/${id}/edit`)}
            className="flex items-center gap-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm px-3 py-2 rounded-lg">
            <Edit size={14} /> Edit
          </button>
          <button onClick={handleDelete}
            className="flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Song Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header section */}
        <div className="bg-gradient-to-r from-sky-50 to-sky-50 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{song.title}</h1>
              {song.titleSearch && (
                <p className="text-sm text-gray-500 mt-0.5">{song.titleSearch}</p>
              )}
              {song.author && (
                <p className="text-sm text-gray-600 mt-1">
                  by {song.author}
                  {song.authorSearch && <span className="text-gray-400"> ({song.authorSearch})</span>}
                </p>
              )}
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 text-sm px-3 py-2 rounded-xl transition-colors"
            >
              <Share2 size={14} /> Share
            </button>
          </div>

          {/* Badges */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {category && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${category.bg} ${category.text}`}>
                {category.label}
              </span>
            )}
            {song.language && (
              <span className="text-xs text-gray-600 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                {song.language}
              </span>
            )}
            {song.bookSource && (
              <span className="text-xs text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                📖 {song.bookSource}
                {song.pageNumber && ` p.${song.pageNumber}`}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {song.tags && song.tags.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="flex gap-1.5 flex-wrap">
              {song.tags.map(tag => (
                <span key={tag} className="text-xs text-sky-600 bg-sky-50 px-2 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lyrics section */}
        {song.lyrics && (
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Lyrics</h3>
              <button
                onClick={() => handleCopy(song.lyrics, 'lyrics')}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-sky-600 transition-colors"
              >
                {copied === 'lyrics' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                {copied === 'lyrics' ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">
              {song.lyrics}
            </div>
          </div>
        )}

        {/* English transliteration (collapsible) */}
        {song.lyricsSearch && (
          <div className="border-b border-gray-100">
            <button
              onClick={() => setShowEnglish(!showEnglish)}
              className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">English Transliteration</span>
              {showEnglish ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {showEnglish && (
              <div className="px-5 pb-4">
                <div className="flex items-center justify-end mb-2">
                  <button
                    onClick={() => handleCopy(song.lyricsSearch, 'english')}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-sky-600 transition-colors"
                  >
                    {copied === 'english' ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copied === 'english' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {song.lyricsSearch}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page images — clickable */}
        {song.pageImages && song.pageImages.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Scanned Pages</h3>
            <div className="grid grid-cols-2 gap-2">
              {song.pageImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setPreviewImg(img)}
                  className="rounded-lg overflow-hidden border border-gray-200 hover:ring-2 hover:ring-sky-300 transition-all relative group cursor-pointer"
                >
                  <img src={img} alt={`Page ${i + 1}`} className="w-full h-auto" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <ZoomIn size={24} className="text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PDFs */}
        {song.pdfFiles && song.pdfFiles.length > 0 && (
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">PDF Documents</h3>
            <div className="space-y-2">
              {song.pdfFiles.map((pdf, i) => (
                <a key={i} href={pdf} download={`song-${i + 1}.pdf`}
                  className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 transition-colors">
                  📄 Download PDF {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Search keywords */}
        {song.searchKeywords && (
          <div className="px-5 py-3 border-b border-gray-100">
            <div className="text-xs text-gray-400">
              <span className="font-medium">Search keywords:</span> {song.searchKeywords}
            </div>
          </div>
        )}

        {/* Notes */}
        {song.notes && (
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{song.notes}</p>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="text-xs text-gray-400 text-center">
        Added {new Date(song.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        {song.updatedAt !== song.createdAt && (
          <> · Updated {new Date(song.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>
        )}
      </div>

      {/* Fullscreen image preview */}
      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setPreviewImg(null)}
        >
          <button
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <X size={28} />
          </button>
          <img
            src={previewImg}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
