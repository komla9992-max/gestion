import React from 'react';

export default function UserItem({ user, onEdit, onDelete }) {
  return (
    <tr>
      <td>{user.name}</td>
      <td>{user.email}</td>
      <td>{user.role}</td>
      <td>
        <button onClick={() => onEdit(user)}>✏️</button>
        <button onClick={() => onDelete(user.id)}>🗑️</button>
      </td>
    </tr>
  );
}
