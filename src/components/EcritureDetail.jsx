import React, { useState } from 'react';

export default function EcritureDetail({ ecriture, onUpdate, onDelete, onValidate }) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    libelle: ecriture?.libelle || '',
    montant: ecriture?.montant || 0,
    date: ecriture?.date || '',
    type: ecriture?.type || 'recette'
  });

  const handleUpdate = () => {
    onUpdate({ ...ecriture, ...formData });
    setIsEditing(false);
  };

  const handleValidate = () => {
    onValidate(ecriture.id);
  };

  const handleDelete = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette écriture ?')) {
      onDelete(ecriture.id);
    }
  };

  if (!ecriture) return null;

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', margin: '20px 0' }}>
      <div style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'details' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'details' ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            Détails
          </button>
          <button
            onClick={() => setActiveTab('modification')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'modification' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'modification' ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            Modification
          </button>
          {/* L'onglet Suppression est toujours visible, même si l'écriture est validée */}
          <button
            onClick={() => setActiveTab('suppression')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: activeTab === 'suppression' ? '#007bff' : '#f0f0f0',
              color: activeTab === 'suppression' ? 'white' : 'black',
              cursor: 'pointer'
            }}
          >
            Suppression
          </button>
        </div>
      </div>

      {activeTab === 'details' && (
        <div>
          <h3>Détails de l'écriture</h3>
          <p><strong>Libellé:</strong> {ecriture.libelle}</p>
          <p><strong>Montant:</strong> {ecriture.montant} €</p>
          <p><strong>Date:</strong> {ecriture.date}</p>
          <p><strong>Type:</strong> {ecriture.type}</p>
          <p><strong>Statut:</strong> {ecriture.validated ? '✅ Validée' : '⏳ En attente'}</p>
          {!ecriture.validated && (
            <button
              onClick={handleValidate}
              style={{
                padding: '10px 20px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                marginTop: '10px'
              }}
            >
              Valider l'écriture
            </button>
          )}
        </div>
      )}

      {activeTab === 'modification' && (
        <div>
          <h3>Modifier l'écriture</h3>
          {isEditing ? (
            <div>
              <div style={{ marginBottom: '10px' }}>
                <label>Libellé: </label>
                <input
                  type="text"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                  style={{ width: '100%', padding: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Montant: </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) })}
                  style={{ width: '100%', padding: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Date: </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  style={{ width: '100%', padding: '5px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label>Type: </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '5px' }}
                >
                  <option value="recette">Recette</option>
                  <option value="dépense">Dépense</option>
                </select>
              </div>
              <button
                onClick={handleUpdate}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Enregistrer
              </button>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '10px 20px',
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <div>
              <p>Cliquez sur le bouton ci-dessous pour modifier l'écriture.</p>
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Modifier
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suppression' && (
        <div>
          <h3>Supprimer l'écriture</h3>
          <p>Êtes-vous sûr de vouloir supprimer cette écriture ?</p>
          <p><strong>Libellé:</strong> {ecriture.libelle}</p>
          <p><strong>Montant:</strong> {ecriture.montant} €</p>
          <p><strong>Statut:</strong> {ecriture.validated ? '✅ Validée' : '⏳ En attente'}</p>
          <button
            onClick={handleDelete}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Supprimer définitivement
          </button>
        </div>
      )}
    </div>
  );
}


