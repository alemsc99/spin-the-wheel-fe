function LoadingSpinner() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(255,255,255,0.95)', zIndex: 9999
    }}>
      <div className="spinner" />
      <style>{`
        .spinner {
          border: 6px solid #eee;
          border-top: 6px solid #f49f31;
          border-radius: 50%;
          width: 56px;
          height: 56px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}</style>
    </div>
  );
}

export default LoadingSpinner;