import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { Layers, User as UserIcon, Mail, Lock, Building, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  workspaceName: z.string().min(2, 'Workspace name must be at least 2 characters').optional().or(z.literal('')),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerAuth } = useAuthStore();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const workspaceId = await registerAuth({
        name: data.name,
        email: data.email,
        password: data.password,
        workspaceName: data.workspaceName || undefined,
      });

      if (workspaceId) {
        navigate(`/workspace/${workspaceId}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setServerError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            marginBottom: '14px',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
          }}>
            <Layers size={28} color="#818cf8" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
            Get started with TeamSpace
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
            Create your account and first workspace in seconds
          </p>
        </div>

        {/* Server Error Alert */}
        {serverError && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.88rem',
            marginBottom: '20px',
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="name-input">Full Name</label>
            <div style={{ position: 'relative' }}>
              <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                id="name-input"
                type="text"
                placeholder="Alex Morgan"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                {...register('name')}
              />
            </div>
            {errors.name && (
              <span className="input-error-text">{errors.name.message}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="register-email-input">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                id="register-email-input"
                type="email"
                placeholder="alex@teamspace.dev"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <span className="input-error-text">{errors.email.message}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="register-password-input">Password (min. 6 characters)</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                id="register-password-input"
                type="password"
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                {...register('password')}
              />
            </div>
            {errors.password && (
              <span className="input-error-text">{errors.password.message}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="workspace-name-input">
              Workspace Name <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(Optional)</span>
            </label>
            <div style={{ position: 'relative' }}>
              <Building size={18} style={{ position: 'absolute', left: '14px', top: '13px', color: 'var(--text-dim)' }} />
              <input
                id="workspace-name-input"
                type="text"
                placeholder="Acme Engineering"
                className="input-field"
                style={{ paddingLeft: '42px' }}
                {...register('workspaceName')}
              />
            </div>
            {errors.workspaceName && (
              <span className="input-error-text">{errors.workspaceName.message}</span>
            )}
          </div>

          <button
            type="submit"
            id="register-submit-btn"
            disabled={isSubmitting}
            className="btn-primary"
            style={{ width: '100%', marginTop: '10px', padding: '12px' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating workspace...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div style={{ textAlign: 'center', marginTop: '26px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            id="link-to-login"
            style={{ color: 'var(--primary-light)', textDecoration: 'none', fontWeight: 600 }}
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
