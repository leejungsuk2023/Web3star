package com.web3star.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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

    private static final int WEBVIEW_ATTACH_MAX_TRIES = 30;
    private static final long WEBVIEW_ATTACH_RETRY_MS = 48L;

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private int webViewAttachTries = 0;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("en"));
        super.onCreate(savedInstanceState);

        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        final View decor = getWindow().getDecorView();
        decor.post(this::tryAttachWebViewInsets);
    }

    @Override
    public void onDestroy() {
        mainHandler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }

    private void tryAttachWebViewInsets() {
        WebView webView = getBridge().getWebView();
        if (webView == null) {
            webViewAttachTries += 1;
            if (webViewAttachTries < WEBVIEW_ATTACH_MAX_TRIES) {
                mainHandler.postDelayed(this::tryAttachWebViewInsets, WEBVIEW_ATTACH_RETRY_MS);
            }
            return;
        }

        ViewCompat.setOnApplyWindowInsetsListener(
                webView,
                (v, windowInsets) -> {
                    Insets sysCut =
                            windowInsets.getInsets(
                                    WindowInsetsCompat.Type.systemBars()
                                            | WindowInsetsCompat.Type.displayCutout());
                    Insets nav = windowInsets.getInsets(WindowInsetsCompat.Type.navigationBars());
                    Insets ime = windowInsets.getInsets(WindowInsetsCompat.Type.ime());

                    int left = Math.max(sysCut.left, ime.left);
                    int top = Math.max(sysCut.top, ime.top);
                    int right = Math.max(sysCut.right, ime.right);
                    int bottom = Math.max(Math.max(sysCut.bottom, nav.bottom), ime.bottom);

                    float d = v.getResources().getDisplayMetrics().density;
                    // Some devices report 0 for bars while drawing edge-to-edge; lift UI off nav / status
                    if (top == 0) {
                        top = Math.round(40f * d);
                    }
                    if (bottom == 0) {
                        bottom = Math.round(48f * d);
                    }

                    v.setPadding(left, top, right, bottom);
                    return WindowInsetsCompat.CONSUMED;
                });
        ViewCompat.requestApplyInsets(webView);
    }
}
