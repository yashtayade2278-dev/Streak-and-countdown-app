package com.streakandcountdown.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "goals")
data class GoalEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val description: String? = null,
    val targetDate: String, // YYYY-MM-DD
    val createdAt: String,  // ISO 8601
    val updatedAt: String,  // ISO 8601
    val archived: Boolean = false,
    val reminderEnabled: Boolean = false,
    val reminderTime: String? = "20:00",
    val colorScheme: String = "indigo"
)
