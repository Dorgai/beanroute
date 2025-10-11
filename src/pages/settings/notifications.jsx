// Notification Settings Page
import { useSession } from '../../lib/session';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import NotificationSettings from '../../components/ui/NotificationSettings';
import { FiArrowLeft } from 'react-icons/fi';
import Link from 'next/link';
import { useTheme } from '../../contexts/ThemeContext';

export default function NotificationSettingsPage() {
  const { session, loading } = useSession();
  const router = useRouter();
  const { isDark } = useTheme();

  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-800' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-800' : 'bg-gray-50'} py-8`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/orders"
            className={`inline-flex items-center text-sm ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'} mb-4`}
          >
            <FiArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
          
          <div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Settings</h1>
            <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
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
                  {typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700">
                        📱 <strong>Mobile Optimized:</strong> Notifications are optimized for mobile devices and will appear in your device's notification center, even when the app is closed.
                      </p>
                    </div>
                  )}
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
                    {typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && (
                      <>
                        <li><strong>Mobile users:</strong> Check your device's notification center</li>
                        <li><strong>iOS users:</strong> Ensure notifications are enabled in Safari settings</li>
                        <li><strong>Android users:</strong> Check Chrome notification permissions</li>
                        <li><strong>PWA:</strong> Try adding the app to your home screen</li>
                      </>
                    )}
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

