"""
Quick DNS Fix Script for MongoDB Connection Issues
Run this if you're getting DNS timeout errors
"""

import os
import sys
import subprocess

def flush_dns_windows():
    """Flush DNS cache on Windows"""
    print("🔄 Flushing DNS cache...")
    try:
        subprocess.run(['ipconfig', '/flushdns'], check=True, capture_output=True)
        print("✅ DNS cache flushed successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to flush DNS: {e}")
        return False


def test_dns_resolution():
    """Test if we can resolve MongoDB Atlas hostname"""
    print("\n🔍 Testing DNS resolution...")
    import socket
    
    hostnames = [
        'cluster0.67w57ax.mongodb.net',
        'google.com',
        '8.8.8.8'
    ]
    
    for hostname in hostnames:
        try:
            ip = socket.gethostbyname(hostname)
            print(f"✅ {hostname} → {ip}")
        except socket.gaierror as e:
            print(f"❌ {hostname} → Failed: {e}")


def suggest_fixes():
    """Suggest fixes for DNS issues"""
    print("\n💡 Troubleshooting Steps:")
    print("\n1. Check Internet Connection:")
    print("   - Make sure you're connected to the internet")
    print("   - Try opening https://google.com in browser")
    
    print("\n2. Change DNS Servers:")
    print("   - Open Network Settings")
    print("   - Change DNS to Google DNS: 8.8.8.8, 8.8.4.4")
    print("   - Or Cloudflare DNS: 1.1.1.1, 1.0.0.1")
    
    print("\n3. Disable VPN/Proxy:")
    print("   - Temporarily disable VPN if you're using one")
    print("   - Check proxy settings in Windows")
    
    print("\n4. Firewall/Antivirus:")
    print("   - Temporarily disable Windows Firewall")
    print("   - Check if antivirus is blocking Python")
    
    print("\n5. Use Direct Connection String:")
    print("   - In MongoDB Atlas, get the connection string")
    print("   - Use the direct connection (not SRV)")
    print("   - Replace in .env file")
    
    print("\n6. Whitelist Your IP:")
    print("   - Go to MongoDB Atlas → Network Access")
    print("   - Add your current IP address")
    print("   - Or allow access from anywhere (0.0.0.0/0)")


def test_mongodb_connection():
    """Test MongoDB connection"""
    print("\n🔌 Testing MongoDB connection...")
    try:
        from pymongo import MongoClient
        from dotenv import load_dotenv
        
        load_dotenv()
        mongo_url = os.environ.get('MONGO_URL')
        
        if not mongo_url:
            print("❌ MONGO_URL not found in .env file")
            return False
        
        print(f"📡 Connecting to: {mongo_url[:50]}...")
        
        # Try with short timeout
        client = MongoClient(
            mongo_url,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000
        )
        
        # Test connection
        client.admin.command('ping')
        print("✅ MongoDB connection successful!")
        
        # List databases
        dbs = client.list_database_names()
        print(f"📊 Available databases: {dbs}")
        
        client.close()
        return True
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        return False


def main():
    print("=" * 60)
    print("🔧 MongoDB DNS Connection Fix Tool")
    print("=" * 60)
    
    # Step 1: Flush DNS
    flush_dns_windows()
    
    # Step 2: Test DNS resolution
    test_dns_resolution()
    
    # Step 3: Test MongoDB connection
    success = test_mongodb_connection()
    
    # Step 4: Suggest fixes if failed
    if not success:
        suggest_fixes()
    else:
        print("\n✅ All checks passed! Your MongoDB connection is working.")
        print("You can now run: python server.py")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    main()
