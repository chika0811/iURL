package app.lovable.iurl

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences

class BootReceiver : BroadcastReceiver() {
    
    override fun onReceive(context: Context, intent: Intent) {
        when (intent.action) {
            Intent.ACTION_BOOT_COMPLETED,
            Intent.ACTION_MY_PACKAGE_REPLACED,
            Intent.ACTION_PACKAGE_REPLACED -> {
                // Check if protection was enabled before restart
                val prefs = context.getSharedPreferences("iurl_prefs", Context.MODE_PRIVATE)
                val wasProtectionEnabled = prefs.getBoolean("protection_enabled", false)
                
                if (wasProtectionEnabled) {
                    // Restart URL monitoring service
                    UrlMonitoringService.startService(context)
                }
            }
        }
    }
}