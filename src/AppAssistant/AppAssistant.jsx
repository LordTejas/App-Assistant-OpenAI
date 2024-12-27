import { useState } from 'react';
import './AppAssistant.css'
import { ask_assistant } from './ai';

// eslint-disable-next-line react/prop-types
const AppAssistantMessage = ({ id, role, content }) => {
  return (
    <div id={id} className='app-assistant-message-container'>
      <span className='app-assistant-message-role'>{role}</span>
      <p className='app-assistant-message-content'>{content}</p>
    </div>
  )
}

const AppAssistant = () => {

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [thread_id, setThreadId] = useState(null);

  const handleSend = async () => {
    try {
      setLoading(true);
      const newMessages = await ask_assistant(query, thread_id);
      setMessages(newMessages.messages);
      setThreadId(newMessages.thread_id);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: error.message }]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  }

  return (
    <div className='app-assistant'>
      <div className='app-assistant-messages'>
        {messages.map((message) => <AppAssistantMessage key={message.id} {...message} />)}
      </div>

      <div className='app-assistant-input'>
        <input type='text' placeholder='Type your message here...' value={query} onChange={(e) => setQuery(e.target.value)} />
        <button
          type="button"
          disabled={!query.trim() || loading}
          onClick={handleSend}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  )
}

export default AppAssistant