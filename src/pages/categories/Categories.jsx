import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
    const { data } = await supabase
      .from('categories')
      .select('*, tags(id, name)')
      .order('name');
    setCategories(data || []);
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
    const { error } = await supabase.from('categories').insert({
      name: newName,
      icon: '📌', // fallback emoji
      image_url: imageUrl,
      is_active: true,
    });
    if (error) alert(error.message);
    else {
      setNewName('');
      setNewImage(null);
      await fetchCategories();
    }
    setLoading(false);
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
    const { error } = await supabase
      .from('categories')
      .update({ name: editingCategory.name, image_url: imageUrl })
      .eq('id', editingCategory.id);
    if (error) alert(error.message);
    else {
      setEditingCategory(null);
      setEditImage(null);
      await fetchCategories();
    }
    setLoading(false);
  };

  const removeImage = async () => {
    if (!editingCategory) return;
    const { error } = await supabase
      .from('categories')
      .update({ image_url: null })
      .eq('id', editingCategory.id);
    if (error) alert(error.message);
    else {
      setEditingCategory({ ...editingCategory, image_url: null });
      await fetchCategories();
    }
  };

  const deleteCategory = async (id) => {
    if (window.confirm('Delete this category and all its tags?')) {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) alert(error.message);
      else fetchCategories();
    }
  };

  const addTag = async (categoryId) => {
    if (!newTag.trim()) return;
    const { error } = await supabase
      .from('tags')
      .insert({ category_id: categoryId, name: newTag.trim() });
    if (error) alert(error.message);
    else {
      setNewTag('');
      fetchCategories();
    }
  };

  const deleteTag = async (tagId) => {
    const { error } = await supabase.from('tags').delete().eq('id', tagId);
    if (error) alert(error.message);
    else fetchCategories();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Categories</h1>

      {/* Add new category form */}
      <div className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Add New Category</h2>
        <div className="flex gap-2 flex-wrap">
          <input
            placeholder="Category name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="border p-2 rounded flex-1"
          />
          <label className="border p-2 rounded cursor-pointer bg-white">
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0])}
              className="hidden"
            />
          </label>
          {newImage && <span className="text-sm text-green-600">Image selected</span>}
          <button
            onClick={handleAddCategory}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Category list with tags */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Image</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Tags</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td className="border p-2 text-center">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.name} className="w-10 h-10 object-cover rounded" />
                ) : (
                  <span className="text-2xl">{cat.icon}</span>
                )}
              </td>
              <td className="border p-2">
                {editingCategory?.id === cat.id ? (
                  <input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    className="border p-1 rounded"
                  />
                ) : (
                  cat.name
                )}
              </td>
              <td className="border p-2">
                <div className="flex flex-wrap gap-1 mb-1">
                  {cat.tags?.map(tag => (
                    <span key={tag.id} className="bg-gray-200 px-2 py-1 rounded text-sm inline-flex items-center gap-1">
                      {tag.name}
                      <button onClick={() => deleteTag(tag.id)} className="text-red-500 text-xs">✕</button>
                    </span>
                  ))}
                </div>
                {editingCategory?.id === cat.id && (
                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      placeholder="New tag"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      className="border p-1 rounded text-sm"
                    />
                    <button onClick={() => addTag(cat.id)} className="bg-green-500 text-white px-2 py-1 rounded text-sm">Add</button>
                  </div>
                )}
              </td>
              <td className="border p-2 text-center space-x-2">
                {editingCategory?.id === cat.id ? (
                  <>
                    {/* Image upload during edit */}
                    <label className="inline-block cursor-pointer text-blue-600 text-sm mr-2">
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditImage(e.target.files[0])}
                        className="hidden"
                      />
                    </label>
                    {editImage && <span className="text-xs text-green-600 mr-2">New image</span>}
                    {cat.image_url && (
                      <button onClick={removeImage} className="text-red-500 text-sm mr-2">Remove Image</button>
                    )}
                    <button onClick={handleUpdateCategory} className="text-green-600">Save</button>
                    <button onClick={() => { setEditingCategory(null); setEditImage(null); }} className="text-gray-600">Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditingCategory(cat)} className="text-blue-600">Edit</button>
                    <button onClick={() => deleteCategory(cat.id)} className="text-red-500">Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}