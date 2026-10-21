import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

export class PlatformService {
  private static isNativePlatform: boolean = false;

  public static init() {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      this.isNativePlatform = (window as any).Capacitor.isNativePlatform();
    }

    if (this.isNativePlatform) {
      try {
        StatusBar.setStyle({ style: Style.Dark });
        StatusBar.setOverlaysWebView({ overlay: true });
      } catch (e) {
        console.warn('StatusBar init skipped', e);
      }
    }
  }

  public static isNative(): boolean {
    return this.isNativePlatform;
  }

  // Register Android Back Button handler
  public static registerBackButton(handler: () => boolean) {
    let listenerPromise: Promise<any> | null = null;
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform()) {
      listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
        // If handler returns true, it handled the back action (e.g. closed modal/fullscreen)
        const handled = handler();
        if (!handled && !canGoBack) {
          App.exitApp();
        }
      });
    }
    return {
      remove: () => {
        if (listenerPromise) {
          listenerPromise.then((handle) => handle.remove());
        }
      },
    };
  }

  // Share or Download File
  public static async shareOrDownload(filename: string, dataUrl: string, mimeType: string) {
    if (this.isNativePlatform) {
      try {
        await Share.share({
          title: filename,
          text: `File from Life of Blocks: ${filename}`,
          url: dataUrl,
          dialogTitle: `Share ${filename}`,
        });
        return;
      } catch (err) {
        console.warn('Native share failed, fallback to browser download', err);
      }
    }

    // Web download fallback
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
