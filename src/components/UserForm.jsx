import React, { useState, useEffect } from 'react';

export default function UserForm({ onSubmit, userToEdit, onCancel }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('agent');

  useEffect(() => {
    if (userToEdit) {
      setName(userToEdit.name);
      setEmail(userToEdit.email);
      setRole(userToEdit.role);
    }
  }, [userToEdit]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email) return alert('Veuillez remplir tous les champs');
    onSubmit({ name, email, role });
    setName('');
    setEmail('');
    setRole('agent');
  };

  return (
    <form onSubmit={handleSubmit} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px' }}>
      <div>
        <label>Nom: </label>
        <input value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <label>Email: </label>
        <input value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div>
        <label>Rôle: </label>
        <select value={role} onChange={e => setRole(e.target.value)}>
          <option value="admin">Admin</option>
          <option value="superviseur">Superviseur</option>
          <option value="agent">Agent</option>
        </select>
      </div>
      <button type="submit">{userToEdit ? 'Modifier' : 'Créer'}</button>
      {userToEdit && <button type="button" onClick={onCancel}>Annuler</button>}
    </form>
  );
}
