import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function TranscriptHistory({ projectId, refreshTrigger = 0 }) {
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState('');
  const [sendingNotification, setSendingNotification] = useState({});
  const [notificationStatus, setNotificationStatus] = useState({});
  const [webhookConfigured, setWebhookConfigured] = useState(false);
  const [checkingWebhook, setCheckingWebhook] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchTranscripts();
      checkWebhookStatus();
    }
  }, [projectId, refreshTrigger]);

  const checkWebhookStatus = async () => {
    try {
      setCheckingWebhook(true);
      const response = await axios.get(
        `http://localhost:8000/projects/${projectId}/webhook/status`
      );
      console.log('🔗 Webhook status response:', response.data);
      setWebhookConfigured(response.data.has_webhook === true);
    } catch (error) {
      console.error('❌ Webhook status check error:', error.response?.data || error.message);
      setWebhookConfigured(false);
    } finally {
      setCheckingWebhook(false);
    }
  };

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(
        `http://localhost:8000/projects/${projectId}/transcripts`
      );
      console.log('📜 Transcripts loaded:', response.data);
      setTranscripts(response.data);
    } catch (error) {
      console.error('Error fetching transcripts:', error);
      if (error.response?.status === 404) {
        setTranscripts([]);
      } else {
        setError('Failed to load transcript history');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text, length = 100) => {
    if (text.length > length) {
      return text.substring(0, length) + '...';
    }
    return text;
  };

  const handleSendGChatNotification = async (transcriptId) => {
    setSendingNotification(prev => ({ ...prev, [transcriptId]: true }));
    setNotificationStatus(prev => ({ ...prev, [transcriptId]: '' }));
    
    try {
      console.log('💬 Sending GChat notification for project:', projectId);
      const response = await axios.post(
        `http://localhost:8000/projects/${projectId}/send-tasks-to-webhook`
      );
      
      console.log('✅ GChat notification response:', response.data);
      
      if (response.data.status === 'no_webhook') {
        setNotificationStatus(prev => ({
          ...prev,
          [transcriptId]: `error: ${response.data.message}`
        }));
      } else if (response.data.status === 'sent') {
        setNotificationStatus(prev => ({
          ...prev,
          [transcriptId]: 'success'
        }));
        
        setTimeout(() => {
          setNotificationStatus(prev => ({
            ...prev,
            [transcriptId]: ''
          }));
        }, 3000);
      } else {
        setNotificationStatus(prev => ({
          ...prev,
          [transcriptId]: `error: ${response.data.message}`
        }));
      }
    } catch (error) {
      console.error('❌ Error sending GChat notification:', error);
      const errorMsg = error.response?.data?.detail || 'Failed to send notification';
      setNotificationStatus(prev => ({
        ...prev,
        [transcriptId]: `error: ${errorMsg}`
      }));
    } finally {
      setSendingNotification(prev => ({ ...prev, [transcriptId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="font-bold text-gray-900 mb-4">📜 Transcript History</h3>
        <p className="text-gray-600">Loading transcripts...</p>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">📜 Transcript History</h3>
        {!webhookConfigured && (
          <button
            onClick={() => {
              console.log('🔄 Re-checking webhook status...');
              checkWebhookStatus();
            }}
            disabled={checkingWebhook}
            className="text-xs px-2 py-1 text-blue-600 hover:bg-blue-100 rounded transition disabled:opacity-50"
            title="Re-check webhook configuration"
          >
            {checkingWebhook ? '🔄 Checking...' : '🔄 Check Webhook'}
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg mb-4">
          ⚠️ {error}
        </div>
      )}

      {transcripts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">📭 No transcripts yet</p>
          <p className="text-sm mt-2">Transcripts will be saved here when you extract tasks</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transcripts.map((transcript, index) => (
            <div
              key={transcript.id}
              className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      #{index + 1}
                    </span>
                    <span className="text-xs text-gray-600">
                      {formatDate(transcript.created_at)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                    {expandedId === transcript.id
                      ? transcript.content
                      : truncateText(transcript.content)}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <span className="text-gray-600">
                      📏 {transcript.length} characters
                    </span>
                    <span className="text-green-600 font-medium">
                      ✅ {transcript.tasks_extracted} tasks extracted
                    </span>
                  </div>

                  {notificationStatus[transcript.id] && (
                    <div className={`mt-2 text-xs font-medium ${
                      notificationStatus[transcript.id].startsWith('error') 
                        ? 'text-red-600' 
                        : 'text-green-600'
                    }`}>
                      {notificationStatus[transcript.id].startsWith('error')
                        ? `❌ ${notificationStatus[transcript.id]}`
                        : '✅ Sent to Google Chat!'}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {transcript.content.length > 100 && (
                    <button
                      onClick={() =>
                        setExpandedId(expandedId === transcript.id ? null : transcript.id)
                      }
                      className="px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 rounded transition whitespace-nowrap"
                    >
                      {expandedId === transcript.id ? '▼ Hide' : '▶ View'}
                    </button>
                  )}

                  {!webhookConfigured ? (
                    <div className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded text-center">
                      ⚠️ No GChat Webhook
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSendGChatNotification(transcript.id)}
                      disabled={sendingNotification[transcript.id]}
                      className="px-3 py-1 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {sendingNotification[transcript.id] 
                        ? '💬 Sending...' 
                        : '💬 Send to GChat'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchTranscripts}
        className="mt-4 px-3 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition"
      >
        🔄 Refresh
      </button>
    </div>
  );
}
