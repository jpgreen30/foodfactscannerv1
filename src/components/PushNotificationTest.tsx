import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  BellOff, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Globe, 
  Send, 
  RefreshCw,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
}

/**
 * PushNotificationTest Component (Web Stub)
 * This is a simplified version that works on web without Capacitor
 */
export const PushNotificationTest = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  
  const {
    isSupported,
    isSubscribed,
    permissions,
    subscribe,
    unsubscribe,
    sendTestNotification,
    error: pushError,
  } = usePushNotifications();

  const addResult = (step: string, status: TestResult['status'], message: string) => {
    setTestResults(prev => [...prev, { step, status, message }]);
  };

  const runTest = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      addResult('Platform Check', 'pending', 'Checking if push is supported...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!isSupported) {
        addResult('Platform Check', 'warning', 'Push notifications not supported on web (requires native app)');
      } else {
        addResult('Platform Check', 'success', 'Push notifications are supported');
      }

      addResult('Permissions', 'pending', 'Checking permissions...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (permissions?.receipt === 'granted') {
        addResult('Permissions', 'success', 'Permission granted');
      } else {
        addResult('Permissions', 'warning', 'Permission not granted (or web limitation)');
      }

      if (isSubscribed) {
        addResult('Subscription', 'success', 'Already subscribed');
      } else {
        addResult('Subscription', 'pending', 'Testing subscription...');
        await new Promise(resolve => setTimeout(resolve, 500));
        addResult('Subscription', 'warning', 'Cannot subscribe on web (requires native app)');
      }

      addResult('Test Notification', 'pending', 'Sending test notification...');
      await new Promise(resolve => setTimeout(resolve, 500));
      addResult('Test Notification', 'warning', 'Cannot send on web (requires native app)');
      
    } catch (err) {
      addResult('Error', 'error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notification Test
        </CardTitle>
        <CardDescription>
          Test push notification functionality (web mode - limited)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {isSupported ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <div>
              <p className="font-medium text-sm">Supported</p>
              <p className="text-xs text-muted-foreground">
                {isSupported ? 'Available on this platform' : 'Not available on web (requires native app)'}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Current Status</p>
              <p className="text-xs text-muted-foreground">
                {isSubscribed ? 'Subscribed' : 'Not subscribed'}
              </p>
            </div>
            <Badge variant={isSubscribed ? 'default' : 'outline'}>
              {isSubscribed ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          
          {permissions && (
            <div className="text-xs text-muted-foreground">
              Permission: {permissions.receipt}
            </div>
          )}
        </div>

        {pushError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{pushError}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={runTest} 
            disabled={isTesting}
            className="flex-1"
            variant="outline"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Run Full Test
              </>
            )}
          </Button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
            <p className="text-sm font-medium">Test Results:</p>
            {testResults.map((result, idx) => (
              <div key={idx} className="text-xs flex items-start gap-2">
                <span className={
                  result.status === 'success' ? 'text-green-500' :
                  result.status === 'error' ? 'text-red-500' :
                  result.status === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }>
                  {result.status === 'success' ? '✓' :
                   result.status === 'error' ? '✗' :
                   result.status === 'warning' ? '⚠' : '○'}
                </span>
                <span>
                  <strong>{result.step}:</strong> {result.message}
                </span>
              </div>
            ))}
          </div>
        )}

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Push notifications require a native app build (iOS/Android). This web version cannot receive push notifications.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PushNotificationTest;
