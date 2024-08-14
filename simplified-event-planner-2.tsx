import React, { useState, useMemo } from 'react';

const VENDOR_CATEGORIES = ['Catering', 'Venue', 'Entertainment', 'Decoration', 'Photography', 'Other'];

const EventPlannerPro = () => {
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [eventVendors, setEventVendors] = useState({});
  const [currentDate, setCurrentDate] = useState(new Date());

  const addEvent = (event) => {
    const newEvent = { ...event, id: Date.now() };
    setEvents([...events, newEvent]);
    setEventVendors({ ...eventVendors, [newEvent.id]: [] });
    setShowAddEvent(false);
  };

  const addVendor = (vendor) => {
    setVendors([...vendors, { ...vendor, id: Date.now(), availability: [] }]);
    setShowAddVendor(false);
  };

  const updateVendorAvailability = (vendorId, date) => {
    setVendors(vendors.map(vendor =>
      vendor.id === vendorId
        ? { ...vendor, availability: [...vendor.availability, date] }
        : vendor
    ));
  };

  const generateEmailTemplate = (vendor) => {
    setSelectedVendor(vendor);
    setShowEmailTemplate(true);
  };

  const assignVendorToEvent = (eventId, vendorId) => {
    setEventVendors(prev => ({
      ...prev,
      [eventId]: [...(prev[eventId] || []), vendorId]
    }));
  };

  const removeVendorFromEvent = (eventId, vendorId) => {
    setEventVendors(prev => ({
      ...prev,
      [eventId]: prev[eventId].filter(id => id !== vendorId)
    }));
  };

  const eventsByDate = useMemo(() => {
    const eventMap = {};
    events.forEach(event => {
      if (!eventMap[event.date]) {
        eventMap[event.date] = [];
      }
      eventMap[event.date].push(event);
    });
    return eventMap;
  }, [events]);

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="text-center p-1"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate[date] || [];
      const availableVendors = vendors.filter(v => v.availability.includes(date));
      const vendorTypes = [...new Set(availableVendors.map(v => v.category))];

      days.push(
        <div key={date} className="border p-1 h-24 overflow-y-auto text-xs">
          <div className="font-bold">{day}</div>
          {dayEvents.map(event => (
            <div key={event.id} className="bg-blue-100 p-1 mb-1 rounded">{event.name}</div>
          ))}
          {vendorTypes.map(type => (
            <div key={type} className="text-green-600">
              {availableVendors.filter(v => v.category === type).length} {type}
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <button onClick={() => setCurrentDate(new Date(year, month - 1))}>&lt;</button>
          <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1))}>&gt;</button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="font-bold text-center">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  const getVendorAvailability = (vendor, eventDate) => 
    vendor.availability.includes(eventDate) ? 'Available' : 'Pending';

  const renderVendorOptions = (eventId, eventDate) => 
    VENDOR_CATEGORIES.map(category => {
      const categoryVendors = vendors
        .filter(v => v.category === category && !eventVendors[eventId]?.includes(v.id))
        .map(vendor => ({
          ...vendor,
          status: getVendorAvailability(vendor, eventDate)
        }))
        .sort((a, b) => {
          const order = { 'Available': 0, 'Pending': 1 };
          return order[a.status] - order[b.status];
        });

      if (categoryVendors.length === 0) return null;

      return (
        <optgroup key={category} label={category}>
          {categoryVendors.map(vendor => (
            <option key={vendor.id} value={vendor.id}>
              {vendor.name} - {vendor.status}
            </option>
          ))}
        </optgroup>
      );
    });

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">Event Planner Pro</h1>
      {renderCalendar()}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Events</h2>
            <button onClick={() => setShowAddEvent(true)} className="bg-blue-500 text-white px-2 py-1 rounded">
              +
            </button>
          </div>
          <div className="bg-white shadow rounded p-2">
            {events.map(event => (
              <div key={event.id} className="mb-2 p-2 bg-gray-100 rounded">
                <p className="font-semibold">{event.name} - {event.date}</p>
                <select 
                  onChange={(e) => assignVendorToEvent(event.id, Number(e.target.value))}
                  className="mt-1 w-full p-1 text-sm border rounded"
                >
                  <option value="">Assign vendor</option>
                  {renderVendorOptions(event.id, event.date)}
                </select>
                {eventVendors[event.id]?.map(vendorId => {
                  const vendor = vendors.find(v => v.id === vendorId);
                  return vendor && (
                    <div key={vendorId} className="flex justify-between items-center text-sm mt-1">
                      <span>{vendor.name} - {getVendorAvailability(vendor, event.date)}</span>
                      <button onClick={() => removeVendorFromEvent(event.id, vendorId)} className="text-red-500">
                        Remove
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">Vendors</h2>
            <button onClick={() => setShowAddVendor(true)} className="bg-green-500 text-white px-2 py-1 rounded">
              +
            </button>
          </div>
          <div className="bg-white shadow rounded p-2">
            {vendors.map(vendor => (
              <div key={vendor.id} className="mb-2 p-2 bg-gray-100 rounded">
                <p className="font-semibold">{vendor.name} - {vendor.category}</p>
                <div className="flex items-center mt-1">
                  <input
                    type="date"
                    className="text-sm border rounded p-1 mr-2"
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      setSelectedVendor({ ...vendor, selectedDate });
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (selectedVendor && selectedVendor.id === vendor.id) {
                        updateVendorAvailability(vendor.id, selectedVendor.selectedDate);
                      }
                    }}
                    className="text-sm bg-green-500 text-white px-2 py-1 rounded mr-2"
                  >
                    Available
                  </button>
                  <button 
                    onClick={() => generateEmailTemplate(vendor)}
                    className="text-sm bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Email
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {showAddEvent && <AddEventModal onClose={() => setShowAddEvent(false)} onAdd={addEvent} />}
      {showAddVendor && <AddVendorModal onClose={() => setShowAddVendor(false)} onAdd={addVendor} />}
      {showEmailTemplate && selectedVendor && (
        <EmailTemplateModal 
          vendor={selectedVendor}
          onClose={() => setShowEmailTemplate(false)} 
        />
      )}
    </div>
  );
};

const AddEventModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ name, date });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Add Event</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Event Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2">Cancel</button>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddVendorModal = ({ onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ name, category });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Add Vendor</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Vendor Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            required
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 mb-2 border rounded"
            required
          >
            <option value="">Select a category</option>
            {VENDOR_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <div className="flex justify-end">
            <button type="button" onClick={onClose} className="mr-2">Cancel</button>
            <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EmailTemplateModal = ({ vendor, onClose }) => {
  const emailTemplate = `Dear ${vendor.name},\n\nI hope this email finds you well. We are organizing an event and would like to inquire about your availability.\n\nPlease let us know if you would be available to provide your ${vendor.category} services for our event.\n\nBest regards,\nEvent Planner`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg max-w-lg w-full">
        <h3 className="text-lg font-semibold mb-2">Email Template</h3>
        <textarea
          className="w-full h-40 p-2 border rounded mb-2"
          value={emailTemplate}
          readOnly
        />
        <div className="flex justify-end">
          <button onClick={onClose} className="mr-2">Close</button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(emailTemplate);
              onClose();
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Copy to Clipboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventPlannerPro;
