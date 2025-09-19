package app.lovable.iurl

import android.content.Intent
import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Handle URL intents from other apps
        handleIntent(intent)
    }
    
    override fun onNewIntent(intent: Intent?) {
        super.onNewIntent(intent)
        if (intent != null) {
            handleIntent(intent)
        }
    }
    
    private fun handleIntent(intent: Intent) {
        if (intent.action == Intent.ACTION_VIEW && intent.data != null) {
            val url = intent.data.toString()
            // Send URL to the web app via bridge
            val jsCode = "window.dispatchEvent(new CustomEvent('scanUrlFromNotification', { detail: { url: '$url' } }));"
            bridge.webView.evaluateJavascript(jsCode, null)
        }
    }
}