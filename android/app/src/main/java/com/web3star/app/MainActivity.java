package com.web3star.app;

import android.os.Bundle;
import android.webkit.WebView;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.graphics.Insets;
import androidx.core.os.LocaleListCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // English-only app locale: affects WebView + Google Sign-In consent dialog on many devices
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("en"));
        super.onCreate(savedInstanceState);

        // Target SDK 35+ draws edge-to-edge; WebView often gets safe-area-inset-bottom = 0 in CSS.
        // Apply system bar + display cutout + IME insets as WebView padding so the tab bar clears
        // the gesture / 3-button navigation strip on Galaxy and similar devices.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        WebView webView = getBridge().getWebView();
        ViewCompat.setOnApplyWindowInsetsListener(webView, (v, windowInsets) -> {
            Insets bars =
                    windowInsets.getInsets(
                            WindowInsetsCompat.Type.systemBars()
                                    | WindowInsetsCompat.Type.displayCutout());
            Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            v.setPadding(
                    Math.max(bars.left, ime.left),
                    Math.max(bars.top, ime.top),
                    Math.max(bars.right, ime.right),
                    Math.max(bars.bottom, ime.bottom));
            return WindowInsetsCompat.CONSUMED;
        });
        ViewCompat.requestApplyInsets(webView);
    }
}
