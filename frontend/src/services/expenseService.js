import api from './api';

export const getExpenses = async (filters = {}) => {
  const { data } = await api.get('/expenses', { params: filters });
  return data.data.expenses;
};

export const createExpense = async (expenseData) => {
  const { data } = await api.post('/expenses', expenseData);
  return data.data.expense;
};

export const updateExpense = async (id, expenseData) => {
  const { data } = await api.put(`/expenses/${id}`, expenseData);
  return data.data.expense;
};

export const deleteExpense = async (id) => {
  await api.delete(`/expenses/${id}`);
};

export const getExpenseStats = async (filters = {}) => {
  const { data } = await api.get('/expenses/stats', { params: filters });
  return data.data.stats;
};
