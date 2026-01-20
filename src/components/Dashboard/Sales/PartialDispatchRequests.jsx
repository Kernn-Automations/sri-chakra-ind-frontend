import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../Auth';
import { useDivision } from '../../context/DivisionContext';
import partialDispatchService from '../../../services/partialDispatchService';
import { showSuccessNotification, showErrorNotification } from '../../../utils/errorHandler';
import { isAdmin, isSuperAdmin } from '../../../utils/roleUtils';
import Loading from '@/components/Loading';
import ErrorModal from '@/components/ErrorModal';
import StoreIndentRequests from './StoreIndentRequests';
import PartialDispatchRequestsList from './PartialDispatchRequestsList';

const PartialDispatchRequests = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { axiosAPI } = useAuth();
  const { selectedDivision, showAllDivisions } = useDivision();

  // Get active tab from URL params or default to 'partial-dispatch'
  const activeTabFromUrl = searchParams.get('tab') || 'partial-dispatch';
  const [activeTab, setActiveTab] = useState(activeTabFromUrl);

  // Update URL when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', tab);
    setSearchParams(newParams);
  };

  // User permissions
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdminUser = isAdmin(user);
  const isSuperAdminUser = isSuperAdmin(user);
  const canApprove = isAdminUser || isSuperAdminUser;

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Requests</h2>
      </div>

      {/* Tabs */}
      <div className="card mb-3">
        <div className="card-body p-0">
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'partial-dispatch' ? 'active' : ''}`}
                onClick={() => handleTabChange('partial-dispatch')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'partial-dispatch'}
              >
                Partial Dispatch Requests
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${activeTab === 'store-indents' ? 'active' : ''}`}
                onClick={() => handleTabChange('store-indents')}
                type="button"
                role="tab"
                aria-selected={activeTab === 'store-indents'}
              >
                Store Indent Requests
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'partial-dispatch' && (
          <div role="tabpanel">
            <PartialDispatchRequestsList navigate={navigate} canApprove={canApprove} />
          </div>
        )}
        {activeTab === 'store-indents' && (
          <div role="tabpanel">
            <StoreIndentRequests navigate={navigate} canApprove={canApprove} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PartialDispatchRequests;
