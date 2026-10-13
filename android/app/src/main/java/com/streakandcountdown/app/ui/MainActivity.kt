package com.streakandcountdown.app.ui

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.streakandcountdown.app.data.local.AppDatabase
import com.streakandcountdown.app.data.local.CheckInEntity
import com.streakandcountdown.app.data.local.GoalEntity
import com.streakandcountdown.app.widget.LargeWidgetProvider
import com.streakandcountdown.app.widget.WidgetPinReceiver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONObject

class MainActivity : ComponentActivity() {
    private lateinit var webView: WebView
    private val db by lazy { AppDatabase.getDatabase(this) }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val loader = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this)).build()
        webView = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.useWideViewPort = false
            settings.loadWithOverviewMode = false
            settings.textZoom = 100
            addJavascriptInterface(AppBridge(this@MainActivity), "AndroidBridge")
            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(view: WebView, request: android.webkit.WebResourceRequest) = loader.shouldInterceptRequest(request.url)
            }
            loadUrl("https://appassets.androidplatform.net/assets/www/index.html")
        }
        setContentView(webView)
    }

    inner class AppBridge(private val context: Context) {
        @JavascriptInterface fun syncGoal(json: String) = lifecycleScope.launch(Dispatchers.IO) {
            val o=JSONObject(json); db.goalDao().insertGoal(GoalEntity(o.getString("id"),o.getString("name"),o.optString("description").ifBlank{null},o.getString("targetDate"),o.getString("createdAt"),o.getString("updatedAt"),o.optBoolean("archived"),o.optBoolean("reminderEnabled"),o.optString("reminderTime").ifBlank{null},o.optString("colorScheme","indigo"))); refreshWidgets()
        }
        @JavascriptInterface fun syncCheckIn(json: String) = lifecycleScope.launch(Dispatchers.IO) {
            val o=JSONObject(json); if(db.checkInDao().getCheckInForDate(o.getString("goalId"),o.getString("localDate"))==null) db.checkInDao().insertCheckIn(CheckInEntity(o.getString("id"),o.getString("goalId"),o.getString("localDate"),o.getString("timestamp"),o.optString("note").ifBlank{null})); refreshWidgets()
        }
        @JavascriptInterface fun deleteGoal(id:String)=lifecycleScope.launch(Dispatchers.IO){db.goalDao().deleteGoalById(id);refreshWidgets()}
        @JavascriptInterface fun refreshWidgets(){ lifecycleScope.launch(Dispatchers.IO){ this@MainActivity.refreshWidgets() } }
        @JavascriptInterface fun pinGoalWidget(goalId:String){ runOnUiThread {
            val manager=AppWidgetManager.getInstance(context); if(android.os.Build.VERSION.SDK_INT>=26&&manager.isRequestPinAppWidgetSupported){
                val callback=Intent(context,WidgetPinReceiver::class.java).putExtra("goalId",goalId)
                val pending=PendingIntent.getBroadcast(context,goalId.hashCode(),callback,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                manager.requestPinAppWidget(ComponentName(context,LargeWidgetProvider::class.java),null,pending)
            }
        }}
    }

    private suspend fun refreshWidgets(){
        val manager=AppWidgetManager.getInstance(this); val ids=manager.getAppWidgetIds(ComponentName(this,LargeWidgetProvider::class.java)); val prefs=getSharedPreferences("widget_prefs",MODE_PRIVATE)
        ids.forEach{ id->LargeWidgetProvider.updateLargeWidget(this,manager,id,prefs.getString("widget_goal_$id",null),db)}
    }
}
