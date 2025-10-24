#!/bin/bash

echo "🔍 Terminal Performance Diagnostic Script"
echo "========================================"
echo ""

# Check basic system info
echo "📊 System Information:"
echo "OS: $(uname -a)"
echo "Shell: $SHELL"
echo "Current directory: $(pwd)"
echo ""

# Check if we can run basic commands
echo "🧪 Testing basic command execution:"
echo "Testing 'ls' command..."
timeout 5 ls -la
if [ $? -eq 124 ]; then
    echo "❌ 'ls' command timed out after 5 seconds"
else
    echo "✅ 'ls' command executed successfully"
fi

echo ""
echo "Testing 'echo' command..."
timeout 5 echo "Hello World"
if [ $? -eq 124 ]; then
    echo "❌ 'echo' command timed out after 5 seconds"
else
    echo "✅ 'echo' command executed successfully"
fi

echo ""
echo "Testing 'pwd' command..."
timeout 5 pwd
if [ $? -eq 124 ]; then
    echo "❌ 'pwd' command timed out after 5 seconds"
else
    echo "✅ 'pwd' command executed successfully"
fi

# Check for hanging processes
echo ""
echo "🔍 Checking for hanging processes:"
echo "Node processes:"
ps aux | grep node | grep -v grep | head -5

echo ""
echo "NPM processes:"
ps aux | grep npm | grep -v grep | head -5

# Check network connectivity
echo ""
echo "🌐 Testing network connectivity:"
echo "Testing localhost:3000..."
timeout 10 curl -s http://localhost:3000 > /dev/null
if [ $? -eq 124 ]; then
    echo "❌ Localhost connection timed out"
else
    echo "✅ Localhost connection successful"
fi

# Check disk space
echo ""
echo "💾 Disk space check:"
df -h . | head -2

# Check memory usage
echo ""
echo "🧠 Memory usage:"
vm_stat | head -5

echo ""
echo "🔍 Diagnostic complete!"
echo ""
echo "💡 Possible causes of slow commands:"
echo "1. High CPU/memory usage"
echo "2. Network connectivity issues"
echo "3. Hanging background processes"
echo "4. File system issues"
echo "5. Shell configuration problems"
echo ""
echo "🚀 Recommendations:"
echo "1. Try restarting your terminal"
echo "2. Check Activity Monitor for resource usage"
echo "3. Restart your computer if issues persist"
echo "4. Use the manual setup guide in PWA_QUICK_SETUP.md"





