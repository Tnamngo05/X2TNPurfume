import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage } from '../lib/api';

const Chatbox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ 
    text: "Xin chào! Tôi là trợ lý AI của X2TNPerfume. Tôi có thể giúp gì cho bạn về các dòng nước hoa cao cấp?", 
    isBot: true 
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const scrollRef = useRef(null);

  const suggestions = [
    "Gợi ý nước hoa nam",
    "Nước hoa nữ bán chạy",
    "Gợi ý nước hoa nữ",
    "Các nước hoa cao cấp"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text = input) => {
    if (!text.trim()) return;
    setShowSuggestions(false);
    
    // Gửi tin nhắn của khách lên màn hình
    setMessages(prev => [...prev, { text: text, isBot: false }]);
    setInput("");
    setIsLoading(true);

    try {
      // Gửi yêu cầu tới API (Đảm bảo backend nhận string)
      const reply = await sendChatMessage(text); 

      // --- CHỨC NĂNG MỚI: CHIA NHỎ VÀ GỬI NỐI TIẾP ---
      const safeReply = typeof reply === 'string' ? reply.trim() : '';
      if (!safeReply) {
        throw new Error('Empty chatbot response');
      }
      const productChunks = safeReply
        .split('|SPLIT|')
        .map(chunk => chunk.trim())
        .filter(Boolean);

      setIsLoading(false); // Tắt loading chung

      // Duyệt qua từng sản phẩm để hiện bubble riêng
      for (let i = 0; i < productChunks.length; i++) {
        // Nếu là sản phẩm thứ 2 trở đi, đợi 1 giây để tạo hiệu ứng "đang gửi"
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        setMessages(prev => [...prev, { 
          text: productChunks[i].trim(), 
          isBot: true 
        }]);
      }

    } catch (error) {
      setIsLoading(false);
      setMessages(prev => [...prev, { text: "Dạ, shop gặp chút lỗi kết nối ạ.", isBot: true }]);
    }
  };

  // --- CHỨC NĂNG NÂNG CẤP: XỬ LÝ HIỂN THỊ ĐẸP HƠN ---
  
  // Hàm format text để hiển thị đẹp mắt - GIẢM FONT VÀ HẠN CHẾ IN ĐẬM
  const formatProductInfo = (text) => {
    // Tìm ảnh trong text
    const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/i;
    const imgMatch = text.match(imgRegex);
    
    // Xóa ảnh khỏi text để xử lý riêng
    let cleanText = text;
    let imageElement = null;
    
    if (imgMatch) {
      cleanText = text.replace(imgRegex, '').trim();
      imageElement = (
        <div className="chat-image-wrapper">
          <img 
            src={imgMatch[2]} 
            alt={imgMatch[1]} 
            className="chat-render-img"
            loading="lazy"
            onError={(e) => {
             e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      );
    }
    
    // Parse các dòng thông tin
    const lines = cleanText.split('\n').filter(line => line.trim() !== '');
    
    return (
      <div className="product-info-container">
        {imageElement}
        <div className="product-details">
          {lines.map((line, index) => {
            // Xử lý các dòng đặc biệt - GIẢM FONT VÀ LOẠI BỎ IN ĐẬM
            if (/^\**\s*(Giá|Price)\s*:/i.test(line)) {
              return (
                <div key={index} className="product-price">
                  {line.replace(/\*\*/g, '')}
                </div>
              );
            } else if (/^\**\s*(Độ|Nồng độ|Concentration)\s*:/i.test(line)) {
              return (
                <div key={index} className="product-concentration">
                  {line.replace(/\*\*/g, '')}
                </div>
              );
            } else if (/^\**\s*(Mô tả|Description)\s*:/i.test(line)) {
              return (
                <div key={index} className="product-description">
                  <span className="desc-label">📝 Mô tả:</span>
                  {line.replace(/^\**\s*(Mô tả|Description)\s*:\s*/i, '')}
                </div>
              );
            } else if (/^\s*\*\*.*\*\*\s*$/.test(line)) {
              // Tiêu đề sản phẩm - GIẢM FONT VÀ BỎ IN ĐẬM
              return (
                <div key={index} className="product-title">
                  {line.replace(/\*\*/g, '')}
                </div>
              );
            } else if (/^\**\s*(Thương hiệu|Brand)\s*:/i.test(line)) {
              // Thương hiệu - GIẢM FONT
              return (
                <div key={index} className="product-brand">
                  ✨ {line}
                </div>
              );
            } else {
              // Các dòng thông tin khác - GIẢM FONT
              return (
                <div key={index} className="product-info-line">
                  {line}
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  const renderMessage = (text) => {
    // Kiểm tra nếu là tin nhắn từ bot và có chứa thông tin sản phẩm
    if (/^\**\s*(Giá|Price|Mô tả|Description|Độ|Nồng độ|Concentration)\s*:/im.test(text)) {
      return formatProductInfo(text);
    }
    
    // Xử lý ảnh đơn lẻ (nếu chỉ có ảnh)
    const imgRegex = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/i;
    const match = text.match(imgRegex);
    
    if (match && !text.includes('Giá:') && !text.includes('Mô tả:')) {
      return (
        <div className="chat-image-wrapper">
          <img 
            src={match[2]} 
            alt={match[1]} 
            className="chat-render-img"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {text.replace(imgRegex, '').trim() && (
            <p className="chat-image-caption">{text.replace(imgRegex, '').trim()}</p>
          )}
        </div>
      );
    }
    
    // Xử lý text thông thường - LOẠI BỎ MARKDOWN IN ĐẬM
    const processedText = text.replace(/\*\*/g, '');
    return <span className="regular-message">{processedText}</span>;
  };

  return (
    <div className="chatbox-wrapper">
      {/* Nút Chat */}
      {!isOpen ? (
        <button 
          className="chat-button"
          onClick={() => setIsOpen(true)}
        >
          <div className="chat-button-inner">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" fill="currentColor"/>
              <circle cx="8" cy="10" r="1.5" fill="white"/>
              <circle cx="12" cy="10" r="1.5" fill="white"/>
              <circle cx="16" cy="10" r="1.5" fill="white"/>
            </svg>
            <span className="chat-button-text">Tư Vấn AI</span>
          </div>
          <span className="chat-button-badge">1</span>
        </button>
      ) : (
        /* Chat Window */
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-left">
              <div className="chat-avatar">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="#c5a572"/>
                  <path d="M7 8L10 10L13 8" stroke="#000" strokeWidth="1.5"/>
                  <circle cx="7" cy="11" r="0.8" fill="#000"/>
                  <circle cx="13" cy="11" r="0.8" fill="#000"/>
                </svg>
              </div>
              <div className="chat-header-info">
                <h3>X2TNPerfume AI</h3>
                <span className="chat-status">
                  <span className="chat-status-dot"></span>
                  Online
                </span>
              </div>
            </div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages" ref={scrollRef}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message-wrapper ${msg.isBot ? 'bot' : 'user'}`}>
                {msg.isBot && (
                  <div className="message-avatar">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <rect width="28" height="28" rx="14" fill="#c5a572"/>
                      <path d="M9 12L14 16L19 12" stroke="#000" strokeWidth="2"/>
                      <circle cx="11" cy="17" r="1" fill="#000"/>
                      <circle cx="17" cy="17" r="1" fill="#000"/>
                    </svg>
                  </div>
                )}
                <div className={`message-bubble ${msg.isBot ? 'bot' : 'user'}`}>
                  {renderMessage(msg.text)}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message-wrapper bot">
                <div className="message-avatar">
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <rect width="28" height="28" rx="14" fill="#c5a572"/>
                  </svg>
                </div>
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {showSuggestions && (
            <div className="chat-suggestions">
              <p className="suggestions-title">Gợi ý nhanh:</p>
              <div className="suggestions-grid">
                {suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    className="suggestion-btn"
                    onClick={() => handleSend(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="chat-input-area">
            <div className="chat-input-container">
              <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Nhập tin nhắn..."
                className="chat-input"
              />
              <button 
                className="chat-send-btn"
                onClick={() => handleSend()}
                disabled={!input.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M2 10L18 10M18 10L12 4M18 10L12 16" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .chatbox-wrapper {
          position: fixed;
          bottom: 30px;
          right: 30px;
          z-index: 9999;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Chat Button */
        .chat-button {
          background: linear-gradient(135deg, #c5a572, #a58b5a);
          border: none;
          border-radius: 50px;
          padding: 12px 24px 12px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          box-shadow: 0 10px 30px rgba(197, 165, 114, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .chat-button:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(197, 165, 114, 0.4);
        }

        .chat-button-inner {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #000;
        }

        .chat-button-text {
          font-weight: 500;
          font-size: 14px;
          letter-spacing: 0.5px;
        }

        .chat-button-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ff4444;
          color: white;
          font-size: 11px;
          font-weight: 600;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #000;
        }

        /* Chat Window */
        .chat-window {
          width: 380px;
          height: 600px;
          background: #0f0f0f;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8);
          border: 1px solid rgba(197, 165, 114, 0.2);
          display: flex;
          flex-direction: column;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Chat Header */
        .chat-header {
          padding: 20px 24px;
          background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
          border-bottom: 1px solid rgba(197, 165, 114, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chat-avatar {
          width: 40px;
          height: 40px;
          background: rgba(197, 165, 114, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chat-header-info h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 600;
          color: #c5a572;
          letter-spacing: 0.5px;
        }

        .chat-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #888;
        }

        .chat-status-dot {
          width: 8px;
          height: 8px;
          background: #4caf92;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .chat-close {
          background: rgba(255, 255, 255, 0.05);
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          color: #888;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .chat-close:hover {
          background: rgba(255, 68, 68, 0.1);
          color: #ff4444;
        }

        /* Messages Area */
        .chat-messages {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #0a0a0a;
        }

        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #c5a572;
          border-radius: 4px;
        }

        .message-wrapper {
          display: flex;
          align-items: flex-end;
          gap: 8px;
        }

        .message-wrapper.bot {
          justify-content: flex-start;
        }

        .message-wrapper.user {
          justify-content: flex-end;
        }

        .message-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .message-bubble {
          max-width: 80%;
          padding: 10px 14px; /* Giảm padding */
          border-radius: 16px; /* Giảm border-radius */
          font-size: 13px; /* Giảm font size từ 14px xuống 13px */
          line-height: 1.5; /* Giảm line-height */
          word-break: break-word;
          animation: messagePop 0.3s ease-out;
          font-weight: 400; /* Font weight bình thường, không in đậm */
        }

        /* Tin nhắn thông thường - không in đậm */
        .regular-message {
          font-weight: 400;
        }

        @keyframes messagePop {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-bubble.bot {
          background: #1a1a1a;
          border: 1px solid rgba(197, 165, 114, 0.2);
          color: #e0e0e0;
          border-bottom-left-radius: 4px;
        }

        .message-bubble.user {
          background: linear-gradient(135deg, #c5a572, #a58b5a);
          color: #000;
          border-bottom-right-radius: 4px;
        }

        /* --- CSS NÂNG CẤP CHO HIỂN THỊ SẢN PHẨM ĐẸP MẮT - GIẢM FONT VÀ HẠN CHẾ IN ĐẬM --- */
        .product-info-container {
          display: flex;
          flex-direction: column;
          gap: 8px; /* Giảm gap */
        }

        .product-details {
          display: flex;
          flex-direction: column;
          gap: 6px; /* Giảm gap */
        }

        .product-brand {
          font-size: 11px; /* Giảm từ 12px xuống 11px */
          color: #c5a572;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
          font-weight: 400;
        }

        .product-title {
          font-size: 15px; /* Giảm từ 18px xuống 15px */
          font-weight: 500; /* Giảm từ 600 xuống 500 */
          color: #fff;
          line-height: 1.3;
          margin-bottom: 4px;
          border-left: 2px solid #c5a572; /* Giảm độ dày border */
          padding-left: 8px;
        }

        .product-price {
          background: rgba(197, 165, 114, 0.1);
          padding: 6px 10px; /* Giảm padding */
          border-radius: 6px; /* Giảm border-radius */
          font-weight: 500; /* Giảm từ 600 xuống 500 */
          color: #c5a572;
          font-size: 14px; /* Giảm từ 16px xuống 14px */
          border: 1px solid rgba(197, 165, 114, 0.3);
          margin: 2px 0;
        }

        .product-concentration {
          font-size: 12px; /* Giảm từ 13px xuống 12px */
          color: #e0e0e0;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px; /* Giảm padding */
          border-radius: 4px; /* Giảm border-radius */
          display: inline-block;
          align-self: flex-start;
          font-weight: 400;
        }

        .product-description {
          font-size: 12px; /* Giảm từ 13px xuống 12px */
          line-height: 1.5; /* Giảm line-height */
          color: #b0b0b0;
          margin-top: 4px;
          padding: 6px 0; /* Giảm padding */
          border-top: 1px dashed rgba(197, 165, 114, 0.3);
        }

        .desc-label {
          color: #c5a572;
          font-weight: 400; /* Giảm từ 500 xuống 400 */
          margin-right: 4px;
          font-size: 12px;
        }

        .product-info-line {
          font-size: 12px; /* Giảm từ 13px xuống 12px */
          color: #d0d0d0;
          padding: 1px 0;
          font-weight: 400;
        }

        .chat-image-wrapper {
          margin: 4px 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .chat-render-img { 
          max-width: 100%;
          max-height: 180px; /* Giảm max-height từ 200px xuống 180px */
          width: auto;
          height: auto;
          border-radius: 8px; /* Giảm border-radius */
          display: block; 
          border: 1px solid rgba(197, 165, 114, 0.3);
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          object-fit: cover;
        }

        .chat-image-caption {
          margin: 0;
          font-size: 12px; /* Giảm từ 13px xuống 12px */
          color: #c5a572;
          font-style: italic;
          line-height: 1.4;
        }
        /* ---------------------------------------------- */

        /* Typing Indicator */
        .typing-indicator {
          background: #1a1a1a;
          padding: 10px 14px; /* Giảm padding */
          border-radius: 16px; /* Giảm border-radius */
          border-bottom-left-radius: 4px;
          border: 1px solid rgba(197, 165, 114, 0.2);
          display: flex;
          gap: 4px;
        }

        .typing-indicator span {
          width: 5px; /* Giảm kích thước */
          height: 5px; /* Giảm kích thước */
          background: #c5a572;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.5;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }

        /* Suggestions */
        .chat-suggestions {
          padding: 12px 20px; /* Giảm padding từ 16px xuống 12px */
          background: #0f0f0f;
          border-top: 1px solid rgba(197, 165, 114, 0.1);
        }

        .suggestions-title {
          margin: 0 0 8px 0; /* Giảm margin-bottom */
          font-size: 11px; /* Giảm từ 12px xuống 11px */
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .suggestions-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 6px; /* Giảm gap */
        }

        .suggestion-btn {
          padding: 6px 12px; /* Giảm padding từ 8px 16px xuống 6px 12px */
          background: rgba(197, 165, 114, 0.1);
          border: 1px solid rgba(197, 165, 114, 0.2);
          border-radius: 20px; /* Giảm border-radius */
          color: #c5a572;
          font-size: 12px; /* Giảm từ 13px xuống 12px */
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 400;
        }

        .suggestion-btn:hover {
          background: rgba(197, 165, 114, 0.2);
          border-color: #c5a572;
          transform: translateY(-2px);
        }

        /* Input Area */
        .chat-input-area {
          padding: 16px 20px; /* Giảm padding từ 20px xuống 16px */
          background: #0f0f0f;
          border-top: 1px solid rgba(197, 165, 114, 0.2);
        }

        .chat-input-container {
          display: flex;
          align-items: center;
          gap: 8px; /* Giảm gap từ 12px xuống 8px */
          background: #1a1a1a;
          border: 1px solid rgba(197, 165, 114, 0.2);
          border-radius: 24px; /* Giảm border-radius từ 30px xuống 24px */
          padding: 2px 2px 2px 16px; /* Giảm padding */
          transition: all 0.2s;
        }

        .chat-input-container:focus-within {
          border-color: #c5a572;
          box-shadow: 0 0 0 2px rgba(197, 165, 114, 0.2);
        }

        .chat-input {
          flex: 1;
          background: transparent;
          border: none;
          color: #fff;
          font-size: 13px; /* Giảm từ 14px xuống 13px */
          line-height: 1.5;
          outline: none;
          padding: 8px 0; /* Giảm padding từ 10px xuống 8px */
        }

        .chat-input::placeholder {
          color: #666;
          font-size: 13px;
        }

        .chat-send-btn {
          width: 38px; /* Giảm từ 44px xuống 38px */
          height: 38px; /* Giảm từ 44px xuống 38px */
          background: #c5a572;
          border: none;
          border-radius: 50%;
          color: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .chat-send-btn:hover:not(:disabled) {
          background: #d4b88c;
          transform: scale(1.05);
        }

        .chat-send-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Responsive */
        @media (max-width: 480px) {
          .chat-window {
            width: calc(100vw - 40px);
            height: calc(100vh - 100px);
            position: fixed;
            top: 20px;
            left: 20px;
            right: 20px;
            bottom: 20px;
            border-radius: 20px;
          }

          .chat-button {
            padding: 10px 14px; /* Giảm padding */
          }

          .chat-button-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Chatbox;