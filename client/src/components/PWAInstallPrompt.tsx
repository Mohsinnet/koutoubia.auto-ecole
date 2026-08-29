import { useEffect, useState } from "react";
import { Download, X, Smartphone } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const iOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(iOS);
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // show after 3s as requested
      setTimeout(() => setVisible(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // For iOS, show manual instruction after 3s if not installed
    if (iOS && !standalone) {
      const dismissed = localStorage.getItem("pwa-ios-dismissed");
      if (!dismissed) setTimeout(() => setVisible(true), 3000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (isStandalone || !visible) return null;

  // iOS branch
  if (isIOS && !deferredPrompt) {
    return (
      <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md rounded-2xl border border-[#e5ded2] bg-white p-4 shadow-2xl" dir="rtl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d3943] text-white"><Smartphone size={18} /></div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[#173840]">ثبّت التطبيق على الآيفون</p>
            <p className="mt-1 text-xs leading-5 text-[#6b7d7c]">اضغط على زر المشاركة <span className="font-bold"> ⎙ </span> ثم اختر <b>“إضافة إلى الشاشة الرئيسية”</b></p>
          </div>
          <button type="button" onClick={() => { setVisible(false); localStorage.setItem("pwa-ios-dismissed", "1"); }} className="icon-button h-8 w-8 shrink-0" aria-label="إغلاق"><X size={14} /></button>
        </div>
      </div>
    );
  }

  if (!deferredPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    try {
      // haptic
      if ("vibrate" in navigator) navigator.vibrate(20);
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
      setDeferredPrompt(null);
    } catch {
      setVisible(false);
    }
  }

  return (
    <div className="fixed bottom-4 inset-x-4 z-50 mx-auto max-w-md rounded-2xl border border-[#e5ded2] bg-white p-4 shadow-2xl" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8793a] text-white"><Download size={18} /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[#173840]">ثبّت التطبيق على هاتفك</p>
          <p className="text-xs text-[#6b7d7c]">وصول سريع مثل التطبيقات الأصلية + يعمل بدون إنترنت</p>
        </div>
        <button type="button" onClick={() => setVisible(false)} className="icon-button h-8 w-8 shrink-0" aria-label="إغلاق"><X size={14} /></button>
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void handleInstall()} className="primary-button flex-1 justify-center">تثبيت الآن</button>
        <button type="button" onClick={() => setVisible(false)} className="secondary-button">لاحقًا</button>
      </div>
    </div>
  );
}
