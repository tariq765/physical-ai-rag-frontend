import React from 'react';
import OriginalRoot from '@theme-original/Root';
import ChatWidget from '@site/src/components/ChatWidget';
import type { WrapperProps } from '@docusaurus/types';

type RootProps = WrapperProps<typeof OriginalRoot>;

export default function Root(props: RootProps): JSX.Element {
  return (
    <>
      <OriginalRoot {...props} />
      <ChatWidget />
    </>
  );
}
