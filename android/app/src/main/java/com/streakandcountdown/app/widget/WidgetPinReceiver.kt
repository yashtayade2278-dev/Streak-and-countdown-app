package com.streakandcountdown.app.widget
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import com.streakandcountdown.app.data.local.AppDatabase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
class WidgetPinReceiver:BroadcastReceiver(){override fun onReceive(context:Context,intent:Intent){val id=intent.getIntExtra(AppWidgetManager.EXTRA_APPWIDGET_ID,AppWidgetManager.INVALID_APPWIDGET_ID);val goal=intent.getStringExtra("goalId")?:return;if(id==AppWidgetManager.INVALID_APPWIDGET_ID)return;context.getSharedPreferences("widget_prefs",Context.MODE_PRIVATE).edit().putString("widget_goal_$id",goal).apply();val pending=goAsync();CoroutineScope(Dispatchers.IO).launch{LargeWidgetProvider.updateLargeWidget(context,AppWidgetManager.getInstance(context),id,goal,AppDatabase.getDatabase(context));pending.finish()}}}
