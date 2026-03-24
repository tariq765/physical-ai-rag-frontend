import React from 'react';
import ChatWidget from '@site/src/components/ChatWidget';
import '@site/src/css/chatkit.css';

interface RootProps {
  children: React.ReactNode;
}

export default function Root({children}: RootProps) {
  return (
    <>
      {children}
      <ChatWidget />
    </>
  );
}
