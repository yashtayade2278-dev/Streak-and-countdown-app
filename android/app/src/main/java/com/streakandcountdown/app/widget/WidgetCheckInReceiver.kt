package com.streakandcountdown.app.widget
import android.appwidget.AppWidgetManager
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.Toast
import com.streakandcountdown.app.data.local.AppDatabase
import com.streakandcountdown.app.data.local.CheckInEntity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
class WidgetCheckInReceiver:BroadcastReceiver(){override fun onReceive(context:Context,intent:Intent){val goalId=intent.getStringExtra("EXTRA_GOAL_ID")?:return;val date=intent.getStringExtra("EXTRA_LOCAL_DATE")?:LocalDate.now().toString();val pending=goAsync();CoroutineScope(Dispatchers.IO).launch{try{val db=AppDatabase.getDatabase(context);if(db.checkInDao().getCheckInForDate(goalId,date)==null)db.checkInDao().insertCheckIn(CheckInEntity("ci-${UUID.randomUUID()}",goalId,date,Instant.now().toString(),"Checked in from Home Widget"));val manager=AppWidgetManager.getInstance(context);val prefs=context.getSharedPreferences("widget_prefs",Context.MODE_PRIVATE);manager.getAppWidgetIds(ComponentName(context,LargeWidgetProvider::class.java)).forEach{id->LargeWidgetProvider.updateLargeWidget(context,manager,id,prefs.getString("widget_goal_$id",null),db)};CoroutineScope(Dispatchers.Main).launch{Toast.makeText(context,"Check-in recorded",Toast.LENGTH_SHORT).show()}}finally{pending.finish()}}}}
