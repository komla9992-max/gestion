import React, { useState } from 'react';
import { useUsers } from '../context/UserContext';
import UserItem from './UserItem';
import UserForm from './UserForm';

export default function UserList() {
  const { users, createUser, updateUser, deleteUser, loading } = useUsers();
  const [editingUser, setEditingUser] = useState(null);

  const handleSubmit = async (data) => {
    if (editingUser) {
      await updateUser(editingUser.id, data);
      setEditingUser(null);
    } else {
      await createUser(data);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h2>Gestion des utilisateurs</h2>
      <UserForm onSubmit={handleSubmit} userToEdit={editingUser} onCancel={() => setEditingUser(null)} />
      <table border="1" cellPadding="5" style={{ width: '100%', marginTop: '10px' }}>
        <thead>
          <tr>
            <th>Nom</th>
            <th>Email</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <UserItem key={u.id} user={u} onEdit={setEditingUser} onDelete={deleteUser} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
