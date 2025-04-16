import React, { useState } from 'react';
import AlertNotification from './AlertNotification';

export default function AlertExamples() {
  const [showDismissibleAlert, setShowDismissibleAlert] = useState(true);
  
  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Alert Notification Examples</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-3">Basic Alerts</h2>
          <AlertNotification 
            severity="info" 
            message="This is an informational alert with default styling." 
          />
          
          <AlertNotification 
            severity="success" 
            message="Operation completed successfully." 
          />
          
          <AlertNotification 
            severity="warning" 
            message="Warning: This action cannot be undone." 
          />
          
          <AlertNotification 
            severity="error" 
            message="Error: Unable to complete the requested operation." 
          />
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-3">Alerts with Titles</h2>
          <AlertNotification 
            severity="info" 
            title="Information" 
            message="This is an informational alert with a title." 
          />
          
          <AlertNotification 
            severity="success" 
            title="Success" 
            message="Operation completed successfully with a title." 
          />
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-3">Alerts without Icons</h2>
          <AlertNotification 
            severity="warning" 
            message="This is a warning alert without an icon." 
            icon={false}
          />
          
          <AlertNotification 
            severity="error" 
            message="This is an error alert without an icon." 
            icon={false}
          />
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-3">Dismissible Alert</h2>
          {showDismissibleAlert && (
            <AlertNotification 
              severity="info" 
              message="This alert can be dismissed by clicking the X button." 
              dismissible={true}
              onClose={() => setShowDismissibleAlert(false)}
            />
          )}
          
          {!showDismissibleAlert && (
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => setShowDismissibleAlert(true)}
            >
              Restore Dismissible Alert
            </button>
          )}
        </section>
        
        <section>
          <h2 className="text-lg font-semibold mb-3">Custom Styled Alert</h2>
          <AlertNotification 
            severity="success" 
            message="This alert has custom styles applied." 
            sx={{ 
              maxWidth: '400px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
            }}
          />
        </section>
      </div>
    </div>
  );
} 