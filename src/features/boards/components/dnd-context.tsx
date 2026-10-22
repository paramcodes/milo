'use client';

import type React from 'react';
import { useEffect, useState } from 'react';

interface ClientOnlyDndProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ClientOnlyDnd({ children, fallback = null }: ClientOnlyDndProps) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
