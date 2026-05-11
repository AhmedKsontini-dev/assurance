import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Eye } from 'lucide-react';

const Reports = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await api.get('/reports/employees');
      setEmployees(response.data.data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch reports', err);
      setLoading(false);
    }
  };

  const handleViewDetails = async (employeeId) => {
    setLoadingDetails(true);
    setSelectedEmployee(employeeId);
    try {
      const response = await api.get(`/reports/employee/${employeeId}`);
      setDetails(response.data.data);
      setLoadingDetails(false);
    } catch (err) {
      console.error('Failed to fetch details', err);
      setLoadingDetails(false);
    }
  };

  if (loading) return <div className="loading">Chargement des rapports...</div>;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Rapports de Performance des Employés</h1>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nom de l'employé</th>
              <th>Email</th>
              <th>Clients Total</th>
              <th>Volume Financier Total (TND)</th>
             
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr 
                key={emp.id} 
                onClick={() => navigate(`/reports/employee/${emp.id}`)}
                style={{ cursor: 'pointer' }}
                className="hover-row"
              >
                <td><strong>{emp.name}</strong></td>
                <td>{emp.email}</td>
                <td>
                  <span className="badge-count">{emp.total_clients}</span>
                </td>
                <td>
                  <span className="amount">{parseFloat(emp.total_amount).toLocaleString()} TND</span>
                </td>
               
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
