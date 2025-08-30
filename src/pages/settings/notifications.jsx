// Notification Settings Page
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import NotificationSettings from '../../components/ui/NotificationSettings';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';

export default function NotificationSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notification Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your push notification preferences and connected devices
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-2">
            <NotificationSettings />
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <InfoCard
              title="About Push Notifications"
              content={
                <div className="text-sm text-gray-600 space-y-3">
                  <p>
                    Push notifications let you stay updated with important BeanRoute activities even when you're not actively using the app.
                  </p>
                  <p>
                    They work across all your devices and browsers where you've enabled them.
                  </p>
                </div>
              }
            />

            <InfoCard
              title="Privacy & Security"
              content={
                <div className="text-sm text-gray-600 space-y-3">
                  <p>
                    Your notification preferences are stored securely and only used to send relevant updates.
                  </p>
                  <p>
                    You can disable notifications anytime without affecting your account.
                  </p>
                </div>
              }
            />

            <InfoCard
              title="Troubleshooting"
              content={
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>Not receiving notifications?</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Check your browser's notification settings</li>
                    <li>Make sure notifications aren't blocked for this site</li>
                    <li>Try the "Send Test Notification" button</li>
                    <li>Refresh the page and try again</li>
                  </ul>
                </div>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const InfoCard = ({ title, content }) => (
  <div className="bg-white rounded-lg shadow-sm border p-6">
    <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
    {content}
  </div>
);

