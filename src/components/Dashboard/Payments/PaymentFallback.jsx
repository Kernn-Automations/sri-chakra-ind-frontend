import React from "react";

const PaymentFallback = ({ error, retry }) => {
  return (
    <div className="container-fluid">
      <div className="row m-0 p-3">
        <div className="col text-center">
          <div className="alert alert-warning">
            <h4>🔧 Payment Module Temporarily Unavailable</h4>
            <p className="mb-3">
              We're experiencing technical difficulties loading the payment dashboard.
            </p>
            
            <div className="row">
              <div className="col-md-6 offset-md-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="card-title">Possible Solutions:</h6>
                    <ul className="list-unstyled text-start">
                      <li>✓ Check your internet connection</li>
                      <li>✓ Clear browser cache and cookies</li>
                      <li>✓ Try refreshing the page</li>
                      <li>✓ Contact support if the issue persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button 
                className="btn btn-primary me-2" 
                onClick={() => window.location.reload()}
              >
                🔄 Refresh Page
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => window.history.back()}
              >
                ← Go Back
              </button>
            </div>

            {error && (
              <details className="mt-3">
                <summary className="btn btn-link">Technical Details</summary>
                <div className="alert alert-light mt-2">
                  <small className="text-muted">
                    <strong>Error:</strong> {error.message || error.toString()}
                  </small>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFallback;
