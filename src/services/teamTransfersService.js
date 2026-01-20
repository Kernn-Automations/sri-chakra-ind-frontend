import api from './apiService';

// Team Transfers Service
// Uses fetch-based apiService with token handling

const getEmployeesForTransfer = async ({ page = 1, limit = 50, search = '', teamId } = {}) => {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (search) query.set('search', search);
  if (teamId) query.set('teamId', String(teamId));

  const res = await api.get(`/team-transfers/employees/for-transfer?${query.toString()}`);
  return res.json ? res.json() : res?.data ?? res;
};

const getAvailableTeams = async (employeeId) => {
  const res = await api.get(`/team-transfers/available-teams/${employeeId}`);
  return res.json ? res.json() : res?.data ?? res;
};

const transferEmployee = async ({ employeeId, toTeamId, transferReason }) => {
  const payload = { employeeId, toTeamId, transferReason };
  const res = await api.post(`/team-transfers/transfer`, payload);
  return res.json ? res.json() : res?.data ?? res;
};

const getEmployeeHistory = async (employeeId) => {
  const res = await api.get(`/team-transfers/history/employee/${employeeId}`);
  return res.json ? res.json() : res?.data ?? res;
};

const getAllHistory = async ({ page, limit, fromDate, toDate, employeeId } = {}) => {
  const query = new URLSearchParams();
  if (page) query.set('page', String(page));
  if (limit) query.set('limit', String(limit));
  if (fromDate) query.set('fromDate', fromDate);
  if (toDate) query.set('toDate', toDate);
  if (employeeId) query.set('employeeId', String(employeeId));
  const qs = query.toString();
  const res = await api.get(`/team-transfers/history/all${qs ? `?${qs}` : ''}`);
  return res.json ? res.json() : res?.data ?? res;
};

export default {
  getEmployeesForTransfer,
  getAvailableTeams,
  transferEmployee,
  getEmployeeHistory,
  getAllHistory,
};



