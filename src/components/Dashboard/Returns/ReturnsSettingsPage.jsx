import React from 'react';
import { useNavigate } from 'react-router-dom';
import ReturnSettings from './ReturnSettings';

const ReturnsSettingsPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <p className="path">
        <span onClick={() => navigate("/returns")}>Returns</span>{" "}
        <i className="bi bi-chevron-right"></i> Settings
      </p>
      
      <div style={{ padding: '20px' }}>
        <ReturnSettings />
      </div>
    </>
  );
};

export default ReturnsSettingsPage;
