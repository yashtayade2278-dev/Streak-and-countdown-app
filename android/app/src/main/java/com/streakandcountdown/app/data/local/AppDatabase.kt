package com.streakandcountdown.app.data.local

import android.content.Context
import androidx.room.*

@Dao
interface GoalDao {
    @Query("SELECT * FROM goals WHERE archived = 0 ORDER BY targetDate ASC")
    suspend fun getActiveGoals(): List<GoalEntity>

    @Query("SELECT * FROM goals WHERE id = :id LIMIT 1")
    suspend fun getGoalById(id: String): GoalEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertGoal(goal: GoalEntity)

    @Update
    suspend fun updateGoal(goal: GoalEntity)

    @Query("DELETE FROM goals WHERE id = :id")
    suspend fun deleteGoalById(id: String)
}

@Dao
interface CheckInDao {
    @Query("SELECT * FROM check_ins WHERE goalId = :goalId ORDER BY localDate ASC")
    suspend fun getCheckInsForGoal(goalId: String): List<CheckInEntity>

    @Query("SELECT * FROM check_ins WHERE goalId = :goalId AND localDate = :localDate LIMIT 1")
    suspend fun getCheckInForDate(goalId: String, localDate: String): CheckInEntity?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insertCheckIn(checkIn: CheckInEntity)

    @Delete
    suspend fun deleteCheckIn(checkIn: CheckInEntity)
}

@Database(entities = [GoalEntity::class, CheckInEntity::class], version = 1, exportSchema = false)
abstract class AppDatabase : RoomDatabase() {

    abstract fun goalDao(): GoalDao
    abstract fun checkInDao(): CheckInDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "streak_countdown.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
