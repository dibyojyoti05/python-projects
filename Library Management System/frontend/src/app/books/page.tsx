'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Trash2,
  Barcode,
  X,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function BooksPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedBookDetail, setSelectedBookDetail] = useState<any | null>(null);


  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newIsbn13, setNewIsbn13] = useState('');
  const [newPages, setNewPages] = useState(300);
  const [newAuthorId, setNewAuthorId] = useState<number | undefined>();
  const [newCategoryId, setNewCategoryId] = useState<number | undefined>();
  const [newPublisherId, setNewPublisherId] = useState<number | undefined>();
  const [newCopies, setNewCopies] = useState(2);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bList, cList, aList, pList] = await Promise.all([
        api.getBooks(searchQuery, selectedCategory),
        api.getCategories(),
        api.getAuthors(),
        api.getPublishers(),
      ]);
      setBooks(bList);
      setCategories(cList);
      setAuthors(aList);
      setPublishers(pList);
    } catch (err) {
      console.error('Error fetching catalog data', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleViewBook = async (id: number) => {
    try {
      const detail = await api.getBook(id);
      setSelectedBookDetail(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load book details');
    }
  };

  const handleDeleteBook = async (id: number, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteBook(id);
      setBooks((prev) => prev.filter((b) => b.id !== id));
      if (selectedBookDetail?.id === id) setSelectedBookDetail(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete book');
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload = {
        title: newTitle,
        subtitle: newSubtitle || undefined,
        isbn13: newIsbn13 || undefined,
        pages: Number(newPages),
        author_ids: newAuthorId ? [Number(newAuthorId)] : [],
        category_ids: newCategoryId ? [Number(newCategoryId)] : [],
        publisher_id: newPublisherId ? Number(newPublisherId) : undefined,
        initial_copies: Number(newCopies),
      };
      await api.createBook(payload);
      setShowAddModal(false);
      // Reset form
      setNewTitle('');
      setNewSubtitle('');
      setNewIsbn13('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Error creating book');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Catalog & Book Repository</h1>
          <p className="text-slate-400 text-sm mt-1">
            Browse physical titles, verify shelf locations, and manage barcode allocations.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-indigo-900/30"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Book</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearch} className="w-full md:max-w-md relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-500"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full sm:w-auto bg-slate-900 border border-slate-700 rounded-xl py-2 px-3.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            onClick={loadData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-sm font-medium transition"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <span className="text-sm">Retrieving books from database...</span>
          </div>
        ) : books.length === 0 ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            No matching books found. Try adjusting your search or category filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/40 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <th className="p-4 font-semibold">Book & Category</th>
                  <th className="p-4 font-semibold">Author(s)</th>
                  <th className="p-4 font-semibold">ISBN</th>
                  <th className="p-4 font-semibold">Copies Available</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm text-slate-300">
                {books.map((book) => {
                  const authorsText = book.authors?.map((a: any) => a.name).join(', ') || 'Various';
                  const catName = book.categories?.[0]?.name || 'General';
                  const isAvailable = book.available_copies > 0;
                  return (
                    <tr key={book.id} className="hover:bg-slate-900/50 transition">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <img
                            src={book.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'}
                            alt={book.title}
                            className="w-10 h-14 object-cover rounded shadow-md border border-slate-800"
                          />
                          <div>
                            <div className="font-semibold text-slate-100">{book.title}</div>
                            <div className="text-xs text-indigo-400 flex items-center gap-1.5 mt-0.5">
                              <span className="px-1.5 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/20 font-medium">
                                {catName}
                              </span>
                              {book.pages && <span className="text-slate-500">· {book.pages} pages</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-slate-300 font-medium">{authorsText}</td>
                      <td className="p-4 font-mono text-xs text-slate-400">{book.isbn13 || book.isbn10 || 'N/A'}</td>
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isAvailable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {book.available_copies} of {book.total_copies} available
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewBook(book.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                          >
                            Copies & Info
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id, book.title)}
                            title="Delete Book"
                            className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Book Details Modal */}
      {selectedBookDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-5">
              <div className="flex items-start space-x-4">
                <img
                  src={selectedBookDetail.cover_image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80'}
                  alt={selectedBookDetail.title}
                  className="w-16 h-22 object-cover rounded-lg border border-slate-700 shadow-md"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedBookDetail.title}</h2>
                  <p className="text-xs text-indigo-400 mt-0.5">{selectedBookDetail.subtitle}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-slate-400">
                    <span>ISBN: <strong className="font-mono text-slate-300">{selectedBookDetail.isbn13 || 'N/A'}</strong></span>
                    <span>· Edition: <strong className="text-slate-300">{selectedBookDetail.edition || '1st'}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-6 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
              {selectedBookDetail.description || 'No description provided.'}
            </p>

            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Barcode className="w-4 h-4 text-indigo-400" />
              <span>Allocated Physical Copies ({selectedBookDetail.copies?.length || 0})</span>
            </h3>

            <div className="space-y-2.5 mb-6">
              {selectedBookDetail.copies?.map((copy: any) => (
                <div
                  key={copy.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono bg-slate-900 px-2 py-1 rounded text-slate-300 border border-slate-700">
                      {copy.barcode}
                    </span>
                    <span className="text-slate-400">Location: {copy.shelf || 'Floor 1'}</span>
                    <span className="text-slate-500">· Condition: {copy.condition || 'Good'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        copy.status === 'available'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {copy.status}
                    </span>
                    <a
                      href={`/api/v1/barcode/generate/barcode/${copy.barcode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-slate-800 transition"
                      title="Download barcode label"
                    >
                      Barcode Tag
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedBookDetail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Book Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <span>Add Book to Catalog</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Book Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Design Patterns: Elements of Reusable Object-Oriented Software"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="e.g. A Handbook of Craftsmanship"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ISBN 13</label>
                  <input
                    type="text"
                    value={newIsbn13}
                    onChange={(e) => setNewIsbn13(e.target.value)}
                    placeholder="9780132350884"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
                  <select
                    value={newAuthorId || ''}
                    onChange={(e) => setNewAuthorId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Author</option>
                    {authors.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategoryId || ''}
                    onChange={(e) => setNewCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Publisher</label>
                  <select
                    value={newPublisherId || ''}
                    onChange={(e) => setNewPublisherId(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Publisher</option>
                    {publishers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pages</label>
                  <input
                    type="number"
                    min="1"
                    value={newPages}
                    onChange={(e) => setNewPages(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Copies to Mint</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={newCopies}
                  onChange={(e) => setNewCopies(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>


              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-900/30"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
