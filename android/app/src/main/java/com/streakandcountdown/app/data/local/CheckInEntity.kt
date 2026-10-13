package com.streakandcountdown.app.data.local

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey

/**
 * CheckInEntity enforces database-level uniqueness on (goalId, localDate)
 */
@Entity(
    tableName = "check_ins",
    foreignKeys = [
        ForeignKey(
            entity = GoalEntity::class,
            parentColumns = ["id"],
            childColumns = ["goalId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index(value = ["goalId", "localDate"], unique = true)
    ]
)
data class CheckInEntity(
    @PrimaryKey
    val id: String,
    val goalId: String,
    val localDate: String, // YYYY-MM-DD
    val timestamp: String, // ISO 8601
    val note: String? = null
)
