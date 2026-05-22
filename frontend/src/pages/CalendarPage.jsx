import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, AlignLeft, Trash2, CheckCircle2, Bell } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './CalendarPage.css';

const CalendarPage = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    start_time: '',
    end_time: '',
    color: '#3b82f6',
    event_partage: false
  });

  const isOwner = !editingEvent || editingEvent.user_id === user?.id;
  const creatorName = editingEvent?.creator_name || 'un autre utilisateur';

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/events');
      setEvents(res.data.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Calendar Helpers
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const daysOfWeek = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  const handleDateClick = (date) => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      event_date: date,
      start_time: '09:00',
      end_time: '10:00',
      color: '#3b82f6',
      event_partage: false
    });
    setShowModal(true);
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: new Date(event.event_date).toLocaleDateString('en-CA'),
      start_time: event.start_time?.substring(0, 5) || '',
      end_time: event.end_time?.substring(0, 5) || '',
      color: event.color || '#3b82f6',
      event_partage: event.event_partage || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      alert('Vous n\'êtes pas autorisé à modifier cet événement.');
      return;
    }
    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}`, formData);
      } else {
        await api.post('/events', formData);
      }
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert('Erreur lors de l\'enregistrement de l\'événement');
    }
  };

  const handleDelete = async () => {
    if (!editingEvent) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cet événement ?')) return;
    try {
      await api.delete(`/events/${editingEvent.id}`);
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  // Render Calendar Grid
  const renderHeader = () => (
    <div className="calendar-header-nav">
      <div className="calendar-title-group">
        <CalendarIcon size={28} className="text-primary" />
        <h1>Mon Planning</h1>
      </div>
      <div className="calendar-controls">
        <button className="nav-btn" onClick={prevMonth}><ChevronLeft size={20} /></button>
        <h2 className="current-month">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button className="nav-btn" onClick={nextMonth}><ChevronRight size={20} /></button>
      </div>
      <button className="add-event-btn" onClick={() => handleDateClick(new Date().toISOString().split('T')[0])}>
        <Plus size={18} /> Nouvel Événement
      </button>
    </div>
  );

  const renderDays = () => (
    <div className="calendar-days-header">
      {daysOfWeek.map((day, index) => (
        <div key={index} className="day-name">{day}</div>
      ))}
    </div>
  );

  const renderCells = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const numDays = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const cells = [];

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }

    // Days of current month
    for (let day = 1; day <= numDays; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = new Date().toLocaleDateString('en-CA') === dateStr;
      
      const dayEvents = events.filter(e => {
        if (!e.event_date) return false;
        const eDate = new Date(e.event_date).toLocaleDateString('en-CA');
        return eDate === dateStr;
      });

      cells.push(
        <div key={day} className={`calendar-cell ${isToday ? 'today' : ''}`} onClick={() => handleDateClick(dateStr)}>
          <span className="day-number">{day}</span>
          <div className="cell-events">
            {dayEvents.map(event => (
              <div 
                key={event.id} 
                className="event-pill" 
                style={{ backgroundColor: event.color }}
                onClick={(e) => handleEventClick(e, event)}
              >
                {event.start_time && <span className="event-time">{event.start_time.substring(0, 5)}</span>}
                <span className="event-title">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div className="calendar-grid">{cells}</div>;
  };

  return (
    <div className="calendar-page animate-fade-in">
      {renderHeader()}
      <div className="calendar-body shadow-soft">
        {renderDays()}
        {renderCells()}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content calendar-modal animate-pop">
            <div className="modal-header">
              <h2>{editingEvent ? (isOwner ? "Modifier l'événement" : "Détails de l'événement") : 'Planifier un événement'}</h2>
              <button className="close-modal" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="event-form">
              {!isOwner && (
                <div className="event-info-banner animate-fade-in">
                  <Bell size={18} />
                  <span>Cet événement a été partagé par <strong>{creatorName}</strong>. Vous pouvez uniquement le consulter.</span>
                </div>
              )}

              <div className="form-group">
                <label><CalendarIcon size={16} /> Titre</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="Ex: Réunion client, Rappel dossier..." 
                  required 
                  disabled={!isOwner}
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label><CalendarIcon size={16} /> Date</label>
                  <input 
                    type="date" 
                    value={formData.event_date} 
                    onChange={e => setFormData({...formData, event_date: e.target.value})} 
                    required 
                    disabled={!isOwner}
                  />
                </div>
                <div className="form-group">
                  <label><Clock size={16} /> Début</label>
                  <input 
                    type="time" 
                    value={formData.start_time} 
                    onChange={e => setFormData({...formData, start_time: e.target.value})} 
                    disabled={!isOwner}
                  />
                </div>
              </div>

              <div className="form-group">
                <label><AlignLeft size={16} /> Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Détails supplémentaires..."
                  rows="3"
                  disabled={!isOwner}
                ></textarea>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isOwner ? 'pointer' : 'default' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.event_partage} 
                    onChange={e => setFormData({...formData, event_partage: e.target.checked})}
                    style={{ width: '18px', height: '18px', cursor: isOwner ? 'pointer' : 'default' }}
                    disabled={!isOwner}
                  />
                  <span>Partager cet événement avec tous les utilisateurs</span>
                </label>
              </div>

              <div className="form-group">
                <label>Couleur</label>
                <div className="color-picker">
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1'].map(c => (
                    <div 
                      key={c} 
                      className={`color-option ${formData.color === c ? 'selected' : ''}`} 
                      style={{ backgroundColor: c, cursor: isOwner ? 'pointer' : 'default' }}
                      onClick={() => isOwner && setFormData({...formData, color: c})}
                    >
                      {formData.color === c && <CheckCircle2 size={14} color="#fff" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                {editingEvent && isOwner && (
                  <button type="button" className="delete-btn" onClick={handleDelete}>
                    <Trash2 size={18} /> Supprimer
                  </button>
                )}
                {isOwner ? (
                  <button type="submit" className="save-btn">
                    {editingEvent ? 'Mettre à jour' : 'Enregistrer'}
                  </button>
                ) : (
                  <button type="button" className="save-btn" onClick={() => setShowModal(false)}>
                    Fermer
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
