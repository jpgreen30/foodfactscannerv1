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
import { isNativePlatform, getPlatform } from '@/services/nativeCapabilities';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
}

export function PushNotificationTest() {
  const [platform, setPlatform] = useState<string>('detecting...');
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [lastTestTime, setLastTestTime] = useState<Date | null>(null);
  
  const { 
    isInitialized, 
    isLoading, 
    isAvailable, 
    sendTest,
    initialize
  } = usePushNotifications();

  useEffect(() => {
    detectPlatform();
    checkPermissionStatus();
  }, []);

  const detectPlatform = async () => {
    if (isNativePlatform()) {
      const platformName = getPlatform();
      setPlatform(`${platformName} (Native via Capacitor)`);
    } else if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPlatform('Web (PWA with Push Support)');
    } else {
      setPlatform('Web (No Push Support)');
    }
  };

  const checkPermissionStatus = async () => {
    if (isNativePlatform()) {
      try {
        const status = await PushNotifications.checkPermissions();
        setPermissionStatus(status.receive);
      } catch (e) {
        setPermissionStatus('error');
      }
    } else if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else {
      setPermissionStatus('not-supported');
    }
  };

  const addTestResult = (step: string, status: TestResult['status'], message: string) => {
    setTestResults(prev => [...prev, { step, status, message }]);
  };

  const runFullTest = async () => {
    setIsRunningTest(true);
    setTestResults([]);
    setLastTestTime(new Date());

    // Step 1: Platform Detection
    addTestResult('Platform Detection', 'success', `Detected: ${platform}`);
    await new Promise(r => setTimeout(r, 500));

    // Step 2: Permission Check
    await checkPermissionStatus();
    if (permissionStatus === 'granted') {
      addTestResult('Permission Status', 'success', 'Notifications are enabled');
    } else if (permissionStatus === 'denied') {
      addTestResult('Permission Status', 'error', 'Notifications are blocked. Please enable in device settings.');
      setIsRunningTest(false);
      return;
    } else {
      addTestResult('Permission Status', 'warning', `Current status: ${permissionStatus}. May need to request permission.`);
    }
    await new Promise(r => setTimeout(r, 500));

    // Step 3: Initialize Push Notifications
    if (!isInitialized && isAvailable) {
      addTestResult('Initialization', 'pending', 'Initializing push notifications...');
      try {
        await initialize();
        addTestResult('Initialization', 'success', 'Push notifications initialized');
      } catch (e) {
        addTestResult('Initialization', 'error', `Failed to initialize: ${e}`);
        setIsRunningTest(false);
        return;
      }
    } else if (isInitialized) {
      addTestResult('Initialization', 'success', 'Already initialized');
    } else {
      addTestResult('Initialization', 'warning', 'Push notifications not available on this platform');
    }
    await new Promise(r => setTimeout(r, 500));

    // Step 4: Check Device Token Registration
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: tokens } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);
      
      if (tokens && tokens.length > 0) {
        setDeviceToken(tokens[0].token.substring(0, 20) + '...');
        addTestResult('Device Token', 'success', `${tokens.length} active device(s) registered`);
      } else {
        addTestResult('Device Token', 'warning', 'No device tokens registered. Try re-initializing.');
      }
    } else {
      addTestResult('Device Token', 'warning', 'Not logged in. Cannot check device registration.');
    }
    await new Promise(r => setTimeout(r, 500));

    // Step 5: Send Test Notification
    addTestResult('Test Notification', 'pending', 'Sending test notification...');
    try {
      const success = await sendTest();
      if (success) {
        addTestResult('Test Notification', 'success', 'Test notification sent! Check your device.');
      } else {
        addTestResult('Test Notification', 'error', 'Failed to send test notification');
      }
    } catch (e) {
      addTestResult('Test Notification', 'error', `Error: ${e}`);
    }

    setIsRunningTest(false);
  };

  const requestPermission = async () => {
    if (isNativePlatform()) {
      try {
        const result = await PushNotifications.requestPermissions();
        setPermissionStatus(result.receive);
      } catch (e) {
        console.error('Error requesting permissions:', e);
      }
    } else if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    }
  };

  const getPlatformIcon = () => {
    if (platform.includes('iOS') || platform.includes('Android')) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Globe className="h-5 w-5" />;
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notification Test
        </CardTitle>
        <CardDescription>
          Verify push notifications are working on your device
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {getPlatformIcon()}
            <span className="text-sm font-medium">Platform</span>
          </div>
          <Badge variant="outline">{platform}</Badge>
        </div>

        {/* Permission Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span className="text-sm font-medium">Permission</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={permissionStatus === 'granted' ? 'default' : 'secondary'}
              className={permissionStatus === 'granted' ? 'bg-green-500' : ''}
            >
              {permissionStatus}
            </Badge>
            {permissionStatus !== 'granted' && (
              <Button size="sm" variant="outline" onClick={requestPermission}>
                Request
              </Button>
            )}
          </div>
        </div>

        {/* Initialization Status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {isInitialized ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">Status</span>
          </div>
          <Badge variant={isInitialized ? 'default' : 'secondary'}>
            {isLoading ? 'Initializing...' : isInitialized ? 'Ready' : 'Not Initialized'}
          </Badge>
        </div>

        {deviceToken && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">Device Token</p>
            <code className="text-xs">{deviceToken}</code>
          </div>
        )}

        <Separator />

        {/* Run Test Button */}
        <Button 
          onClick={runFullTest} 
          disabled={isRunningTest}
          className="w-full"
        >
          {isRunningTest ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Run Full Test
            </>
          )}
        </Button>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Test Results:</p>
            {testResults.map((result, index) => (
              <div 
                key={index}
                className="flex items-start gap-2 p-2 bg-muted/50 rounded text-sm"
              >
                {getStatusIcon(result.status)}
                <div>
                  <span className="font-medium">{result.step}:</span>{' '}
                  <span className="text-muted-foreground">{result.message}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {lastTestTime && (
          <p className="text-xs text-muted-foreground text-center">
            Last tested: {lastTestTime.toLocaleTimeString()}
          </p>
        )}

        {/* Help Alert */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Tips:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>iOS: Requires app to be installed from App Store or TestFlight</li>
              <li>Android: Works on installed PWA or native app</li>
              <li>Web: Requires HTTPS and browser support</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default PushNotificationTest;
