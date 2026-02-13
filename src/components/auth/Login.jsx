import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

const Login = () => {
    const { login, register } = useTournament();
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        if (isRegisterMode && password !== confirmPassword) {
            setError('Passwords do not match');
            setIsSubmitting(false);
            return;
        }

        // Simulate a bit of loading for premium feel
        setTimeout(() => {
            const result = isRegisterMode
                ? register(username, password)
                : login(username, password);

            if (!result.success) {
                setError(result.message);
                setIsSubmitting(false);
            }
        }, 800);
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError('');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="login-wrapper">
            <div className="login-card glass card">
                <div className="login-header">
                    <div className="icon-circle">🏐</div>
                    <h2>{isRegisterMode ? 'Create Account' : 'Tournament Manager'}</h2>
                    <p>{isRegisterMode ? 'Join our tournament community' : 'Please enter your credentials to continue'}</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. beach_master"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {isRegisterMode && (
                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    )}

                    {error && <div className="login-error animate-fade-in">{error}</div>}

                    <button
                        type="submit"
                        className={`btn btn-primary btn-large ${isSubmitting ? 'btn-loading' : ''}`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : (isRegisterMode ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                <div className="login-mode-toggle">
                    <span>{isRegisterMode ? 'Already have an account?' : "Don't have an account?"}</span>
                    <button type="button" className="mode-btn" onClick={toggleMode}>
                        {isRegisterMode ? 'Sign In' : 'Create One'}
                    </button>
                </div>

                <div className="login-footer">
                    <p>Demo Credentials: <code>admin / admin123</code></p>
                </div>
            </div>

            <style jsx>{`
        .login-wrapper {
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
          position: fixed;
          top: 0;
          left: 0;
          z-index: 2000;
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: var(--space-xl);
          animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .login-header {
          text-align: center;
          margin-bottom: var(--space-xl);
        }
        .icon-circle {
          font-size: 2.5rem;
          margin-bottom: var(--space-md);
          display: inline-block;
          animation: bounce 2s infinite ease-in-out;
        }
        h2 {
          color: var(--primary-dark);
          margin-bottom: var(--space-xs);
        }
        .login-header p {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        label {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        input {
          padding: var(--space-md);
          border: 1px solid #ddd;
          border-radius: var(--radius-md);
          font-size: 1rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(0, 119, 182, 0.1);
        }
        .login-error {
          padding: var(--space-sm);
          background-color: rgba(193, 18, 31, 0.1);
          color: var(--danger);
          border-radius: var(--radius-sm);
          text-align: center;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .btn-large {
          width: 100%;
          padding: var(--space-md);
          font-size: 1.1rem;
          margin-top: var(--space-md);
        }
        .btn-loading {
          opacity: 0.8;
          cursor: not-allowed;
        }
        .login-mode-toggle {
          margin-top: var(--space-lg);
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        .mode-btn {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: bold;
          cursor: pointer;
          margin-left: 5px;
          text-decoration: underline;
        }
        .login-footer {
          margin-top: var(--space-xl);
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        code {
          background: #f1f3f5;
          padding: 2px 4px;
          border-radius: 4px;
          color: var(--primary-dark);
          font-weight: bold;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
};

export default Login;
