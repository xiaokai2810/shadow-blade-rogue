package com.shadowblade.rogue;

import android.app.Activity;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
  private WebView webView;

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    requestWindowFeature(Window.FEATURE_NO_TITLE);
    setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_FULLSCREEN,
        WindowManager.LayoutParams.FLAG_FULLSCREEN);

    webView = new WebView(this);
    webView.setBackgroundColor(Color.rgb(8, 13, 11));
    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    webView.setVerticalScrollBarEnabled(false);
    webView.setHorizontalScrollBarEnabled(false);
    webView.setWebViewClient(new WebViewClient());

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
      settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
      WebView.setWebContentsDebuggingEnabled(true);
    }

    setContentView(webView);
    enterImmersiveMode();
    webView.loadUrl("file:///android_asset/index.html");
  }

  @Override
  public void onWindowFocusChanged(boolean hasFocus) {
    super.onWindowFocusChanged(hasFocus);
    if (hasFocus) {
      enterImmersiveMode();
    }
  }

  @Override
  public void onBackPressed() {
    if (webView != null && webView.canGoBack()) {
      webView.goBack();
      return;
    }
    moveTaskToBack(true);
  }

  @Override
  protected void onDestroy() {
    if (webView != null) {
      webView.destroy();
      webView = null;
    }
    super.onDestroy();
  }

  private void enterImmersiveMode() {
    getWindow().getDecorView().setSystemUiVisibility(
        View.SYSTEM_UI_FLAG_FULLSCREEN
            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
  }
}
