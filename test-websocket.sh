#!/bin/bash

# WebSocket Push Notification Test Script - Issue #8
# 
# This script demonstrates the WebSocket push notification system
# by sending test refresh messages to trigger widget updates.

echo "🧪 Testing WebSocket Push Notification System - Issue #8"
echo "========================================================="
echo ""

API_BASE="http://api.dashboard.home"
DASHBOARD_URL="https://dashboard.home"

echo "📡 Dashboard URL: $DASHBOARD_URL"
echo "🔧 API Base URL: $API_BASE"
echo ""

# Function to send refresh message
send_refresh() {
    local widget_type=$1
    local message=$2
    
    echo "🔄 Sending refresh for widget type: $widget_type"
    echo "💬 Message: $message"
    
    response=$(curl -s -X POST "$API_BASE/api/test/refresh-widget" \
        -H "Content-Type: application/json" \
        -d "{\"widgetType\": \"$widget_type\", \"data\": {\"message\": \"$message\"}}")
    
    echo "📨 Response: $response"
    echo ""
}

# Test sequence
echo "🚀 Starting WebSocket test sequence..."
echo ""

echo "Test 1: Refresh all CPAP widgets"
send_refresh "cpap" "Test refresh of all CPAP widgets"
sleep 3

echo "Test 2: Refresh specific SpO2 trend widget"
send_refresh "spo2-trend" "Test refresh of SpO2 trend widget only"
sleep 3

echo "Test 3: Refresh all widgets"
send_refresh "all" "Test refresh of all dashboard widgets"
sleep 3

echo "Test 4: Refresh leak rate widget"
send_refresh "leak-rate" "Test refresh of leak rate widget"
sleep 3

echo "✅ WebSocket test sequence completed!"
echo ""
echo "🔍 Check the dashboard at $DASHBOARD_URL to see:"
echo "   - WebSocket connection status (should show 'Connected')"
echo "   - Widget refresh indicators (spinning icons during refresh)"
echo "   - Message history in the WebSocket Status component"
echo "   - Auto-refresh timestamps updating"
echo ""
echo "📋 Expected behavior:"
echo "   1. Widgets should show spinning refresh icons when messages are received"
echo "   2. Data should be refetched automatically without manual interaction"
echo "   3. WebSocket Status component should log all received messages"
echo "   4. Connection should remain stable throughout the test"
