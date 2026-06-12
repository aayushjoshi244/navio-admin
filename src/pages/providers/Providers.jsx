import { useEffect, useState } from "react";
import {
  getProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  getCategories,
} from "../../lib/api";

export default function Providers() {
  const [providers, setProviders] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allTagsByCategory, setAllTagsByCategory] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [viewTags, setViewTags] = useState([]);
  const [groupedTags, setGroupedTags] = useState({}); // category -> array of tag names
  const [editingProvider, setEditingProvider] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [formData, setFormData] = useState({
    business_name: "",
    owner_name: "",
    description: "",
    address: "",
    city: "",
    district: "",
    province: "",
    postal_code: "",
    selectedCategories: [],
    opening_time: "09:00",
    closing_time: "18:00",
    contact_number: "",
    whatsapp_number: "",
    website: "",
    spoken_languages: [],
    price_range: "$$",
    is_approved: false,
    images: [],
    videos: [],
    tags: [],
  });
  const [saving, setSaving] = useState(false);

  const languageOptions = ["th", "en", "hi", "zh", "ja", "km"];
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudinaryApiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
  const cloudinaryApiSecret = import.meta.env.VITE_CLOUDINARY_API_SECRET;

  // ---------- Cloudinary deletion helper ----------
  const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureString = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryApiSecret}`;
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(signatureString);
    const hashBuffer = await crypto.subtle.digest("SHA-1", encodedData);
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`;
    const fd = new FormData();
    fd.append("public_id", publicId);
    fd.append("timestamp", timestamp);
    fd.append("signature", signature);
    fd.append("api_key", cloudinaryApiKey);
    const response = await fetch(url, { method: "POST", body: fd });
    const result = await response.json();
    if (!response.ok || result.result !== "ok") {
      console.error(`Failed to delete ${publicId}:`, result);
    }
  };

  // ---------- Data fetching ----------
  const fetchProviders = async () => {
    try {
      const data = await getProviders();
      setProviders(data || []);
    } catch (err) {
      console.error("Error fetching providers:", err);
      alert("Failed to load providers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndTags = async () => {
    try {
      const categoriesData = await getCategories();
      setAllCategories(categoriesData);
      const grouped = {};
      categoriesData.forEach((cat) => {
        if (cat.tags && cat.tags.length) {
          grouped[cat.id] = cat.tags;
        }
      });
      setAllTagsByCategory(grouped);
    } catch (err) {
      console.error("Failed to fetch categories/tags:", err);
    }
  };

  // When viewing a provider, compute flat list of tag names (for simple list) and grouped tags (for category-wise display)
  useEffect(() => {
    if (selectedProvider?.tags?.length) {
      const tagIds = selectedProvider.tags;
      const allTags = Object.values(allTagsByCategory).flat();
      const tagNames = allTags.filter(t => tagIds.includes(t.id)).map(t => t.name);
      setViewTags(tagNames);
    } else {
      setViewTags([]);
    }
  }, [selectedProvider, allTagsByCategory]);

  // Compute grouped tags (category -> list of tag names) for view modal
  useEffect(() => {
    if (selectedProvider?.categories?.length && allTagsByCategory && allCategories.length) {
      const map = {};
      for (const catName of selectedProvider.categories) {
        const cat = allCategories.find(c => c.name === catName);
        if (cat && allTagsByCategory[cat.id]) {
          const selectedTagIds = selectedProvider.tags || [];
          const matched = allTagsByCategory[cat.id]
            .filter(tag => selectedTagIds.includes(tag.id))
            .map(tag => tag.name);
          if (matched.length) {
            map[catName] = matched;
          } else {
            map[catName] = [];
          }
        } else {
          map[catName] = [];
        }
      }
      setGroupedTags(map);
    } else {
      setGroupedTags({});
    }
  }, [selectedProvider, allTagsByCategory, allCategories]);

  useEffect(() => {
    fetchProviders();
    fetchCategoriesAndTags();
  }, []);

  // ---------- Modal handlers ----------
  const openCreateModal = () => {
    setEditingProvider(null);
    setFormData({
      business_name: "",
      owner_name: "",
      description: "",
      address: "",
      city: "",
      district: "",
      province: "",
      postal_code: "",
      selectedCategories: [],
      opening_time: "09:00",
      closing_time: "18:00",
      contact_number: "",
      whatsapp_number: "",
      website: "",
      spoken_languages: [],
      price_range: "$$",
      is_approved: false,
      images: [],
      videos: [],
      tags: [],
    });
    setCategorySearchTerm("");
    setModalOpen(true);
  };

  const openEditModal = (provider) => {
    setEditingProvider(provider);
    let opening_time = "09:00";
    let closing_time = "18:00";
    if (provider.working_hours?.monday) {
      const [open, close] = provider.working_hours.monday.split("-");
      opening_time = open;
      closing_time = close;
    }
    let selectedCategories = provider.categories || [];
    if (!selectedCategories.length && provider.category) {
      selectedCategories = [provider.category];
    }
    setFormData({
      business_name: provider.business_name || "",
      owner_name: provider.owner_name || "",
      description: provider.description || "",
      address: provider.address || "",
      city: provider.city || "",
      district: provider.district || "",
      province: provider.province || "",
      postal_code: provider.postal_code || "",
      selectedCategories,
      opening_time,
      closing_time,
      contact_number: provider.contact_number || "",
      whatsapp_number: provider.whatsapp_number || "",
      website: provider.website || "",
      spoken_languages: provider.spoken_languages || [],
      price_range: provider.price_range || "$$",
      is_approved: provider.is_approved || false,
      images: provider.images || [],
      videos: provider.videos || [],
      tags: provider.tags || [],
    });
    setCategorySearchTerm("");
    setModalOpen(true);
  };

  const openViewModal = (provider) => {
    setSelectedProvider(provider);
    setViewModalOpen(true);
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleLanguage = (lang) => {
    const current = formData.spoken_languages;
    if (current.includes(lang)) {
      handleChange(
        "spoken_languages",
        current.filter((l) => l !== lang)
      );
    } else {
      handleChange("spoken_languages", [...current, lang]);
    }
  };

  const toggleTag = (tagId) => {
    const current = formData.tags;
    if (current.includes(tagId)) {
      handleChange(
        "tags",
        current.filter((id) => id !== tagId)
      );
    } else {
      handleChange("tags", [...current, tagId]);
    }
  };

  // ---------- Cloudinary upload helpers ----------
  const uploadToCloudinary = async (file, resourceType = "image") => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", uploadPreset);
    fd.append("folder", "navio-providers");
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const response = await fetch(url, { method: "POST", body: fd });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    setUploading(true);
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file, "image");
        newUrls.push(url);
      }
      handleChange("images", [...formData.images, ...newUrls]);
    } catch (error) {
      alert("Upload failed: " + error.message);
    }
    setUploading(false);
  };

  const handleVideoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (formData.videos.length + files.length > 2) {
      alert("Maximum 2 videos allowed");
      return;
    }
    setUploading(true);
    try {
      const newUrls = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file, "video");
        newUrls.push(url);
      }
      handleChange("videos", [...formData.videos, ...newUrls]);
    } catch (error) {
      alert("Upload failed: " + error.message);
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    handleChange("images", newImages);
  };

  const removeVideo = (index) => {
    const newVideos = [...formData.videos];
    newVideos.splice(index, 1);
    handleChange("videos", newVideos);
  };

  // ---------- Save provider ----------
  const saveProvider = async () => {
    setSaving(true);

    if (editingProvider) {
      const oldImages = editingProvider.images || [];
      const newImages = formData.images || [];
      const removedImages = oldImages.filter((oldUrl) => !newImages.includes(oldUrl));
      for (const url of removedImages) {
        const publicId = url.split("/upload/")[1]?.split(".")[0];
        if (publicId) await deleteFromCloudinary(publicId, "image");
      }

      const oldVideos = editingProvider.videos || [];
      const newVideos = formData.videos || [];
      const removedVideos = oldVideos.filter((oldUrl) => !newVideos.includes(oldUrl));
      for (const url of removedVideos) {
        const publicId = url.split("/upload/")[1]?.split(".")[0];
        if (publicId) await deleteFromCloudinary(publicId, "video");
      }
    }

    const working_hours = {
      monday: `${formData.opening_time}-${formData.closing_time}`,
      tuesday: `${formData.opening_time}-${formData.closing_time}`,
      wednesday: `${formData.opening_time}-${formData.closing_time}`,
      thursday: `${formData.opening_time}-${formData.closing_time}`,
      friday: `${formData.opening_time}-${formData.closing_time}`,
      saturday: `${formData.opening_time}-${formData.closing_time}`,
      sunday: `${formData.opening_time}-${formData.closing_time}`,
    };
    const payload = {
      business_name: formData.business_name,
      owner_name: formData.owner_name,
      description: formData.description,
      address: formData.address,
      city: formData.city,
      district: formData.district,
      province: formData.province,
      postal_code: formData.postal_code,
      categories: formData.selectedCategories,
      category: formData.selectedCategories[0] || "",
      spoken_languages: formData.spoken_languages,
      price_range: formData.price_range,
      tags: formData.tags,
      working_hours,
      contact_number: formData.contact_number,
      whatsapp_number: formData.whatsapp_number,
      website: formData.website,
      is_approved: formData.is_approved,
      images: formData.images,
      videos: formData.videos,
    };

    try {
      if (editingProvider) {
        await updateProvider(editingProvider.id, payload);
      } else {
        await createProvider(payload);
      }
      setModalOpen(false);
      fetchProviders();
    } catch (err) {
      alert("Error saving provider: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Delete provider ----------
  const deleteProviderHandler = async (id) => {
    if (window.confirm("Delete this provider permanently?")) {
      const provider = providers.find(p => p.id === id);
      if (provider) {
        for (const url of provider.images || []) {
          const publicId = url.split("/upload/")[1]?.split(".")[0];
          if (publicId) await deleteFromCloudinary(publicId, "image");
        }
        for (const url of provider.videos || []) {
          const publicId = url.split("/upload/")[1]?.split(".")[0];
          if (publicId) await deleteFromCloudinary(publicId, "video");
        }
      }
      try {
        await deleteProvider(id);
        fetchProviders();
      } catch (err) {
        alert("Error deleting provider: " + err.message);
      }
    }
  };

  if (loading) return <div className="p-6">Loading providers...</div>;

  const filteredCategories = allCategories.filter((cat) =>
    cat.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  // ----------------------------------------------------------------------
  // JSX (unchanged except for the view modal)
  // ----------------------------------------------------------------------
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold">Service Providers</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage listings, approvals, categories, languages, and media.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Provider
        </button>
      </div>

      {providers.length === 0 ? (
        <div className="text-center text-gray-500 mt-10">
          No providers yet. Click "Add Provider" to create one.
        </div>
      ) : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">Business Name</th>
              <th className="border p-2">Owner</th>
              <th className="border p-2">Category(ies)</th>
              <th className="border p-2">Status</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((provider) => (
              <tr key={provider.id}>
                <td className="border p-2">{provider.business_name}</td>
                <td className="border p-2">
                  {provider.owner_name ||
                    provider.profiles?.full_name ||
                    "Unknown"}
                </td>
                <td className="border p-2">
                  {(
                    provider.categories || [provider.category].filter(Boolean)
                  ).join(", ") || "N/A"}
                </td>
                <td className="border p-2">
                  {provider.is_approved ? "✅ Approved" : "⏳ Pending"}
                </td>
                <td className="border p-2 space-x-2">
                  <button
                    onClick={() => openViewModal(provider)}
                    className="text-green-600"
                  >
                    View
                  </button>
                  <button
                    onClick={() => openEditModal(provider)}
                    className="text-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteProviderHandler(provider.id)}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Full‑screen Create/Edit Modal – unchanged */}
      {modalOpen && (
        <div className="provider-editor fixed inset-0 z-50 overflow-y-auto bg-[#10142a] text-slate-100">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
            <div className="sticky top-0 z-10 mb-5 flex items-center justify-between rounded-xl border border-white/10 bg-[#171b38]/95 p-4 shadow-xl shadow-black/20 backdrop-blur">
              <h2 className="text-xl font-bold">
                {editingProvider ? "Edit Provider" : "Add New Provider"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="provider-form-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div className="col-span-2">
                <label className="block font-medium">Business Name *</label>
                <input
                  type="text"
                  value={formData.business_name}
                  onChange={(e) =>
                    handleChange("business_name", e.target.value)
                  }
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
              {/* Owner Name */}
              <div className="col-span-2">
                <label className="block font-medium">Owner Name</label>
                <input
                  type="text"
                  value={formData.owner_name}
                  onChange={(e) => handleChange("owner_name", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              {/* Description */}
              <div className="col-span-2">
                <label className="block font-medium">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              {/* Address fields */}
              <div className="col-span-2">
                <label className="block font-medium">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium">District (อำเภอ)</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => handleChange("district", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium">Province (จังหวัด)</label>
                <input
                  type="text"
                  value={formData.province}
                  onChange={(e) => handleChange("province", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium">Postal Code</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Searchable Categories with Tags */}
              <div className="col-span-2">
                <label className="block font-medium mb-2">
                  Search Categories
                </label>
                <input
                  type="text"
                  placeholder="Type to filter categories..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                  className="w-full border p-2 rounded mb-4"
                />
                <div className="category-picker max-h-96 overflow-y-auto border rounded p-2">
                  {filteredCategories.map((cat) => {
                    const isSelected = formData.selectedCategories.includes(
                      cat.name,
                    );
                    const tagsForThisCat = allTagsByCategory[cat.id] || [];
                    return (
                      <div
                        key={cat.id}
                        className="category-option mb-3 border-b pb-3 last:border-b-0"
                      >
                        <label className="flex items-center gap-2 font-semibold">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                // Remove category and its tags
                                handleChange(
                                  "selectedCategories",
                                  formData.selectedCategories.filter(
                                    (c) => c !== cat.name,
                                  ),
                                );
                                const tagIdsToRemove = tagsForThisCat.map(
                                  (t) => t.id,
                                );
                                handleChange(
                                  "tags",
                                  formData.tags.filter(
                                    (id) => !tagIdsToRemove.includes(id),
                                  ),
                                );
                              } else {
                                handleChange("selectedCategories", [
                                  ...formData.selectedCategories,
                                  cat.name,
                                ]);
                              }
                            }}
                          />
                          <span>{cat.name}</span>
                        </label>
                        {isSelected && tagsForThisCat.length > 0 && (
                          <div className="ml-6 mt-2">
                            <div className="text-sm font-medium mb-1">
                              Tags (sub‑categories)
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {tagsForThisCat.map((tag) => (
                                <label
                                  key={tag.id}
                                  className="tag-checkbox inline-flex items-center gap-2 text-sm"
                                >
                                  <input
                                    type="checkbox"
                                    checked={formData.tags.includes(tag.id)}
                                    onChange={() => toggleTag(tag.id)}
                                  />
                                  <span>{tag.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block font-medium">Price Range</label>
                <select
                  value={formData.price_range}
                  onChange={(e) => handleChange("price_range", e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="$">$ (Budget)</option>
                  <option value="$$">$$ (Moderate)</option>
                  <option value="$$$">$$$ (Premium)</option>
                </select>
              </div>
              {/* Opening Hours */}
              <div>
                <label className="block font-medium">Opens at</label>
                <input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => handleChange("opening_time", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium">Closes at</label>
                <input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => handleChange("closing_time", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              {/* Contact numbers */}
              <div>
                <label className="block font-medium">Contact Number</label>
                <input
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) =>
                    handleChange("contact_number", e.target.value)
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <label className="block font-medium">WhatsApp Number</label>
                <input
                  type="tel"
                  value={formData.whatsapp_number}
                  onChange={(e) =>
                    handleChange("whatsapp_number", e.target.value)
                  }
                  className="w-full border p-2 rounded"
                />
              </div>
              <div className="col-span-2">
                <label className="block font-medium">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>
              {/* Spoken Languages */}
              <div className="col-span-2">
                <label className="block font-medium mb-2">
                  Spoken Languages (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {languageOptions.map((lang) => (
                    <label
                      key={lang}
                      className="inline-flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={formData.spoken_languages.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                      />
                      <span>{lang.toUpperCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Images Upload */}
              <div className="col-span-2">
                <label className="block font-medium mb-2">
                  Images (up to 5)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <p className="text-sm text-gray-500">Uploading...</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.images.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        alt={`preview ${idx}`}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Videos Upload */}
              <div className="col-span-2">
                <label className="block font-medium mb-2">
                  Videos (up to 2)
                </label>
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleVideoUpload}
                  disabled={uploading}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.videos.map((url, idx) => (
                    <div key={idx} className="relative">
                      <video
                        src={url}
                        className="w-32 h-24 object-cover rounded"
                        controls
                      />
                      <button
                        onClick={() => removeVideo(idx)}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              {/* Approval */}
              <div className="col-span-2">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_approved}
                    onChange={(e) =>
                      handleChange("is_approved", e.target.checked)
                    }
                  />
                  <span>Approved (visible to users)</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveProvider}
                disabled={saving || uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal – updated to show categories with their tags */}
      {viewModalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#151936] text-slate-100 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex justify-between items-center mb-5 border-b border-white/5 pb-3">
              <h2 className="text-lg font-bold text-white uppercase tracking-wide">Provider Specifications</h2>
              <button
                onClick={() => setViewModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-lg font-bold"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm border-b border-white/5 pb-5 mb-5">
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Business Name</span>
                <span className="text-sm font-bold text-white mt-1 block">{selectedProvider.business_name || '-'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Owner Name</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block">{selectedProvider.owner_name || selectedProvider.profiles?.full_name || 'N/A'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg col-span-2">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Description</span>
                <span className="text-sm text-slate-300 mt-1 block leading-relaxed whitespace-pre-wrap">{selectedProvider.description || 'No description provided'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Street Address</span>
                <span className="text-sm text-slate-200 mt-1 block">{selectedProvider.address || 'N/A'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">City</span>
                <span className="text-sm text-slate-200 mt-1 block">{selectedProvider.city || 'N/A'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">District</span>
                <span className="text-sm text-slate-200 mt-1 block">{selectedProvider.district || 'N/A'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Province / Postal Code</span>
                <span className="text-sm text-slate-200 mt-1 block">
                  {selectedProvider.province || 'N/A'} {selectedProvider.postal_code ? `(${selectedProvider.postal_code})` : ''}
                </span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Price Range / Status</span>
                <span className="text-sm text-slate-200 mt-1 flex items-center gap-2">
                  <span className="font-bold text-cyan-400">{selectedProvider.price_range || '$$'}</span>
                  <span className="text-slate-650">•</span>
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${selectedProvider.is_approved ? 'bg-emerald-500/15 text-emerald-450 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-450 border border-amber-500/20'}`}>
                    {selectedProvider.is_approved ? 'Approved' : 'Pending'}
                  </span>
                </span>
              </div>

              {/* Categories & Tags – grouped by category */}
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg col-span-2">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Categories & Tags</span>
                <div className="mt-2 space-y-2">
                  {selectedProvider.categories?.length ? (
                    selectedProvider.categories.map(catName => (
                      <div key={catName}>
                        <div className="font-semibold text-white text-sm">{catName}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1 ml-2">
                          {groupedTags[catName]?.length ? (
                            groupedTags[catName].map((tag, i) => (
                              <span key={i} className="bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded text-xs font-semibold text-cyan-400">{tag}</span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-500 italic">No tags selected</span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-slate-200">No categories selected</span>
                  )}
                </div>
              </div>

              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Contact Number</span>
                <span className="text-sm text-slate-200 mt-1 block">{selectedProvider.contact_number || 'N/A'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">WhatsApp Number</span>
                <span className="text-sm text-slate-200 mt-1 block">{selectedProvider.whatsapp_number || 'N/A'}</span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg col-span-2">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Website URL</span>
                {selectedProvider.website ? (
                  <a href={selectedProvider.website} target="_blank" rel="noopener noreferrer" className="text-sm text-cyan-400 hover:underline mt-1 block break-all font-semibold">
                    {selectedProvider.website}
                  </a>
                ) : (
                  <span className="text-sm text-slate-500 mt-1 block">N/A</span>
                )}
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Spoken Languages</span>
                <span className="text-sm text-slate-200 mt-1 block">
                  {selectedProvider.spoken_languages?.map((l) => l.toUpperCase()).join(', ') || 'None'}
                </span>
              </div>
              <div className="bg-[#1b2046]/50 border border-white/5 p-3 rounded-lg">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Working Hours</span>
                <span className="text-sm text-slate-200 mt-1 block">{selectedProvider.working_hours?.monday || 'Not set'}</span>
              </div>
            </div>

            {selectedProvider.images?.length > 0 && (
              <div className="space-y-2">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Images ({selectedProvider.images.length})</span>
                <div className="flex flex-wrap gap-3">
                  {selectedProvider.images.map((url, i) => (
                    <a href={url} target="_blank" rel="noopener noreferrer" key={i} className="block group">
                      <img
                        src={url}
                        alt={`img-${i}`}
                        className="w-24 h-24 object-cover rounded-lg border border-white/10 shadow group-hover:border-blue-500 transition-all duration-200"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {selectedProvider.videos?.length > 0 && (
              <div className="space-y-2 mt-4">
                <span className="block text-xs text-slate-500 font-bold uppercase tracking-wider">Videos ({selectedProvider.videos.length})</span>
                <div className="flex flex-wrap gap-3">
                  {selectedProvider.videos.map((url, i) => (
                    <video
                      key={i}
                      src={url}
                      controls
                      className="w-48 h-36 object-cover rounded-lg border border-white/10 shadow bg-black"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6 border-t border-white/5 pt-4">
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-5 py-2.5 bg-[#1e254e] hover:bg-[#252e60] text-slate-200 hover:text-white transition font-semibold rounded-lg text-sm border border-white/10"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}