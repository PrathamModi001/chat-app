import { useState, useEffect } from 'react';
import { FaTimes, FaPlus, FaSpinner } from 'react-icons/fa';

interface Label {
  id: string;
  name: string;
  color: string;
  assignedAt?: string;
  assignedBy?: string;
}

interface ManageLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatId: string;
  chatName: string;
  onLabelApplied: () => void;
}

export default function ManageLabelsModal({
  isOpen,
  onClose,
  chatId,
  chatName,
  onLabelApplied,
}: ManageLabelsModalProps) {
  const [appliedLabels, setAppliedLabels] = useState<Label[]>([]);
  const [availableLabels, setAvailableLabels] = useState<Label[]>([]);
  const [newLabelName, setNewLabelName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && chatId) {
      fetchLabels();
    }
  }, [isOpen, chatId]);

  const fetchLabels = async () => {
    setIsLoading(true);
    try {
      // Fetch applied labels for this chat
      const appliedResponse = await fetch(`/api/chats/${chatId}/labels`);
      
      if (!appliedResponse.ok) {
        console.error(`Error fetching applied labels: ${appliedResponse.status} ${appliedResponse.statusText}`);
        setAppliedLabels([]);
        // Don't throw, continue to fetch available labels
      } else {
        const appliedData = await appliedResponse.json();
        setAppliedLabels(appliedData.labels || []);
      }
      
      // Fetch all available labels
      const availableResponse = await fetch('/api/labels');
      
      if (!availableResponse.ok) {
        console.error(`Error fetching available labels: ${availableResponse.status} ${availableResponse.statusText}`);
        setAvailableLabels([]);
        return;
      }
      
      const availableData = await availableResponse.json();
      
      // Filter out already applied labels from available labels
      const appliedIds = new Set(appliedLabels.map((label: Label) => label.id));
      setAvailableLabels(
        availableData.labels?.filter((label: Label) => !appliedIds.has(label.id)) || []
      );
    } catch (error) {
      console.error('Error fetching labels:', error);
      setAppliedLabels([]);
      setAvailableLabels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createAndApplyLabel = async () => {
    if (!newLabelName.trim()) return;
    
    setIsCreating(true);
    try {
      // First create the label
      const createResponse = await fetch('/api/labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newLabelName.trim() }),
      });
      
      if (!createResponse.ok) {
        console.error(`Error creating label: ${createResponse.status} ${createResponse.statusText}`);
        return;
      }
      
      const { label } = await createResponse.json();
      
      // Then apply the label
      const applyResponse = await fetch(`/api/chats/${chatId}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          labelId: label.id
        }),
      });
      
      if (!applyResponse.ok) {
        console.error(`Error applying label: ${applyResponse.status} ${applyResponse.statusText}`);
        return;
      }
      
      // Add the new label to applied labels
      const appliedLabel = {
        ...label,
        assignedAt: new Date().toISOString(),
      };
      setAppliedLabels([...appliedLabels, appliedLabel]);
      setNewLabelName('');
      
      // Notify parent component
      if (onLabelApplied) onLabelApplied();
    } catch (error) {
      console.error('Error creating and applying label:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const applyLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          labelId
        }),
      });
      
      if (!response.ok) {
        console.error(`Error applying label: ${response.status} ${response.statusText}`);
        return;
      }
      
      // Move label from available to applied
      const label = availableLabels.find(l => l.id === labelId);
      if (label) {
        const appliedLabel = {
          ...label,
          assignedAt: new Date().toISOString(),
        };
        setAppliedLabels([...appliedLabels, appliedLabel]);
        setAvailableLabels(availableLabels.filter(l => l.id !== labelId));
        if (onLabelApplied) onLabelApplied();
      }
    } catch (error) {
      console.error('Error applying label:', error);
    }
  };

  const removeLabel = async (labelId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/labels/${labelId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        console.error(`Error removing label: ${response.status} ${response.statusText}`);
        return;
      }
      
      // Move label from applied to available
      const label = appliedLabels.find(l => l.id === labelId);
      if (label) {
        const { assignedAt, assignedBy, ...availableLabel } = label;
        setAvailableLabels([...availableLabels, availableLabel]);
        setAppliedLabels(appliedLabels.filter(l => l.id !== labelId));
        if (onLabelApplied) onLabelApplied();
      }
    } catch (error) {
      console.error('Error removing label:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Manage Labels</h2>
          <button 
            onClick={onClose}
            className="text-black hover:text-gray-800"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className="p-4">
          <p className="text-black text-sm mb-4">Chat: {chatName}</p>
          
          <h3 className="text-black font-medium mb-2">Applied Labels</h3>
          {isLoading ? (
            <div className="py-2 text-center text-black">Loading labels...</div>
          ) : appliedLabels.length === 0 ? (
            <p className="text-black text-sm py-2">No labels applied to this chat</p>
          ) : (
            <div className="space-y-2 mb-4">
              {appliedLabels.map(label => (
                <div key={label.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <div>
                    <span className="text-black">{label.name}</span>
                    {label.assignedAt && (
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(label.assignedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={() => removeLabel(label.id)}
                    className="text-black hover:text-red-600"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <h3 className="text-black font-medium mb-2 mt-6">Available Labels</h3>
          {isLoading ? (
            <div className="py-2 text-center text-black">Loading labels...</div>
          ) : availableLabels.length === 0 ? (
            <p className="text-black text-sm py-2">No more labels available</p>
          ) : (
            <div className="space-y-2 mb-4">
              {availableLabels.map(label => (
                <div key={label.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                  <span className="text-black">{label.name}</span>
                  <button 
                    onClick={() => applyLabel(label.id)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <FaPlus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <h3 className="text-black font-medium mb-2 mt-6">Create New Label</h3>
          <div className="flex items-center">
            <input
              type="text"
              value={newLabelName}
              onChange={(e) => setNewLabelName(e.target.value)}
              placeholder="Label name"
              className="flex-1 border border-gray-300 rounded-md p-2 text-black focus:outline-none focus:ring-1 focus:ring-green-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && newLabelName.trim()) {
                  createAndApplyLabel();
                }
              }}
            />
            <button
              onClick={createAndApplyLabel}
              disabled={!newLabelName.trim() || isCreating}
              className="ml-2 bg-green-500 text-white p-2 rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-10 h-10"
            >
              {isCreating ? <FaSpinner className="animate-spin" /> : <FaPlus />}
            </button>
          </div>
          
          <div className="mt-6 border-t pt-4">
            <button
              onClick={onClose}
              className="w-full py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 