import React from 'react';
import { Outlet } from 'react-router';
import { useDevNativePreviewHtmlClass } from '../../lib/useDevNativePreviewHtmlClass';

export default function AppRouteRoot() {
  useDevNativePreviewHtmlClass();
  return <Outlet />;
}
