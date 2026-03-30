package com.web3star.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
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

        // Edge-to-edge: apply system bar + cutout + IME as WebView padding so CSS 100dvh does not
        // draw under gesture / 3-button nav. Post so Bridge WebView exists before listener runs.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        final View decor = getWindow().getDecorView();
        decor.post(
                () -> {
                    WebView webView = getBridge().getWebView();
                    if (webView == null) {
                        return;
                    }
                    ViewCompat.setOnApplyWindowInsetsListener(
                            webView,
                            (v, windowInsets) -> {
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
                });
    }
}
