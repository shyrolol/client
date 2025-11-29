import React, { useState } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

const API_URL = 'http://localhost:3001';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateServerModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const { showNotification } = useNotification();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/servers`, { name }, { withCredentials: true });
      showNotification('Server created successfully', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification(error?.response?.data?.error || 'Failed to create server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/servers/join/${inviteCode}`, {}, { withCredentials: true });
      showNotification('You have joined the server', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      showNotification(error?.response?.data?.error || 'Failed to join server', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="channel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="channel-modal-header">
          <h2>{tab === 'create' ? 'Create Server' : 'Join Server'}</h2>
          <button className="channel-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="channel-modal-body">
          <div className="modal-tabs">
            <button 
              className={tab === 'create' ? 'active' : ''} 
              onClick={() => setTab('create')}
            >
              Create
            </button>
            <button 
              className={tab === 'join' ? 'active' : ''} 
              onClick={() => setTab('join')}
            >
              Join
            </button>
          </div>

          {tab === 'create' ? (
            <div className="form-group">
              <label className="ds-form-label">Server Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Server name"
                className="input"
                autoFocus
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="ds-form-label">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                className="input"
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="channel-modal-footer">
          <div className="flex-1" />
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button 
            onClick={tab === 'create' ? handleCreate : handleJoin} 
            className="btn-primary" 
            disabled={loading || (tab === 'create' ? !name.trim() : !inviteCode.trim())}
          >
            {loading 
              ? (tab === 'create' ? 'Creating...' : 'Joining...')
              : (tab === 'create' ? 'Create' : 'Join Server')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateServerModal;
