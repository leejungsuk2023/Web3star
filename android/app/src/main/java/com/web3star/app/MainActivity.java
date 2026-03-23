package com.web3star.app;

import android.os.Bundle;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.core.os.LocaleListCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // English-only app locale: affects WebView + Google Sign-In consent dialog on many devices
        AppCompatDelegate.setApplicationLocales(LocaleListCompat.forLanguageTags("en"));
        super.onCreate(savedInstanceState);
    }
}
