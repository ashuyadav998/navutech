import React, { useState, useEffect } from 'react';
import {
  FaPlus, FaEdit, FaTrash, FaTag, FaTimes,
  FaCheckCircle, FaTimesCircle, FaPercent, FaEuroSign, FaTruck
} from 'react-icons/fa';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../../services/api';
import '../../styles/AdminCoupons.css';

const EMPTY_FORM = {
  code: '', description: '', type: 'percentage',
  value: '', minOrderAmount: '', maxUses: '', expiresAt: '', isActive: true
};

const typeLabels = {
  percentage:   { label: '% Descuento',   icon: <FaPercent /> },
  fixed:        { label: '€ Fijo',         icon: <FaEuroSign /> },
  free_shipping:{ label: 'Envío Gratis',   icon: <FaTruck /> }
};

const AdminCoupons = () => {
  const [coupons,   setCoupons]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [editing,   setEditing]   = useState(null); // null = crear nuevo
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getCoupons();
      setCoupons(res.data);
    } catch (e) {
      setError('Error al cargar cupones');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  };

  const openEdit = (coupon) => {
    setEditing(coupon._id);
    setForm({
      code:           coupon.code,
      description:    coupon.description || '',
      type:           coupon.type,
      value:          coupon.value ?? '',
      minOrderAmount: coupon.minOrderAmount ?? '',
      maxUses:        coupon.maxUses ?? '',
      expiresAt:      coupon.expiresAt
                        ? new Date(coupon.expiresAt).toISOString().split('T')[0]
                        : '',
      isActive:       coupon.isActive
    });
    setError('');
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditing(null);
    setError('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        code:           form.code.toUpperCase().trim(),
        description:    form.description,
        type:           form.type,
        value:          form.type !== 'free_shipping' ? parseFloat(form.value) || 0 : 0,
        minOrderAmount: parseFloat(form.minOrderAmount) || 0,
        maxUses:        form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt:      form.expiresAt || null,
        isActive:       form.isActive
      };

      if (editing) {
        await updateCoupon(editing, payload);
        setSuccess('Cupón actualizado correctamente');
      } else {
        await createCoupon(payload);
        setSuccess('Cupón creado correctamente');
      }

      closeModal();
      fetchCoupons();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el cupón');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`¿Eliminar el cupón "${code}"?`)) return;
    try {
      await deleteCoupon(id);
      fetchCoupons();
      setSuccess('Cupón eliminado');
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError('Error al eliminar el cupón');
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await updateCoupon(coupon._id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (e) {
      setError('Error al actualizar el cupón');
    }
  };

  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="admin-coupons">
      {/* Header */}
      <div className="admin-page-header">
        <h1><FaTag /> Cupones de Descuento</h1>
        <button className="btn-admin-primary" onClick={openCreate}>
          <FaPlus /> Nuevo cupón
        </button>
      </div>

      {/* Mensajes */}
      {success && (
        <div className="coupon-msg success">
          <FaCheckCircle /> {success}
        </div>
      )}
      {error && !modal && (
        <div className="coupon-msg error">
          <FaTimesCircle /> {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="loading">Cargando cupones...</div>
      ) : (
        <div className="admin-panel">
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Mínimo</th>
                  <th>Usos</th>
                  <th>Expira</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="no-data">
                      No hay cupones. ¡Crea el primero!
                    </td>
                  </tr>
                ) : (
                  coupons.map(c => (
                    <tr key={c._id}>
                      <td>
                        <span className="coupon-code-cell">
                          {typeLabels[c.type].icon} {c.code}
                        </span>
                        {c.description && (
                          <span className="coupon-desc-cell">{c.description}</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge-type-${c.type}`}>
                          {typeLabels[c.type].label}
                        </span>
                      </td>
                      <td>
                        {c.type === 'percentage'    ? `${c.value}%`   :
                         c.type === 'fixed'         ? `${c.value} €`  : '—'}
                      </td>
                      <td>{c.minOrderAmount > 0 ? `${c.minOrderAmount} €` : '—'}</td>
                      <td>
                        {c.maxUses
                          ? `${c.usedCount} / ${c.maxUses}`
                          : `${c.usedCount} / ∞`}
                      </td>
                      <td>
                        {c.expiresAt ? (
                          <span className={isExpired(c.expiresAt) ? 'text-expired' : ''}>
                            {new Date(c.expiresAt).toLocaleDateString('es-ES')}
                            {isExpired(c.expiresAt) && ' (expirado)'}
                          </span>
                        ) : '—'}
                      </td>
                      <td>
                        <button
                          className={`toggle-active-btn ${c.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleActive(c)}
                          title={c.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {c.isActive
                            ? <><FaCheckCircle /> Activo</>
                            : <><FaTimesCircle /> Inactivo</>}
                        </button>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button
                            className="btn-admin-secondary btn-sm"
                            onClick={() => openEdit(c)}
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="btn-admin-danger btn-sm"
                            onClick={() => handleDelete(c._id, c.code)}
                            title="Eliminar"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Editar Cupón' : 'Nuevo Cupón'}</h3>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            {error && (
              <div className="coupon-msg error modal-error">
                <FaTimesCircle /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="coupon-form-admin">

              {/* Código */}
              <div className="form-group">
                <label>Código del cupón *</label>
                <input
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="ej: VERANO25"
                  required
                  maxLength={30}
                  style={{ textTransform: 'uppercase' }}
                />
              </div>

              {/* Descripción */}
              <div className="form-group">
                <label>Descripción (visible para el cliente)</label>
                <input
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="ej: 25% de descuento en verano"
                />
              </div>

              {/* Tipo */}
              <div className="form-group">
                <label>Tipo de descuento *</label>
                <div className="type-selector">
                  {Object.entries(typeLabels).map(([key, { label, icon }]) => (
                    <label
                      key={key}
                      className={`type-option ${form.type === key ? 'selected' : ''}`}
                    >
                      <input
                        type="radio"
                        name="type"
                        value={key}
                        checked={form.type === key}
                        onChange={handleChange}
                        hidden
                      />
                      {icon} {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Valor (solo si no es free_shipping) */}
              {form.type !== 'free_shipping' && (
                <div className="form-group">
                  <label>
                    {form.type === 'percentage' ? 'Porcentaje (1-100) *' : 'Cantidad en € *'}
                  </label>
                  <input
                    name="value"
                    type="number"
                    value={form.value}
                    onChange={handleChange}
                    min="0.01"
                    max={form.type === 'percentage' ? 100 : undefined}
                    step="0.01"
                    placeholder={form.type === 'percentage' ? '10' : '5.00'}
                    required
                  />
                </div>
              )}

              {/* Grid: mínimo + usos */}
              <div className="form-row-2">
                <div className="form-group">
                  <label>Pedido mínimo (€)</label>
                  <input
                    name="minOrderAmount"
                    type="number"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0 = sin mínimo"
                  />
                </div>
                <div className="form-group">
                  <label>Máximo de usos</label>
                  <input
                    name="maxUses"
                    type="number"
                    value={form.maxUses}
                    onChange={handleChange}
                    min="1"
                    placeholder="Vacío = ilimitado"
                  />
                </div>
              </div>

              {/* Fecha expiración */}
              <div className="form-group">
                <label>Fecha de expiración</label>
                <input
                  name="expiresAt"
                  type="date"
                  value={form.expiresAt}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Activo */}
              <div className="form-group form-group-check">
                <label className="checkbox-label-admin">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleChange}
                  />
                  Cupón activo (visible y usable por los clientes)
                </label>
              </div>

              {/* Acciones */}
              <div className="modal-actions">
                <button type="button" className="btn-admin-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-admin-primary"
                  disabled={saving}
                >
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;