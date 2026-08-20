import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ArrowLeft, Save, X, Plus, Loader2 } from 'lucide-react';
import { SONG_CATEGORIES, SONG_LANGUAGES, SONG_TAGS, SONG_BOOKS } from '../constants';

const BLANK = {
  title: '',
  titleSearch: '',
  author: '',
  authorSearch: '',
  language: 'Odia',
  lyrics: '',
  lyricsSearch: '',
  category: 'BHAJAN',
  tags: [],
  searchKeywords: '',
  contentType: 'text',
  pageImages: [],
  pdfFiles: [],
  bookSource: '',
  pageNumber: '',
  notes: '',
};

export default function AddEditSong() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { songs, createSong, editSong } = useApp();
  const existing = id ? songs.find(s => s.id === id) : null;
  const isEdit = !!existing;

  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (existing) {
      setForm({
        ...BLANK,
        ...existing,
        tags: existing.tags || [],
        pageImages: existing.pageImages || [],
        pdfFiles: existing.pdfFiles || [],
      });
    }
  }, [existing?.id]);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(f => ({ ...f, [k]: val }));
  };

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAddTag = (tag) => {
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (form.pageImages.length + files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const newImages = [];
    for (const file of files) {
      if (file.size > 500 * 1024) {
        alert(`${file.name} is too large. Maximum 500KB per image.`);
        continue;
      }
      const dataUrl = await compressImage(file);
      newImages.push(dataUrl);
    }

    setForm(f => ({ ...f, pageImages: [...f.pageImages, ...newImages] }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxSize = 800;
          let { width, height } = img;
          
          if (width > height && width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          } else if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePdfUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (form.pdfFiles.length + files.length > 2) {
      alert('Maximum 2 PDFs allowed');
      return;
    }

    const newPdfs = [];
    for (const file of files) {
      if (file.size > 1024 * 1024) {
        alert(`${file.name} is too large. Maximum 1MB per PDF.`);
        continue;
      }
      const dataUrl = await fileToDataUrl(file);
      newPdfs.push(dataUrl);
    }

    setForm(f => ({ ...f, pdfFiles: [...f.pdfFiles, ...newPdfs] }));
  };

  const fileToDataUrl = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.title.trim()) {
      showToast('err', 'Title is required');
      return;
    }
    if (!form.titleSearch.trim()) {
      showToast('err', 'Title Search (English transliteration) is required');
      return;
    }
    if (!form.category) {
      showToast('err', 'Category is required');
      return;
    }
    if (!form.lyrics && form.pageImages.length === 0 && form.pdfFiles.length === 0) {
      showToast('err', 'Please add lyrics, images, or PDFs');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...form,
        pageNumber: form.pageNumber ? parseInt(form.pageNumber) : null,
        contentType: form.pageImages.length > 0 && form.pdfFiles.length > 0 ? 'mixed' :
                     form.pageImages.length > 0 ? 'image' :
                     form.pdfFiles.length > 0 ? 'pdf' : 'text',
      };

      if (isEdit) {
        await editSong(id, data);
        showToast('ok', 'Song updated successfully!');
        setTimeout(() => navigate(`/songs/${id}`), 1200);
      } else {
        const song = await createSong(data);
        showToast('ok', 'Song added successfully!');
        setTimeout(() => navigate(`/songs/${song.id}`), 1200);
      }
    } catch (err) {
      showToast('err', err.message || 'Something went wrong');
      setSaving(false);
    }
  };

  const inp = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent";
  const sel = inp;

  return (
    <div className="max-w-2xl space-y-4">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold transition-all
          ${toast.type === 'ok' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'ok' ? '✓' : '✕'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-50 py-2 -mx-1 px-1 flex items-center gap-3">
        <button onClick={() => navigate(isEdit ? `/songs/${id}` : '/songs')}
          className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 bg-white border border-gray-200 hover:border-gray-300 px-3 py-2 rounded-xl shadow-sm transition-colors font-medium text-sm flex-shrink-0">
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-900 truncate">{isEdit ? `Edit — ${existing?.title}` : 'Add New Song'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
        {/* Basic Info */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Basic Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input value={form.title} onChange={set('title')} required
                placeholder="Original language title (e.g., ରାଧେ ରାଧେ)" className={inp} />
            </div>
            <div className="col-span-1 sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title Search (English) <span className="text-red-500">*</span>
              </label>
              <input value={form.titleSearch} onChange={set('titleSearch')} required
                placeholder="English transliteration (e.g., radhe radhe)" className={inp} />
              <p className="text-xs text-gray-400 mt-1">Required for search. Type the English version of the title.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Category <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={set('category')} className={sel} required>
                {Object.entries(SONG_CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Language</label>
              <select value={form.language} onChange={set('language')} className={sel}>
                {SONG_LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Author</label>
              <input value={form.author} onChange={set('author')}
                placeholder="Original language author" className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Author Search (English)</label>
              <input value={form.authorSearch} onChange={set('authorSearch')}
                placeholder="English transliteration" className={inp} />
            </div>
          </div>
        </div>

        {/* Lyrics */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Lyrics</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Original Lyrics</label>
            <textarea value={form.lyrics} onChange={set('lyrics')} rows={8}
              placeholder="Type or paste lyrics in original language…" className={`${inp} resize-none font-medium`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">English Transliteration</label>
            <textarea value={form.lyricsSearch} onChange={set('lyricsSearch')} rows={6}
              placeholder="English transliteration for search…" className={`${inp} resize-none`} />
            <p className="text-xs text-gray-400 mt-1">Helps users find this song when searching in English.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Keywords</label>
            <input value={form.searchKeywords} onChange={set('searchKeywords')}
              placeholder="Extra English keywords (e.g., krishna, morning, aarti)" className={inp} />
          </div>
        </div>

        {/* Attachments */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Attachments</h2>
          
          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Scanned Pages (Images) — {form.pageImages.length}/5
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.pageImages.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt={`Page ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pageImages: f.pageImages.filter((_, idx) => idx !== i) }))}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
            {form.pageImages.length < 5 && (
              <label className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 cursor-pointer">
                <Plus size={16} />
                Add Image
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </div>

          {/* PDFs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              PDF Documents — {form.pdfFiles.length}/2
            </label>
            <div className="space-y-2 mb-2">
              {form.pdfFiles.map((pdf, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-600 truncate">PDF {i + 1}</span>
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, pdfFiles: f.pdfFiles.filter((_, idx) => idx !== i) }))}
                    className="text-red-500 hover:text-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            {form.pdfFiles.length < 2 && (
              <label className="flex items-center gap-2 text-sm text-sky-600 hover:text-sky-800 cursor-pointer">
                <Plus size={16} />
                Add PDF
                <input type="file" accept=".pdf" multiple onChange={handlePdfUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Book Reference */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Book Reference</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Book Source</label>
              <select value={form.bookSource} onChange={set('bookSource')} className={sel}>
                <option value="">— Select book —</option>
                {SONG_BOOKS.map(book => (
                  <option key={book} value={book}>{book}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Page Number</label>
              <input type="number" value={form.pageNumber} onChange={set('pageNumber')}
                placeholder="Page number" className={inp} />
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {form.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 text-xs text-sky-600 bg-sky-50 px-2.5 py-1 rounded-full">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-sky-800">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(tagInput); } }}
              placeholder="Add tag…" className={`${inp} flex-1`} />
            <button type="button" onClick={() => handleAddTag(tagInput)}
              className="px-3 py-2 bg-sky-100 text-sky-700 rounded-xl text-sm font-medium hover:bg-sky-200 transition-colors">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SONG_TAGS.filter(t => !form.tags.includes(t)).map(tag => (
              <button key={tag} type="button" onClick={() => handleAddTag(tag)}
                className="text-xs text-gray-500 hover:text-sky-600 bg-gray-100 hover:bg-sky-50 px-2 py-1 rounded transition-colors">
                + {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Notes</h2>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Additional notes…" className={`${inp} resize-none`} />
        </div>

        {/* Submit */}
        <div className="p-5 flex gap-3">
          <button type="submit" disabled={saving || toast?.type === 'ok'}
            className="flex-1 flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60">
            {saving && !toast ? (
              <Loader2 size={16} className="animate-spin" />
            ) : <Save size={16} />}
            {saving && !toast ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Song'}
          </button>
          <button type="button" onClick={() => navigate(isEdit ? `/songs/${id}` : '/songs')}
            className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
