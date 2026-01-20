import React, { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ReturnsHome from './ReturnsHome';
import PageSkeleton from '../../SkeletonLoaders/PageSkeleton';

// Lazy load the settings page
const ReturnsSettingsPage = lazy(() => import('./ReturnsSettingsPage'));

const ReturnRoutes = () => {
  return (
    <Routes>
      <Route index element={<ReturnsHome initialTab="reports" />} />
      <Route path="/requests" element={<ReturnsHome initialTab="requests" />} />
      <Route path="/requests/:id" element={<ReturnsHome initialTab="requests" />} />
      <Route path="/types" element={<ReturnsHome initialTab="types" />} />
      <Route 
        path="/returns-settings" 
        element={
          <Suspense fallback={<PageSkeleton />}>
            <ReturnsSettingsPage />
          </Suspense>
        } 
      />
      <Route path="*" element={<ReturnsHome />} />
    </Routes>
  );
};

export default ReturnRoutes;
