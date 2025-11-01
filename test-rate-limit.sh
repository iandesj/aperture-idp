#!/bin/bash
# Test rate limiting on auth endpoints

echo "Testing auth rate limiting (limit: 5 requests per 15 minutes)..."
echo ""

# Run 7 requests quickly - should get rate limited on request 6
for i in {1..7}; do
  echo -n "Request $i: "
  response=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:3000/api/auth/session 2>/dev/null)
  http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
  
  if [ "$http_code" == "429" ]; then
    echo "✅ Rate limited (429) - as expected!"
    echo "Rate limiting is working correctly!"
    exit 0
  elif [ "$http_code" == "200" ] || [ "$http_code" == "401" ]; then
    echo "Allowed ($http_code)"
  else
    echo "Unexpected status: $http_code"
  fi
  
  sleep 0.5
done

echo ""
echo "⚠️  Rate limiting may not have triggered. Check your dev server is running."
