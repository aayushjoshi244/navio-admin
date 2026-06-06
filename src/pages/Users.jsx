import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: 'user',
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const changeUserType = async (id, newType, currentType) => {
    // If promoting to admin, ask for secret key
    if (newType === 'admin' && currentType !== 'admin') {
      const secretKey = prompt('Enter secret key to promote to admin:');
      if (secretKey !== '14223Aayush') { // Replace with your own secret key
        alert('Invalid secret key. Admin promotion denied.');
        return;
      }
    }
    await supabase.from('profiles').update({ user_type: newType }).eq('id', id);
    await fetchUsers();
  };

  const deleteUser = async (id, email) => {
    if (!window.confirm(`Delete user ${email} permanently? This action cannot be undone.`)) return;
    // First delete from profiles (if not cascade), then from auth.users
    const { error: profileError } = await supabase.from('profiles').delete().eq('id', id);
    if (profileError) {
      alert('Error deleting profile: ' + profileError.message);
      return;
    }
    // Call Supabase admin API to delete user from auth (requires service role key)
    // Since we can't call admin API from client, we'll use a Supabase Edge Function or rely on cascade.
    // Assuming foreign key ON DELETE CASCADE is set, deleting from profiles will also delete auth user.
    // If not, we need to inform the admin to delete manually or set up cascade.
    alert('User deleted from profiles. Auth user deletion requires manual action or ON DELETE CASCADE.');
    await fetchUsers();
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.password) {
      alert('Email and password are required.');
      return;
    }
    setSaving(true);
    // Create auth user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });
    if (signUpError) {
      alert('Error creating user: ' + signUpError.message);
      setSaving(false);
      return;
    }
    if (user) {
      // Insert profile
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: user.id,
          full_name: formData.full_name,
          phone: formData.phone,
          user_type: formData.user_type,
        },
      ]);
      if (profileError) {
        alert('Profile creation failed: ' + profileError.message);
        // Optionally delete the auth user if profile fails (requires admin API)
      } else {
        alert('User created successfully.');
        setModalOpen(false);
        setFormData({ email: '', password: '', full_name: '', phone: '', user_type: 'user' });
        fetchUsers();
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="p-6">Loading users...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Users</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add User
        </button>
      </div>

      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Phone</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td className="border p-2">{user.full_name || '-'}</td>
              <td className="border p-2">{user.email || '-'}</td>
              <td className="border p-2">{user.phone || '-'}</td>
              <td className="border p-2">{user.user_type}</td>
              <td className="border p-2">
                <select
                  value={user.user_type}
                  onChange={(e) => changeUserType(user.id, e.target.value, user.user_type)}
                  className="border rounded p-1 mr-2"
                >
                  <option value="user">User</option>
                  <option value="provider">Provider</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={() => deleteUser(user.id, user.email)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Add New User</h2>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                type="password"
                placeholder="Password *"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                type="text"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <select
                value={formData.user_type}
                onChange={(e) => setFormData({ ...formData, user_type: e.target.value })}
                className="w-full border p-2 rounded"
              >
                <option value="user">User</option>
                <option value="provider">Provider</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button onClick={handleAddUser} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}