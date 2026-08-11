import { RemoteOptions } from 'webdriverio';

export interface AppiumTestOptions {
  hostname: string;
  port: number;
  path: string;
  capabilities: Record<string, any>;
}

export const APPIUM_CONFIG: RemoteOptions = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/wd/hub',
  logLevel: 'info',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME || 'Android Emulator',
    'appium:appPackage': 'com.skillsnap.ai',
    'appium:appActivity': 'com.skillsnap.ai.MainActivity',
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 180,
    'appium:autoGrantPermissions': true
  }
};
