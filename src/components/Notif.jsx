import React, { useEffect, useState } from 'react';
import './Notif.css';

export default function Notif({ title = "Notification", body = "Connection established successfully you can now proceed to sharing files between the devices", duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!visible) return null

  return (
    <div className="notif-container">
      <div className="notif-content">
        <p>{title}</p>
        <p>{body}</p>
        <button onClick={() => setVisible(false)}>╳</button>
      </div>
    </div>
  );
}
