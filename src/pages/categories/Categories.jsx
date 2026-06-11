import { useEffect, useState } from 'react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  addTag,
  deleteTag
} from '../../lib/api';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newName, setNewName] = useState('');
  const [newImage, setNewImage] = useState(null);
  const [editImage, setEditImage] = useState(null);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  const fetchCategories = async () => {
    try {
      const data = await getCategories(); // includes tags nested
      setCategories(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', 'navio-categories');
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
    const response = await fetch(url, { method: 'POST', body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url;
  };

  const handleAddCategory = async () => {
    if (!newName) return;
    setLoading(true);
    let imageUrl = '';
    if (newImage) {
      try {
        imageUrl = await uploadImage(newImage);
      } catch (err) {
        alert('Image upload failed: ' + err.message);
        setLoading(false);
        return;
      }
    }
    try {
      await createCategory({
        name: newName,
        icon: '📌',
        image_url: imageUrl,
        is_active: true,
      });
      setNewName('');
      setNewImage(null);
      await fetchCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    setLoading(true);
    let imageUrl = editingCategory.image_url;
    if (editImage) {
      try {
        imageUrl = await uploadImage(editImage);
      } catch (err) {
        alert('Image upload failed: ' + err.message);
        setLoading(false);
        return;
      }
    }
    try {
      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        image_url: imageUrl,
      });
      setEditingCategory(null);
      setEditImage(null);
      await fetchCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeImage = async () => {
    if (!editingCategory) return;
    try {
      await updateCategory(editingCategory.id, { image_url: null });
      setEditingCategory({ ...editingCategory, image_url: null });
      await fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteCategory = async (id) => {
    if (window.confirm('Delete this category and all its tags?')) {
      try {
        await deleteCategory(id);
        await fetchCategories();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const addTag = async (categoryId) => {
    if (!newTag.trim()) return;
    try {
      await addTag(categoryId, newTag.trim());
      setNewTag('');
      await fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  const deleteTag = async (tagId) => {
    try {
      await deleteTag(tagId);
      await fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">System Inventory</div>
        <h1 className="mt-1 text-2xl font-black text-white tracking-tight">Service Categories</h1>
        <p className="mt-0.5 text-sm text-slate-400">Manage categories, sub-tags, and icons/images</p>
      </div>

      {/* Add new category form */}
      <div className="mb-6 rounded-xl border border-white/5 bg-[#171b38]/50 p-5 shadow-lg">
        <h2 className="text-sm font-bold text-white tracking-wide uppercase mb-3">Add New Category</h2>
        <div className="flex gap-3 flex-wrap items-center">
          <input
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border border-white/10 p-2.5 bg-[#171c3e] text-slate-100 rounded-lg flex-1 min-w-[200px] text-sm focus:border-blue-500 transition"
          />
          <label className="border border-white/10 p-2.5 rounded-lg cursor-pointer bg-[#1e254e] hover:bg-[#252e60] text-slate-200 hover:text-white transition flex items-center gap-2 text-sm font-semibold">
            <span>Upload Image</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
              className="hidden"
            />
          </label>
          {newImage && <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">Image Selected</span>}
          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Category list with tags */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-[#171b38]/40 shadow-xl shadow-black/10">
        <table className="w-full text-slate-200">
          <thead>
            <tr className="border-b border-white/5 bg-[#141833]/90">
              <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-24">Image</th>
              <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tags (Sub-Categories)</th>
              <th className="py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider text-center w-64">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-blue-500/[0.02] transition-colors">
                <td className="py-4 text-center">
                  <div className="flex justify-center">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-10 h-10 object-cover rounded-lg border border-white/10 bg-[#141833] shadow" />
                    ) : (
                      <span className="text-2xl" role="img" aria-label={cat.name}>{cat.icon}</span>
                    )}
                  </div>
                </td>
                <td className="py-4 font-bold text-white text-sm">
                  {editingCategory?.id === cat.id ? (
                    <input
                      value={editingCategory.name}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="border border-white/10 p-1.5 bg-[#171c3e] text-slate-100 rounded-lg text-sm focus:border-blue-500 transition w-full max-w-[200px]"
                    />
                  ) : (
                    cat.name
                  )}
                </td>
                <td className="py-4">
                  <div className="flex flex-wrap gap-1.5 mb-2 max-w-lg">
                    {cat.tags?.map(tag => (
                      <span key={tag.id} className="bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-md text-xs font-semibold text-cyan-400 inline-flex items-center gap-1.5 transition-all duration-200 hover:bg-cyan-500/20 shadow-sm">
                        {tag.name}
                        <button onClick={() => deleteTag(tag.id)} className="text-cyan-400/60 hover:text-red-400 transition-colors font-bold text-[10px] ml-1">✕</button>
                      </span>
                    ))}
                    {!cat.tags?.length && <span className="text-xs text-slate-500 italic">No tags added yet</span>}
                  </div>
                  {editingCategory?.id === cat.id && (
                    <div className="flex gap-2 items-center mt-2">
                      <input
                        type="text"
                        placeholder="New tag name"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="border border-white/10 p-1.5 bg-[#171c3e] text-slate-100 rounded-lg text-xs placeholder-slate-500 focus:border-blue-500 transition max-w-[150px]"
                      />
                      <button onClick={() => addTag(cat.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition">Add Tag</button>
                    </div>
                  )}
                </td>
                <td className="py-4 text-center">
                  <div className="flex justify-center items-center gap-3">
                    {editingCategory?.id === cat.id ? (
                      <>
                        <label className="cursor-pointer text-xs text-blue-400 hover:text-blue-300 font-semibold transition border border-blue-500/20 bg-blue-500/10 px-2 py-1 rounded">
                          Change Image
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditImage(e.target.files[0])}
                            className="hidden"
                          />
                        </label>
                        {editImage && <span className="text-xs font-semibold text-emerald-400">New selected</span>}
                        {cat.image_url && (
                          <button onClick={removeImage} className="text-xs text-rose-400 hover:text-rose-300 font-semibold transition border border-rose-500/20 bg-rose-500/5 px-2 py-1 rounded">Remove Image</button>
                        )}
                        <button onClick={handleUpdateCategory} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold transition">Save</button>
                        <button onClick={() => { setEditingCategory(null); setEditImage(null); }} className="text-xs text-slate-400 hover:text-slate-200 font-bold transition">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditingCategory(cat)} className="text-xs text-blue-400 hover:text-blue-300 font-bold transition border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 rounded">Edit</button>
                        <button onClick={() => deleteCategory(cat.id)} className="text-xs text-rose-400 hover:text-rose-300 font-bold transition border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 rounded">Delete</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!categories.length && (
              <tr>
                <td colSpan="4" className="py-6 text-center text-slate-500 font-medium">
                  No categories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}