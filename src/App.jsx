import React, { useEffect, useMemo, useState } from 'react';
import { api, fileUrl } from './api';
import { BookOpen, Bookmark, Check, ChevronDown, CloudUpload, Download, FileText, Filter, GraduationCap, Heart, LayoutGrid, LogIn, LogOut, Menu, Plus, Search, ShieldCheck, Sparkles, Star, Trash2, TrendingUp, Upload, X, File, FolderOpen, BookMarked, LibraryBig, ArrowUpRight, SlidersHorizontal } from 'lucide-react';

const subjects = ['All', 'Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Economics', 'Other'];
const levels = ['All', 'School', 'Diploma', 'Undergraduate', 'Postgraduate', 'Other'];
const fmt = bytes => bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
const date = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const initialAuth = { name: '', email: '', password: '' };

export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('nn_user')); } catch { return null; } });
  const [notes, setNotes] = useState([]);
  const [mine, setMine] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [view, setView] = useState('discover');
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All');
  const [level, setLevel] = useState('All');
  const [sort, setSort] = useState('recent');
  const [authMode, setAuthMode] = useState('');
  const [auth, setAuth] = useState(initialAuth);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', subject: 'Computer Science', educationLevel: 'Undergraduate', description: '', tags: '', file: null });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [reportNote, setReportNote] = useState(null);
  const [reportReason, setReportReason] = useState('Incorrect or misleading content');

  const flash = msg => { setNotice(msg); window.setTimeout(() => setNotice(''), 4000); };
  async function loadNotes() {
    try {
      const q = new URLSearchParams({ search, subject, level, sort });
      const d = await api(`/notes?${q}`); setNotes(d.notes || []);
    } catch (e) { flash(e.message); }
  }
  async function loadPersonal() {
    if (!user) return;
    try {
      const [a, b] = await Promise.all([api('/notes/mine'), api('/notes/bookmarks')]);
      setMine(a.notes || []); setBookmarks(b.notes || []);
    } catch (e) { flash(e.message); }
  }
  useEffect(() => { const t = window.setTimeout(loadNotes, 250); return () => window.clearTimeout(t); }, [search, subject, level, sort]);
  useEffect(() => { loadPersonal(); }, [user]);
  const allCount = useMemo(() => notes.length, [notes]);
  const go = v => { setView(v); setMobileNav(false); };
  async function authSubmit(e) {
    e.preventDefault(); setBusy(true);
    try {
      const d = await api(`/auth/${authMode}`, { method: 'POST', body: JSON.stringify(auth) });
      localStorage.setItem('nn_token', d.token); localStorage.setItem('nn_user', JSON.stringify(d.user));
      setUser(d.user); setAuthMode(''); setAuth(initialAuth); flash(`Welcome to NoteNest, ${d.user.name}!`);
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  }
  function logout() {
    localStorage.removeItem('nn_token'); localStorage.removeItem('nn_user'); setUser(null); setMine([]); setBookmarks([]); go('discover'); flash('Signed out successfully.');
  }
  async function uploadSubmit(e) {
    e.preventDefault(); if (!uploadData.file) return flash('Please select a file first.');
    const body = new FormData();
    Object.entries(uploadData).forEach(([k, v]) => { if (v !== null) body.append(k, v); });
    setBusy(true);
    try {
      await api('/notes', { method: 'POST', body });
      setUploadOpen(false); setUploadData({ title: '', subject: 'Computer Science', educationLevel: 'Undergraduate', description: '', tags: '', file: null });
      flash('Your notes have been shared!'); await loadNotes(); await loadPersonal();
    } catch (e) { flash(e.message); } finally { setBusy(false); }
  }
  async function toggleBookmark(note) {
    if (!user) return openAuth('login');
    try { const d = await api(`/notes/${note._id}/bookmark`, { method: 'POST' }); flash(d.bookmarked ? 'Added to saved notes.' : 'Removed from saved notes.'); await loadNotes(); await loadPersonal(); }
    catch (e) { flash(e.message); }
  }
  async function toggleLike(note) {
    if (!user) return openAuth('login');
    try { await api(`/notes/${note._id}/like`, { method: 'POST' }); await loadNotes(); await loadPersonal(); }
    catch (e) { flash(e.message); }
  }
  async function downloadNote(note) {
    try {
      const res = await fetch(fileUrl(`/notes/${note._id}/download`));
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Download failed.'); }
      const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = note.originalName || 'notes'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      flash('Download started.'); await loadNotes(); await loadPersonal();
    } catch (e) { flash(e.message); }
  }
  async function deleteNote(note) {
    if (!window.confirm(`Delete "${note.title}"? This cannot be undone.`)) return;
    try { await api(`/notes/${note._id}`, { method: 'DELETE' }); flash('Note deleted.'); await loadNotes(); await loadPersonal(); }
    catch (e) { flash(e.message); }
  }
  async function reportSubmit(e) {
    e.preventDefault();
    try { const d = await api(`/notes/${reportNote._id}/report`, { method: 'POST', body: JSON.stringify({ reason: reportReason }) }); flash(d.message); setReportNote(null); }
    catch (e) { flash(e.message); }
  }
  function openAuth(mode) { setAuthMode(mode); setAuth(initialAuth); }

  const shown = view === 'mine' ? mine : view === 'saved' ? bookmarks : notes;
  const heading = view === 'discover' ? 'Discover notes' : view === 'mine' ? 'My uploads' : 'Saved notes';
  const subheading = view === 'discover' ? 'Good notes make great things possible.' : view === 'mine' ? 'Your shared knowledge, all in one place.' : 'Your personal collection of useful resources.';
  const isSaved = id => bookmarks.some(n => n._id === id);
  const isLiked = note => user && note.likes?.some(id => String(id) === String(user.id));

  return <div className="app">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a href="#" className="logo" onClick={e => { e.preventDefault(); go('discover'); }}><span className="logo-mark"><BookOpen size={22}/></span><span>note<span>nest</span><small>SHARE WHAT YOU KNOW</small></span></a>
      <div className="side-label">LIBRARY</div>
      <button className={`side-link ${view === 'discover' ? 'selected' : ''}`} onClick={() => go('discover')}><LayoutGrid size={18}/> Discover <span className="side-count">{allCount}</span></button>
      <button className={`side-link ${view === 'mine' ? 'selected' : ''}`} onClick={() => user ? go('mine') : openAuth('login')}><CloudUpload size={18}/> My uploads</button>
      <button className={`side-link ${view === 'saved' ? 'selected' : ''}`} onClick={() => user ? go('saved') : openAuth('login')}><Bookmark size={18}/> Saved notes</button>
      <div className="sidebar-divider"></div>
      <div className="side-label">SUBJECTS</div>
      {subjects.slice(1).map((s, i) => <button key={s} className={`subject-link ${subject === s && view === 'discover' ? 'subject-active' : ''}`} onClick={() => { setSubject(s); go('discover'); }}><span className={`subject-dot dot-${i}`}></span>{s}</button>)}
      <div className="sidebar-bottom"><div className="tip-card"><span><Sparkles size={17}/></span><b>Knowledge grows<br/>when it's shared.</b><p>One upload could help someone ace their next exam.</p><button onClick={() => user ? setUploadOpen(true) : openAuth('register')}>Share notes <ArrowUpRight size={14}/></button></div><div className="sidebar-foot"><ShieldCheck size={14}/> Learn together, respectfully.</div></div>
    </aside>
    {mobileNav && <button className="mobile-shade" onClick={() => setMobileNav(false)} aria-label="Close menu"></button>}
    <div className="main-area">
      <header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(!mobileNav)} aria-label="Open navigation"><Menu/></button><div className="crumb"><span>Library</span><b>/</b><strong>{heading}</strong></div><div className="top-actions">{user ? <><button className="upload-top" onClick={() => setUploadOpen(true)}><Plus size={17}/> Upload notes</button><div className="user-menu"><span className="user-avatar">{user.name?.[0]?.toUpperCase()}</span><span className="user-name">{user.name}<small>Student member</small></span><button className="icon-btn" onClick={logout} title="Sign out"><LogOut size={17}/></button></div></> : <><button className="btn-login" onClick={() => openAuth('login')}>Log in</button><button className="upload-top" onClick={() => openAuth('register')}>Join free <ArrowUpRight size={16}/></button></>}</div></header>
      {notice && <div className="toast"><Check size={16}/>{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
      <main className="content">
        {view === 'discover' && <section className="welcome-banner"><div className="banner-text"><span className="banner-pill"><Sparkles size={13}/> YOUR STUDY SPACE</span><h1>Learn better.<br/><em>Together.</em></h1><p>Discover notes shared by students like you.<br/>Find your next “aha!” moment.</p><button className="banner-btn" onClick={() => document.getElementById('notes-grid')?.scrollIntoView({ behavior: 'smooth' })}>Explore the library <ArrowUpRight size={16}/></button></div><div className="banner-illustration"><div className="illus-circle"></div><div className="illus-sheet sheet-back"><span></span><span></span><span></span><span></span></div><div className="illus-sheet sheet-front"><div className="illus-doc-icon"><FileText size={28}/></div><b>Study notes</b><span className="sheet-line"></span><span className="sheet-line short"></span><span className="sheet-line"></span><span className="sheet-line mid"></span><div className="sheet-check"><Check size={14}/></div></div><div className="float-chip chip-one"><BookMarked size={16}/> Made to share</div><div className="float-chip chip-two"><Star size={15} fill="currentColor"/> Student picks</div><div className="spark spark-one">✳</div><div className="spark spark-two">✳</div></div><div className="banner-index">01 <span>/ 03</span></div></section>}
        <section className="library-section" id="notes-grid"><div className="section-title"><div><div className="overline">{view === 'discover' ? 'THE COMMUNITY LIBRARY' : 'YOUR COLLECTION'}</div><h2>{heading}<span className="title-period">.</span></h2><p>{subheading}</p></div>{view === 'discover' && <div className="sort-select"><SlidersHorizontal size={15}/><select value={sort} onChange={e => setSort(e.target.value)}><option value="recent">Recently added</option><option value="popular">Most downloaded</option><option value="liked">Most liked</option></select><ChevronDown size={14}/></div>}</div>
          {view === 'discover' && <div className="search-filter"><label className="search-input"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes, subjects, topics..."/>{search && <button onClick={() => setSearch('')}><X size={15}/></button>}<kbd>⌕</kbd></label><label className="filter-select"><Filter size={16}/><select value={level} onChange={e => setLevel(e.target.value)}>{levels.map(l => <option key={l} value={l}>{l === 'All' ? 'All levels' : l}</option>)}</select><ChevronDown size={14}/></label><span className="showing-count">{notes.length} results</span></div>}
          {shown.length ? <div className="notes-grid">{shown.map(note => <article className="note-card" key={note._id}><div className={`file-preview file-${(note.originalName.split('.').pop() || 'pdf').toLowerCase()}`}><div className="preview-top"><span className="file-type">{(note.originalName.split('.').pop() || 'FILE').toUpperCase()}</span><button className={`bookmark-btn ${isSaved(note._id) ? 'bookmarked' : ''}`} onClick={() => toggleBookmark(note)} aria-label="Save note"><Bookmark size={17} fill={isSaved(note._id) ? 'currentColor' : 'none'}/></button></div><div className="preview-document"><div className="preview-logo"><BookOpen size={19}/></div><span className="preview-heading">{note.title}</span><span className="preview-rule"></span><span className="preview-line"></span><span className="preview-line short"></span><span className="preview-line"></span><span className="preview-line medium"></span><div className="preview-stamp"><FileText size={24}/></div></div><span className="file-size">{fmt(note.size)}</span></div><div className="note-card-body"><div className="note-category"><span className="category-dot"></span>{note.subject}<span className="category-sep">·</span>{note.educationLevel}</div><h3>{note.title}</h3><p className="note-description">{note.description || 'A shared learning resource. Open the details and explore the material.'}</p>{note.tags?.length > 0 && <div className="tag-list">{note.tags.slice(0, 3).map(tag => <span key={tag}>#{tag}</span>)}</div>}<div className="note-author"><span className="author-avatar">{note.uploader?.name?.[0]?.toUpperCase() || 'N'}</span><span><b>{note.uploader?.name || 'Student'}</b><small>{date(note.createdAt)}</small></span><button className={`like-btn ${isLiked(note) ? 'liked' : ''}`} onClick={() => toggleLike(note)} title="Like note"><Heart size={15} fill={isLiked(note) ? 'currentColor' : 'none'}/>{note.likes?.length || 0}</button></div><div className="note-card-footer"><span><Download size={14}/>{note.downloads || 0} downloads</span><div>{user && user.id === (note.uploader?._id || note.uploader) && <button className="card-icon-btn delete-btn" onClick={() => deleteNote(note)} title="Delete"><Trash2 size={15}/></button>}{user && user.id !== (note.uploader?._id || note.uploader) && <button className="card-icon-btn" onClick={() => { setReportNote(note); setReportReason('Incorrect or misleading content'); }} title="Report"><ShieldCheck size={15}/></button>}<button className="download-btn" onClick={() => downloadNote(note)}><Download size={15}/> Download</button></div></div></div></article>)}</div> : <div className="empty-state"><div className="empty-icon"><FolderOpen size={27}/></div><h3>{view === 'discover' ? 'Your next great note is out there.' : view === 'mine' ? 'Your uploads will live here.' : 'Save a note for later.'}</h3><p>{view === 'discover' ? 'No notes match these filters yet. Try another search or be the first to share.' : view === 'mine' ? 'Share your study material and help someone learn something new.' : 'Bookmark notes from the library to build your personal study collection.'}</p>{view === 'discover' && (search || subject !== 'All' || level !== 'All') ? <button className="btn-reset" onClick={() => { setSearch(''); setSubject('All'); setLevel('All'); }}>Clear filters</button> : <button className="empty-cta" onClick={() => user ? setUploadOpen(true) : openAuth('register')}>{view === 'mine' || view === 'discover' ? 'Upload your first note' : 'Explore library'} <ArrowUpRight size={15}/></button>}</div>}
        </section>
        {view === 'discover' && <section className="bottom-promo"><div className="promo-icon"><GraduationCap size={24}/></div><div><b>Have notes that helped you?</b><p>Pass the good stuff forward. Someone else might need exactly what you know.</p></div><button onClick={() => user ? setUploadOpen(true) : openAuth('register')}>Share your notes <ArrowUpRight size={15}/></button></section>}
        <footer className="footer"><a href="#" className="footer-logo" onClick={e => { e.preventDefault(); go('discover'); }}><BookOpen size={17}/> note<span>nest</span></a><span>Knowledge is better when shared.</span><span>© 2026 NoteNest</span></footer>
      </main>
    </div>

    {authMode && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setAuthMode('')}><div className="modal"><button className="modal-close" onClick={() => setAuthMode('')}><X/></button><div className="modal-logo"><BookOpen/></div><div className="overline">WELCOME TO NOTENEST</div><h2>{authMode === 'login' ? 'Welcome back.' : 'Join the study circle.'}</h2><p className="modal-sub">{authMode === 'login' ? 'Pick up where your learning left off.' : 'Create an account and start sharing knowledge.'}</p><form className="form-stack" onSubmit={authSubmit}>{authMode === 'register' && <label>Full name<input required minLength="2" value={auth.name} onChange={e => setAuth({ ...auth, name: e.target.value })} placeholder="Your name"/></label>}<label>Email address<input type="email" required value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength="8" value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} placeholder="At least 8 characters"/></label><button className="primary-submit" disabled={busy}>{busy ? 'Please wait...' : authMode === 'login' ? 'Log in to NoteNest' : 'Create free account'} <ArrowUpRight size={16}/></button></form><p className="switch-auth">{authMode === 'login' ? 'New here?' : 'Already have an account?'} <button onClick={() => openAuth(authMode === 'login' ? 'register' : 'login')}>{authMode === 'login' ? 'Create an account' : 'Log in'}</button></p><div className="secure-note"><ShieldCheck size={14}/> Your password is hashed before it is stored.</div></div></div>}

    {uploadOpen && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setUploadOpen(false)}><div className="modal upload-modal"><button className="modal-close" onClick={() => setUploadOpen(false)}><X/></button><div className="overline">GIVE KNOWLEDGE A NEW HOME</div><h2>Share your notes<span className="title-period">.</span></h2><p className="modal-sub">Add a little context so others can find your resource.</p><form className="form-stack" onSubmit={uploadSubmit}><label>Notes title<input required maxLength="140" value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} placeholder="e.g. Operating Systems — Unit 2"/></label><div className="form-two"><label>Subject<select value={uploadData.subject} onChange={e => setUploadData({ ...uploadData, subject: e.target.value })}>{subjects.slice(1).map(s => <option key={s}>{s}</option>)}</select></label><label>Education level<select value={uploadData.educationLevel} onChange={e => setUploadData({ ...uploadData, educationLevel: e.target.value })}>{levels.slice(1).map(s => <option key={s}>{s}</option>)}</select></label></div><label>Description<textarea rows="3" maxLength="1200" value={uploadData.description} onChange={e => setUploadData({ ...uploadData, description: e.target.value })} placeholder="What will other students learn from these notes?"/></label><label>Tags <small>(comma-separated)</small><input value={uploadData.tags} onChange={e => setUploadData({ ...uploadData, tags: e.target.value })} placeholder="exam, semester, revision"/></label><label className="file-drop"><input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md" onChange={e => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}/><span className="file-drop-icon"><Upload size={22}/></span><b>{uploadData.file ? uploadData.file.name : 'Click to choose your notes file'}</b><small>{uploadData.file ? `${fmt(uploadData.file.size)} · Selected` : 'PDF, DOC, DOCX, PPT, PPTX, TXT, MD · Max 15 MB'}</small></label><div className="form-tip"><ShieldCheck size={15}/> Only share materials you have permission to distribute.</div><button className="primary-submit" disabled={busy}>{busy ? 'Uploading...' : 'Publish notes'} <CloudUpload size={17}/></button></form></div></div>}

    {reportNote && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setReportNote(null)}><div className="modal report-modal"><button className="modal-close" onClick={() => setReportNote(null)}><X/></button><div className="overline">KEEP THE LIBRARY HELPFUL</div><h2>Report this note</h2><p className="modal-sub">Tell us why this resource needs review.</p><form className="form-stack" onSubmit={reportSubmit}><label>Reason<select value={reportReason} onChange={e => setReportReason(e.target.value)}><option>Incorrect or misleading content</option><option>Copyright concern</option><option>Spam or advertising</option><option>Inappropriate content</option><option>Other</option></select></label><button className="primary-submit">Submit report <ArrowUpRight size={16}/></button></form></div></div>}
  </div>;
}
